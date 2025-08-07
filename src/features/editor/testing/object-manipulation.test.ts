import { CanvasTestUtils } from './canvas-test-utils';
import { TestRunner, TestSuites } from './test-runner';
import { fabric } from 'fabric';

export class ObjectManipulationTests {
  private testUtils: CanvasTestUtils;
  private runner: TestRunner;

  constructor() {
    this.testUtils = new CanvasTestUtils();
    this.runner = new TestRunner();
  }

  async runAllTests(): Promise<void> {
    console.log('🎯 Starting Object Manipulation Tests...');
    
    const suite = TestSuites.getObjectManipulationSuite(this.testUtils);
    const results = await this.runner.runSuite(suite);
    
    console.log('\n📊 Object Manipulation Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async runAdvancedTests(): Promise<void> {
    console.log('🎯 Starting Advanced Object Manipulation Tests...');
    
    const tests = [
      this.testPreciseMovement.bind(this),
      this.testConstrainedMovement.bind(this),
      this.testMultiObjectMovement.bind(this),
      this.testPreciseResize.bind(this),
      this.testUniformResize.bind(this),
      this.testRotation.bind(this),
      this.testRotationConstraints.bind(this),
      this.testSkewing.bind(this),
      this.testFlipping.bind(this),
      this.testAlignment.bind(this),
      this.testSnapping.bind(this),
      this.testTransformBox.bind(this),
    ];

    const advancedSuite = {
      name: 'Advanced Object Manipulation',
      tests,
    };

    const results = await this.runner.runSuite(advancedSuite);
    
    console.log('\n📊 Advanced Object Manipulation Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async testPreciseMovement(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle({ left: 100, top: 100 });
      canvas.add(rect);
      
      // Test precise pixel movement
      const originalLeft = rect.left;
      const originalTop = rect.top;
      
      rect.set({ left: originalLeft + 10.5, top: originalTop + 5.25 });
      canvas.renderAll();
      
      const movedLeft = rect.left === 110.5;
      const movedTop = rect.top === 105.25;
      
      return {
        testName: 'Objects should support precise pixel movement',
        passed: movedLeft && movedTop,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should support precise pixel movement',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testConstrainedMovement(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle({ left: 100, top: 100 });
      canvas.add(rect);
      
      // Test constrained movement within canvas bounds
      const canvasWidth = canvas.width!;
      const canvasHeight = canvas.height!;
      const objectWidth = rect.width!;
      const objectHeight = rect.height!;
      
      // Try to move outside bounds
      rect.set({ left: -50, top: -50 });
      canvas.renderAll();
      
      // Check if object stays within bounds (or is properly clipped)
      const withinBounds = rect.left >= -objectWidth && rect.top >= -objectHeight;
      
      return {
        testName: 'Objects should handle constrained movement within canvas bounds',
        passed: withinBounds,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should handle constrained movement within canvas bounds',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testMultiObjectMovement(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create multiple objects
      const rect1 = this.testUtils.createRectangle({ left: 100, top: 100 });
      const rect2 = this.testUtils.createRectangle({ left: 200, top: 200 });
      const circle = this.testUtils.createCircle({ left: 300, top: 300 });
      
      canvas.add(rect1);
      canvas.add(rect2);
      canvas.add(circle);
      
      // Group objects and move them together
      const group = new fabric.Group([rect1, rect2, circle], {
        left: 150,
        top: 150,
      });
      
      const originalGroupLeft = group.left;
      const originalGroupTop = group.top;
      
      group.set({ left: originalGroupLeft + 50, top: originalGroupTop + 30 });
      canvas.add(group);
      canvas.renderAll();
      
      const movedCorrectly = group.left === 200 && group.top === 180;
      
      return {
        testName: 'Multiple objects should move together when grouped',
        passed: movedCorrectly,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Multiple objects should move together when grouped',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testPreciseResize(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle({ width: 100, height: 50 });
      canvas.add(rect);
      
      const originalWidth = rect.width;
      const originalHeight = rect.height;
      
      // Test precise scaling
      rect.set({ scaleX: 1.5, scaleY: 2.25 });
      canvas.renderAll();
      
      const scaledWidth = rect.width! * rect.scaleX;
      const scaledHeight = rect.height! * rect.scaleY;
      
      return {
        testName: 'Objects should support precise scaling',
        passed: scaledWidth === 150 && scaledHeight === 112.5,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should support precise scaling',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testUniformResize(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle({ width: 100, height: 80 });
      canvas.add(rect);
      
      // Test uniform scaling (maintain aspect ratio)
      const aspectRatio = rect.width! / rect.height!;
      const newWidth = 150;
      const newHeight = newWidth / aspectRatio;
      
      rect.set({ scaleX: newWidth / rect.width!, scaleY: newHeight / rect.height! });
      canvas.renderAll();
      
      const finalAspect = (rect.width! * rect.scaleX) / (rect.height! * rect.scaleY);
      const aspectMaintained = Math.abs(finalAspect - aspectRatio) < 0.01;
      
      return {
        testName: 'Objects should maintain aspect ratio during uniform scaling',
        passed: aspectMaintained,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should maintain aspect ratio during uniform scaling',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testRotation(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle({ angle: 0 });
      canvas.add(rect);
      
      // Test various rotation angles
      const testAngles = [45, 90, 180, 270, 360, -45];
      
      let allAnglesCorrect = true;
      for (const angle of testAngles) {
        rect.set({ angle });
        canvas.renderAll();
        
        if (rect.angle !== angle) {
          allAnglesCorrect = false;
          break;
        }
      }
      
      return {
        testName: 'Objects should support rotation at various angles',
        passed: allAnglesCorrect,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should support rotation at various angles',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testRotationConstraints(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle({ angle: 0 });
      canvas.add(rect);
      
      // Test rotation constraints (0-360 degrees)
      rect.set({ angle: 450 }); // Should wrap to 90
      canvas.renderAll();
      
      const normalizedAngle = rect.angle! % 360;
      const isNormalized = normalizedAngle === 90;
      
      return {
        testName: 'Rotation should handle angle constraints properly',
        passed: isNormalized,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Rotation should handle angle constraints properly',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testSkewing(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle({ skewX: 0, skewY: 0 });
      canvas.add(rect);
      
      // Test skewing
      rect.set({ skewX: 30, skewY: 15 });
      canvas.renderAll();
      
      const skewedCorrectly = rect.skewX === 30 && rect.skewY === 15;
      
      return {
        testName: 'Objects should support skewing transformations',
        passed: skewedCorrectly,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should support skewing transformations',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testFlipping(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle({ scaleX: 1, scaleY: 1 });
      canvas.add(rect);
      
      // Test flipping
      rect.set({ scaleX: -1, scaleY: 1 }); // Horizontal flip
      canvas.renderAll();
      
      const flippedHorizontally = rect.scaleX === -1;
      
      rect.set({ scaleX: 1, scaleY: -1 }); // Vertical flip
      canvas.renderAll();
      
      const flippedVertically = rect.scaleY === -1;
      
      return {
        testName: 'Objects should support flipping transformations',
        passed: flippedHorizontally && flippedVertically,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should support flipping transformations',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testAlignment(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create multiple objects
      const rect1 = this.testUtils.createRectangle({ left: 100, top: 100 });
      const rect2 = this.testUtils.createRectangle({ left: 200, top: 150 });
      const rect3 = this.testUtils.createRectangle({ left: 150, top: 200 });
      
      canvas.add(rect1);
      canvas.add(rect2);
      canvas.add(rect3);
      
      // Align objects horizontally
      const group = new fabric.Group([rect1, rect2, rect3]);
      const centerY = canvas.height! / 2;
      
      [rect1, rect2, rect3].forEach(obj => {
        obj.set({ top: centerY - obj.height! / 2 });
      });
      
      canvas.renderAll();
      
      const aligned = [rect1, rect2, rect3].every(obj => 
        Math.abs(obj.top! - centerY + obj.height! / 2) < 0.01
      );
      
      return {
        testName: 'Objects should support alignment operations',
        passed: aligned,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should support alignment operations',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testSnapping(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create grid lines for snapping
      const gridSize = 20;
      const snapThreshold = 5;
      
      const rect = this.testUtils.createRectangle({ left: 95, top: 105 });
      canvas.add(rect);
      
      // Test snapping to grid
      const snapToGrid = (value: number, grid: number, threshold: number) => {
        const remainder = value % grid;
        if (remainder < threshold || remainder > grid - threshold) {
          return Math.round(value / grid) * grid;
        }
        return value;
      };
      
      const snappedLeft = snapToGrid(rect.left!, gridSize, snapThreshold);
      const snappedTop = snapToGrid(rect.top!, gridSize, snapThreshold);
      
      rect.set({ left: snappedLeft, top: snappedTop });
      canvas.renderAll();
      
      const snappedCorrectly = rect.left === 100 && rect.top === 100;
      
      return {
        testName: 'Objects should support grid snapping',
        passed: snappedCorrectly,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should support grid snapping',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testTransformBox(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      const rect = this.testUtils.createRectangle();
      canvas.add(rect);
      
      // Test transform box controls
      const originalControls = rect.hasControls;
      rect.set({ hasControls: true, hasBorders: true });
      
      // Test control points
      const controlPoints = rect.oCoords;
      const hasControlPoints = !!controlPoints;
      
      // Test bounding box
      const boundingRect = rect.getBoundingRect();
      const hasBoundingRect = boundingRect.width > 0 && boundingRect.height > 0;
      
      return {
        testName: 'Objects should have functional transform boxes',
        passed: originalControls !== false && hasControlPoints && hasBoundingRect,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Objects should have functional transform boxes',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Usage example
export async function runObjectManipulationTests(): Promise<void> {
  const tests = new ObjectManipulationTests();
  await tests.runAllTests();
  await tests.runAdvancedTests();
}

// For direct execution
if (typeof window !== 'undefined' && window.location.search.includes('run-manipulation-tests')) {
  runObjectManipulationTests().catch(console.error);
}