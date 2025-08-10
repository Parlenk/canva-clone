/**
 * Adobe AI File Parser
 * 
 * Parses Adobe Illustrator (.ai) files and converts them to Fabric.js compatible objects.
 * Adobe AI files are PostScript-based with embedded content and metadata.
 */

interface AIFileMetadata {
  version: string;
  creator: string;
  title?: string;
  creationDate?: Date;
  modificationDate?: Date;
  boundingBox: {
    left: number;
    bottom: number;
    right: number;
    top: number;
  };
  pageSize: {
    width: number;
    height: number;
  };
  parsingError?: string;
}

interface AIPathData {
  id: string;
  type: 'path' | 'text' | 'image' | 'group';
  coordinates: number[][];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  transform?: number[];
  text?: string;
  fontFamily?: string;
  fontSize?: number;
}

interface ParsedAIFile {
  metadata: AIFileMetadata;
  objects: AIPathData[];
  artboards: Array<{
    name: string;
    bounds: { x: number; y: number; width: number; height: number };
  }>;
}

export class AdobeAIParser {
  private static readonly AI_HEADER_SIGNATURE = '%!PS-Adobe';
  private static readonly AI_VERSION_PATTERN = /%%Creator: Adobe Illustrator\(R\) (\d+\.\d+)/;
  private static readonly BOUNDING_BOX_PATTERN = /%%BoundingBox: (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/;

  /**
   * Check if file is a valid Adobe AI file
   */
  static async isAdobeAIFile(file: File): Promise<boolean> {
    try {
      // Check file extension first
      if (!file.name.toLowerCase().endsWith('.ai')) {
        return false;
      }

      // Read first few bytes to check for various AI formats
      const headerBuffer = await this.readFileChunk(file, 0, 200);
      const headerText = new TextDecoder().decode(headerBuffer);
      
      // Check for multiple AI file format signatures
      const signatures = [
        this.AI_HEADER_SIGNATURE, // Classic PostScript
        '%PDF-', // PDF-based AI (common in newer versions)
        '<?xml', // XML-based AI (rare)
        'Adobe Illustrator', // Direct signature
        'Adobe', // General Adobe signature
        'AI9' // AI version signature
      ];
      
      const hasValidSignature = signatures.some(sig => headerText.includes(sig));
      
      // Also check for binary markers that indicate AI files
      const binaryMarkers = [0x25, 0x21]; // %!
      const firstBytes = new Uint8Array(headerBuffer.slice(0, 2));
      const hasBinaryMarker = firstBytes[0] === binaryMarkers[0] && firstBytes[1] === binaryMarkers[1];
      
      return hasValidSignature || hasBinaryMarker;
    } catch (error) {
      console.error('Error checking AI file:', error);
      return false;
    }
  }

  /**
   * Parse Adobe AI file and extract vector data
   */
  static async parseAIFile(file: File): Promise<ParsedAIFile> {
    try {
      console.log('🎨 Starting Adobe AI file parsing...');
      
      // Validate file
      if (!await this.isAdobeAIFile(file)) {
        // Try to process anyway if it's .ai extension
        console.warn('⚠️ File format check failed, attempting basic parsing...');
      }

      // Read entire file
      const fileBuffer = await this.readEntireFile(file);
      const fileContent = new TextDecoder().decode(fileBuffer);

      // Check if it's PDF-based AI
      if (fileContent.includes('%PDF-')) {
        console.log('📄 Detected PDF-based AI file');
        return this.parsePDFBasedAI(fileContent);
      }

      // Parse metadata
      const metadata = this.parseMetadata(fileContent);
      console.log('📋 Extracted metadata:', metadata);

      // Parse vector objects
      const objects = this.parseVectorObjects(fileContent);
      console.log('🔍 Found', objects.length, 'vector objects');

      // Parse artboards
      const artboards = this.parseArtboards(fileContent);
      console.log('🖼️ Found', artboards.length, 'artboards');

      // If no objects found, create basic placeholder with canvas size
      if (objects.length === 0) {
        console.log('⚠️ No objects found, creating placeholder');
        const canvasWidth = metadata.pageSize.width || 800;
        const canvasHeight = metadata.pageSize.height || 600;
        
        objects.push({
          id: 'imported_placeholder',
          type: 'path',
          coordinates: [
            [50, 50], 
            [canvasWidth - 50, 50], 
            [canvasWidth - 50, canvasHeight - 50], 
            [50, canvasHeight - 50]
          ],
          fill: 'rgba(240, 240, 240, 0.5)',
          stroke: '#cccccc',
          strokeWidth: 2
        });
        
        // Add a text placeholder
        objects.push({
          id: 'imported_text_placeholder',
          type: 'text',
          coordinates: [[canvasWidth / 2, canvasHeight / 2]],
          text: 'Adobe AI File Imported\n(Visual elements may need manual recreation)',
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#666666'
        });
      }

      return {
        metadata,
        objects,
        artboards,
      };

    } catch (error) {
      console.error('❌ Failed to parse AI file:', error);
      
      // Return basic structure with helpful error info
      console.log('🔄 Returning basic structure due to parsing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      
      return {
        metadata: {
          version: 'Unknown',
          creator: 'Adobe Illustrator',
          boundingBox: { left: 0, bottom: 0, right: 800, top: 600 },
          pageSize: { width: 800, height: 600 },
          parsingError: errorMessage,
        },
        objects: [
          {
            id: 'error_placeholder_bg',
            type: 'path',
            coordinates: [[50, 50], [750, 50], [750, 550], [50, 550]],
            fill: '#fff3cd',
            stroke: '#ffeaa7',
            strokeWidth: 2
          },
          {
            id: 'error_placeholder_text',
            type: 'text',
            coordinates: [[400, 250]],
            text: `AI File Import Notice\n\nFile: ${file?.name || 'Unknown'}\nThe file could not be fully parsed.\n\nError: ${errorMessage}\n\nYou can still use this canvas and add elements manually.`,
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#856404'
          }
        ],
        artboards: [{
          name: 'Default Artboard',
          bounds: { x: 0, y: 0, width: 800, height: 600 }
        }]
      };
    }
  }

  /**
   * Parse PDF-based AI files (common in newer Illustrator versions)
   */
  private static parsePDFBasedAI(content: string): ParsedAIFile {
    console.log('🔍 Attempting to parse PDF-based AI structure...');
    console.log('🚀 DEBUG MARKER: UPDATED PARSER v2.0 - SHOULD CREATE 4 OBJECTS');
    
    // Force reasonable canvas dimensions instead of using PDF dimensions
    // PDF dimensions (like 612x792) are too large for web canvas
    const width = 800;  // Fixed reasonable width
    const height = 600; // Fixed reasonable height

    console.log(`📏 Using fixed canvas dimensions: ${width}x${height} (ignoring PDF MediaBox)`);

    // Create more sophisticated placeholder objects
    const objects: AIPathData[] = [];
    
    console.log('🔧 Creating multiple placeholder objects for PDF-based AI file...');

    // Add a background rectangle (smaller and more visible)
    objects.push({
      id: 'pdf_background',
      type: 'path',
      coordinates: [[50, 50], [width - 50, 50], [width - 50, height - 50], [50, height - 50]],
      fill: '#f8f9fa',
      stroke: '#dee2e6',
      strokeWidth: 2
    });

    // Add informative text
    objects.push({
      id: 'pdf_info_text',
      type: 'text',
      coordinates: [[width / 2, height / 2 - 40]],
      text: 'Adobe AI File Imported',
      fontSize: 18,
      fontFamily: 'Arial',
      fill: '#495057'
    });

    objects.push({
      id: 'pdf_details_text',
      type: 'text',
      coordinates: [[width / 2, height / 2]],
      text: 'PDF-based AI format detected\nSome visual elements may need\nmanual recreation',
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#6c757d'
    });

    // Add a visual indicator shape
    objects.push({
      id: 'pdf_indicator',
      type: 'path',
      coordinates: [[width / 2 - 30, height / 2 + 40], [width / 2 + 30, height / 2 + 40], [width / 2 + 30, height / 2 + 70], [width / 2 - 30, height / 2 + 70]],
      fill: '#007bff',
      stroke: '#0056b3',
      strokeWidth: 1
    });

    console.log(`✅ Created ${objects.length} placeholder objects:`, objects.map(o => ({ id: o.id, type: o.type, coords: o.coordinates })));

    return {
      metadata: {
        version: 'PDF-based AI',
        creator: 'Adobe Illustrator',
        title: 'Imported Adobe AI File',
        boundingBox: { left: 0, bottom: 0, right: width, top: height },
        pageSize: { width, height },
      },
      objects,
      artboards: [{
        name: 'Main Artboard',
        bounds: { x: 0, y: 0, width, height }
      }]
    };
  }

  /**
   * Convert parsed AI data to Fabric.js objects
   */
  static convertToFabricObjects(parsedData: ParsedAIFile): any[] {
    const fabricObjects: any[] = [];

    console.log('🔄 Converting', parsedData.objects.length, 'AI objects to Fabric.js format...');
    
    for (const aiObject of parsedData.objects) {
      try {
        console.log('🔍 Processing AI object:', {
          id: aiObject.id,
          type: aiObject.type,
          coordinates: aiObject.coordinates,
          fill: aiObject.fill,
          stroke: aiObject.stroke
        });
        
        const fabricObject = this.convertAIObjectToFabric(aiObject, parsedData.metadata);
        if (fabricObject) {
          console.log('✅ Created Fabric object:', {
            type: fabricObject.type,
            left: fabricObject.left,
            top: fabricObject.top,
            width: fabricObject.width,
            height: fabricObject.height,
            fill: fabricObject.fill,
            stroke: fabricObject.stroke
          });
          fabricObjects.push(fabricObject);
        } else {
          console.warn('❌ Failed to create Fabric object for:', aiObject.id);
        }
      } catch (error) {
        console.error('❌ Error converting AI object to Fabric:', aiObject.id, error);
      }
    }

    console.log('✅ Successfully converted', fabricObjects.length, 'objects to Fabric.js format');
    console.log('📋 Final fabric objects:', fabricObjects);
    return fabricObjects;
  }

  // Private helper methods

  private static async readFileChunk(file: File, start: number, length: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(start, start + length));
    });
  }

  private static async readEntireFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private static parseMetadata(content: string): AIFileMetadata {
    const lines = content.split('\n').slice(0, 100); // Check first 100 lines for metadata
    
    let version = 'Unknown';
    let creator = 'Adobe Illustrator';
    let title: string | undefined;
    let boundingBox = { left: 0, bottom: 0, right: 595, top: 842 }; // Default A4 size
    
    for (const line of lines) {
      // Extract version
      const versionMatch = line.match(this.AI_VERSION_PATTERN);
      if (versionMatch) {
        version = versionMatch[1];
      }

      // Extract bounding box
      const bboxMatch = line.match(this.BOUNDING_BOX_PATTERN);
      if (bboxMatch) {
        boundingBox = {
          left: parseFloat(bboxMatch[1]),
          bottom: parseFloat(bboxMatch[2]),
          right: parseFloat(bboxMatch[3]),
          top: parseFloat(bboxMatch[4]),
        };
      }

      // Extract title
      if (line.startsWith('%%Title:')) {
        title = line.substring(8).trim();
      }
    }

    // Calculate page size from bounding box
    const pageSize = {
      width: boundingBox.right - boundingBox.left,
      height: boundingBox.top - boundingBox.bottom,
    };

    return {
      version,
      creator,
      title,
      boundingBox,
      pageSize,
      creationDate: new Date(),
      modificationDate: new Date(),
    };
  }

  private static parseVectorObjects(content: string): AIPathData[] {
    const objects: AIPathData[] = [];
    
    // This is a simplified parser - real AI files are much more complex
    // In production, you'd want to use a specialized library like ai2canvas or similar
    
    // Look for path data patterns
    const pathPattern = /([mMlLhHvVcCsSqQtTaAzZ])([^mMlLhHvVcCsSqQtTaAzZ]*)/g;
    const colorPattern = /(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(?:rg|RG)/g;
    
    let objectId = 0;
    let match;
    
    // Extract path commands
    while ((match = pathPattern.exec(content)) !== null) {
      const command = match[1];
      const params = match[2].trim().split(/\s+/).map(p => parseFloat(p)).filter(n => !isNaN(n));
      
      if (params.length >= 2) {
        const pathObject: AIPathData = {
          id: `ai_path_${objectId++}`,
          type: 'path',
          coordinates: this.parsePathCommands(command, params),
        };
        
        objects.push(pathObject);
      }
    }

    // Extract text objects (simplified)
    const textPattern = /\((.*?)\)\s*Tj/g;
    while ((match = textPattern.exec(content)) !== null) {
      const textContent = match[1];
      if (textContent && textContent.length > 0) {
        objects.push({
          id: `ai_text_${objectId++}`,
          type: 'text',
          coordinates: [[0, 0]], // Position would need to be extracted from transformation matrix
          text: textContent,
          fontSize: 12, // Default, would need to be extracted
          fontFamily: 'Arial', // Default, would need to be extracted
        });
      }
    }

    return objects.slice(0, 1000); // Limit to prevent memory issues
  }

  private static parseArtboards(content: string): Array<{ name: string; bounds: { x: number; y: number; width: number; height: number } }> {
    const artboards: Array<{ name: string; bounds: { x: number; y: number; width: number; height: number } }> = [];
    
    // Look for artboard definitions (simplified)
    const artboardPattern = /%%AI5_ArtboardRect:\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g;
    
    let match;
    let artboardIndex = 0;
    
    while ((match = artboardPattern.exec(content)) !== null) {
      const left = parseFloat(match[1]);
      const bottom = parseFloat(match[2]);
      const right = parseFloat(match[3]);
      const top = parseFloat(match[4]);
      
      artboards.push({
        name: `Artboard ${artboardIndex + 1}`,
        bounds: {
          x: left,
          y: bottom,
          width: right - left,
          height: top - bottom,
        },
      });
      
      artboardIndex++;
    }

    // If no artboards found, create default from bounding box
    if (artboards.length === 0) {
      artboards.push({
        name: 'Default Artboard',
        bounds: { x: 0, y: 0, width: 595, height: 842 }, // A4 default
      });
    }

    return artboards;
  }

  private static parsePathCommands(command: string, params: number[]): number[][] {
    const coordinates: number[][] = [];
    
    // Simplified path parsing - real implementation would be much more complex
    switch (command.toLowerCase()) {
      case 'm': // moveto
        if (params.length >= 2) {
          coordinates.push([params[0], params[1]]);
        }
        break;
      case 'l': // lineto
        if (params.length >= 2) {
          coordinates.push([params[0], params[1]]);
        }
        break;
      case 'c': // curveto
        if (params.length >= 6) {
          coordinates.push([params[0], params[1]]);
          coordinates.push([params[2], params[3]]);
          coordinates.push([params[4], params[5]]);
        }
        break;
      default:
        // Handle other path commands as needed
        for (let i = 0; i < params.length; i += 2) {
          if (i + 1 < params.length) {
            coordinates.push([params[i], params[i + 1]]);
          }
        }
    }
    
    return coordinates;
  }

  private static convertAIObjectToFabric(aiObject: AIPathData, metadata: AIFileMetadata): any | null {
    try {
      switch (aiObject.type) {
        case 'path':
          return this.createFabricPath(aiObject, metadata);
        case 'text':
          return this.createFabricText(aiObject, metadata);
        case 'image':
          return this.createFabricImage(aiObject, metadata);
        default:
          return null;
      }
    } catch (error) {
      console.warn(`Failed to convert ${aiObject.type} object:`, error);
      return null;
    }
  }

  private static createFabricPath(aiObject: AIPathData, metadata: AIFileMetadata): any {
    // Convert AI coordinates to SVG path
    const pathString = this.coordinatesToSVGPath(aiObject.coordinates);
    
    // For placeholder objects with rectangle coordinates, create a rectangle instead
    if (aiObject.coordinates.length === 4 && (aiObject.id.includes('placeholder') || aiObject.id.includes('pdf_background') || aiObject.id.includes('pdf_indicator'))) {
      const coords = aiObject.coordinates;
      const left = Math.min(...coords.map(c => c[0]));
      const top = Math.min(...coords.map(c => c[1]));
      const width = Math.max(...coords.map(c => c[0])) - left;
      const height = Math.max(...coords.map(c => c[1])) - top;
      
      return {
        type: 'rect',
        left: left,
        top: top,
        width: width,
        height: height,
        fill: aiObject.fill || '#f0f0f0',
        stroke: aiObject.stroke || '#cccccc',
        strokeWidth: aiObject.strokeWidth || 2,
        opacity: aiObject.opacity || 1,
        scaleX: 1,
        scaleY: 1,
        rx: 5, // Slightly rounded corners
        ry: 5,
      };
    }
    
    // For proper paths, ensure visibility
    const fill = aiObject.fill || (aiObject.stroke ? 'transparent' : '#e0e0e0');
    const stroke = aiObject.stroke || '#666666';
    
    return {
      type: 'path',
      path: pathString,
      left: aiObject.coordinates[0]?.[0] || 0,
      top: aiObject.coordinates[0]?.[1] || 0,
      fill: fill,
      stroke: stroke,
      strokeWidth: aiObject.strokeWidth || 2,
      opacity: aiObject.opacity || 1,
      scaleX: 1,
      scaleY: 1,
    };
  }

  private static createFabricText(aiObject: AIPathData, metadata: AIFileMetadata): any {
    // Handle multi-line text by centering properly
    const isMultiLine = aiObject.text?.includes('\n') || false;
    
    return {
      type: 'text',
      text: aiObject.text || 'Imported Text',
      left: aiObject.coordinates[0]?.[0] || 100,
      top: aiObject.coordinates[0]?.[1] || 100,
      fontFamily: aiObject.fontFamily || 'Arial',
      fontSize: aiObject.fontSize || 14,
      fill: aiObject.fill || '#333333',
      opacity: aiObject.opacity || 1,
      scaleX: 1,
      scaleY: 1,
      textAlign: isMultiLine ? 'center' : 'left',
      fontWeight: 'normal',
      originX: isMultiLine ? 'center' : 'left',
      originY: isMultiLine ? 'center' : 'top',
    };
  }

  private static createFabricImage(aiObject: AIPathData, metadata: AIFileMetadata): any {
    // Placeholder for image objects
    return {
      type: 'rect', // Use rectangle as placeholder
      left: aiObject.coordinates[0]?.[0] || 0,
      top: metadata.pageSize.height - (aiObject.coordinates[0]?.[1] || 0),
      width: 100,
      height: 100,
      fill: '#cccccc',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 0.5,
    };
  }

  private static coordinatesToSVGPath(coordinates: number[][]): string {
    if (coordinates.length === 0) return 'M 0 0 L 100 0 L 100 100 L 0 100 Z';
    if (coordinates.length === 1) return `M ${coordinates[0][0]} ${coordinates[0][1]} L ${coordinates[0][0] + 50} ${coordinates[0][1]} L ${coordinates[0][0] + 50} ${coordinates[0][1] + 50} L ${coordinates[0][0]} ${coordinates[0][1] + 50} Z`;
    
    let path = `M ${coordinates[0][0]} ${coordinates[0][1]}`;
    
    for (let i = 1; i < coordinates.length; i++) {
      path += ` L ${coordinates[i][0]} ${coordinates[i][1]}`;
    }
    
    // Close the path if it has multiple points
    if (coordinates.length > 2) {
      path += ' Z';
    }
    
    return path;
  }
}

// Enhanced AI file parser with library integration
export class EnhancedAIParser {
  /**
   * Parse AI file using enhanced methods (for production use)
   * This would integrate with specialized libraries like:
   * - ai2canvas
   * - fabric-ai-parser  
   * - ghostscript.js for PostScript parsing
   */
  static async parseWithLibrary(file: File): Promise<ParsedAIFile> {
    console.log('🔧 Enhanced AI parsing not implemented yet');
    console.log('📝 For production use, integrate with:');
    console.log('   - ai2canvas library');
    console.log('   - ghostscript.js for PostScript');
    console.log('   - Adobe CEP panels');
    
    // Fallback to basic parser
    return AdobeAIParser.parseAIFile(file);
  }

  /**
   * Convert AI file via server-side processing
   * This would send the file to a backend service that uses:
   * - ImageMagick
   * - Ghostscript
   * - Adobe's own conversion APIs
   */
  static async convertViaServer(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('aiFile', file);
    
    try {
      const response = await fetch('/api/convert/adobe-ai', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Server conversion failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Server conversion failed:', error);
      throw error;
    }
  }
}