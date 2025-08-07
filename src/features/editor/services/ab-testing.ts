/**
 * A/B Testing Service for AI Resize Prompts
 * 
 * This service manages different versions of AI prompts and tracks their performance
 * to determine which prompts produce better results.
 */

interface PromptVariant {
  id: string;
  name: string;
  prompt: string;
  active: boolean;
  weight: number; // 0-100, percentage of traffic
  createdAt: Date;
  metrics?: {
    totalUses: number;
    avgRating: number;
    successRate: number; // % of ratings >= 4
  };
}

const PROMPT_VARIANTS: PromptVariant[] = [
  {
    id: 'original',
    name: 'Original Prompt',
    prompt: `You are an AI designer expert. Analyze the provided canvas image and reposition all objects for the new dimensions.

Current canvas size: {currentWidth}x{currentHeight}
New canvas size: {newWidth}x{newHeight}

Objects to reposition: {objectsData}

Return a JSON response with repositioned objects following this exact format:
{
  "placements": [
    {
      "id": "object_id",
      "left": number,
      "top": number,
      "scaleX": number,
      "scaleY": number
    }
  ]
}

Important rules:
- Maintain visual hierarchy and balance
- Keep objects within canvas bounds
- Scale proportionally when needed
- Consider design principles and aesthetics`,
    active: true,
    weight: 50,
    createdAt: new Date(),
  },
  {
    id: 'enhanced',
    name: 'Enhanced Prompt v1',
    prompt: `You are a professional UI/UX designer with expertise in responsive design. Analyze the canvas image and intelligently reposition all objects for optimal visual impact.

CANVAS TRANSFORMATION:
From: {currentWidth}x{currentHeight} → To: {newWidth}x{newHeight}
Aspect ratio change: {aspectRatio}

OBJECTS TO REPOSITION: {objectsData}

DESIGN PRINCIPLES TO FOLLOW:
1. Visual Hierarchy: Maintain importance order of elements
2. Golden Ratio: Use 1.618 proportions when possible
3. White Space: Ensure breathing room around elements
4. Alignment: Create visual order through proper alignment
5. Proximity: Group related elements together

TECHNICAL CONSTRAINTS:
- All objects must be within canvas bounds with 20px margin
- Scale objects proportionally (scaleX = scaleY)
- Maintain readable text sizes (min 12px)
- Preserve original object relationships

Return JSON format:
{
  "placements": [
    {
      "id": "object_id",
      "left": number,
      "top": number,
      "scaleX": number,
      "scaleY": number
    }
  ]
}`,
    active: true,
    weight: 50,
    createdAt: new Date(),
  },
];

export class ABTestingService {
  private static variants = new Map<string, PromptVariant>();
  private static userAssignments = new Map<string, string>(); // userId -> variantId

  static {
    // Initialize variants
    PROMPT_VARIANTS.forEach(variant => {
      this.variants.set(variant.id, variant);
    });
  }

  /**
   * Get a prompt variant for a user (sticky assignment)
   */
  static getVariantForUser(userId: string): PromptVariant {
    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.warn('Invalid userId provided, using anonymous');
      userId = 'anonymous';
    }

    // Sanitize userId (limit length and remove special characters)
    userId = userId.slice(0, 100).replace(/[^a-zA-Z0-9_-]/g, '');

    // Check if user already has an assignment
    let assignedVariantId = this.userAssignments.get(userId);
    
    if (!assignedVariantId || !this.variants.has(assignedVariantId)) {
      // Assign new variant based on weights
      assignedVariantId = this.assignVariant();
      if (assignedVariantId) {
        this.userAssignments.set(userId, assignedVariantId);
      }
    }

    const variant = this.variants.get(assignedVariantId || 'original');
    if (!variant) {
      // Fallback to first available variant
      const firstVariant = Array.from(this.variants.values())[0];
      if (!firstVariant) {
        throw new Error('No A/B test variants available');
      }
      return firstVariant;
    }

    return variant;
  }

  /**
   * Assign a variant based on weighted distribution
   */
  private static assignVariant(): string {
    const activeVariants = Array.from(this.variants.values()).filter(v => v.active);
    const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);
    
    if (totalWeight === 0) {
      return activeVariants[0]?.id || 'original';
    }

    const random = Math.random() * totalWeight;
    let currentWeight = 0;

    for (const variant of activeVariants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        return variant.id;
      }
    }

    return activeVariants[0].id;
  }

  /**
   * Record metrics for a variant
   */
  static recordMetrics(variantId: string, rating: number, processingTime: number) {
    // Validate inputs
    if (!variantId || typeof variantId !== 'string') {
      console.error('Invalid variantId provided to recordMetrics');
      return;
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      console.error('Invalid rating provided to recordMetrics:', rating);
      return;
    }

    const numProcessingTime = Number(processingTime);
    if (isNaN(numProcessingTime) || numProcessingTime < 0) {
      console.error('Invalid processingTime provided to recordMetrics:', processingTime);
      return;
    }

    const variant = this.variants.get(variantId);
    if (!variant) {
      console.error(`Variant ${variantId} not found in recordMetrics`);
      return;
    }

    // Initialize metrics if not present
    if (!variant.metrics) {
      variant.metrics = {
        totalUses: 0,
        avgRating: 0,
        successRate: 0,
      };
    }

    const metrics = variant.metrics;
    const oldTotal = Math.max(0, metrics.totalUses);
    const newTotal = oldTotal + 1;

    // Prevent division by zero and ensure valid calculations
    if (newTotal <= 0) {
      console.error('Invalid newTotal in recordMetrics');
      return;
    }

    // Update average rating with bounds checking
    const oldAvgRating = Math.max(0, Math.min(5, metrics.avgRating));
    metrics.avgRating = Math.max(0, Math.min(5, (oldAvgRating * oldTotal + numRating) / newTotal));
    
    // Update success rate (ratings >= 4) with bounds checking
    const oldSuccessRate = Math.max(0, Math.min(100, metrics.successRate));
    const oldSuccesses = Math.round((oldSuccessRate * oldTotal) / 100);
    const newSuccesses = oldSuccesses + (numRating >= 4 ? 1 : 0);
    metrics.successRate = Math.max(0, Math.min(100, (newSuccesses / newTotal) * 100));
    
    metrics.totalUses = newTotal;

    console.log(`📊 A/B Test Metrics for ${variantId}:`, {
      totalUses: metrics.totalUses,
      avgRating: Math.round(metrics.avgRating * 100) / 100,
      successRate: Math.round(metrics.successRate * 100) / 100,
    });
  }

  /**
   * Get performance comparison of all variants
   */
  static getPerformanceComparison() {
    const comparison = Array.from(this.variants.values()).map(variant => ({
      id: variant.id,
      name: variant.name,
      active: variant.active,
      weight: variant.weight,
      metrics: variant.metrics || {
        totalUses: 0,
        avgRating: 0,
        successRate: 0,
      },
    }));

    // Sort by performance (avg rating * success rate)
    comparison.sort((a, b) => {
      const scoreA = a.metrics.avgRating * a.metrics.successRate;
      const scoreB = b.metrics.avgRating * b.metrics.successRate;
      return scoreB - scoreA;
    });

    return comparison;
  }

  /**
   * Update variant weights based on performance
   */
  static autoOptimizeWeights() {
    const comparison = this.getPerformanceComparison();
    const activeVariants = comparison.filter(v => v.active && v.metrics.totalUses > 10);

    if (activeVariants.length < 2) return;

    // Calculate performance scores
    const maxScore = Math.max(...activeVariants.map(v => 
      v.metrics.avgRating * v.metrics.successRate
    ));

    // Redistribute weights based on relative performance
    let totalNewWeight = 0;
    activeVariants.forEach(variant => {
      const score = variant.metrics.avgRating * variant.metrics.successRate;
      const relativePerformance = score / maxScore;
      
      // Best performer gets 70%, others get proportional share of remaining 30%
      const newWeight = variant === activeVariants[0] ? 70 : 
        Math.max(5, Math.round(30 * relativePerformance));
      
      const actualVariant = this.variants.get(variant.id);
      if (actualVariant) {
        actualVariant.weight = newWeight;
        totalNewWeight += newWeight;
      }
    });

    // Normalize weights to sum to 100
    if (totalNewWeight !== 100) {
      const factor = 100 / totalNewWeight;
      activeVariants.forEach(variant => {
        const actualVariant = this.variants.get(variant.id);
        if (actualVariant) {
          actualVariant.weight = Math.round(actualVariant.weight * factor);
        }
      });
    }

    console.log('🔄 Auto-optimized A/B test weights:', 
      Array.from(this.variants.values()).map(v => ({
        id: v.id,
        weight: v.weight,
        avgRating: v.metrics?.avgRating || 0,
      }))
    );
  }

  /**
   * Add a new prompt variant
   */
  static addVariant(variant: Omit<PromptVariant, 'createdAt' | 'metrics'>) {
    const newVariant: PromptVariant = {
      ...variant,
      createdAt: new Date(),
    };
    
    this.variants.set(variant.id, newVariant);
    
    // Rebalance weights
    const activeCount = Array.from(this.variants.values()).filter(v => v.active).length;
    const baseWeight = Math.floor(100 / activeCount);
    
    Array.from(this.variants.values()).forEach(v => {
      if (v.active) {
        v.weight = baseWeight;
      }
    });
  }

  /**
   * Deactivate a variant
   */
  static deactivateVariant(variantId: string) {
    const variant = this.variants.get(variantId);
    if (variant) {
      variant.active = false;
      variant.weight = 0;
    }
  }

  /**
   * Generate prompt with placeholders filled
   */
  static generatePrompt(
    variantId: string,
    params: {
      currentWidth: number;
      currentHeight: number;
      newWidth: number;
      newHeight: number;
      objectsData: any[];
    }
  ): string {
    const variant = this.variants.get(variantId);
    if (!variant) return '';

    const aspectRatio = ((params.newWidth / params.newHeight) / (params.currentWidth / params.currentHeight)).toFixed(2);

    return variant.prompt
      .replace('{currentWidth}', params.currentWidth.toString())
      .replace('{currentHeight}', params.currentHeight.toString())
      .replace('{newWidth}', params.newWidth.toString())
      .replace('{newHeight}', params.newHeight.toString())
      .replace('{aspectRatio}', aspectRatio)
      .replace('{objectsData}', JSON.stringify(params.objectsData, null, 2));
  }

  /**
   * Statistical significance test (simplified)
   */
  static calculateSignificance(variantA: string, variantB: string) {
    const a = this.variants.get(variantA)?.metrics;
    const b = this.variants.get(variantB)?.metrics;

    if (!a || !b || a.totalUses < 30 || b.totalUses < 30) {
      return { significant: false, confidence: 0 };
    }

    // Simplified z-test for conversion rates
    const p1 = a.successRate / 100;
    const p2 = b.successRate / 100;
    const n1 = a.totalUses;
    const n2 = b.totalUses;

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const z = Math.abs(p1 - p2) / se;

    // 95% confidence threshold
    const significant = z > 1.96;
    const confidence = Math.min(99, Math.round((1 - 2 * (1 - normalCDF(Math.abs(z)))) * 100));

    return { significant, confidence };
  }
}

// Helper function for normal CDF approximation
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x: number): number {
  // Approximation of error function
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}