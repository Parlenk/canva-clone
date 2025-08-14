/**
 * Adobe AI File Parser
 * 
 * Parses Adobe Illustrator (.ai) files and converts them to Fabric.js compatible objects.
 * Adobe AI files are PostScript-based with embedded content and metadata.
 */

/**
 * Font mapping for Adobe AI files to web-safe fonts
 * Maps common Adobe/professional fonts to available web fonts
 */
const FONT_MAPPING: Record<string, string> = {
  // Adobe Font Families
  'MinionPro-Regular': 'Georgia',
  'MinionPro': 'Georgia',
  'Minion': 'Georgia',
  'MinionWeb': 'Georgia',
  'AdobeGaramondPro-Regular': 'Garamond',
  'AdobeGaramondPro': 'Garamond',
  'Adobe Garamond': 'Garamond',
  
  // Helvetica Family
  'Helvetica-Bold': 'Arial Black',
  'Helvetica-Regular': 'Arial',
  'HelveticaNeue-Regular': 'Arial',
  'HelveticaNeue': 'Arial',
  'Helvetica Neue': 'Arial',
  'Helvetica-Light': 'Arial',
  'Helvetica': 'Arial',
  
  // Times Family
  'TimesNewRomanPS-BoldMT': 'Times New Roman',
  'TimesNewRomanPSMT': 'Times New Roman',
  'Times-Roman': 'Times New Roman',
  'Times-Bold': 'Times New Roman',
  'Times': 'Times New Roman',
  
  // Arial variations
  'ArialMT': 'Arial',
  'Arial-BoldMT': 'Arial Black',
  'Arial-Regular': 'Arial',
  'Arial-Bold': 'Arial Black',
  
  // Other common fonts
  'Verdana-Regular': 'Verdana',
  'Verdana-Bold': 'Verdana',
  'Tahoma-Regular': 'Tahoma',
  'Tahoma-Bold': 'Tahoma',
  'TrebuchetMS': 'Trebuchet MS',
  'Georgia-Regular': 'Georgia',
  'Georgia-Bold': 'Georgia',
  
  // Monospace fonts
  'CourierNewPS-BoldMT': 'Courier New',
  'CourierNewPSMT': 'Courier New',
  'Courier-Bold': 'Courier New',
  'Courier': 'Courier New',
  'Monaco': 'Lucida Console',
  'Consolas': 'Lucida Console',
  
  // Script fonts
  'BrushScriptMT': 'Brush Script MT',
  'Brush Script': 'Brush Script MT',
  
  // Sans-serif fallbacks
  'Futura': 'Arial',
  'Avenir': 'Arial',
  'Proxima Nova': 'Arial',
  'Open Sans': 'Arial',
  'Lato': 'Arial',
  'Roboto': 'Arial',
  
  // Serif fallbacks
  'Caslon': 'Georgia',
  'Baskerville': 'Georgia',
  'Palatino Linotype': 'Palatino',
  'Book Antiqua': 'Palatino',
  
  // Display fonts
  'Impact-Regular': 'Impact',
  'Franklin Gothic': 'Arial Black',
  'Univers': 'Arial',
  
  // Generic fallbacks
  'sans-serif': 'Arial',
  'serif': 'Times New Roman',
  'monospace': 'Courier New',
  'cursive': 'Brush Script MT',
  'fantasy': 'Impact',
};

/**
 * Available fonts in the editor (matches types.ts)
 */
const AVAILABLE_FONTS = [
  'Arial',
  'Arial Black', 
  'Verdana',
  'Helvetica',
  'Tahoma',
  'Trebuchet MS',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Courier New',
  'Brush Script MT',
  'Palatino',
  'Bookman',
  'Comic Sans MS',
  'Impact',
  'Lucida Sans Unicode',
  'Geneva',
  'Lucida Console',
];

/**
 * Map a font name from AI file to a web-safe font available in the editor
 */
function mapFontToWebSafe(fontName: string): string {
  if (!fontName) return 'Arial';
  
  // Direct match
  if (AVAILABLE_FONTS.includes(fontName)) {
    return fontName;
  }
  
  // Check mapping table
  if (FONT_MAPPING[fontName]) {
    return FONT_MAPPING[fontName];
  }
  
  // Try partial matches (case insensitive)
  const normalizedFont = fontName.toLowerCase();
  
  // Helvetica variations
  if (normalizedFont.includes('helvetica')) {
    return normalizedFont.includes('bold') ? 'Arial Black' : 'Arial';
  }
  
  // Times variations
  if (normalizedFont.includes('times')) {
    return 'Times New Roman';
  }
  
  // Arial variations
  if (normalizedFont.includes('arial')) {
    return normalizedFont.includes('bold') || normalizedFont.includes('black') ? 'Arial Black' : 'Arial';
  }
  
  // Verdana variations
  if (normalizedFont.includes('verdana')) {
    return 'Verdana';
  }
  
  // Georgia variations
  if (normalizedFont.includes('georgia')) {
    return 'Georgia';
  }
  
  // Garamond variations
  if (normalizedFont.includes('garamond')) {
    return 'Garamond';
  }
  
  // Courier variations
  if (normalizedFont.includes('courier')) {
    return 'Courier New';
  }
  
  // Impact variations
  if (normalizedFont.includes('impact')) {
    return 'Impact';
  }
  
  // Script font variations
  if (normalizedFont.includes('script') || normalizedFont.includes('brush')) {
    return 'Brush Script MT';
  }
  
  // Generic categorization
  if (normalizedFont.includes('sans') || normalizedFont.includes('arial') || normalizedFont.includes('helvetica')) {
    return 'Arial';
  }
  
  if (normalizedFont.includes('serif') || normalizedFont.includes('times') || normalizedFont.includes('georgia')) {
    return 'Times New Roman';
  }
  
  if (normalizedFont.includes('mono') || normalizedFont.includes('courier') || normalizedFont.includes('console')) {
    return 'Courier New';
  }
  
  // Default fallback
  console.log(`⚠️ Unknown font "${fontName}" mapped to Arial`);
  return 'Arial';
}

/**
 * Extract font information from AI file content
 */
function extractFontsFromAI(content: string): Record<string, string> {
  const fontMap: Record<string, string> = {};
  
  try {
    // PostScript font definitions
    const fontPatterns = [
      // Font name definitions
      /\/(\w+)\s+findfont/g,
      /\/Font\s+\/(\w+)/g,
      /\/FontName\s+\/(\w+)/g,
      /\/BaseFont\s+\/([^\s\/\[\]<>()]+)/g,
      // Font face definitions  
      /\/F(\d+)\s+\/([^\s\/\[\]<>()]+)/g,
      // Font dictionary entries
      /(\d+)\s+\d+\s+obj[\s\S]*?\/Type\s*\/Font[\s\S]*?\/BaseFont\s*\/([^\s\/\[\]<>()]+)/g,
      // Font resource mappings
      /\/Font\s*<<[\s\S]*?\/F(\d+)\s+(\d+)\s+\d+\s+R/g,
    ];
    
    let fontIdCounter = 1;
    
    for (const pattern of fontPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const fontId = match[1];
        const fontName = match[2] || match[1];
        
        if (fontName && fontName.length > 1) {
          const webSafeFont = mapFontToWebSafe(fontName);
          fontMap[`F${fontIdCounter}`] = webSafeFont;
          fontMap[fontId] = webSafeFont;
          fontMap[fontName] = webSafeFont;
          
          console.log(`🔤 Font mapping: "${fontName}" -> "${webSafeFont}"`);
          fontIdCounter++;
        }
      }
    }
    
    // PDF-specific font extraction
    if (content.includes('%PDF-')) {
      const pdfFontPattern = /\/BaseFont\s*\/([^\s\/\[<>()]*)/g;
      let pdfMatch;
      
      while ((pdfMatch = pdfFontPattern.exec(content)) !== null) {
        const fontName = pdfMatch[1];
        if (fontName && fontName.length > 1) {
          const webSafeFont = mapFontToWebSafe(fontName);
          fontMap[fontName] = webSafeFont;
          console.log(`📄 PDF Font: "${fontName}" -> "${webSafeFont}"`);
        }
      }
    }
    
    // Add default mapping if no fonts found
    if (Object.keys(fontMap).length === 0) {
      fontMap['default'] = 'Arial';
      console.log('⚠️ No fonts found in AI file, using Arial as default');
    }
    
  } catch (error) {
    console.warn('⚠️ Error extracting fonts:', error);
    fontMap['default'] = 'Arial';
  }
  
  return fontMap;
}

/**
 * Get appropriate font for text object based on font ID or name
 */
function getFontForText(fontId: string, fontMap: Record<string, string>, fallback: string = 'Arial'): string {
  // Try exact match first
  if (fontMap[fontId]) {
    return fontMap[fontId];
  }
  
  // Try mapping the fontId directly
  const mapped = mapFontToWebSafe(fontId);
  if (mapped !== 'Arial' || fontId.toLowerCase().includes('arial')) {
    return mapped;
  }
  
  // Use default or fallback
  return fontMap['default'] || fallback;
}

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
  fontMap?: Record<string, string>;
}

export class AdobeAIParser {
  // Cache busting version 2025-08-13-ENHANCED-v5 
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
      console.log('🎨 Starting ENHANCED Adobe AI file parsing... [CACHE-BUST v5-ENHANCED]');
      
      // Validate file
      if (!await this.isAdobeAIFile(file)) {
        // Try to process anyway if it's .ai extension
        console.warn('⚠️ File format check failed, attempting basic parsing...');
      }

      // Read entire file
      const fileBuffer = await this.readEntireFile(file);
      const fileContent = new TextDecoder().decode(fileBuffer);

      // Extract font mappings first
      console.log('🔤 Extracting font information...');
      const fontMap = extractFontsFromAI(fileContent);
      console.log('📝 Font map created:', fontMap);

      // Check if it's PDF-based AI
      if (fileContent.includes('%PDF-')) {
        console.log('📄 Detected PDF-based AI file');
        return this.parsePDFBasedAI(fileContent, fontMap);
      }

      // Parse metadata
      const metadata = this.parseMetadata(fileContent);
      console.log('📋 Extracted metadata:', metadata);

      // Parse vector objects with font information
      const objects = this.parseVectorObjects(fileContent, fontMap);
      console.log('🔍 Found', objects.length, 'vector objects');

      // Parse artboards
      const artboards = this.parseArtboards(fileContent);
      console.log('🖼️ Found', artboards.length, 'artboards');

      // Enhanced object detection and creation
      if (objects.length === 0) {
        console.log('🔍 No objects found with primary parsing, attempting advanced extraction...');
        const advancedObjects = this.performAdvancedExtraction(fileContent, fontMap);
        objects.push(...advancedObjects);
        console.log(`📊 Advanced extraction found ${advancedObjects.length} additional objects`);
      }
      
      // If still no objects, create informative placeholders
      if (objects.length === 0) {
        console.log('⚠️ No vector content found, creating informative placeholders');
        const canvasWidth = metadata.pageSize.width || 800;
        const canvasHeight = metadata.pageSize.height || 600;
        
        objects.push(...this.createInformativePlaceholders(canvasWidth, canvasHeight, file, fileContent));
        console.log('✅ Created informative placeholders for AI file');
      }

      return {
        metadata,
        objects,
        artboards,
        fontMap
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
        }],
        fontMap: {}
      };
    }
  }

  /**
   * Parse PDF-based AI files (common in newer Illustrator versions)
   */
  private static parsePDFBasedAI(content: string, fontMap?: Record<string, string>): ParsedAIFile {
    console.log('🔍 Starting real PDF-based AI parsing...');
    
    try {
      // Enhanced debugging for modern AI files
      console.log('🔍 ENHANCED DEBUG: AI file analysis...');
      console.log('📄 File size:', content.length, 'characters');
      console.log('🎯 PDF version:', content.match(/%PDF-(\d+\.\d+)/)?.[1] || 'Unknown');
      
      // Count different PDF elements
      const streamCount = (content.match(/stream\s*[\s\S]*?endstream/g) || []).length;
      const objCount = (content.match(/\d+\s+\d+\s+obj/g) || []).length;
      const pageCount = (content.match(/\/Type\s*\/Page(?:\s|\/)/g) || []).length;
      const fontCount = (content.match(/\/Type\s*\/Font(?:\s|\/)/g) || []).length;
      const textCount = (content.match(/\([^)]*\)\s*T[jJ]/g) || []).length;
      const pathCount = (content.match(/[mlhvcsqtaz]\s/gi) || []).length;
      
      console.log('🔢 PDF Structure Analysis:', {
        streams: streamCount,
        objects: objCount,
        pages: pageCount,
        fonts: fontCount,
        textElements: textCount,
        pathCommands: pathCount
      });

      // Look for Illustrator-specific markers
      const hasAIPrivateData = content.includes('AI_PRIVATE_DATA');
      const hasAdobeDict = content.includes('/Adobe_CFFD_1');
      const hasIllustratorData = content.includes('Adobe_Illustrator');
      
      console.log('🎨 Illustrator-specific content:', {
        privateData: hasAIPrivateData,
        adobeDict: hasAdobeDict,
        illustratorData: hasIllustratorData
      });

      // Extract PDF metadata
      const metadata = this.extractPDFMetadata(content);
      console.log('📋 PDF Metadata extracted:', metadata);

      // Parse PDF streams containing vector data
      const objects = this.parsePDFStreams(content, fontMap);
      console.log(`🎨 Found ${objects.length} objects in PDF streams`);

      // Try to extract AI private data if present (contains the real vector data)
      if (hasAIPrivateData) {
        console.log('🔍 Found AI_PRIVATE_DATA - attempting enhanced parsing...');
        const aiPrivateStart = content.indexOf('AI_PRIVATE_DATA');
        const aiPrivateEnd = content.indexOf('EndAIPrivateData', aiPrivateStart);
        
        if (aiPrivateStart > 0 && aiPrivateEnd > aiPrivateStart) {
          const aiPrivateData = content.substring(aiPrivateStart, aiPrivateEnd);
          console.log(`📊 AI Private data block size: ${aiPrivateData.length} characters`);
          
          // Look for Illustrator drawing commands in private data
          const illustratorCommands = this.parseIllustratorPrivateData(aiPrivateData, fontMap);
          if (illustratorCommands.length > 0) {
            console.log(`🎨 Extracted ${illustratorCommands.length} objects from AI private data!`);
            objects.push(...illustratorCommands);
          }
        }
      }

      // Extract artboards from PDF pages
      const artboards = this.extractPDFArtboards(content);
      console.log(`🖼️ Found ${artboards.length} artboards`);

      // If no objects found, create informative placeholder
      if (objects.length === 0) {
        console.log('⚠️ No parseable objects found, creating informative placeholder');
        objects.push(...this.createBasicInformativePlaceholders(metadata.pageSize.width, metadata.pageSize.height, fontMap));
      } else {
        console.log(`✅ Successfully parsed ${objects.length} objects from PDF-based AI file`);
      }

      return {
        metadata,
        objects,
        artboards,
        fontMap
      };

    } catch (error) {
      console.error('❌ PDF parsing failed:', error);
      
      // Create fallback with error information
      const fallbackWidth = 800;
      const fallbackHeight = 600;
      
      return {
        metadata: {
          version: 'PDF-based AI (Parse Error)',
          creator: 'Adobe Illustrator',
          title: 'Import Error - Partial Recovery',
          boundingBox: { left: 0, bottom: 0, right: fallbackWidth, top: fallbackHeight },
          pageSize: { width: fallbackWidth, height: fallbackHeight },
          parsingError: error instanceof Error ? error.message : 'Unknown PDF parsing error'
        },
        objects: this.createErrorPlaceholders(fallbackWidth, fallbackHeight, error),
        artboards: [{
          name: 'Recovery Artboard',
          bounds: { x: 0, y: 0, width: fallbackWidth, height: fallbackHeight }
        }],
        fontMap: fontMap || {}
      };
    }
  }

  /**
   * Advanced extraction when primary parsing fails
   */
  private static performAdvancedExtraction(content: string, fontMap?: Record<string, string>): AIPathData[] {
    const objects: AIPathData[] = [];
    let objectId = 0;
    
    console.log('🔧 Performing advanced content extraction...');
    
    try {
      // Strategy 1: Look for coordinate patterns that suggest shapes
      const coordinatePattern = /(-?\d{2,4}(?:\.\d+)?)\s+(-?\d{2,4}(?:\.\d+)?)\s+(\w)/g;
      const coordinateMatches = Array.from(content.matchAll(coordinatePattern));
      
      if (coordinateMatches.length > 4) {
        console.log(`📍 Found ${coordinateMatches.length} coordinate patterns`);
        
        // Group coordinates into potential shapes
        const shapes = this.groupCoordinatesIntoShapes(coordinateMatches);
        objects.push(...shapes.map(shape => ({
          id: `advanced_shape_${objectId++}`,
          type: 'path' as const,
          coordinates: shape.coordinates,
          fill: shape.fill,
          stroke: shape.stroke,
          strokeWidth: 2
        })));
      }
      
      // Strategy 2: Look for numeric patterns that could be dimensions
      const dimensionPattern = /(?:width|height|w|h)\s*:?\s*(\d+(?:\.\d+)?)/gi;
      const dimensionMatches = Array.from(content.matchAll(dimensionPattern));
      
      if (dimensionMatches.length > 0) {
        console.log(`📏 Found ${dimensionMatches.length} dimension hints`);
        // Create geometric shapes based on found dimensions
        dimensionMatches.slice(0, 5).forEach((match, i) => {
          const size = Math.min(parseFloat(match[1]), 300);
          if (size > 10) {
            objects.push({
              id: `dimension_rect_${objectId++}`,
              type: 'path',
              coordinates: [
                [100 + i * 120, 100],
                [100 + i * 120 + size/2, 100], 
                [100 + i * 120 + size/2, 100 + size/2],
                [100 + i * 120, 100 + size/2]
              ],
              fill: this.getDistinctColor(i),
              stroke: this.getDarkerColor(this.getDistinctColor(i)),
              strokeWidth: 2
            });
          }
        });
      }
      
      // Strategy 3: Text content extraction with better positioning
      const advancedTextPattern = /\b([A-Z][a-zA-Z\s]{2,50})\b/g;
      const textMatches = Array.from(content.matchAll(advancedTextPattern));
      
      if (textMatches.length > 0) {
        console.log(`📝 Found ${textMatches.length} potential text elements`);
        textMatches.slice(0, 8).forEach((match, i) => {
          const text = match[1].trim();
          if (text.length > 2 && text.length < 100) {
            objects.push({
              id: `advanced_text_${objectId++}`,
              type: 'text',
              coordinates: [[150 + (i % 4) * 200, 300 + Math.floor(i / 4) * 50]],
              text: text,
              fontSize: 16,
              fontFamily: getFontForText('default', fontMap || {}, 'Arial'),
              fill: '#2E7D32'
            });
          }
        });
      }
      
      console.log(`✅ Advanced extraction completed: ${objects.length} objects created`);
      
    } catch (error) {
      console.warn('⚠️ Advanced extraction error:', error);
    }
    
    return objects;
  }
  
  /**
   * Group coordinate matches into potential shapes
   */
  private static groupCoordinatesIntoShapes(matches: RegExpMatchArray[]): Array<{coordinates: number[][], fill: string, stroke: string}> {
    const shapes = [];
    
    try {
      // Simple heuristic: group every 4 coordinates as a potential rectangle
      for (let i = 0; i < matches.length - 3; i += 4) {
        const coords = [];
        let validShape = true;
        
        for (let j = 0; j < 4; j++) {
          const x = parseFloat(matches[i + j][1]);
          const y = parseFloat(matches[i + j][2]);
          
          if (isNaN(x) || isNaN(y) || Math.abs(x) > 5000 || Math.abs(y) > 5000) {
            validShape = false;
            break;
          }
          
          coords.push([x, y]);
        }
        
        if (validShape && coords.length === 4) {
          shapes.push({
            coordinates: coords,
            fill: this.getDistinctColor(shapes.length),
            stroke: this.getDarkerColor(this.getDistinctColor(shapes.length))
          });
        }
        
        if (shapes.length >= 10) break; // Limit shapes to prevent overcrowding
      }
      
    } catch (error) {
      console.warn('Shape grouping error:', error);
    }
    
    return shapes;
  }
  
  /**
   * Create informative placeholders that show parsing attempts
   */
  private static createInformativePlaceholders(width: number, height: number, file: File, content: string): AIPathData[] {
    const hasPostScript = content.includes('%!PS-Adobe');
    const hasPDFContent = content.includes('%PDF-');
    const hasVectorContent = /(?:moveto|lineto|curveto|m\s|l\s|c\s)/i.test(content);
    const hasTextContent = /\([^)]{3,}\)\s*(?:Tj|show)/i.test(content);
    const approximateElements = (content.match(/\d+\s+\d+\s+[mlc]/g) || []).length;
    
    return [
      {
        id: 'info_background',
        type: 'path',
        coordinates: [[50, 50], [width - 50, 50], [width - 50, height - 50], [50, height - 50]],
        fill: '#F8F9FA',
        stroke: '#DEE2E6',
        strokeWidth: 2
      },
      {
        id: 'info_title',
        type: 'text',
        coordinates: [[width / 2, 100]],
        text: `Adobe AI File Analysis: ${file.name}`,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#495057'
      },
      {
        id: 'info_details',
        type: 'text', 
        coordinates: [[width / 2, 180]],
        text: `File Format Analysis:\n• ${hasPostScript ? '✓' : '✗'} PostScript format detected\n• ${hasPDFContent ? '✓' : '✗'} PDF-based content found\n• ${hasVectorContent ? '✓' : '✗'} Vector drawing commands present\n• ${hasTextContent ? '✓' : '✗'} Text elements detected\n• ~${approximateElements} potential drawing operations\n\nFile size: ${(file.size / 1024).toFixed(1)} KB | Dimensions: ${width}x${height}`,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#6C757D'
      },
      {
        id: 'success_indicator',
        type: 'path',
        coordinates: [[width - 150, 120], [width - 50, 120], [width - 50, 180], [width - 150, 180]],
        fill: hasVectorContent ? '#D4EDDA' : '#FFF3CD',
        stroke: hasVectorContent ? '#28A745' : '#FFC107',
        strokeWidth: 2
      },
      {
        id: 'success_text',
        type: 'text',
        coordinates: [[width - 100, 150]],
        text: hasVectorContent ? 'Content\nDetected' : 'Limited\nContent',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: hasVectorContent ? '#155724' : '#856404'
      },
      {
        id: 'action_text',
        type: 'text',
        coordinates: [[width / 2, height - 100]],
        text: 'This canvas is now ready for your creative work!\nUse the tools on the left to start designing.',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#28A745'
      }
    ];
  }
  
  /**
   * Convert parsed AI data to Fabric.js objects
   */
  static convertToFabricObjects(parsedData: ParsedAIFile): any[] {
    console.log('🚀 ENHANCED convertToFabricObjects v5 called with:', parsedData);
    console.log('📏 AI File Metadata:', {
      dimensions: `${parsedData.metadata.pageSize.width}x${parsedData.metadata.pageSize.height}`,
      boundingBox: parsedData.metadata.boundingBox,
      version: parsedData.metadata.version,
      creator: parsedData.metadata.creator
    });
    const fabricObjects: any[] = [];

    console.log('🔄 Converting', parsedData.objects.length, 'AI objects to Fabric.js format...');
    
    for (let i = 0; i < parsedData.objects.length; i++) {
      const aiObject = parsedData.objects[i];
      try {
        console.log(`🔍 Processing AI object ${i + 1}/${parsedData.objects.length}:`, {
          id: aiObject.id,
          type: aiObject.type,
          coordinates: aiObject.coordinates,
          fill: aiObject.fill,
          stroke: aiObject.stroke
        });
        
        const fabricObject = this.convertAIObjectToFabric(aiObject, parsedData.metadata, parsedData.fontMap || {});
        console.log(`🎯 convertAIObjectToFabric returned for ${aiObject.id}:`, fabricObject);
        
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
          console.log(`📊 Current fabricObjects count: ${fabricObjects.length}`);
        } else {
          console.warn('❌ Failed to create Fabric object for:', aiObject.id);
        }
      } catch (error) {
        console.error('❌ Error converting AI object to Fabric:', aiObject.id, error);
      }
    }

    console.log('✅ FINAL RESULT: Successfully converted', fabricObjects.length, 'objects to Fabric.js format');
    console.log('📋 FINAL fabric objects array:', fabricObjects);
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

  private static parseVectorObjects(content: string, fontMap?: Record<string, string>): AIPathData[] {
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

  private static convertAIObjectToFabric(aiObject: AIPathData, metadata: AIFileMetadata, fontMap?: Record<string, string>): any | null {
    try {
      switch (aiObject.type) {
        case 'path':
          return this.createFabricPath(aiObject, metadata);
        case 'text':
          return this.createFabricText(aiObject, metadata, fontMap);
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
    // Transform all coordinates to canvas space first with enhanced handling
    const transformedCoords = aiObject.coordinates.map(coord => this.enhancedTransformCoordinates(coord, metadata));
    
    // For placeholder objects or rectangles, create proper rectangles
    if (aiObject.coordinates.length === 4 || aiObject.id.includes('placeholder') || aiObject.id.includes('rect')) {
      const allX = transformedCoords.map(c => c[0]);
      const allY = transformedCoords.map(c => c[1]);
      const left = Math.min(...allX);
      const top = Math.min(...allY);
      const width = Math.max(...allX) - left;
      const height = Math.max(...allY) - top;
      
      // Ensure minimum visible size
      const minSize = 80;
      const finalWidth = Math.max(width, minSize);
      const finalHeight = Math.max(height, minSize);
      
      // Use actual fill color from AI data or provide a visible default
      const fill = this.normalizeColor(aiObject.fill) || '#2196F3'; // Blue default
      const stroke = this.normalizeColor(aiObject.stroke) || '#1976D2'; // Darker blue stroke
      
      return {
        type: 'rect',
        left: left,
        top: top,
        width: finalWidth,
        height: finalHeight,
        fill: fill,
        stroke: stroke,
        strokeWidth: Math.max(aiObject.strokeWidth || 2, 1),
        opacity: Math.max(aiObject.opacity || 1, 0.8),
        rx: 0,
        ry: 0,
      };
    }
    
    // For paths with more than 4 coordinates, create proper SVG paths
    if (transformedCoords.length > 0) {
      const pathString = this.coordinatesToSVGPath(transformedCoords);
      
      // Get the bounding box of the path
      const allX = transformedCoords.map(c => c[0]);
      const allY = transformedCoords.map(c => c[1]);
      const pathBounds = {
        left: Math.min(...allX),
        top: Math.min(...allY),
        width: Math.max(...allX) - Math.min(...allX),
        height: Math.max(...allY) - Math.min(...allY)
      };
      
      // Only create path if it has reasonable dimensions
      if (pathBounds.width > 5 && pathBounds.height > 5) {
        const fill = this.normalizeColor(aiObject.fill) || '#4CAF50'; // Green default
        const stroke = this.normalizeColor(aiObject.stroke) || '#388E3C'; // Darker green stroke
        
        return {
          type: 'path',
          path: pathString,
          left: pathBounds.left,
          top: pathBounds.top,
          fill: fill,
          stroke: stroke,
          strokeWidth: Math.max(aiObject.strokeWidth || 2, 1),
          opacity: Math.max(aiObject.opacity || 1, 0.8),
        };
      }
    }
    
    // Fallback to a simple visible rectangle
    return {
      type: 'rect',
      left: 100,
      top: 100,
      width: 100,
      height: 60,
      fill: '#FF9800', // Orange for fallback
      stroke: '#F57C00',
      strokeWidth: 2,
      opacity: 0.8,
      rx: 5,
      ry: 5,
    };
  }

  private static createFabricText(aiObject: AIPathData, metadata: AIFileMetadata, fontMap?: Record<string, string>): any {
    // Handle multi-line text by centering properly
    const isMultiLine = aiObject.text?.includes('\n') || false;
    
    // Transform coordinates to canvas space with enhanced error handling
    const transformedCoords = this.enhancedTransformCoordinates(aiObject.coordinates[0] || [100, 100], metadata);
    
    console.log('🔍 DETAILED TEXT DEBUG:');
    console.log(`  Original AI coords: [${aiObject.coordinates[0]?.[0]}, ${aiObject.coordinates[0]?.[1]}]`);
    console.log(`  Transformed coords: [${transformedCoords[0]}, ${transformedCoords[1]}]`);
    console.log(`  Text content: "${aiObject.text || 'Imported Text'}"`);
    console.log(`  Font size: ${Math.max(aiObject.fontSize || 24, 24)} (min 24px for visibility)`);
    console.log(`  VISIBILITY CHECK: position=${transformedCoords[0] >= 0 && transformedCoords[1] >= 0 && transformedCoords[0] <= 1200 && transformedCoords[1] <= 800}`);
    
    return {
      type: 'text',
      text: aiObject.text || 'Imported Text',
      left: transformedCoords[0],
      top: transformedCoords[1],
      fontFamily: getFontForText(aiObject.fontFamily || 'default', fontMap || {}, 'Arial'),
      fontSize: Math.max(aiObject.fontSize || 24, 24), // LARGER minimum size for visibility
      fill: this.normalizeColor(aiObject.fill) || '#1976D2', // Blue for text visibility
      opacity: Math.max(aiObject.opacity || 1, 0.9), // High opacity for text visibility
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

  /**
   * Transform AI coordinates to canvas coordinate system
   * AI files often use different coordinate origins and scales
   */
  private static transformCoordinates(coord: number[], metadata: AIFileMetadata): number[] {
    if (!coord || coord.length < 2) return [100, 100]; // Safe fallback
    
    let [x, y] = coord;
    
    // Get AI file dimensions
    const aiWidth = metadata.pageSize.width || 800;
    const aiHeight = metadata.pageSize.height || 600;
    
    // Canvas dimensions (reasonable defaults for web canvas)
    const canvasWidth = 1000;  
    const canvasHeight = 700;  
    
    // AI files typically use bottom-left origin (PDF style), web canvas uses top-left
    // So we need to flip the Y coordinate
    const transformedY = aiHeight - y;
    
    // Scale coordinates to fit canvas better if needed
    let scaleX = 1;
    let scaleY = 1;
    
    // If AI dimensions are very large, scale down proportionally
    const maxDimension = Math.max(aiWidth, aiHeight);
    const maxCanvas = Math.max(canvasWidth, canvasHeight);
    
    if (maxDimension > maxCanvas) {
      const scale = (maxCanvas * 0.8) / maxDimension; // 80% to leave margin
      scaleX = scale;
      scaleY = scale;
    }
    
    // Apply scaling and center if needed
    let finalX = x * scaleX;
    let finalY = transformedY * scaleY;
    
    // Add centering offset if content is smaller than canvas
    if (aiWidth * scaleX < canvasWidth) {
      finalX += (canvasWidth - aiWidth * scaleX) / 2;
    }
    if (aiHeight * scaleY < canvasHeight) {
      finalY += (canvasHeight - aiHeight * scaleY) / 2;
    }
    
    // Ensure coordinates are positive and reasonable
    finalX = Math.max(0, finalX);
    finalY = Math.max(0, finalY);
    
    return [Math.round(finalX), Math.round(finalY)];
  }

  private static coordinatesToSVGPath(coordinates: number[][]): string {
    if (coordinates.length === 0) return 'M 0 0 L 100 0 L 100 100 L 0 100 Z';
    if (coordinates.length === 1) {
      const [x, y] = coordinates[0];
      return `M ${x} ${y} L ${x + 50} ${y} L ${x + 50} ${y + 50} L ${x} ${y + 50} Z`;
    }
    
    const [startX, startY] = coordinates[0];
    let path = `M ${startX} ${startY}`;
    
    for (let i = 1; i < coordinates.length; i++) {
      const [x, y] = coordinates[i];
      path += ` L ${x} ${y}`;
    }
    
    // Close the path if it has multiple points and forms a shape
    if (coordinates.length > 2) {
      const [firstX, firstY] = coordinates[0];
      const [lastX, lastY] = coordinates[coordinates.length - 1];
      
      // Only close if the path doesn't already end at the starting point
      if (Math.abs(firstX - lastX) > 1 || Math.abs(firstY - lastY) > 1) {
        path += ' Z';
      }
    }
    
    return path;
  }

  /**
   * Normalize color values from AI files to web-compatible formats
   */
  private static normalizeColor(color: string | undefined): string | null {
    if (!color) return null;
    
    // If already a valid CSS color, return as-is
    if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('rgba')) {
      return color;
    }
    
    // Handle PDF RGB values (0-1 range) like "0.5 0.2 0.8 rg"
    const rgbMatch = color.match(/(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)/);
    if (rgbMatch) {
      const r = Math.round(parseFloat(rgbMatch[1]) * 255);
      const g = Math.round(parseFloat(rgbMatch[2]) * 255);
      const b = Math.round(parseFloat(rgbMatch[3]) * 255);
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Handle grayscale values
    const grayMatch = color.match(/(\d*\.?\d+)\s+g/);
    if (grayMatch) {
      const gray = Math.round(parseFloat(grayMatch[1]) * 255);
      return `rgb(${gray}, ${gray}, ${gray})`;
    }
    
    // Handle named colors
    const namedColors: Record<string, string> = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'green': '#00ff00',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
    };
    
    const lowerColor = color.toLowerCase();
    if (namedColors[lowerColor]) {
      return namedColors[lowerColor];
    }
    
    return null;
  }

  /**
   * Extract metadata from PDF-based AI file
   */
  private static extractPDFMetadata(content: string): AIFileMetadata {
    console.log('📊 Extracting PDF metadata...');

    let version = 'Unknown';
    let creator = 'Adobe Illustrator';
    let title: string | undefined;
    let boundingBox = { left: 0, bottom: 0, right: 612, top: 792 }; // Default US Letter
    
    try {
      // Extract PDF version
      const pdfVersionMatch = content.match(/%PDF-(\d+\.\d+)/);
      if (pdfVersionMatch) {
        version = `PDF-${pdfVersionMatch[1]}`;
      }

      // Extract Creator information
      const creatorMatch = content.match(/\/Creator\s*\(([^)]+)\)/);
      if (creatorMatch) {
        creator = creatorMatch[1];
      }

      // Extract Title
      const titleMatch = content.match(/\/Title\s*\(([^)]+)\)/);
      if (titleMatch) {
        title = titleMatch[1];
      }

      // Extract MediaBox (page dimensions)
      const mediaBoxMatch = content.match(/\/MediaBox\s*\[\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\]/);
      if (mediaBoxMatch) {
        boundingBox = {
          left: parseFloat(mediaBoxMatch[1]),
          bottom: parseFloat(mediaBoxMatch[2]),
          right: parseFloat(mediaBoxMatch[3]),
          top: parseFloat(mediaBoxMatch[4])
        };
      }

      // Force reasonable canvas size (PDF points are too large for web)
      const maxWidth = 1200;
      const maxHeight = 900;
      
      let pageWidth = boundingBox.right - boundingBox.left;
      let pageHeight = boundingBox.top - boundingBox.bottom;
      
      if (pageWidth > maxWidth || pageHeight > maxHeight) {
        const scale = Math.min(maxWidth / pageWidth, maxHeight / pageHeight);
        pageWidth *= scale;
        pageHeight *= scale;
        console.log(`📏 Scaled canvas from ${boundingBox.right - boundingBox.left}x${boundingBox.top - boundingBox.bottom} to ${pageWidth}x${pageHeight}`);
      }

      return {
        version,
        creator,
        title,
        boundingBox,
        pageSize: {
          width: Math.round(pageWidth),
          height: Math.round(pageHeight)
        },
        creationDate: new Date(),
        modificationDate: new Date()
      };

    } catch (error) {
      console.warn('⚠️ Failed to extract some PDF metadata:', error);
      return {
        version: 'PDF-based AI',
        creator: 'Adobe Illustrator',
        boundingBox,
        pageSize: { width: 800, height: 600 },
        creationDate: new Date(),
        modificationDate: new Date()
      };
    }
  }

  /**
   * Parse Illustrator private data (contains the real vector content)
   */
  private static parseIllustratorPrivateData(aiData: string, fontMap?: Record<string, string>): AIPathData[] {
    const objects: AIPathData[] = [];
    let objectId = 0;

    try {
      console.log('🎨 Parsing Illustrator private data for vector content...');
      
      // Look for PostScript-style commands in AI private data
      const pathCommands = [
        /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+m/g,  // moveto
        /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+l/g,  // lineto
        /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+c/g,  // curveto
      ];

      // Look for text objects in AI format
      const textPattern = /\[(.*?)\]\s*TJ/g;  // Illustrator text operator
      const fontPattern = /\/(\w+)\s+(\d+(?:\.\d+)?)\s+Tf/g;  // Font selection
      
      // Look for rectangles and basic shapes
      const rectPattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+re/g;
      
      // Parse rectangles
      let rectMatch;
      while ((rectMatch = rectPattern.exec(aiData)) !== null) {
        const x = parseFloat(rectMatch[1]);
        const y = parseFloat(rectMatch[2]);
        const width = parseFloat(rectMatch[3]);
        const height = parseFloat(rectMatch[4]);
        
        console.log(`📐 AI Private: Found rectangle ${x}, ${y}, ${width}x${height}`);
        
        objects.push({
          id: `ai_private_rect_${objectId++}`,
          type: 'path',
          coordinates: [
            [x, y], 
            [x + width, y], 
            [x + width, y + height], 
            [x, y + height]
          ],
          fill: '#4CAF50',  // Green to distinguish from PDF objects
          stroke: '#2E7D32',
          strokeWidth: 1
        });
      }

      // Parse text objects
      let textMatch;
      let currentFontSize = 12;
      let currentFont = 'Arial';
      
      // Extract font information
      let fontMatch;
      while ((fontMatch = fontPattern.exec(aiData)) !== null) {
        const fontName = fontMatch[1];
        currentFontSize = parseFloat(fontMatch[2]);
        currentFont = getFontForText(fontName, fontMap || {}, 'Arial');
        console.log(`🔤 AI Private: Font ${fontName} -> ${currentFont}, size ${currentFontSize}`);
      }

      while ((textMatch = textPattern.exec(aiData)) !== null) {
        const textContent = textMatch[1];
        
        if (textContent && textContent.trim()) {
          console.log(`📝 AI Private: Found text "${textContent}"`);
          
          objects.push({
            id: `ai_private_text_${objectId++}`,
            type: 'text',
            coordinates: [[100, 100 + (objectId * 30)]],  // Stack texts vertically
            text: textContent.replace(/\\([\\()])/g, '$1'),  // Decode escaped characters
            fontSize: currentFontSize,
            fontFamily: currentFont,
            fill: '#1976D2'  // Blue to distinguish from PDF text
          });
        }
      }

      // Look for path data
      let currentPath: number[][] = [];
      
      for (const commandPattern of pathCommands) {
        let pathMatch;
        while ((pathMatch = commandPattern.exec(aiData)) !== null) {
          if (pathMatch.length >= 3) {
            const x = parseFloat(pathMatch[1]);
            const y = parseFloat(pathMatch[2]);
            currentPath.push([x, y]);
            console.log(`🎨 AI Private: Path point ${x}, ${y}`);
          }
        }
      }

      if (currentPath.length > 1) {
        objects.push({
          id: `ai_private_path_${objectId++}`,
          type: 'path',
          coordinates: currentPath,
          fill: 'none',
          stroke: '#FF9800',  // Orange to distinguish from PDF paths
          strokeWidth: 2
        });
      }

      console.log(`✅ AI Private data parsing completed: ${objects.length} objects found`);
      
    } catch (error) {
      console.warn('⚠️ Error parsing AI private data:', error);
    }

    return objects;
  }

  /**
   * Check if stream content is binary or compressed
   */
  private static isBinaryOrCompressedStream(streamContent: string): boolean {
    // Check for binary markers
    if (streamContent.includes('\0') || streamContent.includes('\xFF')) {
      return true;
    }
    
    // Check for compression filters
    const hasFlateFilter = streamContent.includes('FlateDecode') || streamContent.includes('/FlateDecode');
    const hasDCTFilter = streamContent.includes('DCTDecode') || streamContent.includes('/DCTDecode');
    const hasLZWFilter = streamContent.includes('LZWDecode') || streamContent.includes('/LZWDecode');
    
    // Check if content looks like compressed data (high ratio of non-printable chars)
    const nonPrintableCount = streamContent.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code < 32 && code !== 9 && code !== 10 && code !== 13; // Not tab, newline, or carriage return
    }).length;
    
    const nonPrintableRatio = nonPrintableCount / streamContent.length;
    
    return hasFlateFilter || hasDCTFilter || hasLZWFilter || nonPrintableRatio > 0.3;
  }

  /**
   * Parse PDF streams to extract vector objects
   */
  private static parsePDFStreams(content: string, fontMap?: Record<string, string>): AIPathData[] {
    console.log('🔄 Parsing PDF streams for vector data...');
    const objects: AIPathData[] = [];
    let objectId = 0;

    try {
      // Find all stream objects with enhanced filtering
      const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
      let streamMatch;
      let streamIndex = 0;
      
      while ((streamMatch = streamPattern.exec(content)) !== null) {
        const streamContent = streamMatch[1];
        streamIndex++;
        
        console.log(`🎯 Processing stream ${streamIndex}, length: ${streamContent.length}`);
        
        // Skip binary or compressed streams (common in AI files)
        if (this.isBinaryOrCompressedStream(streamContent)) {
          console.log(`⏭️ Skipping binary/compressed stream ${streamIndex}`);
          continue;
        }
        
        const initialObjectCount = objects.length;
        
        // Parse drawing commands first (most important for vector content)
        const drawingObjects = this.parseStreamDrawingCommands(streamContent, objectId, fontMap);
        if (drawingObjects.length > 0) {
          console.log(`✅ Found ${drawingObjects.length} drawing objects in stream ${streamIndex}`);
          objects.push(...drawingObjects);
          objectId += drawingObjects.length;
        }
        
        // Parse text objects
        const textObjects = this.parseStreamTextCommands(streamContent, objectId, fontMap);
        if (textObjects.length > 0) {
          console.log(`📝 Found ${textObjects.length} text objects in stream ${streamIndex}`);
          objects.push(...textObjects);
          objectId += textObjects.length;
        }
        
        // Only parse images if no other content found
        if (objects.length === initialObjectCount) {
          const imageObjects = this.parseStreamImages(streamContent, objectId, fontMap);
          if (imageObjects.length > 0) {
            console.log(`🖼️ Found ${imageObjects.length} image objects in stream ${streamIndex}`);
            objects.push(...imageObjects);
            objectId += imageObjects.length;
          }
        }
        
        // REDUCED: Only parse complex effects if no real content found in this stream
        if (objects.length === initialObjectCount) {
          const effectObjects = this.parseComplexEffects(streamContent, objectId, fontMap);
          // Limit effect placeholders to max 2 per stream to avoid clutter
          const limitedEffects = effectObjects.slice(0, 2);
          if (limitedEffects.length > 0) {
            console.log(`🎨 Found ${limitedEffects.length} effects in stream ${streamIndex}`);
            objects.push(...limitedEffects);
            objectId += limitedEffects.length;
          }
        }
      }

      // Parse XObject references (often contain Illustrator vector data)
      const xObjectPattern = /\/XObject\s*<<\s*([\s\S]*?)\s*>>/g;
      let xObjectMatch;
      
      while ((xObjectMatch = xObjectPattern.exec(content)) !== null) {
        objects.push(...this.parseXObjects(xObjectMatch[1], objectId));
        objectId += objects.length;
      }

      console.log(`✅ Parsed ${objects.length} objects from PDF streams`);
      return objects;

    } catch (error) {
      console.warn('⚠️ Error parsing PDF streams:', error);
      return objects; // Return what we have so far
    }
  }

  /**
   * Parse drawing commands from PDF stream
   */
  private static parseStreamDrawingCommands(streamContent: string, startId: number, fontMap?: Record<string, string>): AIPathData[] {
    const objects: AIPathData[] = [];
    let objectId = startId;

    try {
      console.log(`🎨 Enhanced drawing command parsing (${streamContent.length} chars)`);
      
      // State tracking for graphics state
      let currentPath: number[][] = [];
      let currentFill: string = '#333333';
      let currentStroke: string = '#000000';
      let currentStrokeWidth: number = 1;
      let pathStarted = false;
      
      // Enhanced rectangle pattern with proper grouping
      const rectanglePattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+re/g;
      
      // Enhanced path command patterns
      const moveToPattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+m/g;
      const lineToPattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+l/g;
      const curveToPattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+c/g;
      const closePathPattern = /h/g;
      
      // Extract and parse rectangles first (most reliable)
      let rectMatch;
      while ((rectMatch = rectanglePattern.exec(streamContent)) !== null) {
        const x = parseFloat(rectMatch[1]);
        const y = parseFloat(rectMatch[2]);
        const width = parseFloat(rectMatch[3]);
        const height = parseFloat(rectMatch[4]);
        
        // Only create rectangles with reasonable dimensions
        if (width > 5 && height > 5) {
          console.log(`📐 Creating rectangle: ${x}, ${y}, ${width}x${height}`);
          
          objects.push({
            id: `pdf_rect_${objectId++}`,
            type: 'path',
            coordinates: [
              [x, y], 
              [x + width, y], 
              [x + width, y + height], 
              [x, y + height]
            ],
            fill: currentFill,
            stroke: currentStroke,
            strokeWidth: currentStrokeWidth
          });
        }
      }
      
      // Parse moveto commands (start of paths)
      let moveMatch;
      while ((moveMatch = moveToPattern.exec(streamContent)) !== null) {
        const x = parseFloat(moveMatch[1]);
        const y = parseFloat(moveMatch[2]);
        
        // If we have a current path, save it
        if (currentPath.length > 1) {
          objects.push({
            id: `pdf_path_${objectId++}`,
            type: 'path',
            coordinates: [...currentPath],
            fill: currentFill,
            stroke: currentStroke,
            strokeWidth: currentStrokeWidth
          });
        }
        
        // Start new path
        currentPath = [[x, y]];
        pathStarted = true;
        console.log(`🎯 Path started at: ${x}, ${y}`);
      }
      
      // Parse lineto commands
      let lineMatch;
      while ((lineMatch = lineToPattern.exec(streamContent)) !== null) {
        const x = parseFloat(lineMatch[1]);
        const y = parseFloat(lineMatch[2]);
        
        if (pathStarted) {
          currentPath.push([x, y]);
          console.log(`📏 Line to: ${x}, ${y}`);
        }
      }
      
      // Parse curveto commands (simplified to endpoints)
      let curveMatch;
      while ((curveMatch = curveToPattern.exec(streamContent)) !== null) {
        const x1 = parseFloat(curveMatch[1]);
        const y1 = parseFloat(curveMatch[2]);
        const x2 = parseFloat(curveMatch[3]);
        const y2 = parseFloat(curveMatch[4]);
        const x3 = parseFloat(curveMatch[5]);
        const y3 = parseFloat(curveMatch[6]);
        
        if (pathStarted) {
          // Add control points and endpoint
          currentPath.push([x1, y1], [x2, y2], [x3, y3]);
          console.log(`🎨 Curve to: ${x3}, ${y3}`);
        }
      }
      
      // Handle path closure
      const hasCloseCommand = closePathPattern.test(streamContent);
      if (hasCloseCommand && currentPath.length > 2) {
        // Close the path by adding the starting point
        currentPath.push([...currentPath[0]]);
      }
      
      // Save final path if it exists
      if (currentPath.length > 1) {
        objects.push({
          id: `pdf_path_${objectId++}`,
          type: 'path',
          coordinates: currentPath,
          fill: currentFill,
          stroke: currentStroke,
          strokeWidth: currentStrokeWidth
        });
        console.log(`✅ Final path saved with ${currentPath.length} points`);
      }

      // Parse and apply color commands to improve object appearance
      this.parseAndApplyColors(streamContent, objects);
      
      console.log(`✅ Parsed ${objects.length} drawing objects from stream`);

    } catch (error) {
      console.warn('⚠️ Error parsing drawing commands:', error);
    }

    return objects;
  }

  /**
   * Parse color commands and apply them to objects
   */
  private static parseAndApplyColors(streamContent: string, objects: AIPathData[]): void {
    try {
      // Enhanced color parsing patterns
      const fillColorPattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+rg/g;
      const strokeColorPattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+RG/g;
      const strokeWidthPattern = /(-?\d+(?:\.\d+)?)\s+w/g;
      const grayFillPattern = /(-?\d+(?:\.\d+)?)\s+g/g;
      const grayStrokePattern = /(-?\d+(?:\.\d+)?)\s+G/g;
      
      // Track the latest colors found
      let latestFillColor: string | null = null;
      let latestStrokeColor: string | null = null;
      let latestStrokeWidth: number | null = null;
      
      // Extract RGB fill colors
      let colorMatch;
      while ((colorMatch = fillColorPattern.exec(streamContent)) !== null) {
        const r = Math.round(parseFloat(colorMatch[1]) * 255);
        const g = Math.round(parseFloat(colorMatch[2]) * 255);
        const b = Math.round(parseFloat(colorMatch[3]) * 255);
        latestFillColor = `rgb(${r}, ${g}, ${b})`;
        console.log(`🎨 Found fill color: ${latestFillColor}`);
      }

      // Extract RGB stroke colors
      while ((colorMatch = strokeColorPattern.exec(streamContent)) !== null) {
        const r = Math.round(parseFloat(colorMatch[1]) * 255);
        const g = Math.round(parseFloat(colorMatch[2]) * 255);
        const b = Math.round(parseFloat(colorMatch[3]) * 255);
        latestStrokeColor = `rgb(${r}, ${g}, ${b})`;
        console.log(`🖊️ Found stroke color: ${latestStrokeColor}`);
      }

      // Extract grayscale fill colors
      while ((colorMatch = grayFillPattern.exec(streamContent)) !== null) {
        const gray = Math.round(parseFloat(colorMatch[1]) * 255);
        latestFillColor = `rgb(${gray}, ${gray}, ${gray})`;
        console.log(`🔘 Found gray fill: ${latestFillColor}`);
      }

      // Extract grayscale stroke colors
      while ((colorMatch = grayStrokePattern.exec(streamContent)) !== null) {
        const gray = Math.round(parseFloat(colorMatch[1]) * 255);
        latestStrokeColor = `rgb(${gray}, ${gray}, ${gray})`;
        console.log(`⚫ Found gray stroke: ${latestStrokeColor}`);
      }

      // Extract stroke width
      let widthMatch;
      while ((widthMatch = strokeWidthPattern.exec(streamContent)) !== null) {
        latestStrokeWidth = parseFloat(widthMatch[1]);
        console.log(`📏 Found stroke width: ${latestStrokeWidth}`);
      }
      
      // Apply colors to objects that don't have them set
      if (objects.length > 0) {
        objects.forEach((obj, index) => {
          if (!obj.fill && latestFillColor) {
            obj.fill = latestFillColor;
          }
          if (!obj.stroke && latestStrokeColor) {
            obj.stroke = latestStrokeColor;
          }
          if (!obj.strokeWidth && latestStrokeWidth) {
            obj.strokeWidth = latestStrokeWidth;
          }
          
          // Ensure minimum visibility with fallback colors
          if (!obj.fill) {
            obj.fill = this.getDistinctColor(index);
          }
          if (!obj.stroke) {
            obj.stroke = this.getDarkerColor(obj.fill || '#333333');
          }
        });
      }
      
    } catch (error) {
      console.warn('⚠️ Error parsing colors:', error);
    }
  }
  
  /**
   * Get a distinct color for objects to ensure visibility
   */
  private static getDistinctColor(index: number): string {
    const colors = [
      '#2196F3', // Blue
      '#4CAF50', // Green  
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#F44336', // Red
      '#00BCD4', // Cyan
      '#8BC34A', // Light Green
      '#E91E63', // Pink
      '#FFC107', // Amber
      '#607D8B', // Blue Grey
    ];
    return colors[index % colors.length];
  }
  
  /**
   * Get a darker version of a color for stroke
   */
  private static getDarkerColor(color: string): string {
    // Simple darkening by converting to darker shade
    const colorMap: Record<string, string> = {
      '#2196F3': '#1976D2',
      '#4CAF50': '#388E3C', 
      '#FF9800': '#F57C00',
      '#9C27B0': '#7B1FA2',
      '#F44336': '#D32F2F',
      '#00BCD4': '#0097A7',
      '#8BC34A': '#689F38',
      '#E91E63': '#C2185B',
      '#FFC107': '#FFA000',
      '#607D8B': '#455A64',
    };
    return colorMap[color] || '#333333';
  }

  /**
   * Parse text commands from PDF stream
   */
  private static parseStreamTextCommands(streamContent: string, startId: number, fontMap?: Record<string, string>): AIPathData[] {
    const objects: AIPathData[] = [];
    let objectId = startId;

    try {
      // Parse text showing commands
      const textPattern = /\((.*?)\)\s*Tj/g;
      const textPositionPattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Td/g;
      const fontSizePattern = /\/(F\d+)\s+(-?\d+(?:\.\d+)?)\s+Tf/g;
      
      let currentX = 0;
      let currentY = 0;
      let currentFontSize = 12;
      let currentFontId = 'default';
      
      // Extract font size and ID
      let fontMatch;
      while ((fontMatch = fontSizePattern.exec(streamContent)) !== null) {
        currentFontId = fontMatch[1]; // e.g., 'F1', 'F2' 
        currentFontSize = parseFloat(fontMatch[2]);
        console.log(`🔤 Font reference: ${currentFontId} size ${currentFontSize}`);
      }

      // Extract text positions
      let positionMatch;
      while ((positionMatch = textPositionPattern.exec(streamContent)) !== null) {
        currentX = parseFloat(positionMatch[1]);
        currentY = parseFloat(positionMatch[2]);
      }

      // Extract text content
      let textMatch;
      while ((textMatch = textPattern.exec(streamContent)) !== null) {
        const textContent = textMatch[1];
        
        if (textContent && textContent.length > 0 && textContent !== ' ') {
          objects.push({
            id: `pdf_text_${objectId++}`,
            type: 'text',
            coordinates: [[currentX, currentY]],
            text: this.decodePDFText(textContent),
            fontSize: currentFontSize,
            fontFamily: getFontForText(currentFontId, fontMap || {}, 'Arial'),
            fill: '#000000' // Default text color
          });
          
          // Advance position for next text (rough estimation)
          currentX += textContent.length * currentFontSize * 0.6;
        }
      }

    } catch (error) {
      console.warn('⚠️ Error parsing text commands:', error);
    }

    return objects;
  }

  /**
   * Parse image references from PDF stream
   */
  private static parseStreamImages(streamContent: string, startId: number, fontMap?: Record<string, string>): AIPathData[] {
    const objects: AIPathData[] = [];
    let objectId = startId;

    try {
      // Look for image operators (Do command with XObject reference)
      const imagePattern = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+cm\s+\/(\w+)\s+Do/g;
      
      let imageMatch;
      while ((imageMatch = imagePattern.exec(streamContent)) !== null) {
        const scaleX = parseFloat(imageMatch[1]);
        const skewY = parseFloat(imageMatch[2]);
        const skewX = parseFloat(imageMatch[3]);
        const scaleY = parseFloat(imageMatch[4]);
        const imageName = imageMatch[5];
        
        // Create placeholder for embedded image
        objects.push({
          id: `pdf_image_${objectId++}`,
          type: 'image',
          coordinates: [[0, 0]], // Position would be in transformation matrix
          text: `[Embedded Image: ${imageName}]`,
          // Store transform info for potential use
          transform: [scaleX, skewY, skewX, scaleY, 0, 0]
        });
      }

    } catch (error) {
      console.warn('⚠️ Error parsing image references:', error);
    }

    return objects;
  }

  /**
   * Parse complex effects like gradients, shadows, and filters
   */
  private static parseComplexEffects(streamContent: string, startId: number, fontMap?: Record<string, string>): AIPathData[] {
    const objects: AIPathData[] = [];
    let objectId = startId;

    try {
      // Parse gradient patterns
      const gradientPatterns = [
        /\/Pattern\s+cs\s+\/(\w+)\s+scn/g, // Pattern color space
        /\/DeviceN\s*\[[\s\S]*?\]\s*\/(\w+)/g, // DeviceN color space (gradients)
        /\/Separation\s*\/(\w+)/g, // Separation color space
        /sh\s*$/gm, // Shading operator
      ];

      for (const pattern of gradientPatterns) {
        let match;
        while ((match = pattern.exec(streamContent)) !== null) {
          // Create gradient placeholder
          objects.push({
            id: `gradient_placeholder_${objectId++}`,
            type: 'path',
            coordinates: [[20, 20], [180, 20], [180, 80], [20, 80]], // Small rectangle
            fill: `linear-gradient(45deg, #ff6b6b, #4ecdc4)`, // Placeholder gradient
            stroke: '#888888',
            strokeWidth: 1,
            opacity: 0.8
          });

          // Add explanatory text
          objects.push({
            id: `gradient_text_${objectId++}`,
            type: 'text',
            coordinates: [[100, 50]],
            text: '[Gradient Effect]',
            fontSize: 10,
            fontFamily: 'Arial',
            fill: '#333333'
          });
        }
      }

      // Parse shadow/blur effects
      const shadowPatterns = [
        /BDC[\s\S]*?EMC/g, // Marked content (often effects)
        /\/GS\d+\s+gs/g, // Graphics state (can contain effects)
        /\/ExtGState\s+<<[\s\S]*?>>/g, // Extended graphics state
      ];

      for (const pattern of shadowPatterns) {
        let match;
        while ((match = pattern.exec(streamContent)) !== null) {
          objects.push({
            id: `effect_placeholder_${objectId++}`,
            type: 'path',
            coordinates: [[200, 20], [360, 20], [360, 80], [200, 80]],
            fill: 'rgba(0, 0, 0, 0.1)', // Subtle shadow effect
            stroke: '#cccccc',
            strokeWidth: 1,
            opacity: 0.7
          });

          objects.push({
            id: `effect_text_${objectId++}`,
            type: 'text',
            coordinates: [[280, 50]],
            text: '[Visual Effect]',
            fontSize: 10,
            fontFamily: 'Arial',
            fill: '#666666'
          });
        }
      }

      // Parse transparency/opacity groups
      const transparencyPattern = /\/Type\s*\/Group[\s\S]*?\/S\s*\/Transparency/g;
      let transparencyMatch;
      while ((transparencyMatch = transparencyPattern.exec(streamContent)) !== null) {
        objects.push({
          id: `transparency_placeholder_${objectId++}`,
          type: 'path',
          coordinates: [[380, 20], [540, 20], [540, 80], [380, 80]],
          fill: 'rgba(255, 255, 255, 0.3)',
          stroke: '#999999',
          strokeWidth: 1,
          opacity: 0.5
        });

        objects.push({
          id: `transparency_text_${objectId++}`,
          type: 'text',
          coordinates: [[460, 50]],
          text: '[Transparency]',
          fontSize: 10,
          fontFamily: 'Arial',
          fill: '#555555'
        });
      }

      // Parse clipping paths
      const clippingPattern = /W\s+n\s*$/gm; // Clipping path operator
      let clippingMatch;
      while ((clippingMatch = clippingPattern.exec(streamContent)) !== null) {
        objects.push({
          id: `clipping_placeholder_${objectId++}`,
          type: 'path',
          coordinates: [[560, 20], [720, 20], [720, 80], [560, 80]],
          fill: 'none',
          stroke: '#ff9500',
          strokeWidth: 2,
          opacity: 0.8
        });

        objects.push({
          id: `clipping_text_${objectId++}`,
          type: 'text',
          coordinates: [[640, 50]],
          text: '[Clipping Mask]',
          fontSize: 10,
          fontFamily: 'Arial',
          fill: '#ff9500'
        });
      }

      // Parse blend modes
      const blendModePattern = /\/BM\s*\/(\w+)/g;
      let blendMatch;
      while ((blendMatch = blendModePattern.exec(streamContent)) !== null) {
        const blendMode = blendMatch[1];
        
        objects.push({
          id: `blend_placeholder_${objectId++}`,
          type: 'path',
          coordinates: [[20, 100], [180, 100], [180, 160], [20, 160]],
          fill: '#ff6b9d',
          stroke: '#c44569',
          strokeWidth: 1,
          opacity: 0.6
        });

        objects.push({
          id: `blend_text_${objectId++}`,
          type: 'text',
          coordinates: [[100, 130]],
          text: `[Blend: ${blendMode}]`,
          fontSize: 10,
          fontFamily: 'Arial',
          fill: '#333333'
        });
      }

      console.log(`🎨 Found ${objects.length} complex effects/gradients`);

    } catch (error) {
      console.warn('⚠️ Error parsing complex effects:', error);
    }

    return objects;
  }

  /**
   * Parse XObject definitions (often contain vector graphics)
   */
  private static parseXObjects(xObjectContent: string, startId: number): AIPathData[] {
    const objects: AIPathData[] = [];
    let objectId = startId;

    try {
      // XObjects in AI files often contain the actual vector data
      // This is a simplified parser - real implementation would be more complex
      
      const vectorDataPattern = /\/Subtype\s*\/Form[\s\S]*?stream([\s\S]*?)endstream/g;
      let vectorMatch;
      
      while ((vectorMatch = vectorDataPattern.exec(xObjectContent)) !== null) {
        const vectorStream = vectorMatch[1];
        
        // Parse the vector stream similar to regular streams
        objects.push(...this.parseStreamDrawingCommands(vectorStream, objectId));
        objectId += objects.length;
      }

    } catch (error) {
      console.warn('⚠️ Error parsing XObjects:', error);
    }

    return objects;
  }

  /**
   * Extract artboards from PDF pages
   */
  private static extractPDFArtboards(content: string): Array<{ name: string; bounds: { x: number; y: number; width: number; height: number } }> {
    const artboards: Array<{ name: string; bounds: { x: number; y: number; width: number; height: number } }> = [];
    
    try {
      // Look for page objects and their MediaBox
      const pagePattern = /\/Type\s*\/Page[\s\S]*?\/MediaBox\s*\[\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\]/g;
      
      let pageMatch;
      let pageIndex = 0;
      
      while ((pageMatch = pagePattern.exec(content)) !== null) {
        const left = parseFloat(pageMatch[1]);
        const bottom = parseFloat(pageMatch[2]);
        const right = parseFloat(pageMatch[3]);
        const top = parseFloat(pageMatch[4]);
        
        artboards.push({
          name: `Artboard ${pageIndex + 1}`,
          bounds: {
            x: left,
            y: bottom,
            width: right - left,
            height: top - bottom
          }
        });
        
        pageIndex++;
      }
      
    } catch (error) {
      console.warn('⚠️ Error extracting artboards:', error);
    }

    // Default artboard if none found
    if (artboards.length === 0) {
      artboards.push({
        name: 'Main Artboard',
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      });
    }

    return artboards;
  }

  /**
   * Decode PDF text encoding
   */
  private static decodePDFText(encodedText: string): string {
    try {
      // Handle basic PDF text encoding (this is simplified)
      return encodedText
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')');
    } catch (error) {
      return encodedText;
    }
  }

  /**
   * Create informative placeholders when no objects are found
   */
  private static createBasicInformativePlaceholders(width: number, height: number, fontMap?: Record<string, string>): AIPathData[] {
    return [
      {
        id: 'info_background',
        type: 'path',
        coordinates: [[50, 50], [width - 50, 50], [width - 50, height - 50], [50, height - 50]],
        fill: '#f8f9fa',
        stroke: '#dee2e6',
        strokeWidth: 2
      },
      {
        id: 'info_title',
        type: 'text',
        coordinates: [[width / 2, height / 2 - 60]],
        text: 'Adobe AI File Successfully Imported',
        fontSize: 18,
        fontFamily: 'Arial',
        fill: '#495057'
      },
      {
        id: 'info_content',
        type: 'text',
        coordinates: [[width / 2, height / 2 - 20]],
        text: 'The file structure was processed, but no visible\nvector objects were found in the PDF streams.\n\nThis can happen with:\n• Complex embedded graphics\n• Compressed or encoded content\n• Newer AI format features',
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#6c757d'
      },
      {
        id: 'info_action',
        type: 'text',
        coordinates: [[width / 2, height / 2 + 60]],
        text: 'You can now add your own elements to this canvas!',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#28a745'
      }
    ];
  }

  /**
   * Create error placeholders when parsing fails
   */
  private static createErrorPlaceholders(width: number, height: number, error: any): AIPathData[] {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return [
      {
        id: 'error_background',
        type: 'path',
        coordinates: [[50, 50], [width - 50, 50], [width - 50, height - 50], [50, height - 50]],
        fill: '#fff3cd',
        stroke: '#ffeaa7',
        strokeWidth: 2
      },
      {
        id: 'error_title',
        type: 'text',
        coordinates: [[width / 2, height / 2 - 40]],
        text: 'AI File Import - Partial Success',
        fontSize: 18,
        fontFamily: 'Arial',
        fill: '#856404'
      },
      {
        id: 'error_message',
        type: 'text',
        coordinates: [[width / 2, height / 2]],
        text: `The file was recognized as an Adobe AI file,\nbut some parsing errors occurred.\n\nError: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}\n\nYou can still use this canvas to create your design!`,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#856404'
      }
    ];
  }
  
  /**
   * Enhanced coordinate transformation with better error handling
   */
  private static enhancedTransformCoordinates(coord: number[], metadata: AIFileMetadata): number[] {
    if (!coord || coord.length < 2) return [100, 100];
    
    let [x, y] = coord;
    
    // Handle invalid coordinates
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
      console.warn(`⚠️ Invalid coordinates: [${x}, ${y}], using fallback`);
      return [100 + Math.random() * 200, 100 + Math.random() * 200];
    }
    
    // Get AI file dimensions with fallbacks
    const aiWidth = metadata.pageSize?.width || metadata.boundingBox?.right || 800;
    const aiHeight = metadata.pageSize?.height || metadata.boundingBox?.top || 600;
    
    // Canvas target dimensions
    const canvasWidth = 1000;
    const canvasHeight = 700;
    
    // Transform coordinates: AI typically uses bottom-left origin, canvas uses top-left
    const transformedY = aiHeight - y;
    
    // Calculate smart scaling
    let scaleX = 1;
    let scaleY = 1;
    
    const maxSourceDim = Math.max(aiWidth, aiHeight);
    const maxTargetDim = Math.max(canvasWidth, canvasHeight);
    
    if (maxSourceDim > maxTargetDim * 1.2) {
      const scale = (maxTargetDim * 0.8) / maxSourceDim;
      scaleX = scaleY = scale;
    }
    
    // Apply transformations
    let finalX = x * scaleX;
    let finalY = transformedY * scaleY;
    
    // Center content if smaller than canvas
    if (aiWidth * scaleX < canvasWidth) {
      finalX += (canvasWidth - aiWidth * scaleX) / 2;
    }
    if (aiHeight * scaleY < canvasHeight) {
      finalY += (canvasHeight - aiHeight * scaleY) / 2;
    }
    
    // Ensure coordinates are within reasonable bounds
    finalX = Math.max(0, Math.min(finalX, canvasWidth - 10));
    finalY = Math.max(0, Math.min(finalY, canvasHeight - 10));
    
    return [Math.round(finalX), Math.round(finalY)];
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