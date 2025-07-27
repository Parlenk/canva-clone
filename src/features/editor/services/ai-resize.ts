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
    // TEMPORARILY DISABLE TRUE AI TO STOP SCREENSHOT POPUPS
    // TODO: Fix canvas screenshot issue before re-enabling
    const enableTrueAI = false; // Disabled until screenshot issue is resolved
    
    if (enableTrueAI && canvas && process.env.NEXT_PUBLIC_OPENAI_ENABLED === 'true') {
      console.log('🔑 OpenAI enabled, attempting TRUE AI analysis...');
      return await generateTrueAIInstructions(currentSize, newSize, canvasObjects, canvas);
    }

    console.log('🔧 Using smart algorithmic approach (no OpenAI key or disabled)');
    // Fallback to smart algorithmic approach
    return generateSmartResizeInstructions(currentSize, newSize, canvasObjects);
  } catch (error) {
    console.error('❌ AI resize service error:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    // Final fallback to basic proportional scaling
    return generateFallbackInstructions(currentSize, newSize, canvasObjects);
  }
}

async function generateTrueAIInstructions(
  currentSize: { width: number; height: number },
  newSize: { width: number; height: number },
  canvasObjects: CanvasObject[],
  canvas: fabric.Canvas
): Promise<ResizeInstructions> {
  try {
    console.log('🤖 Using TRUE AI analysis with OpenAI Vision...');
    
    // Step 1: Convert canvas to image for visual analysis
    const canvasImageBase64 = await convertCanvasToBase64(canvas);
    console.log('📸 Canvas converted to image for AI analysis');
    
    // Step 2: Call the vision-powered API
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
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.warn('⚠️ Vision API failed:', result.error);
      if (result.fallback) {
        console.log('🔄 API suggested fallback, using smart algorithm...');
        throw new Error(result.error || 'Vision API failed');
      }
      throw new Error(result.error || 'Vision API failed');
    }
    
    console.log('🧠 AI Canvas Analysis:', result.analysis);
    console.log('✨ AI Resize Decision:', result.resize);
    console.log('📋 Design Rationale:', result.resize?.designRationale);
    console.log('🎯 Applied Principles:', result.resize?.appliedPrinciples);
    
    return {
      objects: result.placements || []
    };
  } catch (error) {
    console.error('True AI analysis failed:', error);
    console.log('🔄 Falling back to smart algorithmic approach...');
    return generateSmartResizeInstructions(currentSize, newSize, canvasObjects);
  }
}

async function convertCanvasToBase64(canvas: fabric.Canvas): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log('📸 Converting canvas to base64 (no screenshots taken)');
      
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
      
      // Force render without animations
      canvas.renderAll();
      
      // Use Fabric.js built-in toDataURL (no system screenshot)
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.5, // Smaller size for AI analysis
        enableRetinaScaling: false,
      });
      
      // Restore original state immediately
      if (workspace && originalStroke) {
        workspace.set({ stroke: originalStroke });
      }
      if (activeObject) {
        canvas.setActiveObject(activeObject);
      }
      canvas.renderAll();
      
      // Extract base64 data
      const base64 = dataURL.split(',')[1];
      if (!base64) {
        throw new Error('Failed to convert canvas to base64');
      }
      
      console.log('✅ Canvas converted to base64 successfully (size:', base64.length, 'chars)');
      resolve(base64);
    } catch (error) {
      console.error('❌ Canvas conversion failed:', error);
      reject(error);
    }
  });
}

function generateFallbackInstructions(
  currentSize: { width: number; height: number },
  newSize: { width: number; height: number },
  canvasObjects: CanvasObject[]
): ResizeInstructions {
  return generateSmartResizeInstructions(currentSize, newSize, canvasObjects);
}

function generateSmartResizeInstructions(
  currentSize: { width: number; height: number },
  newSize: { width: number; height: number },
  canvasObjects: CanvasObject[]
): ResizeInstructions {
  console.log('=== Smart Resize: Orientation-Aware Process ===');
  
  // Detect orientation change
  const currentOrientation = currentSize.width > currentSize.height ? 'landscape' : 'portrait';
  const newOrientation = newSize.width > newSize.height ? 'landscape' : 'portrait';
  const isOrientationChange = currentOrientation !== newOrientation;
  
  console.log(`Orientation change: ${currentOrientation} → ${newOrientation} (${isOrientationChange ? 'YES' : 'NO'})`);
  
  let processedObjects: CanvasObject[];
  
  if (isOrientationChange) {
    // Use orientation-aware resize for dramatic layout changes
    console.log('🔄 Applying orientation-aware resize...');
    processedObjects = handleOrientationChange(currentSize, newSize, canvasObjects);
  } else {
    // Use standard proportional resize for same-orientation changes
    console.log('📐 Applying standard proportional resize...');
    processedObjects = scaleObjectsProportionally(currentSize, newSize, canvasObjects);
  }
  
  // Step 2: Smart arrangement to avoid overlaps
  const arrangedObjects = arrangeObjectsSmart(newSize, processedObjects);
  console.log('Step 2 - Smart arrangement completed');
  
  // Step 3: Fill space efficiently
  const finalObjects = fillSpaceEfficiently(newSize, arrangedObjects);
  console.log('Step 3 - Space filling completed');

  return {
    objects: finalObjects.map(obj => ({
      id: obj.id,
      left: obj.left,
      top: obj.top,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
    })),
  };
}

// Orientation-aware resize: Handles horizontal ↔ vertical transitions intelligently
function handleOrientationChange(
  currentSize: { width: number; height: number },
  newSize: { width: number; height: number },
  canvasObjects: CanvasObject[]
): CanvasObject[] {
  const isLandscapeToPortrait = currentSize.width > currentSize.height && newSize.width <= newSize.height;
  const isPortraitToLandscape = currentSize.width <= currentSize.height && newSize.width > newSize.height;
  
  console.log(`🔄 Orientation change detected: ${isLandscapeToPortrait ? 'Landscape → Portrait' : 'Portrait → Landscape'}`);
  
  // Calculate optimal scale factor for the new orientation
  const scaleForWidth = newSize.width / currentSize.width;
  const scaleForHeight = newSize.height / currentSize.height;
  
  // For orientation changes, we need to be more conservative with scaling
  const baseScale = Math.min(scaleForWidth, scaleForHeight) * 0.7;
  
  // Group objects by their layout role
  const { textObjects, imageObjects, shapeObjects } = categorizeObjects(canvasObjects);
  
  let repositionedObjects: CanvasObject[] = [];
  
  if (isLandscapeToPortrait) {
    // Landscape → Portrait: Stack content vertically
    console.log('📱 Adapting for portrait layout...');
    repositionedObjects = adaptToPortrait(newSize, { textObjects, imageObjects, shapeObjects }, baseScale);
  } else if (isPortraitToLandscape) {
    // Portrait → Landscape: Arrange content horizontally
    console.log('🖥️ Adapting for landscape layout...');
    repositionedObjects = adaptToLandscape(newSize, { textObjects, imageObjects, shapeObjects }, baseScale);
  }
  
  return repositionedObjects;
}

// Categorize objects by their design role
function categorizeObjects(objects: CanvasObject[]) {
  const textObjects = objects.filter(obj => obj.type === 'textbox' || obj.type === 'text');
  const imageObjects = objects.filter(obj => obj.type === 'image');
  const shapeObjects = objects.filter(obj => !textObjects.includes(obj) && !imageObjects.includes(obj));
  
  console.log(`📊 Object categories: ${textObjects.length} text, ${imageObjects.length} images, ${shapeObjects.length} shapes`);
  
  return { textObjects, imageObjects, shapeObjects };
}

// Adapt layout for portrait orientation (vertical stacking)
function adaptToPortrait(
  canvasSize: { width: number; height: number },
  { textObjects, imageObjects, shapeObjects }: { textObjects: CanvasObject[], imageObjects: CanvasObject[], shapeObjects: CanvasObject[] },
  baseScale: number
): CanvasObject[] {
  const margin = 30;
  const usableWidth = canvasSize.width - 2 * margin;
  let currentY = margin;
  const result: CanvasObject[] = [];
  
  // Priority order for portrait: Text → Images → Shapes
  const orderedGroups = [
    { objects: textObjects, name: 'text' },
    { objects: imageObjects, name: 'images' },
    { objects: shapeObjects, name: 'shapes' }
  ];
  
  orderedGroups.forEach(group => {
    if (group.objects.length === 0) return;
    
    console.log(`📝 Positioning ${group.objects.length} ${group.name} objects...`);
    
    group.objects.forEach((obj, index) => {
      const scaledWidth = obj.width * obj.scaleX * baseScale;
      const scaledHeight = obj.height * obj.scaleY * baseScale;
      
      // Center objects horizontally
      const left = margin + (usableWidth - scaledWidth) / 2;
      
      // For text, maintain readable size
      const finalScale = group.name === 'text' ? Math.max(baseScale, 0.8) : baseScale;
      
      result.push({
        ...obj,
        left: Math.max(margin, left),
        top: currentY,
        scaleX: obj.scaleX * finalScale,
        scaleY: obj.scaleY * finalScale,
      });
      
      // Add spacing between objects
      currentY += scaledHeight + margin * 0.5;
      
      // Ensure we don't exceed canvas height
      if (currentY > canvasSize.height - margin) {
        console.log('⚠️ Portrait layout: Reached bottom, remaining objects will overlap');
      }
    });
    
    // Add extra spacing between groups
    currentY += margin * 0.5;
  });
  
  return result;
}

// Adapt layout for landscape orientation (horizontal arrangement)
function adaptToLandscape(
  canvasSize: { width: number; height: number },
  { textObjects, imageObjects, shapeObjects }: { textObjects: CanvasObject[], imageObjects: CanvasObject[], shapeObjects: CanvasObject[] },
  baseScale: number
): CanvasObject[] {
  const margin = 30;
  const usableWidth = canvasSize.width - 2 * margin;
  const usableHeight = canvasSize.height - 2 * margin;
  
  // Create a grid-like layout for landscape
  const totalObjects = textObjects.length + imageObjects.length + shapeObjects.length;
  const cols = Math.min(3, Math.ceil(Math.sqrt(totalObjects))); // Max 3 columns
  const rows = Math.ceil(totalObjects / cols);
  
  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;
  
  console.log(`🖥️ Landscape grid: ${cols}x${rows} (${cellWidth.toFixed(0)}x${cellHeight.toFixed(0)} per cell)`);
  
  const result: CanvasObject[] = [];
  let objectIndex = 0;
  
  // Priority order for landscape: Text → Images → Shapes
  const allObjects = [...textObjects, ...imageObjects, ...shapeObjects];
  
  allObjects.forEach((obj, index) => {
    const col = objectIndex % cols;
    const row = Math.floor(objectIndex / cols);
    
    const cellCenterX = margin + col * cellWidth + cellWidth / 2;
    const cellCenterY = margin + row * cellHeight + cellHeight / 2;
    
    const scaledWidth = obj.width * obj.scaleX * baseScale;
    const scaledHeight = obj.height * obj.scaleY * baseScale;
    
    // Scale down if object is too large for cell
    let finalScaleX = obj.scaleX * baseScale;
    let finalScaleY = obj.scaleY * baseScale;
    
    if (scaledWidth > cellWidth * 0.8) {
      finalScaleX = (obj.scaleX * cellWidth * 0.8) / obj.width;
    }
    if (scaledHeight > cellHeight * 0.8) {
      finalScaleY = (obj.scaleY * cellHeight * 0.8) / obj.height;
    }
    
    // For text, maintain readable size
    if (obj.type === 'textbox' || obj.type === 'text') {
      finalScaleX = Math.max(finalScaleX, obj.scaleX * 0.8);
      finalScaleY = Math.max(finalScaleY, obj.scaleY * 0.8);
    }
    
    const finalWidth = obj.width * finalScaleX;
    const finalHeight = obj.height * finalScaleY;
    
    result.push({
      ...obj,
      left: cellCenterX - finalWidth / 2,
      top: cellCenterY - finalHeight / 2,
      scaleX: finalScaleX,
      scaleY: finalScaleY,
    });
    
    objectIndex++;
  });
  
  return result;
}

// Step 1: Scale objects proportionally while maintaining aspect ratios
function scaleObjectsProportionally(
  currentSize: { width: number; height: number },
  newSize: { width: number; height: number },
  canvasObjects: CanvasObject[]
): CanvasObject[] {
  const canvasScaleRatio = Math.min(
    newSize.width / currentSize.width,
    newSize.height / currentSize.height
  );
  
  // Use a conservative scale factor to ensure objects fit well
  const conservativeScale = canvasScaleRatio * 0.8;
  
  return canvasObjects.map(obj => ({
    ...obj,
    // Scale positions proportionally to canvas change
    left: (obj.left / currentSize.width) * newSize.width,
    top: (obj.top / currentSize.height) * newSize.height,
    // Scale object size proportionally but conservatively
    scaleX: obj.scaleX * conservativeScale,
    scaleY: obj.scaleY * conservativeScale,
  }));
}

// Step 2: Arrange objects smartly to avoid overlaps and maintain relationships
function arrangeObjectsSmart(
  canvasSize: { width: number; height: number },
  objects: CanvasObject[]
): CanvasObject[] {
  const margin = 20; // Minimum margin from edges and between objects
  const arrangedObjects = [...objects];
  
  // Sort objects by importance (larger objects first, then by type priority)
  arrangedObjects.sort((a, b) => {
    const aArea = (a.width * a.scaleX) * (a.height * a.scaleY);
    const bArea = (b.width * b.scaleX) * (b.height * b.scaleY);
    
    // Prioritize text objects and larger objects
    const aPriority = a.type === 'textbox' ? 1000 : aArea;
    const bPriority = b.type === 'textbox' ? 1000 : bArea;
    
    return bPriority - aPriority;
  });
  
  // Place objects avoiding overlaps
  for (let i = 0; i < arrangedObjects.length; i++) {
    const obj = arrangedObjects[i];
    const objWidth = obj.width * obj.scaleX;
    const objHeight = obj.height * obj.scaleY;
    
    // Ensure object is within canvas bounds
    obj.left = Math.max(margin, Math.min(canvasSize.width - objWidth - margin, obj.left));
    obj.top = Math.max(margin, Math.min(canvasSize.height - objHeight - margin, obj.top));
    
    // Check for overlaps with previously placed objects
    let attempts = 0;
    while (attempts < 10) {
      let hasOverlap = false;
      
      for (let j = 0; j < i; j++) {
        const otherObj = arrangedObjects[j];
        const otherWidth = otherObj.width * otherObj.scaleX;
        const otherHeight = otherObj.height * otherObj.scaleY;
        
        // Check if objects overlap
        if (
          obj.left < otherObj.left + otherWidth + margin &&
          obj.left + objWidth + margin > otherObj.left &&
          obj.top < otherObj.top + otherHeight + margin &&
          obj.top + objHeight + margin > otherObj.top
        ) {
          hasOverlap = true;
          
          // Try to move object to avoid overlap
          const moveRight = otherObj.left + otherWidth + margin;
          const moveDown = otherObj.top + otherHeight + margin;
          
          // Choose the direction that keeps object more centered
          if (moveRight + objWidth < canvasSize.width - margin) {
            obj.left = moveRight;
          } else if (moveDown + objHeight < canvasSize.height - margin) {
            obj.top = moveDown;
          } else {
            // Find alternative position
            obj.left = Math.random() * (canvasSize.width - objWidth - 2 * margin) + margin;
            obj.top = Math.random() * (canvasSize.height - objHeight - 2 * margin) + margin;
          }
          break;
        }
      }
      
      if (!hasOverlap) break;
      attempts++;
    }
  }
  
  return arrangedObjects;
}

// Step 3: Fill space efficiently by distributing objects
function fillSpaceEfficiently(
  canvasSize: { width: number; height: number },
  objects: CanvasObject[]
): CanvasObject[] {
  if (objects.length === 0) return objects;
  
  const margin = 20;
  const usableWidth = canvasSize.width - 2 * margin;
  const usableHeight = canvasSize.height - 2 * margin;
  
  // Calculate total object area and available space
  const totalObjectArea = objects.reduce((sum, obj) => {
    return sum + (obj.width * obj.scaleX) * (obj.height * obj.scaleY);
  }, 0);
  
  const availableArea = usableWidth * usableHeight;
  const spaceUtilization = totalObjectArea / availableArea;
  
  // If space utilization is low, try to distribute objects more evenly
  if (spaceUtilization < 0.3) {
    return distributeObjectsEvenly(canvasSize, objects, margin);
  }
  
  // For higher utilization, use grid-like arrangement
  if (objects.length > 1) {
    return arrangeInGrid(canvasSize, objects, margin);
  }
  
  return objects;
}

function distributeObjectsEvenly(
  canvasSize: { width: number; height: number },
  objects: CanvasObject[],
  margin: number
): CanvasObject[] {
  const distributedObjects = [...objects];
  const cols = Math.ceil(Math.sqrt(objects.length));
  const rows = Math.ceil(objects.length / cols);
  
  const cellWidth = (canvasSize.width - 2 * margin) / cols;
  const cellHeight = (canvasSize.height - 2 * margin) / rows;
  
  distributedObjects.forEach((obj, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const objWidth = obj.width * obj.scaleX;
    const objHeight = obj.height * obj.scaleY;
    
    // Center object in its cell
    const cellCenterX = margin + col * cellWidth + cellWidth / 2;
    const cellCenterY = margin + row * cellHeight + cellHeight / 2;
    
    obj.left = cellCenterX - objWidth / 2;
    obj.top = cellCenterY - objHeight / 2;
    
    // Ensure object stays within bounds
    obj.left = Math.max(margin, Math.min(canvasSize.width - objWidth - margin, obj.left));
    obj.top = Math.max(margin, Math.min(canvasSize.height - objHeight - margin, obj.top));
  });
  
  return distributedObjects;
}

function arrangeInGrid(
  canvasSize: { width: number; height: number },
  objects: CanvasObject[],
  margin: number
): CanvasObject[] {
  const gridObjects = [...objects];
  
  // Sort by size for better arrangement
  gridObjects.sort((a, b) => {
    const aArea = (a.width * a.scaleX) * (a.height * a.scaleY);
    const bArea = (b.width * b.scaleX) * (b.height * b.scaleY);
    return bArea - aArea;
  });
  
  let currentX = margin;
  let currentY = margin;
  let rowHeight = 0;
  
  gridObjects.forEach(obj => {
    const objWidth = obj.width * obj.scaleX;
    const objHeight = obj.height * obj.scaleY;
    
    // Check if object fits in current row
    if (currentX + objWidth > canvasSize.width - margin) {
      // Move to next row
      currentX = margin;
      currentY += rowHeight + margin / 2;
      rowHeight = 0;
    }
    
    obj.left = currentX;
    obj.top = currentY;
    
    currentX += objWidth + margin / 2;
    rowHeight = Math.max(rowHeight, objHeight);
    
    // Ensure object stays within bounds
    obj.left = Math.max(margin, Math.min(canvasSize.width - objWidth - margin, obj.left));
    obj.top = Math.max(margin, Math.min(canvasSize.height - objHeight - margin, obj.top));
  });
  
  return gridObjects;
}

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