import OpenAI from 'openai';
import { ABTestingService } from './ab-testing';

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

  // Direct resize with A/B tested prompts
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
    }>,
    userId?: string
  ): Promise<ResizeAnalysis & { variantId: string }> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not initialized (client-side)');
      }

      // Get A/B test variant for this user
      const variant = ABTestingService.getVariantForUser(userId || 'anonymous');
      console.log(`🧪 Using A/B variant: ${variant.id} (${variant.name})`);

      // Generate the prompt using the selected variant
      const promptText = ABTestingService.generatePrompt(variant.id, {
        currentWidth: currentSize.width,
        currentHeight: currentSize.height,
        newWidth: newSize.width,
        newHeight: newSize.height,
        objectsData,
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective vision model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${promptText}

STRICT CANVAS BOUNDARIES:
• Canvas dimensions: ${newSize.width} × ${newSize.height} pixels
• Safe zone: 40px margin from ALL edges (top, bottom, left, right)
• Maximum usable area: ${newSize.width - 80} × ${newSize.height - 80} pixels

MANDATORY POSITIONING RULES:
• Element position (left, top) must be >= 40 pixels from canvas edges
• Element's right edge (left + final_width) must be <= ${newSize.width - 40}
• Element's bottom edge (top + final_height) must be <= ${newSize.height - 40}
• Final dimensions = original_width × scaleX, original_height × scaleY

FOR EXTREME DIMENSION CHANGES (like portrait ↔ landscape):
• Prioritize fitting ALL elements within safe boundaries
• Scale elements smaller if needed to prevent boundary violations
• Distribute elements intelligently across available space
• Never sacrifice boundary compliance for visual appeal

SCALE LIMITS:
• Minimum scale: 0.2 (ensure visibility)
• Maximum scale: 1.8 (prevent oversizing)
• Automatic scale reduction if element exceeds boundaries

YOUR MISSION: Position ALL ${objectsData.length} elements so they create a beautiful, professional design that fits COMPLETELY within the ${newSize.width}×${newSize.height} white canvas while maintaining visual hierarchy and modern design aesthetics.

RESPOND in this exact JSON format with positions for ALL elements:
{
  "layoutStrategy": "How I arranged all ${objectsData.length} elements to maintain visual hierarchy and modern design principles",
  "placements": [
    {
      "id": "obj_0",
      "left": 50,
      "top": 60,
      "scaleX": 0.7,
      "scaleY": 0.7,
      "reasoning": "Position and scale that maintains visual hierarchy while keeping element within canvas boundaries"
    }
  ],
  "designRationale": "Why this arrangement creates an elegant, professional layout optimized for the new size"
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
        let safeScaleX = Math.max(minScale, Math.min(maxScale, placement.scaleX));
        let safeScaleY = Math.max(minScale, Math.min(maxScale, placement.scaleY));
        
        // Calculate final size after safe scaling
        const safeWidth = originalObj.width * safeScaleX;
        const safeHeight = originalObj.height * safeScaleY;
        
        // ENHANCED boundary enforcement with larger safety margins for extreme resizes
        const margin = 40; // Increased margin for better safety
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
        
        // AGGRESSIVE boundary enforcement - multiple validation passes
        let validationPasses = 0;
        const maxValidationPasses = 3;
        
        while (validationPasses < maxValidationPasses) {
          const currentWidth = originalObj.width * safeScaleX;
          const currentHeight = originalObj.height * safeScaleY;
          
          // Check if object exceeds boundaries
          const exceedsRight = safeLeft + currentWidth > newSize.width - margin;
          const exceedsBottom = safeTop + currentHeight > newSize.height - margin;
          const exceedsLeft = safeLeft < margin;
          const exceedsTop = safeTop < margin;
          
          if (!exceedsRight && !exceedsBottom && !exceedsLeft && !exceedsTop) {
            break; // Object fits perfectly
          }
          
          // Calculate required scale reduction
          const maxAllowedWidth = newSize.width - 2 * margin;
          const maxAllowedHeight = newSize.height - 2 * margin;
          const requiredScaleX = Math.min(safeScaleX, maxAllowedWidth / originalObj.width);
          const requiredScaleY = Math.min(safeScaleY, maxAllowedHeight / originalObj.height);
          const emergencyScale = Math.max(0.2, Math.min(requiredScaleX, requiredScaleY));
          
          safeScaleX = emergencyScale;
          safeScaleY = emergencyScale;
          
          // Recalculate position with emergency scale
          const emergencyWidth = originalObj.width * emergencyScale;
          const emergencyHeight = originalObj.height * emergencyScale;
          
          // Center in available space if needed
          if (exceedsRight || exceedsLeft) {
            safeLeft = Math.max(margin, (newSize.width - emergencyWidth) / 2);
          }
          if (exceedsBottom || exceedsTop) {
            safeTop = Math.max(margin, (newSize.height - emergencyHeight) / 2);
          }
          
          // Final boundary clamp
          safeLeft = Math.max(margin, Math.min(safeLeft, newSize.width - emergencyWidth - margin));
          safeTop = Math.max(margin, Math.min(safeTop, newSize.height - emergencyHeight - margin));
          
          validationPasses++;
          console.log(`🚨 Emergency boundary fix pass ${validationPasses} for ${placement.id}: scale=${emergencyScale.toFixed(2)}, pos=(${safeLeft.toFixed(1)}, ${safeTop.toFixed(1)})`);
        }
        
        // Final size after all corrections
        const finalWidth = originalObj.width * safeScaleX;
        const finalHeight = originalObj.height * safeScaleY;
        
        // COMPREHENSIVE boundary validation logging
        const rightEdge = safeLeft + finalWidth;
        const bottomEdge = safeTop + finalHeight;
        const maxRight = newSize.width - margin;
        const maxBottom = newSize.height - margin;
        const withinBounds = safeLeft >= margin && safeTop >= margin && rightEdge <= maxRight && bottomEdge <= maxBottom;
        
        console.log(`🔧 Layer ${placement.id} boundary validation:`, {
          original: { left: placement.left, top: placement.top, scaleX: placement.scaleX, scaleY: placement.scaleY },
          validated: { left: safeLeft, top: safeTop, scaleX: safeScaleX, scaleY: safeScaleY },
          finalSize: { width: finalWidth, height: finalHeight },
          canvasSize: { width: newSize.width, height: newSize.height },
          boundaries: { rightEdge, bottomEdge, maxRight, maxBottom },
          withinBounds,
          violations: {
            left: safeLeft < margin,
            top: safeTop < margin,
            right: rightEdge > maxRight,
            bottom: bottomEdge > maxBottom
          }
        });
        
        // FAIL-SAFE: If still violating boundaries after all fixes, log critical error
        if (!withinBounds) {
          console.error(`🚨 CRITICAL: Layer ${placement.id} STILL exceeds boundaries after validation!`);
          console.error('This should NEVER happen - boundary validation failed');
        }
        
        return {
          ...placement,
          left: safeLeft,
          top: safeTop,
          scaleX: safeScaleX,
          scaleY: safeScaleY,
        };
      });
      
      // Final system-wide boundary compliance check
      const boundaryViolations = validatedPlacements.filter(placement => {
        const originalObj = objectsData.find(obj => obj.id === placement.id);
        if (!originalObj) return false;
        
        const finalWidth = originalObj.width * placement.scaleX;
        const finalHeight = originalObj.height * placement.scaleY;
        const margin = 40;
        
        return placement.left < margin ||
               placement.top < margin ||
               placement.left + finalWidth > newSize.width - margin ||
               placement.top + finalHeight > newSize.height - margin;
      });
      
      if (boundaryViolations.length > 0) {
        console.error(`🚨 SYSTEM ALERT: ${boundaryViolations.length} objects still violate boundaries:`, 
          boundaryViolations.map(p => p.id));
      } else {
        console.log(`✅ All ${validatedPlacements.length} objects verified within canvas boundaries`);
      }
      
      result.placements = validatedPlacements;
      result.designRationale = (result.designRationale || '') + ` [Enhanced boundary validation: ${validatedPlacements.length} objects secured within ${newSize.width}×${newSize.height} canvas]`;
      
      return {
        ...result,
        variantId: variant.id,
      };
    } catch (error) {
      console.error('Error resizing canvas:', error);
      throw error;
    }
  }


}

// Export singleton instance
export const openAIVisionService = new OpenAIVisionService();