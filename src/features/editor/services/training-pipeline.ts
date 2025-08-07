/**
 * AI Resize Training Pipeline
 * 
 * This service handles the machine learning pipeline for improving 
 * the AI resize system based on user feedback and interactions.
 */

interface TrainingDataPoint {
  inputFeatures: {
    originalDimensions: { width: number; height: number };
    targetDimensions: { width: number; height: number };
    objectsData: Array<{
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
    canvasComplexity: number; // 0-1 scale
    aspectRatioChange: number;
    sizeChangeRatio: number;
  };
  expectedOutput: {
    placements: Array<{
      id: string;
      left: number;
      top: number;
      scaleX: number;
      scaleY: number;
    }>;
  };
  userFeedback: {
    rating: number; // 1-5
    helpful: boolean;
    manualCorrections?: any;
  };
  qualityScore: number; // 0-1
}

export class AIResizeTrainingPipeline {
  /**
   * Extract meaningful features from canvas data for training
   */
  static extractFeatures(originalCanvas: any, targetDimensions: { width: number; height: number }): TrainingDataPoint['inputFeatures'] {
    // Validate inputs
    if (!originalCanvas || typeof originalCanvas !== 'object') {
      throw new Error('Invalid originalCanvas: must be a valid object');
    }

    if (!targetDimensions || targetDimensions.width <= 0 || targetDimensions.height <= 0) {
      throw new Error('Invalid targetDimensions: width and height must be positive numbers');
    }

    const objects = Array.isArray(originalCanvas.objects) ? originalCanvas.objects : [];
    
    // Safely get canvas dimensions with defaults
    const canvasWidth = Math.max(1, Number(originalCanvas.width) || 400);
    const canvasHeight = Math.max(1, Number(originalCanvas.height) || 400);
    
    // Calculate canvas complexity (more objects = higher complexity)
    const canvasComplexity = Math.min(Math.max(0, objects.length) / 10, 1);
    
    // Calculate aspect ratio change with safety checks
    const originalAspectRatio = canvasWidth / canvasHeight;
    const targetAspectRatio = targetDimensions.width / targetDimensions.height;
    const aspectRatioChange = Math.abs(targetAspectRatio - originalAspectRatio) / Math.max(originalAspectRatio, 0.1);
    
    // Calculate size change ratio with bounds
    const originalArea = canvasWidth * canvasHeight;
    const targetArea = targetDimensions.width * targetDimensions.height;
    const sizeChangeRatio = Math.min(Math.max(targetArea / Math.max(originalArea, 1), 0.01), 100);
    
    // Extract object data with safety checks
    const objectsData = objects
      .filter((obj: any) => obj && typeof obj === 'object') // Filter out invalid objects
      .map((obj: any) => {
        const width = Math.max(0, Number(obj.width) || 0);
        const height = Math.max(0, Number(obj.height) || 0);
        const scaleX = Math.max(0.01, Math.min(10, Number(obj.scaleX) || 1));
        const scaleY = Math.max(0.01, Math.min(10, Number(obj.scaleY) || 1));

        return {
          type: String(obj.type || 'unknown').slice(0, 50), // Limit string length
          position: { 
            x: Math.max(0, Number(obj.left) || 0), 
            y: Math.max(0, Number(obj.top) || 0) 
          },
          size: { 
            width: width * scaleX, 
            height: height * scaleY 
          },
        };
      })
      .slice(0, 100); // Limit to 100 objects max

    return {
      originalDimensions: { width: canvasWidth, height: canvasHeight },
      targetDimensions: {
        width: Math.max(1, targetDimensions.width),
        height: Math.max(1, targetDimensions.height),
      },
      objectsData,
      canvasComplexity: Math.max(0, Math.min(1, canvasComplexity)),
      aspectRatioChange: Math.max(0, Math.min(10, aspectRatioChange)),
      sizeChangeRatio: Math.max(0.01, Math.min(100, sizeChangeRatio)),
    };
  }

  /**
   * Calculate training quality score based on user feedback
   */
  static calculateQualityScore(userFeedback: TrainingDataPoint['userFeedback']): number {
    // Validate input
    if (!userFeedback || typeof userFeedback !== 'object') {
      throw new Error('Invalid userFeedback: must be a valid object');
    }

    const rating = Number(userFeedback.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error('Invalid rating: must be a number between 1 and 5');
    }

    let score = Math.max(0, Math.min(1, rating / 5.0)); // Base score from rating, ensure 0-1 range
    
    // Boost score if helpful (but cap at 1.0)
    if (userFeedback.helpful === true) {
      score = Math.min(score * 1.1, 1.0);
    } else if (userFeedback.helpful === false) {
      score = Math.max(score * 0.9, 0.0);
    }
    
    // Reduce score if manual corrections were needed
    if (userFeedback.manualCorrections && 
        typeof userFeedback.manualCorrections === 'object' &&
        Object.keys(userFeedback.manualCorrections).length > 0) {
      score = Math.max(score * 0.8, 0.1);
    }
    
    // Ensure final score is within valid range
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Prepare training data for model retraining
   * This would be used with a machine learning framework like TensorFlow.js or PyTorch
   */
  static prepareTrainingBatch(trainingDataPoints: TrainingDataPoint[]) {
    const features = trainingDataPoints.map(point => [
      point.inputFeatures.originalDimensions.width,
      point.inputFeatures.originalDimensions.height,
      point.inputFeatures.targetDimensions.width,
      point.inputFeatures.targetDimensions.height,
      point.inputFeatures.canvasComplexity,
      point.inputFeatures.aspectRatioChange,
      point.inputFeatures.sizeChangeRatio,
      point.inputFeatures.objectsData.length,
    ]);

    const labels = trainingDataPoints.map(point => point.qualityScore);

    return { features, labels };
  }

  /**
   * Analyze patterns in training data to improve AI prompts
   */
  static analyzePatterns(trainingDataPoints: TrainingDataPoint[]) {
    const highQualityResults = trainingDataPoints.filter(p => p.qualityScore >= 0.8);
    const lowQualityResults = trainingDataPoints.filter(p => p.qualityScore <= 0.4);

    const patterns = {
      successfulScenarios: {
        avgComplexity: highQualityResults.reduce((sum, p) => sum + p.inputFeatures.canvasComplexity, 0) / highQualityResults.length,
        avgAspectRatioChange: highQualityResults.reduce((sum, p) => sum + p.inputFeatures.aspectRatioChange, 0) / highQualityResults.length,
        avgSizeChangeRatio: highQualityResults.reduce((sum, p) => sum + p.inputFeatures.sizeChangeRatio, 0) / highQualityResults.length,
      },
      problematicScenarios: {
        avgComplexity: lowQualityResults.reduce((sum, p) => sum + p.inputFeatures.canvasComplexity, 0) / lowQualityResults.length,
        avgAspectRatioChange: lowQualityResults.reduce((sum, p) => sum + p.inputFeatures.aspectRatioChange, 0) / lowQualityResults.length,
        avgSizeChangeRatio: lowQualityResults.reduce((sum, p) => sum + p.inputFeatures.sizeChangeRatio, 0) / lowQualityResults.length,
      },
    };

    return patterns;
  }

  /**
   * Generate improved AI prompts based on training data analysis
   */
  static generateImprovedPrompts(patterns: ReturnType<typeof AIResizeTrainingPipeline.analyzePatterns>) {
    const prompts = [];

    // Add specific guidance based on successful patterns
    if (patterns.successfulScenarios.avgComplexity > 0.5) {
      prompts.push("For complex canvases with many objects, prioritize maintaining visual hierarchy and grouping related elements.");
    }

    if (patterns.successfulScenarios.avgAspectRatioChange < 0.3) {
      prompts.push("When aspect ratio changes are minimal, focus on proportional scaling while maintaining object relationships.");
    }

    if (patterns.problematicScenarios.avgSizeChangeRatio > 2.0) {
      prompts.push("For significant size increases, ensure objects don't appear lost in empty space - consider strategic positioning and scaling.");
    }

    return prompts.join(" ");
  }
}

// Example usage in a background job or API endpoint:
/*
export async function retrainAIModel() {
  // 1. Fetch training data from database
  const sessions = await db.select().from(resizeSessions)
    .where(and(
      isNotNull(resizeSessions.userRating),
      gte(resizeSessions.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
    ));

  // 2. Convert to training data points
  const trainingPoints = sessions.map(session => ({
    inputFeatures: AIResizeTrainingPipeline.extractFeatures(session.originalCanvas, session.targetDimensions),
    expectedOutput: session.aiResult,
    userFeedback: {
      rating: session.userRating,
      helpful: session.userRating >= 4,
      manualCorrections: session.manualCorrections,
    },
    qualityScore: AIResizeTrainingPipeline.calculateQualityScore({
      rating: session.userRating,
      helpful: session.userRating >= 4,
      manualCorrections: session.manualCorrections,
    }),
  }));

  // 3. Analyze patterns and improve prompts
  const patterns = AIResizeTrainingPipeline.analyzePatterns(trainingPoints);
  const improvedPrompts = AIResizeTrainingPipeline.generateImprovedPrompts(patterns);

  // 4. Update AI service with improved prompts
  // This would update your OpenAI service to use better prompts

  console.log('Model retrained with', trainingPoints.length, 'data points');
  console.log('Improved prompts:', improvedPrompts);
}
*/