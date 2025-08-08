/**
 * Enhanced AI Content Analyzer
 * 
 * Provides intelligent content analysis and scaling recommendations
 * for different types of canvas elements during AI resize operations.
 */

export interface ContentAnalysisResult {
  elementType: 'text' | 'image' | 'shape' | 'icon' | 'logo' | 'decoration' | 'unknown';
  importance: 'primary' | 'secondary' | 'tertiary' | 'decorative';
  scalingRules: {
    minScale: number;
    maxScale: number;
    preferredScale: number;
    aspectRatioLocked: boolean;
  };
  positioningHints: {
    preferredQuadrant?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    alignmentPreference?: 'left' | 'center' | 'right' | 'top' | 'bottom';
    marginRequirements: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  visualProperties: {
    estimatedVisualWeight: number; // 0-10 scale
    colorDominance: 'high' | 'medium' | 'low';
    detailLevel: 'high' | 'medium' | 'low';
  };
}

export class EnhancedAIContentAnalyzer {
  /**
   * Analyze canvas objects to provide intelligent scaling and positioning recommendations
   */
  static analyzeCanvasContent(
    objectsData: Array<{
      id: string;
      type: string;
      left: number;
      top: number;
      width: number;
      height: number;
      scaleX: number;
      scaleY: number;
      text?: string;
      fill?: string;
      stroke?: string;
    }>
  ): Map<string, ContentAnalysisResult> {
    const analysisResults = new Map<string, ContentAnalysisResult>();

    objectsData.forEach(obj => {
      const analysis = this.analyzeIndividualObject(obj, objectsData);
      analysisResults.set(obj.id, analysis);
    });

    // Post-process to adjust importance based on overall composition
    this.adjustRelativeImportance(analysisResults, objectsData);

    return analysisResults;
  }

  /**
   * Generate enhanced prompt context based on content analysis
   */
  static generateContextualPrompt(
    analysisResults: Map<string, ContentAnalysisResult>,
    objectsData: Array<any>,
    currentSize: { width: number; height: number },
    newSize: { width: number; height: number }
  ): string {
    const primaryElements = Array.from(analysisResults.entries())
      .filter(([_, analysis]) => analysis.importance === 'primary')
      .map(([id]) => id);

    const secondaryElements = Array.from(analysisResults.entries())
      .filter(([_, analysis]) => analysis.importance === 'secondary')
      .map(([id]) => id);

    const decorativeElements = Array.from(analysisResults.entries())
      .filter(([_, analysis]) => analysis.importance === 'decorative')
      .map(([id]) => id);

    const scaleDirection = this.determineScaleDirection(currentSize, newSize);
    const aspectRatioChange = this.calculateAspectRatioChange(currentSize, newSize);

    return `
INTELLIGENT CONTENT ANALYSIS CONTEXT:

PRIMARY ELEMENTS (${primaryElements.length}): ${primaryElements.join(', ')}
- These are the most important elements and should be prioritized for visibility
- Maintain optimal sizes even if space is constrained
- Position these elements first in the most prominent areas

SECONDARY ELEMENTS (${secondaryElements.length}): ${secondaryElements.join(', ')}
- Supporting elements that enhance the primary content
- Can be scaled down more aggressively if needed to accommodate primary elements
- Should maintain clear hierarchy relationship with primary elements

DECORATIVE ELEMENTS (${decorativeElements.length}): ${decorativeElements.join(', ')}
- Visual enhancements that can be most flexible in scaling
- Can be significantly reduced or repositioned as needed
- Should not compete with primary/secondary content

RESIZE CONTEXT:
- Scale Direction: ${scaleDirection}
- Aspect Ratio Change: ${aspectRatioChange}
- Original Canvas: ${currentSize.width} × ${currentSize.height}
- Target Canvas: ${newSize.width} × ${newSize.height}

ELEMENT-SPECIFIC SCALING INTELLIGENCE:
${this.generateElementSpecificGuidance(analysisResults, objectsData)}

COMPOSITION OPTIMIZATION STRATEGY:
${this.generateCompositionStrategy(analysisResults, currentSize, newSize)}
`;
  }

  private static analyzeIndividualObject(
    obj: any,
    allObjects: Array<any>
  ): ContentAnalysisResult {
    const elementType = this.determineElementType(obj);
    const importance = this.determineImportance(obj, allObjects);
    const scalingRules = this.generateScalingRules(obj, elementType);
    const positioningHints = this.generatePositioningHints(obj, elementType);
    const visualProperties = this.analyzeVisualProperties(obj);

    return {
      elementType,
      importance,
      scalingRules,
      positioningHints,
      visualProperties,
    };
  }

  private static determineElementType(obj: any): ContentAnalysisResult['elementType'] {
    if (obj.type === 'text' || obj.type === 'textbox') return 'text';
    if (obj.type === 'image') return 'image';
    if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') return 'shape';
    if (obj.type === 'path' && obj.width < 100 && obj.height < 100) return 'icon';
    
    // Advanced heuristics
    if (obj.text && obj.text.toLowerCase().includes('logo')) return 'logo';
    if (obj.width * obj.height > 50000) return 'image'; // Large elements likely images
    if (obj.fill === 'transparent' && obj.stroke) return 'decoration';
    
    return 'unknown';
  }

  private static determineImportance(obj: any, allObjects: Array<any>): ContentAnalysisResult['importance'] {
    const size = obj.width * obj.height * obj.scaleX * obj.scaleY;
    const position = { x: obj.left, y: obj.top };
    
    // Size-based importance (larger elements are often more important)
    const avgSize = allObjects.reduce((sum, o) => sum + (o.width * o.height * o.scaleX * o.scaleY), 0) / allObjects.length;
    const sizeRatio = size / avgSize;

    // Position-based importance (top-left elements often more important)
    const centerDistance = Math.sqrt(Math.pow(position.x - 400, 2) + Math.pow(position.y - 300, 2));

    // Text content analysis
    if (obj.text) {
      const textLength = obj.text.length;
      const isTitle = textLength < 50 && obj.fontSize > 20;
      if (isTitle) return 'primary';
      if (textLength > 100) return 'secondary';
    }

    // Logo detection
    if (obj.type === 'image' && size < 10000) return 'primary'; // Small images likely logos

    // Combine factors
    let importanceScore = 0;
    if (sizeRatio > 1.5) importanceScore += 2;
    else if (sizeRatio > 1.0) importanceScore += 1;
    
    if (centerDistance < 200) importanceScore += 1;
    if (position.x < 200 && position.y < 200) importanceScore += 1; // Top-left quadrant

    if (importanceScore >= 3) return 'primary';
    if (importanceScore >= 2) return 'secondary';
    if (importanceScore >= 1) return 'tertiary';
    return 'decorative';
  }

  private static generateScalingRules(obj: any, elementType: ContentAnalysisResult['elementType']) {
    const baseRules = {
      minScale: 0.3,
      maxScale: 1.8,
      preferredScale: 1.0,
      aspectRatioLocked: false,
    };

    switch (elementType) {
      case 'text':
        return {
          ...baseRules,
          minScale: 0.5, // Keep text readable
          maxScale: 1.4,
          preferredScale: 0.9,
          aspectRatioLocked: false,
        };
      
      case 'image':
      case 'logo':
        return {
          ...baseRules,
          minScale: 0.4,
          maxScale: 1.2,
          preferredScale: 0.85,
          aspectRatioLocked: true, // Prevent distortion
        };
      
      case 'icon':
        return {
          ...baseRules,
          minScale: 0.6,
          maxScale: 1.0,
          preferredScale: 0.8,
          aspectRatioLocked: true,
        };
      
      case 'shape':
        return {
          ...baseRules,
          minScale: 0.3,
          maxScale: 1.6,
          preferredScale: 0.9,
          aspectRatioLocked: false,
        };
      
      case 'decoration':
        return {
          ...baseRules,
          minScale: 0.2, // Most flexible
          maxScale: 1.4,
          preferredScale: 0.7,
          aspectRatioLocked: false,
        };
      
      default:
        return baseRules;
    }
  }

  private static generatePositioningHints(obj: any, elementType: ContentAnalysisResult['elementType']) {
    const baseMargins = { top: 20, right: 20, bottom: 20, left: 20 };

    const hints = {
      marginRequirements: baseMargins,
      preferredQuadrant: undefined as any,
      alignmentPreference: undefined as any,
    };

    switch (elementType) {
      case 'logo':
        hints.preferredQuadrant = 'top-left';
        hints.alignmentPreference = 'left';
        hints.marginRequirements = { top: 30, right: 30, bottom: 30, left: 30 };
        break;
      
      case 'text':
        if (obj.fontSize > 24) {
          hints.preferredQuadrant = 'top-left';
          hints.alignmentPreference = 'left';
        }
        hints.marginRequirements = { top: 15, right: 15, bottom: 15, left: 15 };
        break;
      
      case 'decoration':
        hints.marginRequirements = { top: 10, right: 10, bottom: 10, left: 10 };
        break;
    }

    return hints;
  }

  private static analyzeVisualProperties(obj: any) {
    const size = obj.width * obj.height * obj.scaleX * obj.scaleY;
    
    let estimatedVisualWeight = 5; // Base weight
    
    // Size contribution
    if (size > 50000) estimatedVisualWeight += 2;
    else if (size > 20000) estimatedVisualWeight += 1;
    else if (size < 5000) estimatedVisualWeight -= 1;
    
    // Color contribution (simplified analysis)
    let colorDominance: 'high' | 'medium' | 'low' = 'medium';
    if (obj.fill && obj.fill !== 'transparent') {
      const color = obj.fill.toLowerCase();
      if (color.includes('red') || color.includes('blue') || color.includes('green')) {
        colorDominance = 'high';
        estimatedVisualWeight += 1;
      }
      if (color.includes('black') || color === '#000000') {
        estimatedVisualWeight += 1;
      }
    }
    
    // Detail level estimation
    let detailLevel: 'high' | 'medium' | 'low' = 'medium';
    if (obj.type === 'path' || (obj.text && obj.text.length > 50)) {
      detailLevel = 'high';
    } else if (obj.type === 'rect' || obj.type === 'circle') {
      detailLevel = 'low';
    }

    return {
      estimatedVisualWeight: Math.max(1, Math.min(10, estimatedVisualWeight)),
      colorDominance,
      detailLevel,
    };
  }

  private static adjustRelativeImportance(
    analysisResults: Map<string, ContentAnalysisResult>,
    objectsData: Array<any>
  ): void {
    const primaryCount = Array.from(analysisResults.values()).filter(r => r.importance === 'primary').length;
    
    // If too many primary elements, demote some to secondary
    if (primaryCount > Math.ceil(objectsData.length * 0.3)) {
      const primaryEntries = Array.from(analysisResults.entries())
        .filter(([_, analysis]) => analysis.importance === 'primary')
        .sort(([idA, analysisA], [idB, analysisB]) => 
          analysisB.visualProperties.estimatedVisualWeight - analysisA.visualProperties.estimatedVisualWeight
        );
      
      // Keep only the top elements as primary
      const keepAsPrimary = Math.ceil(objectsData.length * 0.3);
      primaryEntries.slice(keepAsPrimary).forEach(([id, analysis]) => {
        analysis.importance = 'secondary';
      });
    }
  }

  private static determineScaleDirection(currentSize: { width: number; height: number }, newSize: { width: number; height: number }): string {
    const widthRatio = newSize.width / currentSize.width;
    const heightRatio = newSize.height / currentSize.height;
    
    if (widthRatio > 1.2 && heightRatio > 1.2) return 'significant enlargement';
    if (widthRatio < 0.8 && heightRatio < 0.8) return 'significant reduction';
    if (widthRatio > heightRatio + 0.3) return 'width expansion';
    if (heightRatio > widthRatio + 0.3) return 'height expansion';
    return 'proportional adjustment';
  }

  private static calculateAspectRatioChange(currentSize: { width: number; height: number }, newSize: { width: number; height: number }): string {
    const currentRatio = currentSize.width / currentSize.height;
    const newRatio = newSize.width / newSize.height;
    const ratioChange = Math.abs(newRatio - currentRatio) / currentRatio;
    
    if (ratioChange > 0.5) return 'dramatic aspect ratio change';
    if (ratioChange > 0.2) return 'moderate aspect ratio change';
    if (ratioChange > 0.1) return 'slight aspect ratio adjustment';
    return 'aspect ratio preserved';
  }

  private static generateElementSpecificGuidance(
    analysisResults: Map<string, ContentAnalysisResult>,
    objectsData: Array<any>
  ): string {
    return Array.from(analysisResults.entries())
      .map(([id, analysis]) => {
        const obj = objectsData.find(o => o.id === id);
        const guidance = [];
        
        guidance.push(`${id} (${analysis.elementType}, ${analysis.importance}):`);
        guidance.push(`  - Scale range: ${analysis.scalingRules.minScale} to ${analysis.scalingRules.maxScale}`);
        guidance.push(`  - Visual weight: ${analysis.visualProperties.estimatedVisualWeight}/10`);
        
        if (analysis.scalingRules.aspectRatioLocked) {
          guidance.push(`  - MAINTAIN aspect ratio (prevent distortion)`);
        }
        
        if (analysis.positioningHints.preferredQuadrant) {
          guidance.push(`  - Preferred position: ${analysis.positioningHints.preferredQuadrant}`);
        }
        
        return guidance.join('\n');
      })
      .join('\n\n');
  }

  private static generateCompositionStrategy(
    analysisResults: Map<string, ContentAnalysisResult>,
    currentSize: { width: number; height: number },
    newSize: { width: number; height: number }
  ): string {
    const totalElements = analysisResults.size;
    const primaryElements = Array.from(analysisResults.values()).filter(r => r.importance === 'primary').length;
    const decorativeElements = Array.from(analysisResults.values()).filter(r => r.importance === 'decorative').length;
    
    const strategies = [];
    
    if (primaryElements === 1) {
      strategies.push('Single focal point strategy: Center the primary element with supporting elements arranged around it');
    } else if (primaryElements <= 3) {
      strategies.push('Multi-focal strategy: Create visual triangle or line between primary elements');
    } else {
      strategies.push('Grid-based strategy: Organize multiple primary elements in a structured grid layout');
    }
    
    if (decorativeElements > totalElements * 0.4) {
      strategies.push('Rich composition: Use decorative elements to create visual rhythm and texture');
    }
    
    const canvasRatio = newSize.width / newSize.height;
    if (canvasRatio > 1.5) {
      strategies.push('Wide format optimization: Arrange elements horizontally with strong left-to-right flow');
    } else if (canvasRatio < 0.7) {
      strategies.push('Tall format optimization: Create vertical hierarchy with clear top-to-bottom progression');
    }
    
    return strategies.join('\n- ');
  }
}