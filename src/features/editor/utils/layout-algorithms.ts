import { fabric } from 'fabric';

export interface LayoutBounds {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface ObjectInfo {
  object: fabric.Object;
  width: number;
  height: number;
  left: number;
  top: number;
  type: string;
  area: number;
}

export type ResizeStrategy = 'basic' | 'proportional' | 'smart-reflow' | 'grid-layout' | 'center-focus' | 'ai-powered';

/**
 * Analyzes canvas objects and extracts positioning information
 */
export function analyzeObjects(canvas: fabric.Canvas, excludeWorkspace = true): ObjectInfo[] {
  const objects = canvas.getObjects();
  console.log('All canvas objects:', objects.map(obj => ({ type: obj.type, name: obj.name })));
  
  const filtered = objects.filter(obj => !excludeWorkspace || obj.name !== 'clip');
  console.log('Filtered objects (excluding workspace):', filtered.length);
  
  return filtered.map(obj => {
    const bounds = obj.getBoundingRect();
    console.log('Object bounds:', { type: obj.type, bounds });
    return {
      object: obj,
      width: bounds.width,
      height: bounds.height,
      left: bounds.left,
      top: bounds.top,
      type: obj.type || 'unknown',
      area: bounds.width * bounds.height,
    };
  });
}

/**
 * Calculates optimal spacing based on canvas size and object count
 */
export function calculateOptimalSpacing(canvasWidth: number, canvasHeight: number, objectCount: number): number {
  const canvasArea = canvasWidth * canvasHeight;
  const baseSpacing = Math.sqrt(canvasArea) * 0.02; // 2% of canvas diagonal
  const countFactor = Math.max(0.5, 1 - (objectCount - 1) * 0.1); // Reduce spacing with more objects
  return Math.max(10, baseSpacing * countFactor);
}

/**
 * Detects collision between two objects with padding
 */
export function hasCollision(obj1: ObjectInfo, obj2: ObjectInfo, padding = 0): boolean {
  return !(obj1.left + obj1.width + padding <= obj2.left ||
           obj2.left + obj2.width + padding <= obj1.left ||
           obj1.top + obj1.height + padding <= obj2.top ||
           obj2.top + obj2.height + padding <= obj1.top);
}

/**
 * Proportional scaling strategy - maintains relative positions and sizes
 */
export function proportionalLayout(
  objects: ObjectInfo[],
  oldBounds: LayoutBounds,
  newBounds: LayoutBounds
): Array<{ object: fabric.Object; left: number; top: number; scaleX: number; scaleY: number }> {
  const scaleX = newBounds.width / oldBounds.width;
  const scaleY = newBounds.height / oldBounds.height;
  const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

  return objects.map(({ object, left, top }) => {
    const relativeX = (left - oldBounds.left) / oldBounds.width;
    const relativeY = (top - oldBounds.top) / oldBounds.height;
    
    return {
      object,
      left: newBounds.left + relativeX * newBounds.width,
      top: newBounds.top + relativeY * newBounds.height,
      scaleX: scale,
      scaleY: scale,
    };
  });
}

/**
 * Grid layout strategy - arranges objects in optimal grid formation
 */
export function gridLayout(
  objects: ObjectInfo[],
  bounds: LayoutBounds
): Array<{ object: fabric.Object; left: number; top: number; scaleX: number; scaleY: number }> {
  if (objects.length === 0) return [];

  console.log('Grid layout for', objects.length, 'objects in bounds:', bounds);

  // Calculate optimal grid dimensions
  const aspectRatio = bounds.width / bounds.height;
  const cols = Math.ceil(Math.sqrt(objects.length * aspectRatio));
  const rows = Math.ceil(objects.length / cols);

  console.log(`Grid layout: ${cols} columns x ${rows} rows`);

  const spacing = Math.max(20, calculateOptimalSpacing(bounds.width, bounds.height, objects.length));
  const cellWidth = (bounds.width - spacing * (cols + 1)) / cols;
  const cellHeight = (bounds.height - spacing * (rows + 1)) / rows;

  console.log(`Cell size: ${cellWidth}x${cellHeight}, spacing: ${spacing}`);

  // Sort objects by area (largest first) for better visual balance
  const sortedObjects = [...objects].sort((a, b) => b.area - a.area);

  return sortedObjects.map(({ object }, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const x = bounds.left + spacing + col * (cellWidth + spacing);
    const y = bounds.top + spacing + row * (cellHeight + spacing);
    
    // Calculate scale to fit object in cell while maintaining aspect ratio
    const objectBounds = object.getBoundingRect();
    const scaleX = Math.min(1, cellWidth / (objectBounds.width || 1));
    const scaleY = Math.min(1, cellHeight / (objectBounds.height || 1));
    const scale = Math.min(scaleX, scaleY, 1) * 0.7; // 70% of cell size for clear separation

    const finalLeft = x + cellWidth / 2;
    const finalTop = y + cellHeight / 2;

    console.log(`Object ${index}: positioned at (${finalLeft}, ${finalTop}) with scale ${scale}`);

    return {
      object,
      left: finalLeft,
      top: finalTop,
      scaleX: scale,
      scaleY: scale,
    };
  });
}

/**
 * Smart reflow strategy - intelligently arranges objects to maximize space usage
 */
export function smartReflowLayout(
  objects: ObjectInfo[],
  bounds: LayoutBounds
): Array<{ object: fabric.Object; left: number; top: number; scaleX: number; scaleY: number }> {
  if (objects.length === 0) return [];

  const spacing = calculateOptimalSpacing(bounds.width, bounds.height, objects.length);
  const positions: Array<{ object: fabric.Object; left: number; top: number; scaleX: number; scaleY: number }> = [];
  
  // Sort by area (largest first) for better packing
  const sortedObjects = [...objects].sort((a, b) => b.area - a.area);
  
  let currentX = bounds.left + spacing;
  let currentY = bounds.top + spacing;
  let rowHeight = 0;

  for (const { object, width, height } of sortedObjects) {
    // Calculate scale to fit within reasonable bounds
    const maxWidth = bounds.width * 0.4; // Max 40% of canvas width
    const maxHeight = bounds.height * 0.4; // Max 40% of canvas height
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // Check if object fits in current row
    if (currentX + scaledWidth > bounds.left + bounds.width - spacing) {
      // Move to next row
      currentX = bounds.left + spacing;
      currentY += rowHeight + spacing;
      rowHeight = 0;
    }

    positions.push({
      object,
      left: currentX + scaledWidth / 2,
      top: currentY + scaledHeight / 2,
      scaleX: scale,
      scaleY: scale,
    });

    currentX += scaledWidth + spacing;
    rowHeight = Math.max(rowHeight, scaledHeight);
  }

  return positions;
}

/**
 * Center focus strategy - keeps central objects centered, arranges others around
 */
export function centerFocusLayout(
  objects: ObjectInfo[],
  bounds: LayoutBounds
): Array<{ object: fabric.Object; left: number; top: number; scaleX: number; scaleY: number }> {
  if (objects.length === 0) return [];

  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const spacing = calculateOptimalSpacing(bounds.width, bounds.height, objects.length);

  // Find the most central object
  const centralObject = objects.reduce((closest, current) => {
    const currentDistance = Math.sqrt(
      Math.pow(current.left + current.width / 2 - centerX, 2) +
      Math.pow(current.top + current.height / 2 - centerY, 2)
    );
    const closestDistance = Math.sqrt(
      Math.pow(closest.left + closest.width / 2 - centerX, 2) +
      Math.pow(closest.top + closest.height / 2 - centerY, 2)
    );
    return currentDistance < closestDistance ? current : closest;
  });

  const positions: Array<{ object: fabric.Object; left: number; top: number; scaleX: number; scaleY: number }> = [];
  
  // Place central object in center
  positions.push({
    object: centralObject.object,
    left: centerX,
    top: centerY,
    scaleX: 1,
    scaleY: 1,
  });

  // Arrange other objects around the center in a circle
  const remainingObjects = objects.filter(obj => obj !== centralObject);
  const angleStep = (2 * Math.PI) / remainingObjects.length;
  const radius = Math.min(bounds.width, bounds.height) * 0.3;

  remainingObjects.forEach(({ object }, index) => {
    const angle = index * angleStep;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    // Scale smaller objects around the center
    const scale = 0.8;

    positions.push({
      object,
      left: x,
      top: y,
      scaleX: scale,
      scaleY: scale,
    });
  });

  return positions;
}

/**
 * Applies layout positions to canvas objects
 */
export function applyLayout(
  positions: Array<{ object: fabric.Object; left: number; top: number; scaleX: number; scaleY: number }>,
  canvas: fabric.Canvas
): void {
  console.log('applyLayout called with', positions.length, 'positions');
  
  // Disable canvas events during batch update for performance
  canvas.off('object:modified');
  
  positions.forEach(({ object, left, top, scaleX, scaleY }, index) => {
    console.log(`Moving object ${index} from (${object.left}, ${object.top}) to (${left}, ${top})`);
    
    // Ensure the object is not in a group that might prevent movement
    if (object.group) {
      console.log(`Object ${index} is in a group, removing from group`);
      object.group.removeWithUpdate(object);
    }
    
    // Set new position and scale
    object.set({
      left,
      top,
      scaleX: scaleX,
      scaleY: scaleY,
    });
    
    // Update object coordinates
    object.setCoords();
    
    // Mark as modified to trigger change events
    object.fire('modified');
  });
  
  // Clear any active selections that might interfere
  canvas.discardActiveObject();
  
  // Force complete canvas refresh
  canvas.renderAll();
  
  console.log('Layout applied and canvas refreshed');
}