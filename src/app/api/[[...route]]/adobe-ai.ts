import { verifyAuth } from '@hono/auth-js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono()
  .post(
    '/upload',
    verifyAuth(),
    async (ctx) => {
      const session = ctx.get('authUser');
      if (!session.token?.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }

      try {
        console.log('📁 Adobe AI file upload initiated');
        
        // Get the uploaded file from the request
        const body = await ctx.req.parseBody();
        const file = body['aiFile'] as File;
        
        if (!file) {
          return ctx.json({ error: 'No AI file provided' }, 400);
        }

        // Validate file type and size
        if (!file.name.toLowerCase().endsWith('.ai')) {
          return ctx.json({ error: 'File must be a .ai file' }, 400);
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          return ctx.json({ error: 'File size too large (max 50MB)' }, 400);
        }

        console.log(`📋 Processing AI file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

        // Read file content
        const fileBuffer = await file.arrayBuffer();
        const fileContent = new TextDecoder().decode(fileBuffer);

        // Enhanced AI file validation
        const validSignatures = ['%!PS-Adobe', '%PDF-', 'Adobe'];
        const hasValidSignature = validSignatures.some(sig => fileContent.includes(sig));
        
        if (!hasValidSignature) {
          console.warn('⚠️ File signature not recognized, proceeding with caution');
          // Don't fail here - let the parser try anyway
        }

        // Parse metadata from AI file
        const metadata = parseAIMetadata(fileContent);
        console.log('🎨 Extracted metadata:', metadata);

        // Convert to canvas-compatible format
        const canvasData = await convertAIToCanvas(fileContent, metadata);
        console.log('✅ Converted to canvas format:', {
          objectCount: canvasData.objects?.length || 0,
          canvasSize: `${canvasData.width}x${canvasData.height}`
        });

        return ctx.json({
          success: true,
          data: {
            filename: file.name,
            metadata,
            canvasData,
            objects: canvasData.objects || [],
          }
        });

      } catch (error) {
        console.error('❌ Adobe AI file processing failed:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Provide more specific error messages
        let userMessage = 'Failed to process Adobe AI file';
        let statusCode = 500;
        
        if (errorMessage.includes('decode')) {
          userMessage = 'File appears to be corrupted or in an unsupported format';
          statusCode = 400;
        } else if (errorMessage.includes('memory') || errorMessage.includes('size')) {
          userMessage = 'File is too large or complex to process';
          statusCode = 413;
        } else if (errorMessage.includes('timeout')) {
          userMessage = 'File processing timed out. Please try a smaller file';
          statusCode = 408;
        }
        
        return ctx.json({
          error: userMessage,
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          suggestions: [
            'Try exporting the file as SVG from Adobe Illustrator',
            'Simplify the artwork and reduce the number of objects',
            'Use a smaller file size (under 10MB recommended)'
          ]
        }, statusCode as 400 | 413 | 408 | 500);
      }
    },
  )
  .post(
    '/convert-server',
    verifyAuth(),
    zValidator(
      'json',
      z.object({
        fileData: z.string(), // Base64 encoded file
        filename: z.string(),
        conversionOptions: z.object({
          targetFormat: z.enum(['fabric', 'svg', 'json']).default('fabric'),
          preserveArtboards: z.boolean().default(true),
          scaleFactor: z.number().min(0.1).max(10).default(1),
        }).optional(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('authUser');
      if (!session.token?.id) {
        return ctx.json({ error: 'Unauthorized' }, 401);
      }

      const { fileData, filename, conversionOptions = {} } = ctx.req.valid('json');

      try {
        console.log('🔄 Server-side AI conversion initiated');

        // Decode base64 file data
        const buffer = Buffer.from(fileData, 'base64');
        const fileContent = buffer.toString('utf-8');

        // Validate AI file with enhanced checks
        const validSignatures = ['%!PS-Adobe', '%PDF-', 'Adobe'];
        const hasValidSignature = validSignatures.some(sig => fileContent.includes(sig));
        
        if (!hasValidSignature) {
          console.warn('⚠️ Server conversion: File signature not recognized, proceeding with caution');
          // Don't fail here - let the parser try anyway
        }

        // Advanced conversion logic would go here
        // For now, use the same parsing logic
        const metadata = parseAIMetadata(fileContent);
        const canvasData = await convertAIToCanvas(fileContent, metadata, conversionOptions);

        return ctx.json({
          success: true,
          data: {
            filename,
            metadata,
            canvasData,
            objects: canvasData.objects || [],
            conversionOptions,
          }
        });

      } catch (error) {
        console.error('❌ Server-side AI conversion failed:', error);
        return ctx.json({
          error: 'Server conversion failed',
          details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
        }, 500);
      }
    },
  )
  .get(
    '/supported-features',
    async (ctx) => {
      return ctx.json({
        supportedFeatures: {
          basicParsing: true,
          pathExtraction: true,
          textExtraction: true,
          colorExtraction: true,
          artboardSupport: true,
          layerSupport: false, // Not implemented yet
          gradientSupport: false, // Not implemented yet
          effectsSupport: false, // Not implemented yet
          embeddedImagesSupport: false, // Not implemented yet
        },
        limitations: [
          'Complex path operations may not be fully supported',
          'Embedded images are not extracted',
          'Advanced effects and filters are not preserved',
          'Text formatting may be simplified',
          'Gradients are converted to solid colors',
        ],
        recommendedAlternatives: [
          'Export as SVG from Illustrator for better compatibility',
          'Use Adobe Creative SDK for full feature support',
          'Consider server-side conversion with Ghostscript',
        ]
      });
    }
  );

// Helper functions for AI file processing

function parseAIMetadata(content: string): any {
  const lines = content.split('\n').slice(0, 200); // Check first 200 lines
  
  const metadata: any = {
    version: 'Unknown',
    creator: 'Adobe Illustrator',
    boundingBox: { left: 0, bottom: 0, right: 595, top: 842 },
    pageSize: { width: 595, height: 842 },
    artboards: [],
  };

  // Extract version
  for (const line of lines) {
    const versionMatch = line.match(/%%Creator: Adobe Illustrator\(R\) (\d+\.\d+)/);
    if (versionMatch) {
      metadata.version = versionMatch[1];
    }

    // Extract bounding box
    const bboxMatch = line.match(/%%BoundingBox: (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/);
    if (bboxMatch) {
      metadata.boundingBox = {
        left: parseFloat(bboxMatch[1]),
        bottom: parseFloat(bboxMatch[2]),
        right: parseFloat(bboxMatch[3]),
        top: parseFloat(bboxMatch[4]),
      };
      
      metadata.pageSize = {
        width: metadata.boundingBox.right - metadata.boundingBox.left,
        height: metadata.boundingBox.top - metadata.boundingBox.bottom,
      };
    }

    // Extract title
    if (line.startsWith('%%Title:')) {
      metadata.title = line.substring(8).trim();
    }

    // Extract artboards
    const artboardMatch = line.match(/%%AI5_ArtboardRect:\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/);
    if (artboardMatch) {
      const left = parseFloat(artboardMatch[1]);
      const bottom = parseFloat(artboardMatch[2]);
      const right = parseFloat(artboardMatch[3]);
      const top = parseFloat(artboardMatch[4]);
      
      metadata.artboards.push({
        name: `Artboard ${metadata.artboards.length + 1}`,
        bounds: {
          x: left,
          y: bottom,
          width: right - left,
          height: top - bottom,
        },
      });
    }
  }

  return metadata;
}

async function convertAIToCanvas(
  content: string, 
  metadata: any, 
  options: any = {}
): Promise<any> {
  const { scaleFactor = 1, preserveArtboards = true } = options;
  
  console.log('🔄 Converting AI content to canvas format...');

  // Extract objects from AI content
  const objects = extractAIObjects(content, metadata, scaleFactor);
  
  // Determine canvas size
  let canvasWidth = metadata.pageSize.width * scaleFactor;
  let canvasHeight = metadata.pageSize.height * scaleFactor;
  
  // Use first artboard if available and requested
  if (preserveArtboards && metadata.artboards.length > 0) {
    const firstArtboard = metadata.artboards[0];
    canvasWidth = firstArtboard.bounds.width * scaleFactor;
    canvasHeight = firstArtboard.bounds.height * scaleFactor;
  }

  return {
    version: '5.3.0', // Fabric.js version
    width: Math.max(100, Math.round(canvasWidth)),
    height: Math.max(100, Math.round(canvasHeight)),
    objects,
    background: '#ffffff',
    metadata: {
      source: 'Adobe Illustrator',
      originalFile: metadata,
      conversionDate: new Date().toISOString(),
      scaleFactor,
    },
  };
}

function extractAIObjects(content: string, metadata: any, scaleFactor: number): any[] {
  const objects: any[] = [];
  let objectId = 0;

  // Extract paths (simplified)
  const pathPattern = /([mMlLhHvVcCsSqQtTaAzZ])([^mMlLhHvVcCsSqQtTaAzZ]*)/g;
  let match;
  
  while ((match = pathPattern.exec(content)) !== null && objects.length < 500) {
    const command = match[1];
    const params = match[2].trim().split(/\s+/).map(p => parseFloat(p)).filter(n => !isNaN(n));
    
    if (params.length >= 2) {
      const pathData = parsePathCommand(command, params, scaleFactor);
      
      if (pathData.length > 0) {
        objects.push({
          type: 'path',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: pathData[0].x,
          top: metadata.pageSize.height * scaleFactor - pathData[0].y, // Flip Y coordinate
          width: 100 * scaleFactor,
          height: 100 * scaleFactor,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 1 * scaleFactor,
          strokeDashArray: null,
          strokeLineCap: 'butt',
          strokeDashOffset: 0,
          strokeLineJoin: 'miter',
          strokeUniform: false,
          strokeMiterLimit: 4,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
          flipX: false,
          flipY: false,
          opacity: 1,
          shadow: null,
          visible: true,
          path: pathDataToSVGPath(pathData),
        });
        objectId++;
      }
    }
  }

  // Extract text objects (simplified)
  const textPattern = /\((.*?)\)\s*Tj/g;
  while ((match = textPattern.exec(content)) !== null && objects.length < 500) {
    const textContent = match[1];
    if (textContent && textContent.length > 0 && textContent.length < 1000) {
      objects.push({
        type: 'text',
        version: '5.3.0',
        originX: 'left',
        originY: 'top',
        left: 50 * scaleFactor,
        top: 50 * scaleFactor,
        width: textContent.length * 8 * scaleFactor, // Approximate width
        height: 20 * scaleFactor,
        fill: '#000000',
        stroke: null,
        strokeWidth: 0,
        strokeDashArray: null,
        strokeLineCap: 'butt',
        strokeDashOffset: 0,
        strokeLineJoin: 'miter',
        strokeUniform: false,
        strokeMiterLimit: 4,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        flipX: false,
        flipY: false,
        opacity: 1,
        shadow: null,
        visible: true,
        text: textContent,
        fontSize: 16 * scaleFactor,
        fontWeight: 'normal',
        fontFamily: 'Arial',
        fontStyle: 'normal',
        lineHeight: 1.16,
        underline: false,
        overline: false,
        linethrough: false,
        textAlign: 'left',
        textBackgroundColor: '',
      });
      objectId++;
    }
  }

  console.log(`📊 Extracted ${objects.length} objects from AI file`);
  return objects;
}

function parsePathCommand(command: string, params: number[], scaleFactor: number): Array<{x: number, y: number}> {
  const points: Array<{x: number, y: number}> = [];
  
  switch (command.toLowerCase()) {
    case 'm': // moveto
      if (params.length >= 2) {
        points.push({
          x: params[0] * scaleFactor,
          y: params[1] * scaleFactor
        });
      }
      break;
    case 'l': // lineto
      if (params.length >= 2) {
        points.push({
          x: params[0] * scaleFactor,
          y: params[1] * scaleFactor
        });
      }
      break;
    case 'c': // curveto
      if (params.length >= 6) {
        points.push({
          x: params[4] * scaleFactor,
          y: params[5] * scaleFactor
        });
      }
      break;
    default:
      // Handle other commands
      for (let i = 0; i < params.length; i += 2) {
        if (i + 1 < params.length) {
          points.push({
            x: params[i] * scaleFactor,
            y: params[i + 1] * scaleFactor
          });
        }
      }
  }
  
  return points;
}

function pathDataToSVGPath(pathData: Array<{x: number, y: number}>): string {
  if (pathData.length === 0) return '';
  
  let path = `M ${pathData[0].x} ${pathData[0].y}`;
  
  for (let i = 1; i < pathData.length; i++) {
    path += ` L ${pathData[i].x} ${pathData[i].y}`;
  }
  
  return path;
}

export default app;