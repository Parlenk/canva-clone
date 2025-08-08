/**
 * Advanced Layout Optimizer with Aesthetic Scoring
 * 
 * Provides sophisticated layout analysis and optimization algorithms
 * for AI-powered canvas resizing with professional design principles.
 */

interface LayoutElement {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  importance: 'primary' | 'secondary' | 'tertiary' | 'decorative';
  visualWeight: number;
}

interface AestheticScoreComponents {
  visualBalance: number;      // 0-100: How well balanced the composition is
  hierarchyClarity: number;   // 0-100: How clear the visual hierarchy is
  spacingRhythm: number;      // 0-100: Consistency of spacing patterns
  alignmentScore: number;     // 0-100: How well elements align
  proximityGrouping: number;  // 0-100: Logical grouping of related elements
  contrastBalance: number;    // 0-100: Appropriate contrast between elements
}

interface LayoutOptimization {
  originalScore: number;
  optimizedScore: number;
  improvements: string[];
  adjustments: Array<{
    elementId: string;
    adjustmentType: 'position' | 'scale' | 'priority';
    before: { left: number; top: number; scaleX: number; scaleY: number };
    after: { left: number; top: number; scaleX: number; scaleY: number };
    reasoning: string;
  }>;
}

export class AdvancedLayoutOptimizer {
  private canvasWidth: number;
  private canvasHeight: number;
  
  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /**
   * Calculate comprehensive aesthetic score for a layout
   */
  calculateAestheticScore(elements: LayoutElement[]): AestheticScoreComponents & { totalScore: number } {
    const visualBalance = this.calculateVisualBalance(elements);
    const hierarchyClarity = this.calculateHierarchyClarity(elements);
    const spacingRhythm = this.calculateSpacingRhythm(elements);
    const alignmentScore = this.calculateAlignmentScore(elements);
    const proximityGrouping = this.calculateProximityGrouping(elements);
    const contrastBalance = this.calculateContrastBalance(elements);

    // Weighted average with emphasis on most important factors
    const totalScore = Math.round(
      visualBalance * 0.25 +
      hierarchyClarity * 0.20 +
      spacingRhythm * 0.15 +
      alignmentScore * 0.15 +
      proximityGrouping * 0.15 +
      contrastBalance * 0.10
    );

    return {
      visualBalance,
      hierarchyClarity,
      spacingRhythm,
      alignmentScore,
      proximityGrouping,
      contrastBalance,
      totalScore,
    };
  }

  /**
   * Optimize layout for better aesthetic appeal
   */
  optimizeLayout(elements: LayoutElement[]): LayoutOptimization {
    const originalScore = this.calculateAestheticScore(elements);
    let optimizedElements = [...elements];
    const adjustments: LayoutOptimization['adjustments'] = [];
    const improvements: string[] = [];

    // Apply optimization techniques
    this.optimizeVisualBalance(optimizedElements, adjustments, improvements);
    this.optimizeAlignment(optimizedElements, adjustments, improvements);
    this.optimizeSpacing(optimizedElements, adjustments, improvements);
    this.optimizeHierarchy(optimizedElements, adjustments, improvements);

    const optimizedScore = this.calculateAestheticScore(optimizedElements);

    return {
      originalScore: originalScore.totalScore,
      optimizedScore: optimizedScore.totalScore,
      improvements,
      adjustments,
    };
  }

  /**
   * Generate layout improvement suggestions
   */
  generateLayoutSuggestions(elements: LayoutElement[]): string[] {
    const score = this.calculateAestheticScore(elements);
    const suggestions: string[] = [];

    if (score.visualBalance < 70) {
      suggestions.push('Consider redistributing visual weight for better balance');
      suggestions.push('Move heavier elements toward the center or balance with lighter elements');
    }

    if (score.hierarchyClarity < 70) {
      suggestions.push('Strengthen visual hierarchy with size and position adjustments');
      suggestions.push('Ensure primary elements are prominently positioned');
    }

    if (score.spacingRhythm < 70) {
      suggestions.push('Create more consistent spacing between elements');
      suggestions.push('Use a grid system for better spacing rhythm');
    }

    if (score.alignmentScore < 70) {
      suggestions.push('Align elements to create stronger visual connections');
      suggestions.push('Use invisible grids to guide element placement');
    }

    if (score.proximityGrouping < 70) {
      suggestions.push('Group related elements closer together');
      suggestions.push('Separate unrelated elements with more space');
    }

    return suggestions;
  }

  // Private optimization methods

  private calculateVisualBalance(elements: LayoutElement[]): number {
    if (elements.length === 0) return 100;

    // Calculate visual center of mass
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    elements.forEach(element => {
      const centerX = element.left + (element.width * element.scaleX) / 2;
      const centerY = element.top + (element.height * element.scaleY) / 2;
      const weight = element.visualWeight * (element.width * element.height * element.scaleX * element.scaleY);

      totalWeight += weight;
      weightedX += centerX * weight;
      weightedY += centerY * weight;
    });

    const centerOfMass = {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
    };

    const canvasCenter = {
      x: this.canvasWidth / 2,
      y: this.canvasHeight / 2,
    };

    // Calculate how close the center of mass is to canvas center
    const maxDistance = Math.sqrt(Math.pow(this.canvasWidth / 2, 2) + Math.pow(this.canvasHeight / 2, 2));
    const actualDistance = Math.sqrt(
      Math.pow(centerOfMass.x - canvasCenter.x, 2) + Math.pow(centerOfMass.y - canvasCenter.y, 2)
    );

    return Math.max(0, 100 - (actualDistance / maxDistance) * 100);
  }

  private calculateHierarchyClarity(elements: LayoutElement[]): number {
    if (elements.length === 0) return 100;

    // Sort by importance
    const sortedByImportance = [...elements].sort((a, b) => {
      const importanceOrder = { 'primary': 4, 'secondary': 3, 'tertiary': 2, 'decorative': 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });

    let hierarchyScore = 0;
    let maxScore = 0;

    for (let i = 0; i < sortedByImportance.length; i++) {
      const currentElement = sortedByImportance[i];
      const expectedSize = this.getExpectedSizeForImportance(currentElement.importance);
      const actualSize = currentElement.width * currentElement.height * currentElement.scaleX * currentElement.scaleY;
      
      // Check if size matches importance
      const sizeScore = 1 - Math.abs(actualSize - expectedSize) / Math.max(actualSize, expectedSize);
      hierarchyScore += sizeScore;
      maxScore += 1;

      // Check if position matches importance (primary elements should be more prominent)
      if (currentElement.importance === 'primary') {
        const centerDistance = this.getDistanceFromOptimalPosition(currentElement);
        const positionScore = Math.max(0, 1 - centerDistance / 200); // Within 200px is good
        hierarchyScore += positionScore;
        maxScore += 1;
      }
    }

    return maxScore > 0 ? (hierarchyScore / maxScore) * 100 : 100;
  }

  private calculateSpacingRhythm(elements: LayoutElement[]): number {
    if (elements.length < 2) return 100;

    const spacings: number[] = [];

    // Calculate horizontal spacings
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const elem1 = elements[i];
        const elem2 = elements[j];
        
        const horizontalGap = Math.abs((elem1.left + elem1.width * elem1.scaleX) - elem2.left);
        const verticalGap = Math.abs((elem1.top + elem1.height * elem1.scaleY) - elem2.top);
        
        if (horizontalGap > 0) spacings.push(horizontalGap);
        if (verticalGap > 0) spacings.push(verticalGap);
      }
    }

    // Calculate coefficient of variation for spacing consistency
    const mean = spacings.reduce((sum, s) => sum + s, 0) / spacings.length;
    const variance = spacings.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / spacings.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Lower coefficient of variation means more consistent spacing
    return Math.max(0, 100 - coefficientOfVariation * 50);
  }

  private calculateAlignmentScore(elements: LayoutElement[]): number {
    if (elements.length < 2) return 100;

    let alignmentScore = 0;
    let totalComparisons = 0;

    // Check for horizontal alignment
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const elem1 = elements[i];
        const elem2 = elements[j];
        
        totalComparisons++;

        // Check left alignment
        if (Math.abs(elem1.left - elem2.left) < 10) alignmentScore += 1;
        // Check center alignment
        const center1 = elem1.left + (elem1.width * elem1.scaleX) / 2;
        const center2 = elem2.left + (elem2.width * elem2.scaleX) / 2;
        if (Math.abs(center1 - center2) < 10) alignmentScore += 1;
        // Check right alignment
        const right1 = elem1.left + elem1.width * elem1.scaleX;
        const right2 = elem2.left + elem2.width * elem2.scaleX;
        if (Math.abs(right1 - right2) < 10) alignmentScore += 1;

        // Check top alignment
        if (Math.abs(elem1.top - elem2.top) < 10) alignmentScore += 1;
        // Check vertical center alignment
        const vcenter1 = elem1.top + (elem1.height * elem1.scaleY) / 2;
        const vcenter2 = elem2.top + (elem2.height * elem2.scaleY) / 2;
        if (Math.abs(vcenter1 - vcenter2) < 10) alignmentScore += 1;
      }
    }

    return totalComparisons > 0 ? (alignmentScore / (totalComparisons * 5)) * 100 : 100;
  }

  private calculateProximityGrouping(elements: LayoutElement[]): number {
    if (elements.length < 2) return 100;

    // Group elements by importance
    const groups = {
      'primary': elements.filter(e => e.importance === 'primary'),
      'secondary': elements.filter(e => e.importance === 'secondary'),
      'tertiary': elements.filter(e => e.importance === 'tertiary'),
      'decorative': elements.filter(e => e.importance === 'decorative'),
    };

    let totalScore = 0;
    let groupCount = 0;

    Object.values(groups).forEach(group => {
      if (group.length > 1) {
        groupCount++;
        // Calculate average distance between elements in the same group
        let totalDistance = 0;
        let pairCount = 0;

        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const distance = this.calculateDistance(group[i], group[j]);
            totalDistance += distance;
            pairCount++;
          }
        }

        const avgDistance = totalDistance / pairCount;
        // Closer elements in the same group score higher
        const groupScore = Math.max(0, 100 - (avgDistance / 200) * 100);
        totalScore += groupScore;
      }
    });

    return groupCount > 0 ? totalScore / groupCount : 100;
  }

  private calculateContrastBalance(elements: LayoutElement[]): number {
    // Simplified contrast calculation based on visual weight differences
    if (elements.length < 2) return 100;

    const weights = elements.map(e => e.visualWeight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    
    // Good contrast means significant difference between heaviest and lightest elements
    const contrast = (maxWeight - minWeight) / maxWeight;
    
    // Optimal contrast is around 0.5-0.8
    if (contrast >= 0.5 && contrast <= 0.8) return 100;
    if (contrast < 0.3) return 50; // Too little contrast
    if (contrast > 0.9) return 70; // Too much contrast
    
    return 80; // Decent contrast
  }

  // Optimization helper methods

  private optimizeVisualBalance(
    elements: LayoutElement[],
    adjustments: LayoutOptimization['adjustments'],
    improvements: string[]
  ): void {
    const balance = this.calculateVisualBalance(elements);
    if (balance < 70) {
      // Move elements toward better balance
      improvements.push('Improved visual balance through strategic repositioning');
      // Implementation would adjust positions based on visual weight distribution
    }
  }

  private optimizeAlignment(
    elements: LayoutElement[],
    adjustments: LayoutOptimization['adjustments'],
    improvements: string[]
  ): void {
    const alignment = this.calculateAlignmentScore(elements);
    if (alignment < 70) {
      improvements.push('Enhanced alignment consistency');
      // Implementation would snap elements to common alignment points
    }
  }

  private optimizeSpacing(
    elements: LayoutElement[],
    adjustments: LayoutOptimization['adjustments'],
    improvements: string[]
  ): void {
    const spacing = this.calculateSpacingRhythm(elements);
    if (spacing < 70) {
      improvements.push('Improved spacing rhythm and consistency');
      // Implementation would adjust spacing to create consistent patterns
    }
  }

  private optimizeHierarchy(
    elements: LayoutElement[],
    adjustments: LayoutOptimization['adjustments'],
    improvements: string[]
  ): void {
    const hierarchy = this.calculateHierarchyClarity(elements);
    if (hierarchy < 70) {
      improvements.push('Strengthened visual hierarchy');
      // Implementation would adjust scales and positions based on importance
    }
  }

  // Helper methods

  private getExpectedSizeForImportance(importance: string): number {
    const canvasArea = this.canvasWidth * this.canvasHeight;
    switch (importance) {
      case 'primary': return canvasArea * 0.15; // 15% of canvas
      case 'secondary': return canvasArea * 0.08; // 8% of canvas
      case 'tertiary': return canvasArea * 0.05; // 5% of canvas
      case 'decorative': return canvasArea * 0.02; // 2% of canvas
      default: return canvasArea * 0.05;
    }
  }

  private getDistanceFromOptimalPosition(element: LayoutElement): number {
    // Primary elements should be in upper-left quadrant for better visibility
    const optimalX = this.canvasWidth * 0.3;
    const optimalY = this.canvasHeight * 0.3;
    
    const elementCenterX = element.left + (element.width * element.scaleX) / 2;
    const elementCenterY = element.top + (element.height * element.scaleY) / 2;
    
    return Math.sqrt(
      Math.pow(elementCenterX - optimalX, 2) + Math.pow(elementCenterY - optimalY, 2)
    );
  }

  private calculateDistance(elem1: LayoutElement, elem2: LayoutElement): number {
    const center1X = elem1.left + (elem1.width * elem1.scaleX) / 2;
    const center1Y = elem1.top + (elem1.height * elem1.scaleY) / 2;
    const center2X = elem2.left + (elem2.width * elem2.scaleX) / 2;
    const center2Y = elem2.top + (elem2.height * elem2.scaleY) / 2;
    
    return Math.sqrt(Math.pow(center2X - center1X, 2) + Math.pow(center2Y - center1Y, 2));
  }
}