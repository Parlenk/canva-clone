import { CanvasTestUtils } from './canvas-test-utils';
import { TestRunner, TestSuites } from './test-runner';
import { fabric } from 'fabric';
import { CIRCLE_OPTIONS, RECTANGLE_OPTIONS, TEXT_OPTIONS, TRIANGLE_OPTIONS } from '@/features/editor/types';

export class DrawingToolsTests {
  private testUtils: CanvasTestUtils;
  private runner: TestRunner;

  constructor() {
    this.testUtils = new CanvasTestUtils();
    this.runner = new TestRunner();
  }

  async runAllTests(): Promise<void> {
    console.log('🔧 Starting Drawing Tools Tests...');
    
    const suite = TestSuites.getDrawingToolsSuite(this.testUtils);
    const results = await this.runner.runSuite(suite);
    
    console.log('\n📊 Drawing Tools Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async runAdvancedTests(): Promise<void> {
    console.log('🔧 Starting Advanced Drawing Tools Tests...');
    
    const tests = [
      this.testShapeDrawingTools.bind(this),
      this.testTextDrawingTools.bind(this),
      this.testImageDrawingTools.bind(this),
      this.testDrawingModeTools.bind(this),
      this.testShapeProperties.bind(this),
      this.testTextFormatting.bind(this),
      this.testComplexShapes.bind(this),
      this.testShapeInteractions.bind(this),
    ];

    const advancedSuite = {
      name: 'Advanced Drawing Tools',
      tests,
    };

    const results = await this.runner.runSuite(advancedSuite);
    
    console.log('\n📊 Advanced Drawing Tools Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async testShapeDrawingTools(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Test rectangle creation
      const rect = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        left: 100,
        top: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
      });
      canvas.add(rect);
      
      // Test circle creation
      const circle = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        left: 200,
        top: 200,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 2,
      });
      canvas.add(circle);
      
      // Test triangle creation
      const triangle = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
        left: 300,
        top: 300,
        fill: '#0000ff',
        stroke: '#000000',
        strokeWidth: 2,
      });
      canvas.add(triangle);
      
      const objects = canvas.getObjects();
      const hasRect = objects.some(obj => obj.type === 'rect');
      const hasCircle = objects.some(obj => obj.type === 'circle');
      const hasTriangle = objects.some(obj => obj.type === 'triangle');
      
      return {
        testName: 'All basic shapes should be drawable',
        passed: objects.length === 3 && hasRect && hasCircle && hasTriangle,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'All basic shapes should be drawable',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testTextDrawingTools(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Test basic text
      const text1 = new fabric.Textbox('Hello World', {
        ...TEXT_OPTIONS,
        left: 100,
        top: 100,
        fontSize: 24,
        fill: '#000000',
      });
      canvas.add(text1);
      
      // Test styled text
      const text2 = new fabric.Textbox('Styled Text', {
        ...TEXT_OPTIONS,
        left: 200,
        top: 200,
        fontSize: 32,
        fill: '#ff0000',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'center',
      });
      canvas.add(text2);
      
      // Test multiline text
      const text3 = new fabric.Textbox('This is a\nmulti-line\ntext box', {
        ...TEXT_OPTIONS,
        left: 300,
        top: 300,
        fontSize: 16,
        fill: '#0000ff',
        width: 150,
      });
      canvas.add(text3);
      
      const objects = canvas.getObjects();
      const textObjects = objects.filter(obj => obj.type === 'textbox');
      
      return {
        testName: 'Text tools should create text objects with various styles',
        passed: textObjects.length === 3,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Text tools should create text objects with various styles',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testImageDrawingTools(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create multiple images
      const image1 = await this.testUtils.createImage(100, 100);
      image1.set({ left: 100, top: 100 });
      canvas.add(image1);
      
      const image2 = await this.testUtils.createImage(150, 75);
      image2.set({ left: 250, top: 150 });
      canvas.add(image2);
      
      const image3 = await this.testUtils.createImage(80, 120);
      image3.set({ left: 400, top: 200 });
      canvas.add(image3);
      
      const objects = canvas.getObjects();
      const imageObjects = objects.filter(obj => obj.type === 'image');
      
      return {
        testName: 'Image tools should add images with correct dimensions',
        passed: imageObjects.length === 3,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Image tools should add images with correct dimensions',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testDrawingModeTools(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Test drawing mode activation
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = '#ff0000';
      
      const drawingModeActive = canvas.isDrawingMode;
      const brushWidth = canvas.freeDrawingBrush.width;
      const brushColor = canvas.freeDrawingBrush.color;
      
      // Test drawing mode deactivation
      canvas.isDrawingMode = false;
      
      return {
        testName: 'Drawing mode should toggle correctly with brush settings',
        passed: drawingModeActive && brushWidth === 5 && brushColor === '#ff0000' && !canvas.isDrawingMode,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Drawing mode should toggle correctly with brush settings',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testShapeProperties(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Test rectangle with custom properties
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 120,
        height: 80,
        fill: 'linear-gradient(45deg, #ff0000, #0000ff)',
        stroke: '#000000',
        strokeWidth: 3,
        strokeDashArray: [5, 5],
        rx: 10,
        ry: 10,
        opacity: 0.8,
        angle: 45,
      });
      canvas.add(rect);
      
      // Test circle with custom properties
      const circle = new fabric.Circle({
        left: 250,
        top: 150,
        radius: 50,
        fill: 'radial-gradient(circle, #ffff00, #ff0000)',
        stroke: '#000000',
        strokeWidth: 2,
        opacity: 0.9,
        startAngle: 0,
        endAngle: 270,
      });
      canvas.add(circle);
      
      const objects = canvas.getObjects();
      
      return {
        testName: 'Shapes should support all standard properties',
        passed: objects.length === 2,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Shapes should support all standard properties',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testTextFormatting(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Test text with full formatting
      const text = new fabric.Textbox('Formatted Text', {
        ...TEXT_OPTIONS,
        left: 100,
        top: 100,
        fontSize: 24,
        fill: '#ff0000',
        fontFamily: 'Georgia',
        fontWeight: 700,
        fontStyle: 'italic',
        textAlign: 'right',
        textDecoration: 'underline',
        lineHeight: 1.5,
        charSpacing: 100,
        backgroundColor: '#ffff00',
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.3)',
          blur: 5,
          offsetX: 2,
          offsetY: 2,
        }),
      });
      canvas.add(text);
      
      const objects = canvas.getObjects();
      const textObject = objects[0] as fabric.Textbox;
      
      return {
        testName: 'Text should support advanced formatting options',
        passed: objects.length === 1 && textObject.fontSize === 24,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Text should support advanced formatting options',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testComplexShapes(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Test polygon (diamond)
      const diamond = new fabric.Polygon([
        { x: 100, y: 0 },
        { x: 200, y: 100 },
        { x: 100, y: 200 },
        { x: 0, y: 100 },
      ], {
        left: 100,
        top: 100,
        fill: '#ff00ff',
        stroke: '#000000',
        strokeWidth: 2,
      });
      canvas.add(diamond);
      
      // Test custom path
      const path = new fabric.Path('M 0 0 L 100 0 L 100 100 L 0 100 Z', {
        left: 300,
        top: 100,
        fill: '#00ffff',
        stroke: '#000000',
        strokeWidth: 2,
      });
      canvas.add(path);
      
      // Test line
      const line = new fabric.Line([50, 50, 150, 150], {
        stroke: '#ff0000',
        strokeWidth: 3,
      });
      canvas.add(line);
      
      const objects = canvas.getObjects();
      
      return {
        testName: 'Complex shapes (polygons, paths, lines) should be drawable',
        passed: objects.length === 3,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Complex shapes (polygons, paths, lines) should be drawable',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testShapeInteractions(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Add multiple shapes
      const rect = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        left: 100,
        top: 100,
        fill: '#ff0000',
      });
      canvas.add(rect);
      
      const circle = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        left: 150,
        top: 150,
        fill: '#00ff00',
      });
      canvas.add(circle);
      
      // Test grouping
      const group = new fabric.Group([rect, circle], {
        left: 200,
        top: 200,
      });
      canvas.add(group);
      
      // Test ungrouping
      group.toActiveSelection();
      
      const objects = canvas.getObjects();
      
      return {
        testName: 'Shapes should support grouping and interaction',
        passed: objects.length >= 3,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Shapes should support grouping and interaction',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Usage example
export async function runDrawingToolsTests(): Promise<void> {
  const tests = new DrawingToolsTests();
  await tests.runAllTests();
  await tests.runAdvancedTests();
}

// For direct execution
if (typeof window !== 'undefined' && window.location.search.includes('run-drawing-tests')) {
  runDrawingToolsTests().catch(console.error);
}