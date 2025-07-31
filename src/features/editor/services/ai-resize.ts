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
    
    // Step 1.5: Quick API health check
    console.log('🔍 Checking API endpoint health...');
    try {
      const healthResponse = await fetch('/api/ai/test-openai', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ API endpoint is healthy:', healthData);
      } else {
        console.warn('⚠️ API endpoint health check failed:', healthResponse.status);
      }
    } catch (healthError) {
      console.warn('⚠️ API health check failed:', healthError);
      // Continue anyway - health check is just diagnostic
    }
    
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
    console.log('🌐 Making request to /api/ai/vision-resize...');
    let response;
    try {
      response = await fetch('/api/ai/vision-resize', {
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
      console.log('📡 API response received:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('❌ Network request failed:', fetchError);
      
      // Better error message for localhost vs internet issues
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
      
      if (isLocalhost && errorMessage.includes('Failed to fetch')) {
        throw new Error(`Development server connection failed: ${errorMessage}. The server may have stopped running. Please check if the development server is running on localhost:3000.`);
      } else {
        throw new Error(`Network request failed: ${errorMessage}. Please check your internet connection and try again.`);
      }
    }
    
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorResponse = await response.text();
        errorDetails = errorResponse;
        console.error('❌ API Error Response:', errorDetails);
      } catch (e) {
        console.error('❌ Could not read error response');
      }
      throw new Error(`API request failed (${response.status} ${response.statusText}): ${errorDetails || 'Unknown server error'}. Please try again.`);
    }
    
    let result;
    try {
      result = await response.json();
      console.log('📊 API Response:', result);
    } catch (parseError) {
      console.error('❌ Failed to parse API response:', parseError);
      throw new Error('Invalid response from AI service. Please try again.');
    }
    
    if (!result.success) {
      const errorMessage = result.error || 'Unknown AI service error';
      console.error('❌ AI Service Error:', errorMessage);
      throw new Error(`AI analysis failed: ${errorMessage}. Please try again.`);
    }
    
    console.log('🧠 Direct AI Resize Result:', result.resize);
    console.log('📋 Layout Strategy:', result.resize?.layoutStrategy);
    console.log('🎯 Design Rationale:', result.resize?.designRationale);
    
    return {
      objects: result.placements || []
    };
  } catch (error) {
    console.error('❌ AI resize analysis failed');
    console.error('❌ Error details:', error);
    
    // Extract clean error message without repetitive prefixes
    let cleanErrorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Ensure cleanErrorMessage is a string before calling replace
    if (typeof cleanErrorMessage === 'string') {
      // Remove redundant "TRUE AI ONLY MODE" prefixes if they exist
      cleanErrorMessage = cleanErrorMessage.replace(/TRUE AI ONLY MODE[:\s-]*/g, '');
      cleanErrorMessage = cleanErrorMessage.replace(/Complete failure[:\s-]*/g, '');
    } else {
      cleanErrorMessage = 'Unknown error occurred';
    }
    
    throw new Error(`AI resize failed: ${cleanErrorMessage}`);
  }
}

async function convertCanvasToBase64(canvas: fabric.Canvas): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔍 Converting canvas to base64 (canvas-level only)');
      
      // Ensure canvas is properly rendered before conversion
      canvas.renderAll();
      
      // Wait a small amount to ensure rendering is complete
      setTimeout(() => {
        try {
          // Store original state
          const activeObject = canvas.getActiveObject();
          const workspace = canvas.getObjects().find(obj => obj.name === 'clip');
          const originalStroke = workspace?.stroke;
          
          // Temporarily hide UI elements for clean capture
          if (activeObject) {
            canvas.discardActiveObject();
          }
          
          if (workspace) {
            workspace.set({ stroke: 'transparent' });
          }
          
          // Force another render after state changes
          canvas.renderAll();
          
          // Use Fabric.js built-in toDataURL with more robust settings
          const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 0.8, // Increased quality for better AI analysis
            multiplier: 0.5, // Balanced multiplier
            enableRetinaScaling: false,
            left: 0,
            top: 0,
            width: canvas.width || 800,
            height: canvas.height || 600
          });
          
          // Restore original state immediately
          if (workspace && originalStroke) {
            workspace.set({ stroke: originalStroke });
          }
          if (activeObject) {
            canvas.setActiveObject(activeObject);
          }
          
          // Force render after restoring state
          canvas.renderAll();
          
          // Validate dataURL format
          if (!dataURL || !dataURL.startsWith('data:image/')) {
            throw new Error('Invalid dataURL format - not a valid image');
          }
          
          // Extract base64 data
          const base64 = dataURL.split(',')[1];
          if (!base64 || base64.length < 500) {
            throw new Error('Base64 data too short or missing - canvas may be empty');
          }
          
          console.log('✅ Canvas conversion complete:', {
            dataURLLength: dataURL.length,
            base64Length: base64.length,
            canvasSize: { width: canvas.width, height: canvas.height }
          });
          
          resolve(base64);
          
        } catch (conversionError) {
          console.error('❌ Canvas conversion failed:', conversionError);
          reject(new Error(`Canvas conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`));
        }
      }, 100); // Small delay to ensure rendering is complete
      
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