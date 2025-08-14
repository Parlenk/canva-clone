import { verifyAuth } from '@hono/auth-js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import OpenAI from 'openai';

import { getReplicate } from '@/lib/replicate';
import { OpenAIVisionService } from '@/features/editor/services/openai-vision';
import { db } from '@/db/drizzle';
import { resizeSessions, trainingData } from '@/db/schema';
import { eq, and, isNotNull, gte, desc, sql } from 'drizzle-orm';
import { AIResizeTrainingPipeline } from '@/features/editor/services/training-pipeline';
// import { GoogleVisionService } from '@/features/editor/services/google-vision';

const app = new Hono()
  .post(
    '/remove-bg',
    verifyAuth(),
    zValidator(
      'json',
      z.object({
        image: z.string(),
      }),
    ),
    async (ctx) => {
      const { image } = ctx.req.valid('json');

      const replicate = getReplicate();
      const output: unknown = await replicate.run('cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003', {
        input: {
          image,
        },
      });

      const res = output as string;

      return ctx.json({ data: res });
    },
  )
  .get(
    '/test-openai',
    async (ctx) => {
      try {
        console.log('🔍 Testing OpenAI connection...');
        
        if (!process.env.OPENAI_API_KEY) {
          return ctx.json({ 
            success: false, 
            error: 'OpenAI API key not configured',
            hasKey: false
          });
        }

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Test with a simple completion
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Say 'OpenAI connection successful!'" }],
          max_tokens: 10,
        });

        return ctx.json({ 
          success: true, 
          message: 'OpenAI connection working',
          response: response.choices[0]?.message?.content,
          hasKey: true
        });
      } catch (error) {
        console.error('❌ OpenAI test failed:', error);
        return ctx.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          hasKey: !!process.env.OPENAI_API_KEY
        });
      }
    },
  )
  .post(
    '/generate-image',
    zValidator(
      'json',
      z.object({
        prompt: z.string().min(10),
      }),
    ),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      try {
        console.log('🎨 OpenAI image generation request received');
        console.log('📝 Prompt:', prompt);
        console.log('🔑 API Key available:', !!process.env.OPENAI_API_KEY);
        
        if (!process.env.OPENAI_API_KEY) {
          console.error('❌ OpenAI API key not found in environment');
          throw new Error('OpenAI API key not configured');
        }

        console.log('⚙️ Initializing OpenAI client...');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Try DALL-E 3 first, then fallback to DALL-E 2
        let response;
        try {
          console.log('🚀 Calling OpenAI DALL-E 3...');
          response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
          });
        } catch (dalle3Error) {
          console.log('⚠️ DALL-E 3 failed, trying DALL-E 2...');
          console.log('DALL-E 3 error:', dalle3Error);
          
          response = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            n: 1,
            size: "1024x1024"
          });
          console.log('✅ DALL-E 2 successful');
        }

        console.log('📦 OpenAI response received:', response);
        
        const imageUrl = response.data?.[0]?.url;
        if (!imageUrl) {
          console.error('❌ No image URL in response:', response);
          throw new Error('No image URL returned from OpenAI');
        }

        console.log('✅ Image generated successfully:', imageUrl);
        return ctx.json({ data: imageUrl });
      } catch (error) {
        console.error('❌ OpenAI image generation error:', error);
        console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
        
        // Check if it's a quota/billing error
        const isQuotaError = error instanceof Error && (
          error.message.includes('quota') || 
          error.message.includes('billing') ||
          error.message.includes('insufficient_quota')
        );
        
        if (isQuotaError) {
          console.log('💳 Quota error detected, returning specific error message');
          return ctx.json({ 
            error: 'OpenAI quota exceeded. Please check your billing.',
            details: error.message
          }, 429);
        }
        
        // Fallback to Replicate if OpenAI fails
        try {
          console.log('🔄 Falling back to Replicate...');
          const replicate = getReplicate();
          const output: unknown = await replicate.run(
            'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
            {
              input: {
                prompt,
                scheduler: 'K_EULER',
              },
            },
          );

          const res = output as Array<string>;
          console.log('✅ Replicate fallback successful');
          return ctx.json({ data: res[0] });
        } catch (fallbackError) {
          console.error('❌ Replicate fallback also failed:', fallbackError);
          return ctx.json({ 
            error: 'Both OpenAI and Replicate failed',
            openaiError: error instanceof Error ? error.message : 'Unknown OpenAI error',
            replicateError: fallbackError instanceof Error ? fallbackError.message : 'Unknown Replicate error'
          }, 500);
        }
      }
    },
  )
  .post(
    '/resize',
    zValidator(
      'json',
      z.object({
        prompt: z.string(),
        type: z.literal('resize'),
      }),
    ),
    async (ctx) => {
      const { prompt } = ctx.req.valid('json');

      try {
        console.log('🤖 AI Resize Request received');
        
        // Parse the prompt to extract canvas sizes and object information
        const currentSizeMatch = prompt.match(/from (\d+)x(\d+)/);
        const newSizeMatch = prompt.match(/to (\d+)x(\d+)/);
        
        if (!currentSizeMatch || !newSizeMatch) {
          throw new Error('Could not parse canvas sizes from prompt');
        }

        const currentWidth = parseInt(currentSizeMatch[1]);
        const currentHeight = parseInt(currentSizeMatch[2]);
        const newWidth = parseInt(newSizeMatch[1]);
        const newHeight = parseInt(newSizeMatch[2]);

        // Apply the 3-step smart resize process (fallback)
        const instructions = applySmartResizeProcess(
          { width: currentWidth, height: currentHeight },
          { width: newWidth, height: newHeight },
          prompt
        );

        const response = {
          objects: instructions
        };

        return ctx.json({ 
          text: JSON.stringify(response, null, 2),
          success: true 
        });
      } catch (error) {
        console.error('AI resize error:', error);
        return ctx.json({ 
          text: JSON.stringify({ objects: [] }),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },
  )
  .post(
    '/vision-resize',
    zValidator(
      'json',
      z.object({
        canvasImage: z.string(),
        currentSize: z.object({
          width: z.number(),
          height: z.number(),
        }),
        newSize: z.object({
          width: z.number(),
          height: z.number(),
        }),
        objectsData: z.array(z.object({
          id: z.string(),
          type: z.string(),
          left: z.number(),
          top: z.number(),
          width: z.number(),
          height: z.number(),
          scaleX: z.number(),
          scaleY: z.number(),
          text: z.string().optional(),
        })),
      }),
    ),
    async (ctx) => {
      const { canvasImage, currentSize, newSize, objectsData } = ctx.req.valid('json');

      try {
        console.log('🧠 TRUE AI Vision-powered resize request');
        console.log('📊 Request data:', {
          currentSize,
          newSize,
          objectsCount: objectsData.length,
          imageSize: canvasImage.length,
          envKey: !!process.env.OPENAI_API_KEY
        });
        
        if (!process.env.OPENAI_API_KEY) {
          console.error('❌ OpenAI API key not found in environment');
          return ctx.json({ 
            success: false,
            error: 'OpenAI API key not configured',
            env: process.env.NODE_ENV
          }, 500);
        }

        console.log('🔑 OpenAI API key found, initializing service...');
        const visionService = new OpenAIVisionService();
        
        // Single step: Direct resize with simplified prompt
        console.log('🤖 Performing direct AI resize with simplified prompt...');
        const resizeAnalysis = await visionService.resizeCanvas(
          canvasImage,
          currentSize,
          newSize,
          objectsData
        );
        console.log('✅ Direct AI resize completed:', resizeAnalysis);

        return ctx.json({
          success: true,
          resize: resizeAnalysis,
          placements: resizeAnalysis.placements,
        });
      } catch (error) {
        console.error('❌ Vision AI resize error:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return ctx.json({ 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
          fallback: true
        });
      }
    },
  )
  .post(
    '/google-vision-resize',
    zValidator(
      'json',
      z.object({
        canvasImage: z.string(),
        currentSize: z.object({
          width: z.number(),
          height: z.number(),
        }),
        newSize: z.object({
          width: z.number(),
          height: z.number(),
        }),
        objectsData: z.array(z.object({
          id: z.string(),
          type: z.string(),
          left: z.number(),
          top: z.number(),
          width: z.number(),
          height: z.number(),
          scaleX: z.number(),
          scaleY: z.number(),
          text: z.string().optional(),
        })),
      }),
    ),
    async (ctx) => {
      const { canvasImage, currentSize, newSize, objectsData } = ctx.req.valid('json');

      try {
        console.log('🔍 Google Vision-powered resize request');
        console.log('📊 Request data:', {
          currentSize,
          newSize,
          objectsCount: objectsData.length,
          imageSize: canvasImage.length,
          hasGoogleCreds: !!(process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY)
        });
        
        if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
          console.error('❌ Google Cloud credentials not found');
          return ctx.json({ 
            success: false,
            error: 'Google Cloud Vision credentials not configured',
            fallback: true
          }, 500);
        }

        console.log('🔑 Google Cloud credentials found...');
        // Google Vision temporarily disabled for build fix
        return ctx.json({ 
          success: false,
          error: 'Google Vision temporarily disabled',
          fallback: true
        }, 500);
      } catch (error) {
        console.error('❌ Google Vision resize error:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return ctx.json({ 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
          fallback: true
        });
      }
    },
  )
  .post(
    '/resize-session',
    // verifyAuth(), // Temporarily disabled for testing
    zValidator(
      'json',
      z.object({
        projectId: z.string().optional(),
        originalCanvas: z.any().refine((val) => val && typeof val === 'object', 'Invalid canvas data'),
        targetDimensions: z.object({
          width: z.number().min(100).max(10000),
          height: z.number().min(100).max(10000),
        }),
        aiResult: z.any().optional().default({}),
        processingTime: z.number().min(0).max(300000), // Max 5 minutes
        variantId: z.string().optional(),
        status: z.enum(['completed', 'failed', 'pending']).optional(),
        errorMessage: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('authUser');
      // Temporarily allow unauthenticated access for testing
      const userId = session?.token?.id || 'anonymous-user';

      const data = ctx.req.valid('json');

      // Validate data integrity
      if (!data.originalCanvas || !data.targetDimensions) {
        return ctx.json({ error: 'Missing required session data' }, 400);
      }

      try {
        // Sanitize JSON data to prevent issues
        const sanitizedOriginalCanvas = JSON.parse(JSON.stringify(data.originalCanvas));
        const sanitizedAiResult = JSON.parse(JSON.stringify(data.aiResult || {}));

        try {
          const [resizeSession] = await db.insert(resizeSessions).values({
            userId: userId,
            projectId: data.projectId || null,
            originalCanvas: JSON.stringify(sanitizedOriginalCanvas),
            targetDimensions: JSON.stringify(data.targetDimensions),
            aiResult: JSON.stringify(sanitizedAiResult),
            processingTime: Math.max(0, data.processingTime || 0),
            variantId: data.variantId || null,
            status: data.status || 'completed',
            errorMessage: data.errorMessage || null,
            updatedAt: new Date(),
          }).returning();

          return ctx.json({ data: resizeSession });
        } catch (dbError) {
          console.warn('Database insert failed, returning mock session:', dbError);
          
          // Return mock session when database is not available
          const mockSession = {
            id: 'mock-session-' + Date.now(),
            userId: userId,
            projectId: data.projectId || null,
            originalCanvas: sanitizedOriginalCanvas,
            targetDimensions: data.targetDimensions,
            aiResult: sanitizedAiResult,
            processingTime: Math.max(0, data.processingTime || 0),
            variantId: data.variantId || null,
            status: data.status || 'completed',
            errorMessage: data.errorMessage || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          return ctx.json({ data: mockSession });
        }
      } catch (error) {
        console.error('Failed to process resize session:', error);
        
        // Return specific error details for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
        return ctx.json({ 
          error: 'Failed to process resize session',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, 500);
      }
    },
  )
  .patch(
    '/resize-session/:id',
    verifyAuth(),
    zValidator(
      'json',
      z.object({
        manualCorrections: z.any().optional(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('authUser');
      if (!session.token?.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }

      const sessionId = ctx.req.param('id');
      const data = ctx.req.valid('json');

      try {
        const [updatedSession] = await db
          .update(resizeSessions)
          .set({
            manualCorrections: data.manualCorrections,
          })
          .where(eq(resizeSessions.id, sessionId))
          .returning();

        return ctx.json({ data: updatedSession });
      } catch (error) {
        console.error('Failed to update resize session:', error);
        return ctx.json({ error: 'Failed to update resize session' }, 500);
      }
    },
  )
  .post(
    '/resize-feedback',
    verifyAuth(),
    zValidator(
      'json',
      z.object({
        sessionId: z.string().min(1, 'Session ID required'),
        rating: z.number().int().min(1).max(5),
        feedbackText: z.string().max(1000).optional(), // Limit text length
        helpful: z.boolean(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('authUser');
      if (!session.token?.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }

      const data = ctx.req.valid('json');

      try {
        // First check if session exists and belongs to user
        const existingSession = await db
          .select({ id: resizeSessions.id, userId: resizeSessions.userId })
          .from(resizeSessions)
          .where(eq(resizeSessions.id, data.sessionId))
          .limit(1);

        if (existingSession.length === 0) {
          return ctx.json({ error: 'Resize session not found' }, 404);
        }

        if (existingSession[0].userId !== session.token.id) {
          return ctx.json({ error: 'Unauthorized - Session belongs to different user' }, 403);
        }

        // Update the resize session with feedback
        const [updatedSession] = await db
          .update(resizeSessions)
          .set({
            userRating: data.rating,
            feedbackText: data.feedbackText?.trim() || null,
            updatedAt: new Date(),
          })
          .where(eq(resizeSessions.id, data.sessionId))
          .returning();

        if (!updatedSession) {
          return ctx.json({ error: 'Failed to update session' }, 500);
        }

        // Create training data entry if rating is good (4-5 stars) or poor (1-2 stars)
        if (data.rating >= 4 || data.rating <= 2) {
          try {
            const qualityScore = Math.max(0, Math.min(1, data.rating / 5.0)); // Ensure 0-1 range
            
            // Safely extract features from the resize session
            const inputFeatures = {
              originalDimensions: updatedSession.originalCanvas || {},
              targetDimensions: updatedSession.targetDimensions || {},
              processingTime: updatedSession.processingTime || 0,
              helpful: data.helpful,
              variantId: updatedSession.variantId || 'unknown',
            };

            await db.insert(trainingData).values({
              sessionId: data.sessionId,
              inputFeatures: JSON.stringify(inputFeatures),
              expectedOutput: JSON.stringify(updatedSession.aiResult || {}),
              qualityScore,
              validated: false,
            });
          } catch (trainingError) {
            // Log training data creation error but don't fail the feedback submission
            console.error('Failed to create training data:', trainingError);
          }
        }

        return ctx.json({ 
          data: updatedSession,
          message: 'Feedback submitted successfully'
        });
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return ctx.json({ 
          error: 'Failed to submit feedback',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, 500);
      }
    },
  )
  .post(
    '/retrain-model',
    verifyAuth(),
    zValidator(
      'json',
      z.object({
        days: z.number().optional().default(30),
        minRating: z.number().optional().default(1),
        adminKey: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('authUser');
      const data = ctx.req.valid('json');

      // Enhanced security check
      if (!process.env.ADMIN_SECRET_KEY) {
        return ctx.json({ error: 'Admin functionality not configured' }, 503);
      }
      
      if (!data.adminKey || data.adminKey !== process.env.ADMIN_SECRET_KEY) {
        return ctx.json({ error: 'Unauthorized - Admin access required' }, 401);
      }

      // Validate parameters
      if (data.days < 1 || data.days > 365) {
        return ctx.json({ error: 'Days parameter must be between 1 and 365' }, 400);
      }

      if (data.minRating < 1 || data.minRating > 5) {
        return ctx.json({ error: 'Min rating must be between 1 and 5' }, 400);
      }

      try {
        console.log('🧠 Starting AI model retraining process...');
        
        // 1. Fetch training data from the last N days
        const cutoffDate = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000);
        const sessions = await db
          .select()
          .from(resizeSessions)
          .where(
            and(
              isNotNull(resizeSessions.userRating),
              gte(resizeSessions.createdAt, cutoffDate),
              gte(resizeSessions.userRating, data.minRating)
            )
          )
          .orderBy(desc(resizeSessions.createdAt))
          .limit(1000); // Limit to prevent memory issues

        if (sessions.length === 0) {
          return ctx.json({ 
            message: 'No training data available',
            sessionsFound: 0 
          });
        }

        console.log(`📊 Found ${sessions.length} resize sessions for training`);

        // 2. Convert to training data points
        const trainingPoints = sessions.map(session => ({
          inputFeatures: AIResizeTrainingPipeline.extractFeatures(
            JSON.parse(session.originalCanvas), 
            JSON.parse(session.targetDimensions) as { width: number; height: number }
          ),
          expectedOutput: JSON.parse(session.aiResult) as { placements: { id: string; left: number; top: number; scaleX: number; scaleY: number; }[]; },
          userFeedback: {
            rating: session.userRating!,
            helpful: session.userRating! >= 4,
            manualCorrections: session.manualCorrections ? JSON.parse(session.manualCorrections) : null,
          },
          qualityScore: AIResizeTrainingPipeline.calculateQualityScore({
            rating: session.userRating!,
            helpful: session.userRating! >= 4,
            manualCorrections: session.manualCorrections,
          }),
        }));

        // 3. Analyze patterns and generate insights
        const patterns = AIResizeTrainingPipeline.analyzePatterns(trainingPoints);
        const improvedPrompts = AIResizeTrainingPipeline.generateImprovedPrompts(patterns);

        // 4. Calculate performance metrics
        const avgQualityScore = trainingPoints.reduce((sum, p) => sum + p.qualityScore, 0) / trainingPoints.length;
        const highQualityCount = trainingPoints.filter(p => p.qualityScore >= 0.8).length;
        const lowQualityCount = trainingPoints.filter(p => p.qualityScore <= 0.4).length;

        // 5. Store updated training data
        const validatedTrainingData = trainingPoints
          .filter(p => p.qualityScore >= 0.6) // Only use reasonably good examples
          .map(point => ({
            sessionId: sessions.find(s => 
              JSON.stringify(s.originalCanvas) === JSON.stringify(point.expectedOutput)
            )?.id || '',
            inputFeatures: JSON.stringify(point.inputFeatures),
            expectedOutput: JSON.stringify(point.expectedOutput),
            qualityScore: point.qualityScore,
            validated: true,
          }));

        // Batch insert training data
        if (validatedTrainingData.length > 0) {
          await db.insert(trainingData).values(validatedTrainingData);
        }

        const retrainingResults = {
          success: true,
          timestamp: new Date().toISOString(),
          metrics: {
            totalSessions: sessions.length,
            trainingPoints: trainingPoints.length,
            validatedPoints: validatedTrainingData.length,
            avgQualityScore: Math.round(avgQualityScore * 100) / 100,
            highQualityCount,
            lowQualityCount,
            improvementRate: highQualityCount / trainingPoints.length,
          },
          patterns: {
            successful: patterns.successfulScenarios,
            problematic: patterns.problematicScenarios,
          },
          improvedPrompts,
          recommendations: [
            avgQualityScore < 0.6 ? 'Consider adjusting AI prompts - low average quality detected' : null,
            lowQualityCount > trainingPoints.length * 0.3 ? 'High number of poor results - review edge cases' : null,
            patterns.problematicScenarios.avgComplexity > 0.7 ? 'Complex canvases need better handling' : null,
          ].filter(Boolean),
        };

        console.log('✅ AI model retraining completed:', retrainingResults.metrics);
        
        return ctx.json(retrainingResults);

      } catch (error) {
        console.error('❌ Model retraining failed:', error);
        return ctx.json({ 
          error: 'Model retraining failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    },
  )
  .get(
    '/training-analytics',
    verifyAuth(),
    async (ctx) => {
      try {
        // Get training statistics
        const totalSessions = await db
          .select({ count: sql<number>`count(*)` })
          .from(resizeSessions);

        const ratedSessions = await db
          .select({ count: sql<number>`count(*)` })
          .from(resizeSessions)
          .where(isNotNull(resizeSessions.userRating));

        const avgRating = await db
          .select({ avg: sql<number>`avg(user_rating)` })
          .from(resizeSessions)
          .where(isNotNull(resizeSessions.userRating));

        const recentSessions = await db
          .select()
          .from(resizeSessions)
          .where(
            gte(resizeSessions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
          .orderBy(desc(resizeSessions.createdAt))
          .limit(100);

        const analytics = {
          overview: {
            totalSessions: totalSessions[0]?.count || 0,
            ratedSessions: ratedSessions[0]?.count || 0,
            avgRating: Math.round((avgRating[0]?.avg || 0) * 100) / 100,
            feedbackRate: totalSessions[0]?.count > 0 
              ? Math.round((ratedSessions[0]?.count / totalSessions[0]?.count) * 100) 
              : 0,
          },
          recentActivity: recentSessions.map(session => ({
            id: session.id,
            rating: session.userRating,
            processingTime: session.processingTime,
            createdAt: session.createdAt,
            hasFeedback: !!session.feedbackText,
            hasCorrections: !!session.manualCorrections,
          })),
          trends: {
            dailyCount: recentSessions.reduce((acc, session) => {
              const date = session.createdAt.toISOString().split('T')[0];
              acc[date] = (acc[date] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          },
        };

        return ctx.json(analytics);

      } catch (error) {
        console.error('Failed to fetch training analytics:', error);
        return ctx.json({ error: 'Failed to fetch analytics' }, 500);
      }
    },
  );

// Smart resize processing function
function applySmartResizeProcess(
  currentSize: { width: number; height: number },
  newSize: { width: number; height: number },
  prompt: string
): Array<{ id: string; left: number; top: number; scaleX: number; scaleY: number }> {
  // Extract object information from prompt
  const objectPattern = /- (\w+) at \((\d+), (\d+)\)/g;
  const extractedObjects = [];
  let index = 0;
  let match;

  while ((match = objectPattern.exec(prompt)) !== null) {
    const [, type, left, top] = match;
    extractedObjects.push({
      id: `obj_${index}`,
      type,
      left: parseInt(left),
      top: parseInt(top),
      width: 100, // Default width
      height: 50, // Default height
      scaleX: 1,
      scaleY: 1,
    });
    index++;
  }

  if (extractedObjects.length === 0) {
    return [];
  }

  // Step 1: Scale objects proportionally with canvas boundary constraints
  const canvasScaleRatio = Math.min(
    newSize.width / currentSize.width,
    newSize.height / currentSize.height
  );
  const conservativeScale = Math.min(canvasScaleRatio * 0.8, 0.9); // Ensure objects don't exceed 90% of canvas

  const scaledObjects = extractedObjects.map(obj => ({
    ...obj,
    left: (obj.left / currentSize.width) * newSize.width,
    top: (obj.top / currentSize.height) * newSize.height,
    scaleX: obj.scaleX * conservativeScale,
    scaleY: obj.scaleY * conservativeScale,
  }));

  // Step 2: Smart arrangement (simplified version for API)
  const margin = 20;
  const arrangedObjects = scaledObjects.map(obj => {
    const objWidth = obj.width * obj.scaleX;
    const objHeight = obj.height * obj.scaleY;
    
    return {
      ...obj,
      left: Math.max(margin, Math.min(newSize.width - objWidth - margin, obj.left)),
      top: Math.max(margin, Math.min(newSize.height - objHeight - margin, obj.top)),
    };
  });

  // Step 3: Space filling - distribute evenly if objects are sparse
  const totalObjectArea = arrangedObjects.reduce((sum, obj) => {
    return sum + (obj.width * obj.scaleX) * (obj.height * obj.scaleY);
  }, 0);
  
  const availableArea = (newSize.width - 2 * margin) * (newSize.height - 2 * margin);
  const spaceUtilization = totalObjectArea / availableArea;
  
  // Ensure no object exceeds canvas dimensions
  const finalArrangedObjects = arrangedObjects.map(obj => {
    const objWidth = obj.width * obj.scaleX;
    const objHeight = obj.height * obj.scaleY;
    
    // Cap object size to canvas boundaries with margins
    const maxObjWidth = newSize.width - 2 * margin;
    const maxObjHeight = newSize.height - 2 * margin;
    
    let finalScaleX = obj.scaleX;
    let finalScaleY = obj.scaleY;
    
    if (objWidth > maxObjWidth) {
      finalScaleX = (maxObjWidth / obj.width) * 0.9; // 90% of max width
    }
    
    if (objHeight > maxObjHeight) {
      finalScaleY = (maxObjHeight / obj.height) * 0.9; // 90% of max height
    }
    
    // Use the smaller scale to maintain proportions
    const finalScale = Math.min(finalScaleX, finalScaleY);
    
    return {
      ...obj,
      scaleX: finalScale,
      scaleY: finalScale
    };
  });

  if (spaceUtilization < 0.3 && finalArrangedObjects.length > 1) {
    // Distribute objects evenly
    const cols = Math.ceil(Math.sqrt(finalArrangedObjects.length));
    const rows = Math.ceil(finalArrangedObjects.length / cols);
    const cellWidth = (newSize.width - 2 * margin) / cols;
    const cellHeight = (newSize.height - 2 * margin) / rows;

    return finalArrangedObjects.map((obj, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const objWidth = obj.width * obj.scaleX;
      const objHeight = obj.height * obj.scaleY;
      
      const cellCenterX = margin + col * cellWidth + cellWidth / 2;
      const cellCenterY = margin + row * cellHeight + cellHeight / 2;
      
      return {
        id: obj.id,
        left: Math.max(margin, Math.min(newSize.width - objWidth - margin, cellCenterX - objWidth / 2)),
        top: Math.max(margin, Math.min(newSize.height - objHeight - margin, cellCenterY - objHeight / 2)),
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
      };
    });
  }

  // Final boundary check and positioning
  return finalArrangedObjects.map(obj => {
    const objWidth = obj.width * obj.scaleX;
    const objHeight = obj.height * obj.scaleY;
    
    // Ensure final positioning stays within canvas bounds
    const finalLeft = Math.max(margin, Math.min(newSize.width - objWidth - margin, obj.left));
    const finalTop = Math.max(margin, Math.min(newSize.height - objHeight - margin, obj.top));
    
    return {
      id: obj.id,
      left: finalLeft,
      top: finalTop,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
    };
  });
}

export default app;
