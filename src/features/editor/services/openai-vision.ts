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
                text: `IMPORTANT: You are looking at a design canvas. The WHITE RECTANGULAR AREA in the image is the ONLY space where design elements should be placed.

CURRENT SITUATION:
- Current white canvas: ${currentSize.width}×${currentSize.height} pixels
- Elements on canvas: ${layersList}

TASK: Resize all elements to fit in a NEW white canvas of ${newSize.width}×${newSize.height} pixels.

🚨 CRITICAL RULE: ALL ${objectsData.length} elements MUST be placed INSIDE the white rectangular canvas area ONLY.

ABSOLUTE REQUIREMENTS:
1. The white canvas area starts at (0,0) and ends at (${newSize.width},${newSize.height})
2. EVERY element must have its position AND size fit completely within these boundaries
3. NO element can extend beyond the white canvas edges
4. ALL ${objectsData.length} elements must be visible and well-arranged

POSITIONING RULES:
- Element position (left, top) must be >= 30 (minimum margin)
- Element position + element size must be <= canvas size - 30 (maximum boundary)
- For element at (left, top) with original size (width, height) and scale (scaleX, scaleY):
  → Final width = width × scaleX
  → Final height = height × scaleY  
  → left + Final width MUST BE <= ${newSize.width - 30}
  → top + Final height MUST BE <= ${newSize.height - 30}

SCALING GUIDELINES:
- Scale between 0.3 (minimum readable) to 1.5 (maximum)
- Ensure all elements remain readable and visible
- Consider visual importance when scaling

YOUR MISSION: Position ALL ${objectsData.length} elements so they create a beautiful design that fits COMPLETELY within the ${newSize.width}×${newSize.height} white canvas.

RESPOND in this exact JSON format with positions for ALL elements:
{
  "layoutStrategy": "How I arranged all ${objectsData.length} elements within the white canvas",
  "placements": [
    {
      "id": "obj_0",
      "left": 50,
      "top": 60,
      "scaleX": 0.7,
      "scaleY": 0.7,
      "reasoning": "Position and scale that keeps this element within white canvas boundaries"
    }
  ],
  "designRationale": "Why this arrangement keeps all elements within the white canvas and looks good"
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
        
        // STRICT canvas boundary enforcement with larger margins
        const margin = 30;
        const maxLeft = Math.max(margin, newSize.width - safeWidth - margin);
        const maxTop = Math.max(margin, newSize.height - safeHeight - margin);
        
        // Force positioning within safe boundaries
        let safeLeft = Math.max(margin, Math.min(placement.left, maxLeft));
        let safeTop = Math.max(margin, Math.min(placement.top, maxTop));
        
        // Double-check final position doesn't exceed canvas
        if (safeLeft + safeWidth > newSize.width - margin) {
          safeLeft = Math.max(margin, newSize.width - safeWidth - margin);
        }
        if (safeTop + safeHeight > newSize.height - margin) {
          safeTop = Math.max(margin, newSize.height - safeHeight - margin);
        }
        
        // Final safety check - if object is still too big, scale it down more
        if (safeLeft + safeWidth > newSize.width - margin || safeTop + safeHeight > newSize.height - margin) {
          const maxScaleX = Math.min(safeScaleX, (newSize.width - 2 * margin) / originalObj.width);
          const maxScaleY = Math.min(safeScaleY, (newSize.height - 2 * margin) / originalObj.height);
          const finalScale = Math.max(0.3, Math.min(maxScaleX, maxScaleY));
          
          safeScaleX = finalScale;
          safeScaleY = finalScale;
          
          // Recalculate with new scale
          const newWidth = originalObj.width * finalScale;
          const newHeight = originalObj.height * finalScale;
          safeLeft = Math.max(margin, Math.min(safeLeft, newSize.width - newWidth - margin));
          safeTop = Math.max(margin, Math.min(safeTop, newSize.height - newHeight - margin));
          
          console.log(`🔧 Force-scaled ${placement.id} to fit: scale=${finalScale.toFixed(2)}`);
        }
        
        // Final size after all corrections
        const finalWidth = originalObj.width * safeScaleX;
        const finalHeight = originalObj.height * safeScaleY;
        
        console.log(`🔧 Validating layer ${placement.id}:`, {
          original: { left: placement.left, top: placement.top, scaleX: placement.scaleX, scaleY: placement.scaleY },
          validated: { left: safeLeft, top: safeTop, scaleX: safeScaleX, scaleY: safeScaleY },
          finalSize: { width: finalWidth, height: finalHeight },
          canvasSize: { width: newSize.width, height: newSize.height },
          boundaries: { 
            rightEdge: safeLeft + finalWidth, 
            bottomEdge: safeTop + finalHeight,
            maxRight: newSize.width - margin,
            maxBottom: newSize.height - margin
          },
          withinBounds: safeLeft >= margin && safeTop >= margin && safeLeft + finalWidth <= newSize.width - margin && safeTop + finalHeight <= newSize.height - margin
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