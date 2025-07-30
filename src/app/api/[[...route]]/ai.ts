import { verifyAuth } from '@hono/auth-js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import OpenAI from 'openai';

import { getReplicate } from '@/lib/replicate';
import { OpenAIVisionService } from '@/features/editor/services/openai-vision';
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
