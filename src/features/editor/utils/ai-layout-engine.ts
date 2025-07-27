import { fabric } from 'fabric';
import { type ObjectInfo, type LayoutBounds } from './layout-algorithms';

export type ObjectCategory = 'text' | 'image' | 'logo' | 'shape' | 'decoration' | 'unknown';

export interface AIObjectInfo extends ObjectInfo {
  importance: number;        // 0-1 scale
  category: ObjectCategory;  // text, image, logo, decoration
  relationships: string[];   // IDs of related objects
  constraints: LayoutConstraints;
}

export interface LayoutConstraints {
  preserveAspectRatio: boolean;
  minScale: number;
  maxScale: number;
  allowRotation: boolean;
  maintainPosition: 'strict' | 'relative' | 'flexible';
}

export interface LayoutPosition {
  object: fabric.Object;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  confidence: number; // How confident we are in this positioning (0-1)
}

/**
 * Analyzes object importance based on multiple factors
 */
export function analyzeObjectImportance(object: fabric.Object, canvas: fabric.Canvas): number {
  let importance = 0;

  // Size importance (larger objects are generally more important)
  const bounds = object.getBoundingRect();
  const canvasArea = canvas.width! * canvas.height!;
  const objectArea = bounds.width * bounds.height;
  const sizeRatio = objectArea / canvasArea;
  importance += Math.min(sizeRatio * 2, 0.3); // Max 30% from size

  // Position importance (center objects are more important)
  const centerX = canvas.width! / 2;
  const centerY = canvas.height! / 2;
  const objectCenterX = bounds.left + bounds.width / 2;
  const objectCenterY = bounds.top + bounds.height / 2;
  
  const distanceFromCenter = Math.sqrt(
    Math.pow(objectCenterX - centerX, 2) + Math.pow(objectCenterY - centerY, 2)
  );
  const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
  const centerScore = 1 - (distanceFromCenter / maxDistance);
  importance += centerScore * 0.25; // Max 25% from position

  // Content type importance
  const category = categorizeObject(object);
  const categoryWeights = {
    logo: 0.4,
    text: 0.35,
    image: 0.3,
    shape: 0.2,
    decoration: 0.1,
    unknown: 0.15
  };
  importance += categoryWeights[category];

  // Visual contrast importance (objects that stand out more)
  const contrastScore = calculateVisualContrast(object);
  importance += contrastScore * 0.15; // Max 15% from contrast

  return Math.min(importance, 1); // Cap at 1.0
}

/**
 * Categorizes objects based on their type and properties
 */
export function categorizeObject(object: fabric.Object): ObjectCategory {
  // Check for text objects
  if (object.type === 'textbox' || object.type === 'text' || object.type === 'i-text') {
    return 'text';
  }

  // Check for images
  if (object.type === 'image') {
    return 'image';
  }

  // Check for shapes
  if (['rect', 'circle', 'triangle', 'polygon', 'ellipse'].includes(object.type || '')) {
    return 'shape';
  }

  // Check for potential logos (small images or text with specific characteristics)
  if (object.type === 'image' && object.width && object.height) {
    const area = object.width * object.height;
    if (area < 10000) { // Small images might be logos
      return 'logo';
    }
  }

  // Check for decorative elements (small shapes, lines)
  if (object.type === 'line' || (object.width && object.height && object.width * object.height < 5000)) {
    return 'decoration';
  }

  return 'unknown';
}

/**
 * Calculates visual contrast of an object (simplified)
 */
export function calculateVisualContrast(object: fabric.Object): number {
  // For now, use a simplified approach based on fill color
  const fill = object.fill as string;
  
  if (!fill || fill === 'transparent') {
    return 0.3; // Medium contrast for transparent objects
  }

  // Convert to grayscale and calculate contrast
  if (typeof fill === 'string' && fill.startsWith('#')) {
    const hex = fill.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const grayscale = (r + g + b) / 3;
    
    // Return contrast based on how far from middle gray (128)
    return Math.abs(grayscale - 128) / 128;
  }

  return 0.5; // Default contrast
}

/**
 * Generates layout constraints for an object based on its category and importance
 */
export function generateLayoutConstraints(
  object: fabric.Object, 
  category: ObjectCategory, 
  importance: number
): LayoutConstraints {
  const baseConstraints: LayoutConstraints = {
    preserveAspectRatio: true,
    minScale: 0.3,
    maxScale: 2.0,
    allowRotation: false,
    maintainPosition: 'flexible'
  };

  // Adjust constraints based on category
  switch (category) {
    case 'logo':
      return {
        ...baseConstraints,
        preserveAspectRatio: true,
        minScale: 0.5,
        maxScale: 1.5,
        maintainPosition: importance > 0.7 ? 'strict' : 'relative'
      };

    case 'text':
      return {
        ...baseConstraints,
        preserveAspectRatio: false, // Text can be stretched
        minScale: 0.7,
        maxScale: 1.5,
        maintainPosition: importance > 0.6 ? 'relative' : 'flexible'
      };

    case 'image':
      return {
        ...baseConstraints,
        preserveAspectRatio: true,
        minScale: 0.4,
        maxScale: 2.0,
        maintainPosition: importance > 0.8 ? 'strict' : 'flexible'
      };

    case 'decoration':
      return {
        ...baseConstraints,
        preserveAspectRatio: false,
        minScale: 0.1,
        maxScale: 3.0,
        maintainPosition: 'flexible'
      };

    default:
      return baseConstraints;
  }
}

/**
 * Enhanced object analysis that includes AI-powered importance scoring
 */
export function analyzeObjectsWithAI(canvas: fabric.Canvas, excludeWorkspace = true): AIObjectInfo[] {
  const objects = canvas.getObjects();
  console.log('AI Analysis: Found', objects.length, 'total objects');
  
  const filtered = objects.filter(obj => !excludeWorkspace || obj.name !== 'clip');
  console.log('AI Analysis: Analyzing', filtered.length, 'objects (excluding workspace)');
  
  return filtered.map(obj => {
    const bounds = obj.getBoundingRect();
    const importance = analyzeObjectImportance(obj, canvas);
    const category = categorizeObject(obj);
    const constraints = generateLayoutConstraints(obj, category, importance);
    
    console.log(`AI Analysis: Object ${obj.type} - Category: ${category}, Importance: ${importance.toFixed(2)}`);
    
    return {
      object: obj,
      width: bounds.width,
      height: bounds.height,
      left: bounds.left,
      top: bounds.top,
      type: obj.type || 'unknown',
      area: bounds.width * bounds.height,
      importance,
      category,
      relationships: [], // TODO: Implement relationship detection
      constraints
    };
  });
}

/**
 * AI-powered layout engine that generates optimal layouts based on object importance
 */
export class AILayoutEngine {
  /**
   * Generates an optimal layout preserving important objects
   */
  generateOptimalLayout(
    objects: AIObjectInfo[],
    currentBounds: LayoutBounds,
    targetBounds: LayoutBounds
  ): LayoutPosition[] {
    console.log('AI Layout Engine: Generating layout for', objects.length, 'objects');
    console.log('AI Layout Engine: Target bounds:', targetBounds);

    // Sort objects by importance (highest first)
    const sortedObjects = [...objects].sort((a, b) => b.importance - a.importance);
    
    // Separate into importance tiers
    const highImportance = sortedObjects.filter(obj => obj.importance > 0.7);
    const mediumImportance = sortedObjects.filter(obj => obj.importance > 0.4 && obj.importance <= 0.7);
    const lowImportance = sortedObjects.filter(obj => obj.importance <= 0.4);

    console.log(`AI Layout: High importance: ${highImportance.length}, Medium: ${mediumImportance.length}, Low: ${lowImportance.length}`);

    const positions: LayoutPosition[] = [];

    // Position high importance objects first (preserve their relative positions)
    highImportance.forEach(objInfo => {
      const position = this.preserveImportantObject(objInfo, currentBounds, targetBounds);
      positions.push(position);
    });

    // Position medium importance objects (adaptive positioning)
    mediumImportance.forEach(objInfo => {
      const position = this.adaptObject(objInfo, currentBounds, targetBounds, positions);
      positions.push(position);
    });

    // Position low importance objects (fill remaining space)
    lowImportance.forEach(objInfo => {
      const position = this.flexiblePosition(objInfo, targetBounds, positions);
      positions.push(position);
    });

    return positions;
  }

  /**
   * Preserves important objects with minimal changes while keeping within bounds
   */
  private preserveImportantObject(
    objInfo: AIObjectInfo, 
    currentBounds: LayoutBounds, 
    targetBounds: LayoutBounds
  ): LayoutPosition {
    // Calculate the scale ratio between old and new canvas sizes
    const canvasScaleX = targetBounds.width / currentBounds.width;
    const canvasScaleY = targetBounds.height / currentBounds.height;
    
    console.log(`Canvas scale factors: X=${canvasScaleX.toFixed(2)}, Y=${canvasScaleY.toFixed(2)}`);
    
    // For proportional scaling, use the smaller scale factor to maintain aspect ratio
    let targetScale = objInfo.constraints.preserveAspectRatio ? 
      Math.min(canvasScaleX, canvasScaleY) : 
      Math.min(canvasScaleX, canvasScaleY);
    
    // Apply constraints and ensure reasonable scaling
    targetScale = Math.max(
      objInfo.constraints.minScale, 
      Math.min(targetScale, objInfo.constraints.maxScale)
    );
    
    // For shrinking canvases, make sure we don't scale up objects
    if (canvasScaleX < 1 || canvasScaleY < 1) {
      targetScale = Math.min(targetScale, 0.8); // Cap at 80% when shrinking
    }

    console.log(`Target scale for important object: ${targetScale.toFixed(2)}`);

    // Calculate proportional position within new bounds
    const relativeX = (objInfo.left - currentBounds.left) / currentBounds.width;
    const relativeY = (objInfo.top - currentBounds.top) / currentBounds.height;
    
    let newLeft = targetBounds.left + relativeX * targetBounds.width;
    let newTop = targetBounds.top + relativeY * targetBounds.height;

    // Ensure object stays within bounds with padding
    const currentObjectBounds = objInfo.object.getBoundingRect();
    const scaledWidth = currentObjectBounds.width * targetScale;
    const scaledHeight = currentObjectBounds.height * targetScale;
    const padding = 20;

    // Constrain to bounds
    newLeft = Math.max(targetBounds.left + padding, 
      Math.min(newLeft, targetBounds.left + targetBounds.width - scaledWidth - padding));
    newTop = Math.max(targetBounds.top + padding, 
      Math.min(newTop, targetBounds.top + targetBounds.height - scaledHeight - padding));

    console.log(`Important object: (${objInfo.left.toFixed(0)}, ${objInfo.top.toFixed(0)}) -> (${newLeft.toFixed(0)}, ${newTop.toFixed(0)}), scale: ${targetScale.toFixed(2)}`);

    return {
      object: objInfo.object,
      left: newLeft,
      top: newTop,
      scaleX: targetScale,
      scaleY: targetScale,
      confidence: 0.9
    };
  }

  /**
   * Adaptively positions medium importance objects
   */
  private adaptObject(
    objInfo: AIObjectInfo, 
    currentBounds: LayoutBounds, 
    targetBounds: LayoutBounds,
    existingPositions: LayoutPosition[]
  ): LayoutPosition {
    // Try to maintain relative position but avoid conflicts
    const basePosition = this.preserveImportantObject(objInfo, currentBounds, targetBounds);
    
    // Check for conflicts with existing positions
    const hasConflict = existingPositions.some(pos => 
      this.checkCollision(basePosition, pos, 20) // 20px buffer
    );

    if (!hasConflict) {
      console.log('Medium importance object: using base position');
      return { ...basePosition, confidence: 0.7 };
    }

    // Find alternative position with appropriate scale
    console.log('Medium importance object: finding alternative position due to conflict');
    const alternativePosition = this.findAlternativePosition(objInfo, targetBounds, existingPositions);
    return { ...alternativePosition, confidence: 0.6 };
  }

  /**
   * Flexibly positions low importance objects in available space
   */
  private flexiblePosition(
    objInfo: AIObjectInfo, 
    targetBounds: LayoutBounds,
    existingPositions: LayoutPosition[]
  ): LayoutPosition {
    // Find available space with smaller scale for low importance objects
    console.log('Low importance object: finding flexible position');
    const position = this.findAvailableSpace(objInfo, targetBounds, existingPositions);
    
    // Scale down low importance objects more aggressively to fit
    const smallerScale = Math.min(position.scaleX, 0.6); // Cap at 60% for low importance
    
    return { 
      ...position, 
      scaleX: smallerScale,
      scaleY: smallerScale,
      confidence: 0.5 
    };
  }

  /**
   * Checks if two positions collide
   */
  private checkCollision(pos1: LayoutPosition, pos2: LayoutPosition, buffer: number = 0): boolean {
    const bounds1 = pos1.object.getBoundingRect();
    const bounds2 = pos2.object.getBoundingRect();

    return !(
      pos1.left + bounds1.width + buffer <= pos2.left ||
      pos2.left + bounds2.width + buffer <= pos1.left ||
      pos1.top + bounds1.height + buffer <= pos2.top ||
      pos2.top + bounds2.height + buffer <= pos1.top
    );
  }

  /**
   * Finds alternative position for an object within canvas bounds
   */
  private findAlternativePosition(
    objInfo: AIObjectInfo,
    bounds: LayoutBounds,
    existingPositions: LayoutPosition[]
  ): LayoutPosition {
    const step = 30; // 30px steps for position search
    
    // Use smaller scale to ensure objects fit in smaller canvases
    const maxScale = Math.min(0.7, 
      bounds.width / 400,  // Scale based on canvas width
      bounds.height / 400  // Scale based on canvas height
    );
    const scale = Math.max(0.3, maxScale); // Don't go below 30%

    console.log(`Alternative positioning with scale: ${scale.toFixed(2)} for bounds ${bounds.width}x${bounds.height}`);

    // Try positions in a grid pattern from top-left
    for (let y = bounds.top + 15; y < bounds.top + bounds.height - 50; y += step) {
      for (let x = bounds.left + 15; x < bounds.left + bounds.width - 50; x += step) {
        const testPosition: LayoutPosition = {
          object: objInfo.object,
          left: x,
          top: y,
          scaleX: scale,
          scaleY: scale,
          confidence: 0.5
        };

        // Estimate object size after scaling
        const objectBounds = objInfo.object.getBoundingRect();
        const scaledWidth = objectBounds.width * scale;
        const scaledHeight = objectBounds.height * scale;

        // Check if position is within bounds and doesn't conflict
        if (x + scaledWidth <= bounds.left + bounds.width - 15 &&
            y + scaledHeight <= bounds.top + bounds.height - 15 &&
            !existingPositions.some(pos => this.checkCollision(testPosition, pos, 10))) {
          console.log(`Found alternative position at (${x.toFixed(0)}, ${y.toFixed(0)}) with scale ${scale.toFixed(2)}`);
          return testPosition;
        }
      }
    }

    // Fallback: place in top-left corner with very small scale
    const fallbackScale = Math.max(0.2, scale * 0.5);
    console.log(`Using fallback position with scale: ${fallbackScale.toFixed(2)}`);
    return {
      object: objInfo.object,
      left: bounds.left + 20,
      top: bounds.top + 20,
      scaleX: fallbackScale,
      scaleY: fallbackScale,
      confidence: 0.2
    };
  }

  /**
   * Finds available space for low importance objects
   */
  private findAvailableSpace(
    objInfo: AIObjectInfo,
    bounds: LayoutBounds,
    existingPositions: LayoutPosition[]
  ): LayoutPosition {
    // For now, use the same algorithm as findAlternativePosition
    // In a more advanced implementation, this could use more sophisticated space-finding algorithms
    return this.findAlternativePosition(objInfo, bounds, existingPositions);
  }

  /**
   * Predicts layout quality based on design principles
   */
  predictLayoutQuality(layout: LayoutPosition[]): number {
    let score = 0;
    let maxScore = 0;

    // Visual balance score
    const balanceScore = this.calculateVisualBalance(layout);
    score += balanceScore * 0.3;
    maxScore += 0.3;

    // Spacing consistency score
    const spacingScore = this.calculateSpacingConsistency(layout);
    score += spacingScore * 0.2;
    maxScore += 0.2;

    // Hierarchy preservation score
    const hierarchyScore = this.calculateHierarchyPreservation(layout);
    score += hierarchyScore * 0.3;
    maxScore += 0.3;

    // Collision avoidance score
    const collisionScore = this.calculateCollisionAvoidance(layout);
    score += collisionScore * 0.2;
    maxScore += 0.2;

    return maxScore > 0 ? score / maxScore : 0;
  }

  private calculateVisualBalance(layout: LayoutPosition[]): number {
    // Simplified visual balance calculation
    // In practice, this would be more sophisticated
    return 0.7; // Placeholder
  }

  private calculateSpacingConsistency(layout: LayoutPosition[]): number {
    // Simplified spacing consistency calculation
    return 0.8; // Placeholder
  }

  private calculateHierarchyPreservation(layout: LayoutPosition[]): number {
    // Check if important objects maintain their relative importance in the layout
    return 0.75; // Placeholder
  }

  private calculateCollisionAvoidance(layout: LayoutPosition[]): number {
    let collisions = 0;
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (this.checkCollision(layout[i], layout[j])) {
          collisions++;
        }
      }
    }

    const maxPossibleCollisions = (layout.length * (layout.length - 1)) / 2;
    return maxPossibleCollisions > 0 ? 1 - (collisions / maxPossibleCollisions) : 1;
  }
}