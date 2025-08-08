/**
 * Advanced Boundary Validator with Sophisticated Overflow Handling
 * 
 * Provides intelligent boundary validation and overflow resolution
 * for complex canvas resize scenarios with multiple element types.
 */

interface ElementBounds {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  type: string;
  importance: 'primary' | 'secondary' | 'tertiary' | 'decorative';
  minScale?: number;
  maxScale?: number;
  aspectRatioLocked?: boolean;
}

interface CanvasBoundaries {
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface OverflowAnalysis {
  hasOverflow: boolean;
  overflowType: 'none' | 'horizontal' | 'vertical' | 'both';
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  affectedElements: string[];
  recommendedActions: string[];
}

interface ValidationResult {
  isValid: boolean;
  overflow: OverflowAnalysis;
  corrections: Array<{
    elementId: string;
    action: 'reposition' | 'scale' | 'priority-swap' | 'layout-compress';
    before: ElementBounds;
    after: ElementBounds;
    reasoning: string;
  }>;
  finalBounds: ElementBounds[];
  qualityScore: number; // 0-100, how well the solution maintains design integrity
}

export class AdvancedBoundaryValidator {
  private boundaries: CanvasBoundaries;
  
  constructor(canvasWidth: number, canvasHeight: number, customMargins?: Partial<CanvasBoundaries['margins']>) {
    this.boundaries = {
      width: canvasWidth,
      height: canvasHeight,
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
        ...customMargins
      }
    };
  }

  /**
   * Comprehensive boundary validation with intelligent overflow resolution
   */
  validateAndCorrect(elements: ElementBounds[]): ValidationResult {
    console.log(`🔍 Starting advanced boundary validation for ${elements.length} elements`);
    
    // Phase 1: Analyze current overflow situation
    const overflow = this.analyzeOverflow(elements);
    console.log('📊 Overflow analysis:', overflow);

    if (!overflow.hasOverflow) {
      return {
        isValid: true,
        overflow,
        corrections: [],
        finalBounds: elements,
        qualityScore: 100
      };
    }

    // Phase 2: Apply intelligent corrections based on overflow type and severity
    const { correctedElements, corrections } = this.applyIntelligentCorrections(elements, overflow);
    console.log(`🔧 Applied ${corrections.length} intelligent corrections`);

    // Phase 3: Validate corrections and calculate quality score
    const finalOverflow = this.analyzeOverflow(correctedElements);
    const qualityScore = this.calculateQualityScore(elements, correctedElements, corrections);

    return {
      isValid: !finalOverflow.hasOverflow,
      overflow: finalOverflow,
      corrections,
      finalBounds: correctedElements,
      qualityScore
    };
  }

  /**
   * Analyze overflow patterns and classify severity
   */
  private analyzeOverflow(elements: ElementBounds[]): OverflowAnalysis {
    const safeArea = this.getSafeArea();
    const overflowingElements: string[] = [];
    let hasHorizontalOverflow = false;
    let hasVerticalOverflow = false;
    let totalOverflowArea = 0;
    let maxOverflowDistance = 0;

    elements.forEach(element => {
      const finalWidth = element.width * element.scaleX;
      const finalHeight = element.height * element.scaleY;
      const rightEdge = element.left + finalWidth;
      const bottomEdge = element.top + finalHeight;

      const horizontalOverflow = Math.max(0, rightEdge - safeArea.maxRight) + Math.max(0, safeArea.minLeft - element.left);
      const verticalOverflow = Math.max(0, bottomEdge - safeArea.maxBottom) + Math.max(0, safeArea.minTop - element.top);

      if (horizontalOverflow > 0 || verticalOverflow > 0) {
        overflowingElements.push(element.id);
        
        if (horizontalOverflow > 0) hasHorizontalOverflow = true;
        if (verticalOverflow > 0) hasVerticalOverflow = true;

        const elementOverflowArea = horizontalOverflow * finalHeight + verticalOverflow * finalWidth;
        totalOverflowArea += elementOverflowArea;
        
        const overflowDistance = Math.max(horizontalOverflow, verticalOverflow);
        maxOverflowDistance = Math.max(maxOverflowDistance, overflowDistance);
      }
    });

    // Determine overflow type
    let overflowType: OverflowAnalysis['overflowType'] = 'none';
    if (hasHorizontalOverflow && hasVerticalOverflow) overflowType = 'both';
    else if (hasHorizontalOverflow) overflowType = 'horizontal';
    else if (hasVerticalOverflow) overflowType = 'vertical';

    // Determine severity based on overflow metrics
    let severity: OverflowAnalysis['severity'] = 'none';
    const overflowRatio = overflowingElements.length / elements.length;
    const totalCanvasArea = this.boundaries.width * this.boundaries.height;
    const overflowAreaRatio = totalOverflowArea / totalCanvasArea;

    if (overflowRatio > 0.7 || overflowAreaRatio > 0.3 || maxOverflowDistance > 200) {
      severity = 'severe';
    } else if (overflowRatio > 0.4 || overflowAreaRatio > 0.15 || maxOverflowDistance > 100) {
      severity = 'moderate';
    } else if (overflowingElements.length > 0) {
      severity = 'minor';
    }

    // Generate recommendations
    const recommendedActions = this.generateOverflowRecommendations(overflowType, severity, overflowRatio);

    return {
      hasOverflow: overflowingElements.length > 0,
      overflowType,
      severity,
      affectedElements: overflowingElements,
      recommendedActions
    };
  }

  /**
   * Apply intelligent corrections based on element importance and overflow patterns
   */
  private applyIntelligentCorrections(
    elements: ElementBounds[], 
    overflow: OverflowAnalysis
  ): { correctedElements: ElementBounds[]; corrections: ValidationResult['corrections'] } {
    const corrections: ValidationResult['corrections'] = [];
    let workingElements = [...elements];

    switch (overflow.severity) {
      case 'severe':
        workingElements = this.applySevereOverflowCorrections(workingElements, overflow, corrections);
        break;
      case 'moderate':
        workingElements = this.applyModerateOverflowCorrections(workingElements, overflow, corrections);
        break;
      case 'minor':
        workingElements = this.applyMinorOverflowCorrections(workingElements, overflow, corrections);
        break;
    }

    return { correctedElements: workingElements, corrections };
  }

  /**
   * Handle severe overflow with aggressive layout restructuring
   */
  private applySevereOverflowCorrections(
    elements: ElementBounds[],
    overflow: OverflowAnalysis,
    corrections: ValidationResult['corrections']
  ): ElementBounds[] {
    console.log('🚨 Applying severe overflow corrections');
    
    // Strategy 1: Aggressive scaling of all non-primary elements
    const primaryElements = elements.filter(e => e.importance === 'primary');
    const nonPrimaryElements = elements.filter(e => e.importance !== 'primary');

    // Scale down non-primary elements first
    nonPrimaryElements.forEach(element => {
      const before = { ...element };
      const aggressiveScale = Math.min(element.scaleX * 0.6, element.minScale || 0.3);
      element.scaleX = aggressiveScale;
      element.scaleY = element.aspectRatioLocked ? aggressiveScale : element.scaleY * 0.6;
      
      corrections.push({
        elementId: element.id,
        action: 'scale',
        before,
        after: { ...element },
        reasoning: `Aggressive scaling to resolve severe overflow (${element.importance} element)`
      });
    });

    // Strategy 2: Compact layout arrangement
    return this.applyCompactLayoutArrangement(elements, corrections);
  }

  /**
   * Handle moderate overflow with balanced corrections
   */
  private applyModerateOverflowCorrections(
    elements: ElementBounds[],
    overflow: OverflowAnalysis,
    corrections: ValidationResult['corrections']
  ): ElementBounds[] {
    console.log('⚠️ Applying moderate overflow corrections');
    
    // Strategy 1: Prioritized scaling based on importance
    const safeArea = this.getSafeArea();
    
    elements.forEach(element => {
      if (overflow.affectedElements.includes(element.id)) {
        const before = { ...element };
        const scaleReduction = this.calculateScaleReduction(element, safeArea);
        
        if (scaleReduction < 1) {
          element.scaleX *= scaleReduction;
          element.scaleY = element.aspectRatioLocked ? element.scaleX : element.scaleY * scaleReduction;
          
          corrections.push({
            elementId: element.id,
            action: 'scale',
            before,
            after: { ...element },
            reasoning: `Proportional scaling to fit within boundaries (reduction: ${(1 - scaleReduction) * 100}%)`
          });
        }
      }
    });

    // Strategy 2: Smart repositioning
    return this.applySmartRepositioning(elements, corrections);
  }

  /**
   * Handle minor overflow with precise adjustments
   */
  private applyMinorOverflowCorrections(
    elements: ElementBounds[],
    overflow: OverflowAnalysis,
    corrections: ValidationResult['corrections']
  ): ElementBounds[] {
    console.log('🔧 Applying minor overflow corrections');
    
    const safeArea = this.getSafeArea();
    
    // Fine-tune positioning for overflowing elements
    elements.forEach(element => {
      if (overflow.affectedElements.includes(element.id)) {
        const before = { ...element };
        const finalWidth = element.width * element.scaleX;
        const finalHeight = element.height * element.scaleY;
        
        // Adjust position to fit within bounds
        let newLeft = element.left;
        let newTop = element.top;
        
        // Horizontal adjustment
        if (element.left < safeArea.minLeft) {
          newLeft = safeArea.minLeft;
        } else if (element.left + finalWidth > safeArea.maxRight) {
          newLeft = safeArea.maxRight - finalWidth;
        }
        
        // Vertical adjustment
        if (element.top < safeArea.minTop) {
          newTop = safeArea.minTop;
        } else if (element.top + finalHeight > safeArea.maxBottom) {
          newTop = safeArea.maxBottom - finalHeight;
        }
        
        if (newLeft !== element.left || newTop !== element.top) {
          element.left = newLeft;
          element.top = newTop;
          
          corrections.push({
            elementId: element.id,
            action: 'reposition',
            before,
            after: { ...element },
            reasoning: 'Precise positioning adjustment to resolve minor boundary violation'
          });
        }
      }
    });

    return elements;
  }

  /**
   * Apply compact layout arrangement for severe overflow situations
   */
  private applyCompactLayoutArrangement(
    elements: ElementBounds[],
    corrections: ValidationResult['corrections']
  ): ElementBounds[] {
    const safeArea = this.getSafeArea();
    const availableWidth = safeArea.maxRight - safeArea.minLeft;
    const availableHeight = safeArea.maxBottom - safeArea.minTop;

    // Sort by importance and size
    const sortedElements = [...elements].sort((a, b) => {
      const importanceOrder = { 'primary': 4, 'secondary': 3, 'tertiary': 2, 'decorative': 1 };
      const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance];
      if (importanceDiff !== 0) return importanceDiff;
      
      // If same importance, sort by size (larger first)
      const sizeA = a.width * a.height * a.scaleX * a.scaleY;
      const sizeB = b.width * b.height * b.scaleX * b.scaleY;
      return sizeB - sizeA;
    });

    // Arrange in grid pattern
    const cols = Math.ceil(Math.sqrt(elements.length));
    const rows = Math.ceil(elements.length / cols);
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;

    sortedElements.forEach((element, index) => {
      const before = { ...element };
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      // Position in grid cell center
      const cellCenterX = safeArea.minLeft + col * cellWidth + cellWidth / 2;
      const cellCenterY = safeArea.minTop + row * cellHeight + cellHeight / 2;
      
      // Ensure element fits in cell
      const maxElementWidth = cellWidth * 0.8; // 80% of cell width
      const maxElementHeight = cellHeight * 0.8; // 80% of cell height
      
      const currentWidth = element.width * element.scaleX;
      const currentHeight = element.height * element.scaleY;
      
      let scaleX = element.scaleX;
      let scaleY = element.scaleY;
      
      if (currentWidth > maxElementWidth) {
        scaleX = (maxElementWidth / element.width);
      }
      if (currentHeight > maxElementHeight) {
        scaleY = (maxElementHeight / element.height);
      }
      
      // Apply aspect ratio locking if needed
      if (element.aspectRatioLocked) {
        const uniformScale = Math.min(scaleX, scaleY);
        scaleX = uniformScale;
        scaleY = uniformScale;
      }
      
      const finalWidth = element.width * scaleX;
      const finalHeight = element.height * scaleY;
      
      element.left = cellCenterX - finalWidth / 2;
      element.top = cellCenterY - finalHeight / 2;
      element.scaleX = scaleX;
      element.scaleY = scaleY;
      
      corrections.push({
        elementId: element.id,
        action: 'layout-compress',
        before,
        after: { ...element },
        reasoning: `Compact grid layout arrangement (${col + 1}, ${row + 1}) to resolve severe overflow`
      });
    });

    return sortedElements;
  }

  /**
   * Apply smart repositioning to minimize overlap and maximize space usage
   */
  private applySmartRepositioning(
    elements: ElementBounds[],
    corrections: ValidationResult['corrections']
  ): ElementBounds[] {
    // Implementation of smart repositioning algorithm
    // This would use algorithms like force-directed layout or bin packing
    // For now, return the elements as-is with a note that this could be enhanced
    console.log('📍 Smart repositioning would be applied here (advanced algorithm)');
    return elements;
  }

  /**
   * Calculate quality score based on how well corrections preserve design integrity
   */
  private calculateQualityScore(
    originalElements: ElementBounds[],
    correctedElements: ElementBounds[],
    corrections: ValidationResult['corrections']
  ): number {
    let totalScore = 100;
    
    // Penalty for each correction type
    corrections.forEach(correction => {
      switch (correction.action) {
        case 'reposition':
          totalScore -= 5; // Light penalty for repositioning
          break;
        case 'scale':
          const scaleDiff = Math.abs(correction.before.scaleX - correction.after.scaleX);
          totalScore -= scaleDiff * 20; // Penalty proportional to scale change
          break;
        case 'priority-swap':
          totalScore -= 15; // Moderate penalty for changing element priority
          break;
        case 'layout-compress':
          totalScore -= 25; // Heavy penalty for layout restructuring
          break;
      }
    });

    // Bonus for maintaining important elements well
    const primaryElements = originalElements.filter(e => e.importance === 'primary');
    const primaryCorrections = corrections.filter(c => 
      primaryElements.some(p => p.id === c.elementId)
    );
    
    if (primaryCorrections.length === 0) {
      totalScore += 10; // Bonus for not affecting primary elements
    }

    return Math.max(0, Math.min(100, totalScore));
  }

  // Helper methods

  private getSafeArea() {
    return {
      minLeft: this.boundaries.margins.left,
      minTop: this.boundaries.margins.top,
      maxRight: this.boundaries.width - this.boundaries.margins.right,
      maxBottom: this.boundaries.height - this.boundaries.margins.bottom
    };
  }

  private calculateScaleReduction(element: ElementBounds, safeArea: any): number {
    const finalWidth = element.width * element.scaleX;
    const finalHeight = element.height * element.scaleY;
    
    const maxAllowedWidth = safeArea.maxRight - element.left;
    const maxAllowedHeight = safeArea.maxBottom - element.top;
    
    const widthReduction = maxAllowedWidth / finalWidth;
    const heightReduction = maxAllowedHeight / finalHeight;
    
    return Math.min(1, widthReduction, heightReduction, element.maxScale || 1.5);
  }

  private generateOverflowRecommendations(
    overflowType: OverflowAnalysis['overflowType'],
    severity: OverflowAnalysis['severity'],
    overflowRatio: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (severity === 'severe') {
      recommendations.push('Consider reducing canvas content density');
      recommendations.push('Aggressive scaling of decorative elements recommended');
      if (overflowRatio > 0.8) {
        recommendations.push('Layout restructuring required for optimal results');
      }
    }
    
    if (overflowType === 'horizontal') {
      recommendations.push('Horizontal compression and vertical stacking may improve layout');
    } else if (overflowType === 'vertical') {
      recommendations.push('Vertical compression and horizontal arrangement recommended');
    } else if (overflowType === 'both') {
      recommendations.push('Grid-based layout arrangement will optimize space usage');
    }
    
    return recommendations;
  }
}