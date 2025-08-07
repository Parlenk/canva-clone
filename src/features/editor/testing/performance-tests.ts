import { CanvasTestUtils, TestDataGenerator } from './canvas-test-utils';
import { TestRunner } from './test-runner';
import { fabric } from 'fabric';

export class PerformanceTests {
  private testUtils: CanvasTestUtils;
  private runner: TestRunner;

  constructor() {
    this.testUtils = new CanvasTestUtils();
    this.runner = new TestRunner();
  }

  async runAllTests(): Promise<void> {
    console.log('⚡ Starting Performance Tests...');

    const tests = [
      this.testLargeCanvasPerformance.bind(this),
      this.testComplexObjectRendering.bind(this),
      this.testMemoryUsageWithObjects.bind(this),
      this.testRealTimeRendering.bind(this),
      this.testImageProcessingPerformance.bind(this),
      this.testTextRenderingPerformance.bind(this),
      this.testZoomPerformance.bind(this),
      this.testExportPerformance.bind(this),
    ];

    const suite = {
      name: 'Performance Tests',
      tests,
    };

    const results = await this.runner.runSuite(suite);
    
    console.log('\n📊 Performance Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async testLargeCanvasPerformance(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      // Create large canvas
      const canvas = await this.testUtils.createCanvas({ width: 2000, height: 1500 });
      
      // Add many objects
      const objectCount = 1000;
      for (let i = 0; i < objectCount; i++) {
        const rect = new fabric.Rect({
          left: Math.random() * 1800,
          top: Math.random() * 1300,
          width: 20 + Math.random() * 30,
          height: 20 + Math.random() * 30,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
        });
        canvas.add(rect);
      }
      
      // Measure rendering time
      const renderStart = performance.now();
      canvas.renderAll();
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      return {
        testName: 'Large canvas should render within acceptable time limits',
        passed: renderTime < 1000, // 1 second
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Large canvas should render within acceptable time limits',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testComplexObjectRendering(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create complex objects
      const complexObjects = [
        new fabric.Path('M 0 0 L 100 0 L 100 100 L 0 100 Z M 50 50 L 150 50 L 150 150 L 50 150 Z', {
          fill: 'red',
          stroke: 'black',
          strokeWidth: 2,
        }),
        new fabric.Polygon([
          { x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 100 }
        ], {
          fill: 'blue',
          stroke: 'green',
          strokeWidth: 3,
        }),
        new fabric.Text('Complex Text with Shadow', {
          left: 50,
          top: 150,
          fontSize: 24,
          fill: 'purple',
          shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.3)',
            blur: 5,
            offsetX: 2,
            offsetY: 2,
          }),
        }),
      ];
      
      complexObjects.forEach(obj => canvas.add(obj));
      
      // Measure rendering time for complex objects
      const renderStart = performance.now();
      canvas.renderAll();
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      return {
        testName: 'Complex objects should render efficiently',
        passed: renderTime < 500, // 500ms
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Complex objects should render efficiently',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testMemoryUsageWithObjects(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Get initial memory usage if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Add many objects
      const objectCount = 500;
      for (let i = 0; i < objectCount; i++) {
        const circle = new fabric.Circle({
          left: Math.random() * 700,
          top: Math.random() * 500,
          radius: 10 + Math.random() * 20,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
        });
        canvas.add(circle);
      }
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Measure memory usage
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Reasonable memory usage per object (less than 1MB total)
      const memoryUsageReasonable = memoryIncrease < 1000000;
      
      return {
        testName: 'Memory usage should remain reasonable with many objects',
        passed: memoryUsageReasonable,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Memory usage should remain reasonable with many objects',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testRealTimeRendering(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Add some objects for interaction
      const rect = this.testUtils.createRectangle({ left: 100, top: 100 });
      canvas.add(rect);
      
      // Simulate real-time updates
      const updateCount = 100;
      const frameTimes: number[] = [];
      
      for (let i = 0; i < updateCount; i++) {
        const frameStart = performance.now();
        
        // Update object properties
        rect.set({
          left: 100 + Math.sin(i * 0.1) * 50,
          top: 100 + Math.cos(i * 0.1) * 50,
          angle: i * 3.6,
        });
        
        canvas.renderAll();
        
        const frameEnd = performance.now();
        frameTimes.push(frameEnd - frameStart);
      }
      
      const averageFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      
      // Should maintain 30fps (33ms per frame)
      const performanceAcceptable = averageFrameTime < 33 && maxFrameTime < 50;
      
      return {
        testName: 'Real-time rendering should maintain acceptable frame rates',
        passed: performanceAcceptable,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Real-time rendering should maintain acceptable frame rates',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testImageProcessingPerformance(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create multiple images
      const imageCount = 10;
      const images: fabric.Image[] = [];
      
      for (let i = 0; i < imageCount; i++) {
        const image = await this.testUtils.createImage(100, 100);
        image.set({
          left: i * 50,
          top: i * 50,
          filters: [
            new fabric.Image.filters.Grayscale(),
            new fabric.Image.filters.Brightness({ brightness: 0.1 }),
          ],
        });
        images.push(image);
        canvas.add(image);
      }
      
      // Apply filters
      const filterStart = performance.now();
      images.forEach(image => {
        image.applyFilters();
      });
      canvas.renderAll();
      const filterEnd = performance.now();
      
      const filterTime = filterEnd - filterStart;
      
      return {
        testName: 'Image processing and filtering should complete efficiently',
        passed: filterTime < 2000, // 2 seconds
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Image processing and filtering should complete efficiently',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testTextRenderingPerformance(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create multiple text objects
      const textCount = 50;
      for (let i = 0; i < textCount; i++) {
        const text = new fabric.Text(`Text ${i} with styling`, {
          left: Math.random() * 600,
          top: Math.random() * 400,
          fontSize: 16 + Math.random() * 16,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
          fontFamily: 'Arial',
          fontWeight: Math.random() > 0.5 ? 'bold' : 'normal',
          fontStyle: Math.random() > 0.5 ? 'italic' : 'normal',
        });
        canvas.add(text);
      }
      
      // Measure text rendering time
      const renderStart = performance.now();
      canvas.renderAll();
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      return {
        testName: 'Text rendering should complete efficiently',
        passed: renderTime < 1000, // 1 second
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Text rendering should complete efficiently',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testZoomPerformance(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Add content for zooming
      for (let i = 0; i < 100; i++) {
        const shape = i % 3 === 0 
          ? this.testUtils.createRectangle({ left: i * 20, top: i * 15 })
          : i % 3 === 1 
          ? this.testUtils.createCircle({ left: i * 20, top: i * 15 })
          : new fabric.Triangle({ left: i * 20, top: i * 15, width: 30, height: 30, fill: 'yellow' });
        canvas.add(shape);
      }
      
      // Test zoom operations
      const zoomLevels = [0.5, 1, 1.5, 2, 3, 5];
      const zoomTimes: number[] = [];
      
      for (const zoom of zoomLevels) {
        const zoomStart = performance.now();
        canvas.setZoom(zoom);
        canvas.renderAll();
        const zoomEnd = performance.now();
        zoomTimes.push(zoomEnd - zoomStart);
      }
      
      const maxZoomTime = Math.max(...zoomTimes);
      
      return {
        testName: 'Zoom operations should complete efficiently',
        passed: maxZoomTime < 500, // 500ms
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Zoom operations should complete efficiently',
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
      for (let i = 0; i < 200; i++) {
        const rect = new fabric.Rect({
          left: Math.random() * 700,
          top: Math.random() * 500,
          width: 10 + Math.random() * 20,
          height: 10 + Math.random() * 20,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
          angle: Math.random() * 360,
        });
        canvas.add(rect);
      }
      
      // Test export performance
      const exportFormats = ['png', 'jpeg'];
      const exportTimes: Record<string, number> = {};
      
      for (const format of exportFormats) {
        const exportStart = performance.now();
        const dataUrl = canvas.toDataURL({
          format: format as 'png' | 'jpeg',
          quality: 0.8,
        });
        const exportEnd = performance.now();
        exportTimes[format] = exportEnd - exportStart;
      }
      
      const maxExportTime = Math.max(...Object.values(exportTimes));
      
      return {
        testName: 'Export operations should complete efficiently',
        passed: maxExportTime < 3000, // 3 seconds
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Export operations should complete efficiently',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Usage example
export async function runPerformanceTests(): Promise<void> {
  const tests = new PerformanceTests();
  await tests.runAllTests();
}

// For direct execution
if (typeof window !== 'undefined' && window.location.search.includes('run-performance-tests')) {
  runPerformanceTests().catch(console.error);
}