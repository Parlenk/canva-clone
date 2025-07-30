import OpenAI from 'openai';

// Removed CanvasAnalysis interface - using direct resize approach

interface ObjectPlacement {
  id: string;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  reasoning: string;
}

interface ResizeAnalysis {
  layoutStrategy?: string;
  placements: ObjectPlacement[];
  designRationale: string;
  appliedPrinciples: string[];
  qualityChecks?: {
    textReadability?: string;
    visualBalance?: string;
    professionalAppearance?: string;
  };
}

export class OpenAIVisionService {
  private openai: OpenAI;

  constructor() {
    // In Next.js, we need to check if we're server-side
    if (typeof window !== 'undefined') {
      console.log('⚠️ OpenAI Vision Service: Running client-side, skipping initialization');
      // Client-side - service will be called via API
      this.openai = null as any;
      return;
    }
    
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('🎯 OpenAI Vision Service: API Key available:', !!apiKey);
    if (!apiKey) {
      console.log('❌ OpenAI API key not found, service will not initialize');
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    console.log('✅ OpenAI Vision Service initialized successfully');
  }

  // Simplified: Direct resize with single prompt
  async resizeCanvas(
    canvasImageBase64: string,
    currentSize: { width: number; height: number },
    newSize: { width: number; height: number },
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
    }>
  ): Promise<ResizeAnalysis> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not initialized (client-side)');
      }

      const layersList = objectsData.map((obj, index) => 
        `Layer ${index + 1}: ${obj.type}${obj.text ? ` "${obj.text}"` : ''} (${obj.width}×${obj.height} at position ${obj.left},${obj.top})`
      ).join('\n');

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective vision model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Here is an image with canvas size ${currentSize.width}×${currentSize.height} and the following layers:

${layersList}

TASK: Resize to new canvas size ${newSize.width}×${newSize.height}. Resize all layers to fit INSIDE the new canvas boundaries.

CRITICAL RULES:
1. ALL objects must be positioned INSIDE the canvas boundaries (0,0) to (${newSize.width},${newSize.height})
2. Object positions (left, top) must be >= 0 
3. Object positions + object size must be <= canvas size
4. For object at (left, top) with size (width×height) and scale (scaleX, scaleY):
   - left + (width × scaleX) must be <= ${newSize.width}
   - top + (height × scaleY) must be <= ${newSize.height}
5. Leave at least 10px margin from canvas edges
6. Scale objects appropriately but keep them readable (minimum scale 0.3)

RESPOND ONLY in this JSON format:
{
  "layoutStrategy": "brief description of your resize approach",
  "placements": [
    {
      "id": "obj_0",
      "left": 50,
      "top": 40,
      "scaleX": 0.8,
      "scaleY": 0.8,
      "reasoning": "why you positioned and scaled this way"
    }
  ],
  "designRationale": "how this maintains good design in the new size"
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${canvasImageBase64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in OpenAI response');
      }

      const result = JSON.parse(jsonMatch[0]) as ResizeAnalysis;
      
      // Add applied principles for compatibility
      result.appliedPrinciples = result.appliedPrinciples || ['smart scaling', 'layout preservation'];
      
      // Validate and fix AI positioning to ensure objects stay within canvas bounds
      const validatedPlacements = result.placements?.map((placement, index) => {
        const originalObj = objectsData.find(obj => obj.id === placement.id) || objectsData[index];
        if (!originalObj) return placement;
        
        // Calculate object final size after scaling
        const finalWidth = originalObj.width * placement.scaleX;
        const finalHeight = originalObj.height * placement.scaleY;
        
        // Ensure minimum scale
        const minScale = 0.3;
        const safeScaleX = Math.max(minScale, placement.scaleX);
        const safeScaleY = Math.max(minScale, placement.scaleY);
        
        // Recalculate size with safe scaling
        const safeWidth = originalObj.width * safeScaleX;
        const safeHeight = originalObj.height * safeScaleY;
        
        // Ensure positioning stays within canvas with 10px margin
        const margin = 10;
        const maxLeft = newSize.width - safeWidth - margin;
        const maxTop = newSize.height - safeHeight - margin;
        
        const safeLeft = Math.max(margin, Math.min(placement.left, maxLeft));
        const safeTop = Math.max(margin, Math.min(placement.top, maxTop));
        
        console.log(`🔧 Validating ${placement.id}:`, {
          original: { left: placement.left, top: placement.top, scaleX: placement.scaleX, scaleY: placement.scaleY },
          safe: { left: safeLeft, top: safeTop, scaleX: safeScaleX, scaleY: safeScaleY },
          size: { width: safeWidth, height: safeHeight },
          bounds: { maxLeft, maxTop }
        });
        
        return {
          ...placement,
          left: safeLeft,
          top: safeTop,
          scaleX: safeScaleX,
          scaleY: safeScaleY,
        };
      }) || [];
      
      result.placements = validatedPlacements;
      result.designRationale = (result.designRationale || '') + ' [Validated for canvas boundaries]';
      
      return result;
    } catch (error) {
      console.error('Error resizing canvas:', error);
      throw error;
    }
  }


}

// Export singleton instance
export const openAIVisionService = new OpenAIVisionService();