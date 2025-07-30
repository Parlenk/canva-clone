import { fabric } from 'fabric';
import { OpenAIVisionService } from './openai-vision';

interface CanvasObject {
  id: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  fill?: string;
  text?: string;
}

interface ResizeInstructions {
  objects: Array<{
    id: string;
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
  }>;
}

export async function generateAIResizeInstructions(
  currentSize: { width: number; height: number },
  newSize: { width: number; height: number },
  canvasObjects: CanvasObject[],
  canvas?: fabric.Canvas
): Promise<ResizeInstructions> {
  try {
    // TRUE AI ENABLED - Using AI Vision for intelligent resize
    const enableTrueAI = true; // Enabled for TRUE AI-powered resize
    const enableCanvasScreenshot = true; // ENABLED for TRUE AI-powered resize!
    const useGoogleVision = process.env.GOOGLE_CLOUD_PROJECT_ID ? true : false; // Use Google Vision if available
    
    console.log('🔍 AI Resizer Debug:', {
      enableTrueAI,
      hasCanvas: !!canvas,
      enableCanvasScreenshot,
      useGoogleVision,
      serverSide: typeof window === 'undefined'
    });
    
    // ONLY TRUE AI - No fallbacks allowed
    if (!enableTrueAI || !canvas || !enableCanvasScreenshot) {
      throw new Error('TRUE AI resize requires canvas and screenshot enabled');
    }

    console.log('🔑 Using ONLY TRUE AI analysis - no fallbacks!');
    return await generateTrueAIInstructions(currentSize, newSize, canvasObjects, canvas);
  } catch (error) {
    console.error('❌ TRUE AI ONLY - Complete failure, no fallbacks allowed');
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    // NO FALLBACKS EVER - Throw error to user
    throw new Error(`TRUE AI ONLY MODE: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Rate limiting for canvas conversion to prevent system alerts
let lastCanvasConversion = 0;
const CONVERSION_COOLDOWN = 2000; // 2 seconds between conversions

async function generateTrueAIInstructions(
  currentSize: { width: number; height: number },
  newSize: { width: number; height: number },
  canvasObjects: CanvasObject[],
  canvas: fabric.Canvas
): Promise<ResizeInstructions> {
  try {
    const useGoogleVision = process.env.GOOGLE_CLOUD_PROJECT_ID ? true : false;
    console.log(`🤖 Using TRUE AI analysis with ${useGoogleVision ? 'Google Vision' : 'OpenAI Vision'}...`);
    
    // Rate limiting disabled for TRUE AI testing
    console.log('🚫 Rate limiting disabled - TRUE AI will always run');
    
    // Step 1: Convert canvas to image for visual analysis
    console.log('📸 Starting canvas conversion for TRUE AI...');
    const canvasImageBase64 = await convertCanvasToBase64(canvas);
    console.log('📊 Canvas conversion result:', {
      hasData: !!canvasImageBase64,
      length: canvasImageBase64?.length || 0,
      isValid: canvasImageBase64 && canvasImageBase64.length >= 1000
    });
    
    // NO FALLBACKS - Force TRUE AI only
    if (!canvasImageBase64 || canvasImageBase64.length < 1000) {
      console.error('❌ Canvas conversion failed - STOPPING (no fallbacks allowed)');
      throw new Error('TRUE AI ONLY: Canvas conversion failed - resize aborted');
    }
    
    console.log('✅ Canvas converted successfully for TRUE AI analysis');
    
    // Step 2: Use Google Vision if available as primary, OpenAI as fallback
    if (useGoogleVision) {
      try {
        console.log('🔍 Using Google Vision API...');
        const response = await fetch('/api/ai/google-vision-resize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            canvasImage: canvasImageBase64,
            currentSize,
            newSize,
            objectsData: canvasObjects.map(obj => ({
              id: obj.id,
              type: obj.type,
              left: obj.left,
              top: obj.top,
              width: obj.width,
              height: obj.height,
              scaleX: obj.scaleX,
              scaleY: obj.scaleY,
              text: obj.text,
            })),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('🧠 Google Vision Analysis:', result.analysis);
          console.log('✨ Google Vision Resize:', result.resize);
          
          return {
            objects: result.placements || []
          };
        } else {
          console.error('❌ Google Vision API failed - STOPPING (no fallbacks)');
          throw new Error(`Google Vision API failed: ${response.status} - TRUE AI ONLY mode`);
        }
      } catch (googleError) {
        console.error('❌ Google Vision failed - STOPPING (no OpenAI fallback allowed)');
        throw new Error(`Google Vision failed: ${googleError instanceof Error ? googleError.message : 'Unknown error'} - TRUE AI ONLY mode`);
      }
    }
    
    // Step 3: Call the OpenAI vision-powered API (PRIMARY - no fallbacks)
    const response = await fetch('/api/ai/vision-resize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        canvasImage: canvasImageBase64,
        currentSize,
        newSize,
        objectsData: canvasObjects.map(obj => ({
          id: obj.id,
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          text: obj.text,
        })),
      }),
    });
    
    if (!response.ok) {
      console.error('❌ OpenAI Vision API request failed - STOPPING (no fallbacks)');
      throw new Error(`OpenAI API request failed: ${response.status} - TRUE AI ONLY mode`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ OpenAI Vision API failed - STOPPING (no fallbacks)');
      throw new Error(`OpenAI Vision API failed: ${result.error || 'Unknown error'} - TRUE AI ONLY mode`);
    }
    
    console.log('🧠 Direct AI Resize Result:', result.resize);
    console.log('📋 Layout Strategy:', result.resize?.layoutStrategy);
    console.log('🎯 Design Rationale:', result.resize?.designRationale);
    
    return {
      objects: result.placements || []
    };
  } catch (error) {
    console.error('❌ TRUE AI analysis completely failed - NO FALLBACKS');
    console.error('❌ This means OpenAI Vision API is not working');
    throw new Error(`TRUE AI ONLY MODE - Complete failure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function convertCanvasToBase64(canvas: fabric.Canvas): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔍 Converting canvas to base64 (canvas-level only)');
      
      // Store original state
      const activeObject = canvas.getActiveObject();
      const workspace = canvas.getObjects().find(obj => obj.name === 'clip');
      const originalStroke = workspace?.stroke;
      
      try {
        // Temporarily hide UI elements for clean capture
        if (activeObject) {
          canvas.discardActiveObject();
        }
        
        if (workspace) {
          workspace.set({ stroke: 'transparent' });
        }
        
        // Use Fabric.js built-in toDataURL efficiently
        const dataURL = canvas.toDataURL({
          format: 'png',
          quality: 0.6, // Reduced quality to minimize processing
          multiplier: 0.3, // Further reduced for faster processing
          enableRetinaScaling: false,
          left: 0,
          top: 0,
          width: canvas.width,
          height: canvas.height
        });
        
        // Restore original state immediately
        if (workspace && originalStroke) {
          workspace.set({ stroke: originalStroke });
        }
        if (activeObject) {
          canvas.setActiveObject(activeObject);
        }
        
        // Extract base64 data
        const base64 = dataURL.split(',')[1];
        if (!base64) {
          throw new Error('Failed to extract base64 data');
        }
        
        console.log('✅ Canvas conversion complete (optimized size)');
        resolve(base64);
        
      } catch (conversionError) {
        console.error('❌ Canvas conversion failed - no fallbacks');
        reject(new Error(`Canvas conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`));
      }
      
    } catch (error) {
      console.error('❌ Canvas conversion error:', error);
      reject(error);
    }
  });
}

// All fallback functions removed - TRUE AI only mode
// Removed: generateSmartResizeInstructions, handleOrientationChange, adaptToPortrait, 
// adaptToLandscape, categorizeObjects, scaleObjectsProportionally, arrangeObjectsSmart,
// fillSpaceEfficiently, distributeObjectsEvenly, arrangeInGrid

export function extractCanvasObjects(canvas: fabric.Canvas): CanvasObject[] {
  return canvas.getObjects()
    .filter(obj => obj.name !== 'clip') // Exclude workspace
    .map((obj, index) => ({
      id: `obj_${index}`,
      type: obj.type || 'unknown',
      left: obj.left || 0,
      top: obj.top || 0,
      width: obj.width || 0,
      height: obj.height || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      fill: typeof obj.fill === 'string' ? obj.fill : undefined,
      text: (obj as any).text || undefined,
    }));
}