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
                text: `You are a professional graphic designer. Here is a canvas with size ${currentSize.width}×${currentSize.height} containing these layers:

${layersList}

DESIGN CHALLENGE: Resize this design to fit perfectly in a new ${newSize.width}×${newSize.height} white canvas.

CRITICAL REQUIREMENTS:
🎯 ALL ${objectsData.length} LAYERS must be visible within the white canvas boundaries
🎯 ALL layers must work together as a cohesive, well-designed composition
🎯 NO layer can be positioned outside the white canvas area
🎯 The final result must look professionally designed, not randomly placed

DESIGN CONSTRAINTS:
• Canvas boundaries: (0,0) to (${newSize.width},${newSize.height})
• Minimum 20px margin from all edges for breathing room
• Each layer must be scaled appropriately (minimum 0.4x, maximum 2.0x)
• Consider visual hierarchy - important elements should be more prominent
• Maintain good spacing between layers - no overlapping unless intentional
• Think about the overall composition flow and balance

MATHEMATICAL VALIDATION:
For each layer at position (left, top) with size (width×height) and scale (scaleX, scaleY):
✓ left >= 20
✓ top >= 20  
✓ left + (width × scaleX) <= ${newSize.width - 20}
✓ top + (height × scaleY) <= ${newSize.height - 20}

YOUR TASK: Create a layout where ALL ${objectsData.length} layers are beautifully arranged within the white canvas, scaled appropriately, and work together as a unified design.

RESPOND with precise positioning for ALL layers in JSON format:
{
  "layoutStrategy": "describe how you arranged all ${objectsData.length} layers together",
  "placements": [
    {
      "id": "obj_0",
      "left": 50,
      "top": 40,
      "scaleX": 0.8,
      "scaleY": 0.8,
      "reasoning": "why you positioned this layer here and how it works with other layers"
    }
  ],
  "designRationale": "explain how this layout makes all ${objectsData.length} layers work together beautifully"
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
      
      // Validate that AI provided placements for ALL layers
      if (!result.placements || result.placements.length !== objectsData.length) {
        console.error(`❌ AI only provided ${result.placements?.length || 0} placements for ${objectsData.length} layers!`);
        
        // Create missing placements for layers the AI forgot
        const missingPlacements = objectsData.map((obj, index) => {
          const existingPlacement = result.placements?.find(p => p.id === obj.id);
          if (existingPlacement) return existingPlacement;
          
          // Create safe fallback placement for missing layer
          const margin = 20;
          const maxScale = Math.min(
            (newSize.width - 2 * margin) / obj.width,
            (newSize.height - 2 * margin) / obj.height,
            1.0
          );
          const safeScale = Math.max(0.4, maxScale * 0.8);
          
          console.log(`🔧 Creating fallback placement for missing layer ${obj.id}`);
          return {
            id: obj.id,
            left: margin + (index * 50) % (newSize.width - obj.width * safeScale - 2 * margin),
            top: margin + Math.floor(index / 3) * 100,
            scaleX: safeScale,
            scaleY: safeScale,
            reasoning: `Fallback placement for layer AI forgot to position`
          };
        });
        result.placements = missingPlacements;
      }

      // Validate and fix AI positioning to ensure ALL objects stay within canvas bounds
      const validatedPlacements = result.placements.map((placement, index) => {
        const originalObj = objectsData.find(obj => obj.id === placement.id) || objectsData[index];
        if (!originalObj) {
          console.error(`❌ Could not find original object for placement ${placement.id}`);
          return placement;
        }
        
        // Ensure minimum and maximum scale limits
        const minScale = 0.4;
        const maxScale = 2.0;
        const safeScaleX = Math.max(minScale, Math.min(maxScale, placement.scaleX));
        const safeScaleY = Math.max(minScale, Math.min(maxScale, placement.scaleY));
        
        // Calculate final size after safe scaling
        const safeWidth = originalObj.width * safeScaleX;
        const safeHeight = originalObj.height * safeScaleY;
        
        // Ensure positioning stays within canvas with proper margins
        const margin = 20;
        const maxLeft = newSize.width - safeWidth - margin;
        const maxTop = newSize.height - safeHeight - margin;
        
        const safeLeft = Math.max(margin, Math.min(placement.left, maxLeft));
        const safeTop = Math.max(margin, Math.min(placement.top, maxTop));
        
        console.log(`🔧 Validating layer ${placement.id}:`, {
          original: { left: placement.left, top: placement.top, scaleX: placement.scaleX, scaleY: placement.scaleY },
          validated: { left: safeLeft, top: safeTop, scaleX: safeScaleX, scaleY: safeScaleY },
          finalSize: { width: safeWidth, height: safeHeight },
          bounds: { maxLeft, maxTop },
          withinBounds: safeLeft >= margin && safeTop >= margin && safeLeft + safeWidth <= newSize.width - margin && safeTop + safeHeight <= newSize.height - margin
        });
        
        return {
          ...placement,
          left: safeLeft,
          top: safeTop,
          scaleX: safeScaleX,
          scaleY: safeScaleY,
        };
      });
      
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