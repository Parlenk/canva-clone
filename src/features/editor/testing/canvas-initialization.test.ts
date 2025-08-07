import { CanvasTestUtils } from './canvas-test-utils';
import { TestRunner, TestSuites } from './test-runner';
import { fabric } from 'fabric';

export class CanvasInitializationTests {
  private testUtils: CanvasTestUtils;
  private runner: TestRunner;

  constructor() {
    this.testUtils = new CanvasTestUtils();
    this.runner = new TestRunner();
  }

  async runAllTests(): Promise<void> {
    console.log('🔍 Starting Canvas Initialization Tests...');
    
    const suite = TestSuites.getCanvasInitializationSuite(this.testUtils);
    const results = await this.runner.runSuite(suite);
    
    console.log('\n📊 Canvas Initialization Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async runAdvancedTests(): Promise<void> {
    console.log('🔍 Starting Advanced Canvas Initialization Tests...');
    
    const tests = [
      this.testWorkspaceInitialization.bind(this),
      this.testClipPathInitialization.bind(this),
      this.testZoomInitialization.bind(this),
      this.testEventListeners.bind(this),
      this.testCanvasStatePersistence.bind(this),
      this.testMultipleCanvasInstances.bind(this),
      this.testCanvasResize.bind(this),
    ];

    const advancedSuite = {
      name: 'Advanced Canvas Initialization',
      tests,
    };

    const results = await this.runner.runSuite(advancedSuite);
    
    console.log('\n📊 Advanced Canvas Initialization Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async testWorkspaceInitialization(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create workspace as done in use-editor.ts
      const workspace = new fabric.Rect({
        width: 800,
        height: 600,
        name: 'clip',
        fill: 'white',
        selectable: false,
        hasControls: false,
      });
      
      canvas.add(workspace);
      canvas.centerObject(workspace);
      canvas.clipPath = workspace;
      
      const foundWorkspace = canvas.getObjects().find(obj => obj.name === 'clip');
      
      return {
        testName: 'Workspace should initialize correctly',
        passed: !!foundWorkspace && foundWorkspace.width === 800 && foundWorkspace.height === 600,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Workspace should initialize correctly',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testClipPathInitialization(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      const workspace = new fabric.Rect({
        width: 400,
        height: 300,
        name: 'clip',
        fill: 'white',
        selectable: false,
        hasControls: false,
      });
      
      canvas.add(workspace);
      canvas.clipPath = workspace;
      
      // Add object outside clip path
      const rect = new fabric.Rect({
        left: 500,
        top: 400,
        width: 100,
        height: 100,
        fill: 'red',
      });
      
      canvas.add(rect);
      
      return {
        testName: 'Clip path should constrain object visibility',
        passed: canvas.clipPath === workspace,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Clip path should constrain object visibility',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testZoomInitialization(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      const initialZoom = canvas.getZoom();
      
      // Test zoom in
      canvas.setZoom(1.5);
      const zoomedIn = canvas.getZoom();
      
      // Test zoom out
      canvas.setZoom(0.5);
      const zoomedOut = canvas.getZoom();
      
      return {
        testName: 'Zoom levels should initialize and change correctly',
        passed: initialZoom === 1 && zoomedIn === 1.5 && zoomedOut === 0.5,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Zoom levels should initialize and change correctly',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testEventListeners(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      let eventFired = false;
      canvas.on('object:added', () => {
        eventFired = true;
      });
      
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 50,
        height: 50,
        fill: 'blue',
      });
      
      canvas.add(rect);
      
      return {
        testName: 'Event listeners should initialize and fire correctly',
        passed: eventFired,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Event listeners should initialize and fire correctly',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testCanvasStatePersistence(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Add multiple objects
      canvas.add(this.testUtils.createRectangle());
      canvas.add(this.testUtils.createCircle());
      canvas.add(this.testUtils.createText('Persistent Text'));
      
      // Save state
      const json = canvas.toJSON();
      
      // Clear canvas
      canvas.clear();
      
      // Restore state
      await new Promise(resolve => {
        canvas.loadFromJSON(json, resolve);
      });
      
      return {
        testName: 'Canvas state should persist after save/load',
        passed: canvas.getObjects().length === 3,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Canvas state should persist after save/load',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testMultipleCanvasInstances(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas1 = await this.testUtils.createCanvas({ width: 400, height: 300 });
      const canvas2 = await this.testUtils.createCanvas({ width: 600, height: 400 });
      
      canvas1.add(this.testUtils.createRectangle({ left: 50, top: 50 }));
      canvas2.add(this.testUtils.createCircle({ left: 100, top: 100 }));
      
      const canvas1Objects = canvas1.getObjects().length;
      const canvas2Objects = canvas2.getObjects().length;
      
      return {
        testName: 'Multiple canvas instances should work independently',
        passed: canvas1Objects === 1 && canvas2Objects === 1 && canvas1 !== canvas2,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Multiple canvas instances should work independently',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testCanvasResize(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas({ width: 800, height: 600 });
      
      // Resize canvas
      canvas.setDimensions({ width: 1024, height: 768 });
      
      // Check if objects maintain relative positions
      const rect = this.testUtils.createRectangle({ left: 400, top: 300 });
      canvas.add(rect);
      
      const relativeX = rect.left! / canvas.width!;
      const relativeY = rect.top! / canvas.height!;
      
      return {
        testName: 'Canvas should resize correctly maintaining object proportions',
        passed: canvas.width === 1024 && canvas.height === 768 && relativeX === 0.5 && relativeY === 0.5,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Canvas should resize correctly maintaining object proportions',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Usage example
export async function runCanvasInitializationTests(): Promise<void> {
  const tests = new CanvasInitializationTests();
  await tests.runAllTests();
  await tests.runAdvancedTests();
}

// For direct execution
if (typeof window !== 'undefined' && window.location.search.includes('run-tests')) {
  runCanvasInitializationTests().catch(console.error);
}