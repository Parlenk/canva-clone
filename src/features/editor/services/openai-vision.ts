import OpenAI from 'openai';

interface CanvasAnalysis {
  contentType: string;
  elements: Array<{
    type: string;
    importance: number;
    position: string;
    description: string;
  }>;
  designStyle: string;
  recommendations: string[];
}

interface ObjectPlacement {
  id: string;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  reasoning: string;
}

interface ResizeAnalysis {
  placements: ObjectPlacement[];
  designRationale: string;
  appliedPrinciples: string[];
}

export class OpenAIVisionService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async analyzeCanvasLayout(canvasImageBase64: string): Promise<CanvasAnalysis> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo", // Vision-capable model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this canvas design and provide insights about its content, layout, and design style. 
                
                Please identify:
                1. What type of content this appears to be (business card, poster, social media, etc.)
                2. List all visual elements and their importance (1-10 scale)
                3. Describe the current design style
                4. Provide recommendations for maintaining design integrity during resize
                
                Respond in JSON format with the structure:
                {
                  "contentType": "description of content type",
                  "elements": [
                    {
                      "type": "text|image|shape|logo",
                      "importance": 8,
                      "position": "top-left|center|bottom-right|etc",
                      "description": "description of the element"
                    }
                  ],
                  "designStyle": "modern|classic|playful|professional|etc",
                  "recommendations": ["recommendation 1", "recommendation 2"]
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
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent analysis
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

      return JSON.parse(jsonMatch[0]) as CanvasAnalysis;
    } catch (error) {
      console.error('Error analyzing canvas:', error);
      throw error;
    }
  }

  async generateSmartResize(
    canvasAnalysis: CanvasAnalysis,
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
      const prompt = `You are a professional graphic designer tasked with intelligently resizing a canvas design.

CANVAS ANALYSIS:
- Content Type: ${canvasAnalysis.contentType}
- Design Style: ${canvasAnalysis.designStyle}
- Elements: ${JSON.stringify(canvasAnalysis.elements, null, 2)}
- AI Recommendations: ${canvasAnalysis.recommendations.join(', ')}

RESIZE REQUEST:
- Current Canvas: ${currentSize.width}x${currentSize.height}
- New Canvas: ${newSize.width}x${newSize.height}
- Scale Factor: ${(newSize.width / currentSize.width).toFixed(2)}x horizontally, ${(newSize.height / currentSize.height).toFixed(2)}x vertically

CURRENT OBJECTS:
${objectsData.map((obj, index) => `${index}. ${obj.type} at (${obj.left}, ${obj.top}) size: ${obj.width}x${obj.height} scale: ${obj.scaleX}x${obj.scaleY}${obj.text ? ` text: "${obj.text}"` : ''}`).join('\n')}

DESIGN PRINCIPLES TO APPLY:
1. Maintain visual hierarchy and importance levels
2. Preserve design style and aesthetic
3. Ensure readability and usability
4. Optimize space utilization
5. Keep related elements together
6. Maintain appropriate margins and spacing

Please provide intelligent placement for each object in the new canvas size. Consider:
- Element importance and visual weight
- Typography hierarchy and readability
- Brand/logo prominence
- Balanced composition
- Effective use of whitespace

Respond in JSON format:
{
  "placements": [
    {
      "id": "obj_0",
      "left": 50,
      "top": 30,
      "scaleX": 0.8,
      "scaleY": 0.8,
      "reasoning": "Positioned logo prominently in top-left maintaining brand visibility while scaling proportionally"
    }
  ],
  "designRationale": "Overall explanation of the design decisions made",
  "appliedPrinciples": ["principle 1", "principle 2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert graphic designer with deep knowledge of visual design principles, typography, and layout optimization. Provide thoughtful, professional design decisions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.4, // Balanced between creativity and consistency
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

      return JSON.parse(jsonMatch[0]) as ResizeAnalysis;
    } catch (error) {
      console.error('Error generating smart resize:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const openAIVisionService = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});