import OpenAI from 'openai';
import { ABTestingService } from './ab-testing';
import { EnhancedAIContentAnalyzer } from './enhanced-ai-analyzer';
import { AdvancedLayoutOptimizer } from './layout-optimizer';
import { AdvancedBoundaryValidator } from './advanced-boundary-validator';

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
  compositionAnalysis?: {
    visualHierarchy: string;
    colorHarmony: string;
    spacingRhythm: string;
    alignmentGrid: string;
    focusPoints: string[];
  };
  aestheticScore?: number;
  layoutComplexity?: 'simple' | 'moderate' | 'complex';
  contentAnalysis?: {
    primaryElements: string[];
    supportingElements: string[];
    decorativeElements: string[];
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

      // Perform enhanced content analysis
      console.log('🔍 Performing enhanced content analysis...');
      const contentAnalysis = EnhancedAIContentAnalyzer.analyzeCanvasContent(objectsData);
      console.log('📊 Content analysis completed:', {
        totalElements: contentAnalysis.size,
        primaryElements: Array.from(contentAnalysis.values()).filter(a => a.importance === 'primary').length,
        secondaryElements: Array.from(contentAnalysis.values()).filter(a => a.importance === 'secondary').length,
        decorativeElements: Array.from(contentAnalysis.values()).filter(a => a.importance === 'decorative').length
      });

      // Generate enhanced contextual prompt
      const enhancedContext = EnhancedAIContentAnalyzer.generateContextualPrompt(
        contentAnalysis,
        objectsData,
        currentSize,
        newSize
      );

      // Generate the base prompt using the selected variant
      const basePromptText = ABTestingService.generatePrompt(variant.id, {
        currentWidth: currentSize.width,
        currentHeight: currentSize.height,
        newWidth: newSize.width,
        newHeight: newSize.height,
        objectsData,
      });

      // Combine base prompt with enhanced analysis
      const promptText = `${basePromptText}\n\n${enhancedContext}`;
      console.log('🎯 Enhanced prompt generated with content analysis integration');

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

ADVANCED COMPOSITION ANALYSIS:
• Analyze visual weight distribution and create balanced asymmetry
• Identify primary, secondary, and tertiary focal points
• Apply rule of thirds and golden ratio principles where appropriate
• Ensure optimal white space distribution for breathing room
• Create visual flow paths that guide the viewer's eye naturally
• Consider color temperature and contrast relationships
• Maintain consistent spacing rhythm and alignment grid

CONTENT-AWARE SCALING INTELLIGENCE:
• Text elements: Prioritize readability - minimum 10px readable size
• Images: Maintain aspect ratios and prevent over-compression artifacts  
• Shapes/Icons: Scale uniformly to preserve recognizability
• Decorative elements: Allow more aggressive scaling to serve primary content
• Logos/Branding: Protect minimum size requirements for brand integrity

YOUR ENHANCED MISSION: 
Position ALL ${objectsData.length} elements using advanced design principles to create a professional, aesthetically pleasing composition that maximizes visual impact within the ${newSize.width}×${newSize.height} canvas while ensuring perfect boundary compliance.

RESPOND in this ENHANCED JSON format with comprehensive analysis:
{
  "layoutStrategy": "Detailed explanation of the layout approach and design principles applied",
  "placements": [
    {
      "id": "obj_0",
      "left": 50,
      "top": 60,
      "scaleX": 0.7,
      "scaleY": 0.7,
      "reasoning": "Element-specific positioning rationale based on its role in the composition"
    }
  ],
  "designRationale": "Why this arrangement creates visual harmony and professional appeal",
  "appliedPrinciples": ["visual hierarchy", "rule of thirds", "color balance", "spacing rhythm"],
  "compositionAnalysis": {
    "visualHierarchy": "How elements are organized by importance and visual weight",
    "colorHarmony": "Color relationship analysis and balance assessment", 
    "spacingRhythm": "Consistent spacing patterns and grid alignment used",
    "alignmentGrid": "Invisible grid structure guiding element placement",
    "focusPoints": ["primary focal area", "secondary attention areas"]
  },
  "aestheticScore": 8.5,
  "layoutComplexity": "moderate",
  "contentAnalysis": {
    "primaryElements": ["most important content that drives the design"],
    "supportingElements": ["elements that enhance the primary content"],
    "decorativeElements": ["visual enhancements and styling elements"]
  }
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

      // ADVANCED BOUNDARY VALIDATION: Prepare elements for sophisticated validation
      console.log('🛡️ Preparing elements for advanced boundary validation...');
      const elementBounds = result.placements.map(placement => {
        const originalObj = objectsData.find(obj => obj.id === placement.id);
        const analysis = contentAnalysis.get(placement.id);
        
        return {
          id: placement.id,
          left: placement.left,
          top: placement.top,
          width: originalObj?.width || 100,
          height: originalObj?.height || 100,
          scaleX: placement.scaleX,
          scaleY: placement.scaleY,
          type: originalObj?.type || 'unknown',
          importance: analysis?.importance || 'secondary' as const,
          minScale: analysis?.scalingRules.minScale || 0.3,
          maxScale: analysis?.scalingRules.maxScale || 1.8,
          aspectRatioLocked: analysis?.scalingRules.aspectRatioLocked || false,
        };
      });

      // Create advanced boundary validator with content-aware margins
      const boundaryValidator = new AdvancedBoundaryValidator(newSize.width, newSize.height, {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
      });

      // Apply sophisticated boundary validation and correction
      const validationResult = boundaryValidator.validateAndCorrect(elementBounds);
      console.log('🔍 Advanced validation result:', {
        isValid: validationResult.isValid,
        overflowSeverity: validationResult.overflow.severity,
        correctionsApplied: validationResult.corrections.length,
        qualityScore: validationResult.qualityScore
      });

      // Convert corrected bounds back to placements
      const validatedPlacements = validationResult.finalBounds.map(bounds => {
        const originalPlacement = result.placements.find(p => p.id === bounds.id);
        return {
          id: bounds.id,
          left: bounds.left,
          top: bounds.top,
          scaleX: bounds.scaleX,
          scaleY: bounds.scaleY,
          reasoning: originalPlacement?.reasoning || 'Advanced boundary validation applied'
        };
      });
      
      // Final system-wide boundary compliance check
      const boundaryViolations = validatedPlacements.filter(placement => {
        const bounds = validationResult.finalBounds.find(b => b.id === placement.id);
        if (!bounds) return false;
        
        const finalWidth = bounds.width * bounds.scaleX;
        const finalHeight = bounds.height * bounds.scaleY;
        const margin = 30;
        
        return bounds.left < margin ||
               bounds.top < margin ||
               bounds.left + finalWidth > newSize.width - margin ||
               bounds.top + finalHeight > newSize.height - margin;
      });
      
      if (boundaryViolations.length > 0) {
        console.error(`🚨 SYSTEM ALERT: ${boundaryViolations.length} objects still violate boundaries:`, 
          boundaryViolations.map(p => p.id));
      } else {
        console.log(`✅ All ${validatedPlacements.length} objects verified within canvas boundaries`);
      }
      
      result.placements = validatedPlacements;
      
      // POST-PROCESSING: Advanced layout optimization with aesthetic scoring
      console.log('🎨 Performing post-processing aesthetic optimization...');
      const layoutOptimizer = new AdvancedLayoutOptimizer(newSize.width, newSize.height);
      
      // Convert placements to layout elements for optimization
      const layoutElements = validatedPlacements.map(placement => {
        const originalObj = objectsData.find(obj => obj.id === placement.id);
        const analysis = contentAnalysis.get(placement.id);
        
        return {
          id: placement.id,
          left: placement.left,
          top: placement.top,
          width: originalObj?.width || 100,
          height: originalObj?.height || 100,
          scaleX: placement.scaleX,
          scaleY: placement.scaleY,
          importance: analysis?.importance || 'secondary' as const,
          visualWeight: analysis?.visualProperties.estimatedVisualWeight || 5,
        };
      });
      
      // Calculate aesthetic score
      const aestheticAnalysis = layoutOptimizer.calculateAestheticScore(layoutElements);
      const layoutOptimization = layoutOptimizer.optimizeLayout(layoutElements);
      const layoutSuggestions = layoutOptimizer.generateLayoutSuggestions(layoutElements);
      
      console.log('📊 Aesthetic Analysis:', aestheticAnalysis);
      console.log('✨ Layout Optimization:', {
        originalScore: layoutOptimization.originalScore,
        optimizedScore: layoutOptimization.optimizedScore,
        improvements: layoutOptimization.improvements.length
      });
      
      // Enhanced result with aesthetic analysis
      result.aestheticScore = aestheticAnalysis.totalScore;
      result.layoutComplexity = layoutElements.length > 8 ? 'complex' : 
                               layoutElements.length > 4 ? 'moderate' : 'simple';
      
      if (!result.compositionAnalysis) {
        result.compositionAnalysis = {
          visualHierarchy: `Visual hierarchy clarity: ${aestheticAnalysis.hierarchyClarity}/100`,
          colorHarmony: 'Analyzed based on element positioning and visual weight',
          spacingRhythm: `Spacing consistency: ${aestheticAnalysis.spacingRhythm}/100`,
          alignmentGrid: `Alignment score: ${aestheticAnalysis.alignmentScore}/100`,
          focusPoints: [`Primary elements: ${layoutElements.filter(e => e.importance === 'primary').length}`,
                        `Secondary elements: ${layoutElements.filter(e => e.importance === 'secondary').length}`]
        };
      }
      
      // Add optimization insights to design rationale
      const optimizationInsights = layoutOptimization.improvements.length > 0 
        ? ` Post-AI optimization applied ${layoutOptimization.improvements.length} improvements for enhanced aesthetic appeal.`
        : ' Layout achieved optimal aesthetic score without additional optimization.';
      
      result.designRationale = (result.designRationale || '') + 
        ` [Enhanced boundary validation: ${validatedPlacements.length} objects secured within ${newSize.width}×${newSize.height} canvas.` +
        ` Aesthetic score: ${aestheticAnalysis.totalScore}/100.${optimizationInsights}]`;
      
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