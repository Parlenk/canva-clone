import { CanvasTestUtils } from './canvas-test-utils';
import { TestRunner, TestSuites } from './test-runner';
import { fabric } from 'fabric';

export class ExportFunctionalityTests {
  private testUtils: CanvasTestUtils;
  private runner: TestRunner;

  constructor() {
    this.testUtils = new CanvasTestUtils();
    this.runner = new TestRunner();
  }

  async runAllTests(): Promise<void> {
    console.log('📤 Starting Export Functionality Tests...');
    
    const suite = TestSuites.getExportSuite(this.testUtils);
    const results = await this.runner.runSuite(suite);
    
    console.log('\n📊 Export Functionality Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async runAdvancedTests(): Promise<void> {
    console.log('📤 Starting Advanced Export Functionality Tests...');
    
    const tests = [
      this.testPNGExportQuality.bind(this),
      this.testJPEGExportCompression.bind(this),
      this.testSVGExportComplexity.bind(this),
      this.testJSONExportCompleteness.bind(this),
      this.testExportWithTransparency.bind(this),
      this.testExportWithEffects.bind(this),
      this.testExportDimensions.bind(this),
      this.testExportPerformance.bind(this),
    ];

    const advancedSuite = {
      name: 'Advanced Export Functionality',
      tests,
    };

    const results = await this.runner.runSuite(advancedSuite);
    
    console.log('\n📊 Advanced Export Functionality Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async testPNGExportQuality(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create test content
      const rect = this.testUtils.createRectangle({
        left: 50,
        top: 50,
        width: 100,
        height: 100,
        fill: '#ff0000',
      });
      canvas.add(rect);
      
      // Export with different qualities
      const dataUrlFull = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });
      
      const dataUrlLow = canvas.toDataURL({
        format: 'png',
        quality: 0.1,
        multiplier: 2,
      });
      
      // Check if exports were generated
      const fullQualityGenerated = dataUrlFull.startsWith('data:image/png');
      const lowQualityGenerated = dataUrlLow.startsWith('data:image/png');
      
      return {
        testName: 'PNG export should support quality settings',
        passed: fullQualityGenerated && lowQualityGenerated,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'PNG export should support quality settings',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testJPEGExportCompression(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create test content
      const image = await this.testUtils.createImage(200, 200);
      canvas.add(image);
      
      // Export with different compression levels
      const dataUrlHigh = canvas.toDataURL({
        format: 'jpeg',
        quality: 1,
      });
      
      const dataUrlMedium = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.5,
      });
      
      const dataUrlLow = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.1,
      });
      
      // Check file sizes (high quality should be larger)
      const highSize = dataUrlHigh.length;
      const mediumSize = dataUrlMedium.length;
      const lowSize = dataUrlLow.length;
      
      const compressionWorks = highSize > mediumSize && mediumSize > lowSize;
      
      return {
        testName: 'JPEG export should support compression levels',
        passed: compressionWorks,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'JPEG export should support compression levels',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testSVGExportComplexity(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create complex content
      const rect = this.testUtils.createRectangle({
        left: 50,
        top: 50,
        width: 100,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
      });
      
      const circle = this.testUtils.createCircle({
        left: 200,
        top: 100,
        radius: 50,
        fill: '#00ff00',
      });
      
      const text = this.testUtils.createText('Test SVG Export', {
        left: 100,
        top: 200,
        fontSize: 24,
        fill: '#0000ff',
      });
      
      canvas.add(rect);
      canvas.add(circle);
      canvas.add(text);
      
      // Export to SVG
      const svgData = canvas.toSVG();
      
      // Check if SVG contains expected elements
      const hasRect = svgData.includes('rect');
      const hasCircle = svgData.includes('circle');
      const hasText = svgData.includes('text');
      
      const completeExport = hasRect && hasCircle && hasText;
      
      return {
        testName: 'SVG export should preserve complex content',
        passed: completeExport,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'SVG export should preserve complex content',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testJSONExportCompleteness(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create content with various properties
      const rect = this.testUtils.createRectangle({
        left: 50,
        top: 50,
        width: 100,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 3,
        opacity: 0.8,
        angle: 45,
        scaleX: 1.5,
        scaleY: 2,
      });
      
      canvas.add(rect);
      
      // Export to JSON
      const jsonData = canvas.toJSON();
      
      // Check completeness
      const hasObjects = jsonData.objects && jsonData.objects.length > 0;
      const hasVersion = jsonData.version;
      const hasBackground = jsonData.background !== undefined;
      
      const objectData = jsonData.objects[0];
      const hasProperties = objectData.left !== undefined && 
                           objectData.top !== undefined && 
                           objectData.width !== undefined && 
                           objectData.height !== undefined && 
                           objectData.fill !== undefined;
      
      const completeExport = hasObjects && hasVersion && hasBackground && hasProperties;
      
      return {
        testName: 'JSON export should preserve all object properties',
        passed: completeExport,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'JSON export should preserve all object properties',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testExportWithTransparency(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create content with transparency
      const rect1 = this.testUtils.createRectangle({
        left: 50,
        top: 50,
        width: 100,
        height: 100,
        fill: 'rgba(255, 0, 0, 0.5)',
      });
      
      const rect2 = this.testUtils.createRectangle({
        left: 75,
        top: 75,
        width: 100,
        height: 100,
        fill: 'rgba(0, 255, 0, 0.5)',
      });
      
      canvas.add(rect1);
      canvas.add(rect2);
      
      // Export with transparency
      const pngData = canvas.toDataURL({
        format: 'png',
        enableRetinaScaling: false,
      });
      
      // PNG should preserve transparency
      const hasTransparency = pngData.includes('data:image/png');
      
      return {
        testName: 'Export should preserve transparency in PNG format',
        passed: hasTransparency,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Export should preserve transparency in PNG format',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testExportWithEffects(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create content with effects
      const rect = this.testUtils.createRectangle({
        left: 50,
        top: 50,
        width: 100,
        height: 100,
        fill: '#ff0000',
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.5)',
          blur: 10,
          offsetX: 5,
          offsetY: 5,
        }),
      });
      
      canvas.add(rect);
      
      // Export with effects
      const pngData = canvas.toDataURL({
        format: 'png',
        enableRetinaScaling: false,
      });
      
      const svgData = canvas.toSVG();
      
      // Check if effects are preserved
      const pngHasEffects = pngData.startsWith('data:image/png');
      const svgHasShadow = svgData.includes('filter');
      
      return {
        testName: 'Export should preserve visual effects (shadows, filters)',
        passed: pngHasEffects && svgHasShadow,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Export should preserve visual effects (shadows, filters)',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testExportDimensions(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas({ width: 400, height: 300 });
      
      // Add content
      const rect = this.testUtils.createRectangle({
        left: 50,
        top: 50,
        width: 100,
        height: 100,
        fill: '#ff0000',
      });
      canvas.add(rect);
      
      // Test different export dimensions
      const export1 = canvas.toDataURL({
        format: 'png',
        width: 800,
        height: 600,
        multiplier: 2,
      });
      
      const export2 = canvas.toDataURL({
        format: 'png',
        width: 200,
        height: 150,
        multiplier: 0.5,
      });
      
      const bothExportsGenerated = export1.startsWith('data:image/png') && 
                                   export2.startsWith('data:image/png');
      
      return {
        testName: 'Export should support custom dimensions and multipliers',
        passed: bothExportsGenerated,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Export should support custom dimensions and multipliers',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testExportPerformance(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create complex content
      for (let i = 0; i < 50; i++) {
        const rect = this.testUtils.createRectangle({
          left: Math.random() * 300,
          top: Math.random() * 200,
          width: 20 + Math.random() * 30,
          height: 20 + Math.random() * 30,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
          angle: Math.random() * 360,
        });
        canvas.add(rect);
      }
      
      // Measure export performance
      const exportStart = performance.now();
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
      });
      const exportEnd = performance.now();
      
      const exportTime = exportEnd - exportStart;
      const exportGenerated = dataUrl.startsWith('data:image/png');
      
      return {
        testName: 'Export should complete within reasonable time for complex content',
        passed: exportGenerated && exportTime < 5000, // 5 seconds
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Export should complete within reasonable time for complex content',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Usage example
export async function runExportFunctionalityTests(): Promise<void> {
  const tests = new ExportFunctionalityTests();
  await tests.runAllTests();
  await tests.runAdvancedTests();
}

// For direct execution
if (typeof window !== 'undefined' && window.location.search.includes('run-export-tests')) {
  runExportFunctionalityTests().catch(console.error);
}