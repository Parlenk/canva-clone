import { CanvasTestUtils } from './canvas-test-utils';
import { TestRunner } from './test-runner';
import { fabric } from 'fabric';

export class LayerManagementTests {
  private testUtils: CanvasTestUtils;
  private runner: TestRunner;

  constructor() {
    this.testUtils = new CanvasTestUtils();
    this.runner = new TestRunner();
  }

  async runAllTests(): Promise<void> {
    console.log('📚 Starting Layer Management Tests...');
    
    const suite = TestSuites.getLayerManagementSuite(this.testUtils);
    const results = await this.runner.runSuite(suite);
    
    console.log('\n📊 Layer Management Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async runAdvancedTests(): Promise<void> {
    console.log('📚 Starting Advanced Layer Management Tests...');
    
    const tests = [
      this.testZIndexManipulation.bind(this),
      this.testLayerVisibility.bind(this),
      this.testLayerLocking.bind(this),
      this.testLayerOpacity.bind(this),
      this.testLayerBlending.bind(this),
      this.testLayerGrouping.bind(this),
      this.testLayerReordering.bind(this),
      this.testComplexLayerHierarchy.bind(this),
    ];

    const advancedSuite = {
      name: 'Advanced Layer Management',
      tests,
    };

    const results = await this.runner.runSuite(advancedSuite);
    
    console.log('\n📊 Advanced Layer Management Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async testZIndexManipulation(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create objects in specific order
      const rect1 = this.testUtils.createRectangle({ fill: '#ff0000' });
      const rect2 = this.testUtils.createRectangle({ fill: '#00ff00' });
      const rect3 = this.testUtils.createRectangle({ fill: '#0000ff' });
      
      canvas.add(rect1);
      canvas.add(rect2);
      canvas.add(rect3);
      
      // Test z-index manipulation
      canvas.sendToBack(rect3); // Blue should be at bottom
      canvas.bringToFront(rect1); // Red should be at top
      
      const objects = canvas.getObjects();
      const bottomObject = objects[0];
      const topObject = objects[objects.length - 1];
      
      return {
        testName: 'Z-index should be manipulable with bringToFront/sendToBack',
        passed: bottomObject === rect3 && topObject === rect1,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Z-index should be manipulable with bringToFront/sendToBack',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testLayerVisibility(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      const rect1 = this.testUtils.createRectangle({ visible: true });
      const rect2 = this.testUtils.createRectangle({ visible: true });
      const rect3 = this.testUtils.createRectangle({ visible: true });
      
      canvas.add(rect1);
      canvas.add(rect2);
      canvas.add(rect3);
      
      // Test visibility toggling
      rect2.set({ visible: false });
      canvas.renderAll();
      
      const visibleObjects = canvas.getObjects().filter(obj => obj.visible);
      
      return {
        testName: 'Layer visibility should be toggleable',
        passed: visibleObjects.length === 2,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Layer visibility should be toggleable',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testLayerLocking(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      const rect1 = this.testUtils.createRectangle({ selectable: true });
      const rect2 = this.testUtils.createRectangle({ selectable: true });
      
      canvas.add(rect1);
      canvas.add(rect2);
      
      // Test locking
      rect1.set({ selectable: false, evented: false });
      canvas.renderAll();
      
      const selectableObjects = canvas.getObjects().filter(obj => obj.selectable);
      
      return {
        testName: 'Layers should support locking (selectable/evented toggles)',
        passed: selectableObjects.length === 1 && selectableObjects[0] === rect2,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Layers should support locking (selectable/evented toggles)',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testLayerOpacity(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      const rect1 = this.testUtils.createRectangle({ opacity: 1 });
      const rect2 = this.testUtils.createRectangle({ opacity: 0.5 });
      const rect3 = this.testUtils.createRectangle({ opacity: 0 });
      
      canvas.add(rect1);
      canvas.add(rect2);
      canvas.add(rect3);
      
      // Test opacity changes
      rect1.set({ opacity: 0.75 });
      canvas.renderAll();
      
      const opacities = canvas.getObjects().map(obj => obj.opacity);
      const expectedOpacities = [0.75, 0.5, 0];
      
      return {
        testName: 'Layer opacity should be adjustable',
        passed: JSON.stringify(opacities) === JSON.stringify(expectedOpacities),
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Layer opacity should be adjustable',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testLayerBlending(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      const rect1 = this.testUtils.createRectangle({ fill: '#ff0000', globalCompositeOperation: 'source-over' });
      const rect2 = this.testUtils.createRectangle({ fill: '#00ff00', globalCompositeOperation: 'multiply' });
      
      canvas.add(rect1);
      canvas.add(rect2);
      
      // Test different blend modes
      rect2.set({ globalCompositeOperation: 'screen' });
      canvas.renderAll();
      
      const blendMode = rect2.globalCompositeOperation;
      
      return {
        testName: 'Layers should support blend modes',
        passed: blendMode === 'screen',
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Layers should support blend modes',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testLayerGrouping(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      const rect1 = this.testUtils.createRectangle({ fill: '#ff0000' });
      const rect2 = this.testUtils.createRectangle({ fill: '#00ff00' });
      const circle = this.testUtils.createCircle({ fill: '#0000ff' });
      
      canvas.add(rect1);
      canvas.add(rect2);
      canvas.add(circle);
      
      // Create group
      const group = new fabric.Group([rect1, rect2, circle], {
        left: 200,
        top: 200,
      });
      
      canvas.remove(rect1);
      canvas.remove(rect2);
      canvas.remove(circle);
      canvas.add(group);
      
      const groupObjects = group.getObjects();
      
      return {
        testName: 'Layers should support grouping functionality',
        passed: groupObjects.length === 3 && canvas.getObjects().length === 1,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Layers should support grouping functionality',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testLayerReordering(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      const objects = [];
      for (let i = 0; i < 5; i++) {
        const rect = this.testUtils.createRectangle({ fill: `#${i.toString(16).repeat(6)}` });
        objects.push(rect);
        canvas.add(rect);
      }
      
      // Test reordering
      const objectToMove = objects[2];
      canvas.bringForward(objectToMove);
      canvas.sendBackwards(objectToMove);
      
      const currentIndex = canvas.getObjects().indexOf(objectToMove);
      
      return {
        testName: 'Layer reordering should work with bringForward/sendBackwards',
        passed: currentIndex === 2, // Should return to original position
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Layer reordering should work with bringForward/sendBackwards',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testComplexLayerHierarchy(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create complex hierarchy
      const background = this.testUtils.createRectangle({ fill: '#cccccc' });
      const midLayer = this.testUtils.createRectangle({ fill: '#888888' });
      const topLayer = this.testUtils.createRectangle({ fill: '#444444' });
      
      canvas.add(background);
      canvas.add(midLayer);
      canvas.add(topLayer);
      
      // Create nested groups
      const group1 = new fabric.Group([background]);
      const group2 = new fabric.Group([midLayer, topLayer]);
      
      canvas.clear();
      canvas.add(group1);
      canvas.add(group2);
      
      // Test z-index within groups
      group2.bringToFront(topLayer);
      
      const objects = canvas.getObjects();
      
      return {
        testName: 'Complex layer hierarchies should maintain correct z-index relationships',
        passed: objects.length === 2 && objects[1] === group2,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Complex layer hierarchies should maintain correct z-index relationships',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Usage example
export async function runLayerManagementTests(): Promise<void> {
  const tests = new LayerManagementTests();
  await tests.runAllTests();
  await tests.runAdvancedTests();
}

// For direct execution
if (typeof window !== 'undefined' && window.location.search.includes('run-layer-tests')) {
  runLayerManagementTests().catch(console.error);
}