import { CanvasTestUtils } from './canvas-test-utils';
import { TestRunner } from './test-runner';
import { fabric } from 'fabric';

export class UndoRedoTests {
  private testUtils: CanvasTestUtils;
  private runner: TestRunner;

  constructor() {
    this.testUtils = new CanvasTestUtils();
    this.runner = new TestRunner();
  }

  async runAllTests(): Promise<void> {
    console.log('↩️ Starting Undo/Redo Tests...');

    const tests = [
      this.testBasicUndoRedo.bind(this),
      this.testUndoRedoWithMultipleObjects.bind(this),
      this.testUndoRedoWithTransformations.bind(this),
      this.testUndoRedoWithDeletions.bind(this),
      this.testUndoRedoWithProperties.bind(this),
      this.testUndoRedoLimits.bind(this),
      this.testUndoRedoMemoryUsage.bind(this),
      this.testUndoRedoStateConsistency.bind(this),
    ];

    const suite = {
      name: 'Undo/Redo Functionality',
      tests,
    };

    const results = await this.runner.runSuite(suite);
    
    console.log('\n📊 Undo/Redo Test Results:');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration}ms)`);
    });
    
    await this.testUtils.cleanup();
  }

  async testBasicUndoRedo(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create a simple history system
      const history: string[] = [];
      let historyIndex = -1;
      
      const saveState = () => {
        const state = JSON.stringify(canvas.toJSON());
        // Remove future states if we're not at the end
        history.splice(historyIndex + 1);
        history.push(state);
        historyIndex++;
        
        // Limit history to 50 states
        if (history.length > 50) {
          history.shift();
          historyIndex--;
        }
      };
      
      const undo = () => {
        if (historyIndex > 0) {
          historyIndex--;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      const redo = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      // Initial state
      saveState();
      
      // Add first object
      const rect1 = this.testUtils.createRectangle({ left: 100, top: 100 });
      canvas.add(rect1);
      saveState();
      
      // Add second object
      const rect2 = this.testUtils.createRectangle({ left: 200, top: 200 });
      canvas.add(rect2);
      saveState();
      
      // Test undo
      const canUndo1 = undo();
      const objectsAfterUndo = canvas.getObjects().length;
      
      // Test redo
      const canRedo1 = redo();
      const objectsAfterRedo = canvas.getObjects().length;
      
      return {
        testName: 'Basic undo/redo should work correctly',
        passed: canUndo1 && canRedo1 && objectsAfterUndo === 1 && objectsAfterRedo === 2,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Basic undo/redo should work correctly',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testUndoRedoWithMultipleObjects(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create history system
      const history: string[] = [];
      let historyIndex = -1;
      
      const saveState = () => {
        const state = JSON.stringify(canvas.toJSON());
        history.splice(historyIndex + 1);
        history.push(state);
        historyIndex++;
      };
      
      const undo = () => {
        if (historyIndex > 0) {
          historyIndex--;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      const redo = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      saveState();
      
      // Add multiple objects in sequence
      const objects = [];
      for (let i = 0; i < 10; i++) {
        const rect = this.testUtils.createRectangle({
          left: 50 + i * 30,
          top: 50 + i * 30,
          fill: `hsl(${i * 36}, 70%, 50%)`,
        });
        objects.push(rect);
        canvas.add(rect);
        saveState();
      }
      
      // Perform multiple undos
      const initialCount = canvas.getObjects().length;
      let undoCount = 0;
      while (undo()) {
        undoCount++;
      }
      
      // Perform redos
      let redoCount = 0;
      while (redo()) {
        redoCount++;
      }
      
      const finalCount = canvas.getObjects().length;
      
      return {
        testName: 'Undo/redo should work with multiple objects',
        passed: initialCount === 10 && undoCount === 10 && redoCount === 10 && finalCount === 10,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Undo/redo should work with multiple objects',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testUndoRedoWithTransformations(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create history system
      const history: string[] = [];
      let historyIndex = -1;
      
      const saveState = () => {
        const state = JSON.stringify(canvas.toJSON());
        history.splice(historyIndex + 1);
        history.push(state);
        historyIndex++;
      };
      
      const undo = () => {
        if (historyIndex > 0) {
          historyIndex--;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      const redo = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      saveState();
      
      // Add object
      const rect = this.testUtils.createRectangle({ left: 100, top: 100 });
      canvas.add(rect);
      saveState();
      
      // Transform object
      rect.set({
        left: 200,
        top: 200,
        scaleX: 2,
        scaleY: 1.5,
        angle: 45,
        fill: '#00ff00',
      });
      canvas.renderAll();
      saveState();
      
      // Test undo
      const canUndo = undo();
      const objAfterUndo = canvas.getObjects()[0];
      const originalProps = {
        left: objAfterUndo.left,
        top: objAfterUndo.top,
        scaleX: objAfterUndo.scaleX,
        scaleY: objAfterUndo.scaleY,
        angle: objAfterUndo.angle,
        fill: objAfterUndo.fill,
      };
      
      // Test redo
      const canRedo = redo();
      const objAfterRedo = canvas.getObjects()[0];
      const transformedProps = {
        left: objAfterRedo.left,
        top: objAfterRedo.top,
        scaleX: objAfterRedo.scaleX,
        scaleY: objAfterRedo.scaleY,
        angle: objAfterRedo.angle,
        fill: objAfterRedo.fill,
      };
      
      const transformationsPreserved = 
        originalProps.left === 100 && originalProps.top === 100 &&
        transformedProps.left === 200 && transformedProps.top === 200 &&
        transformedProps.scaleX === 2 && transformedProps.scaleY === 1.5 &&
        transformedProps.angle === 45 && transformedProps.fill === '#00ff00';
      
      return {
        testName: 'Undo/redo should preserve transformation properties',
        passed: canUndo && canRedo && transformationsPreserved,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Undo/redo should preserve transformation properties',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testUndoRedoWithDeletions(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create history system
      const history: string[] = [];
      let historyIndex = -1;
      
      const saveState = () => {
        const state = JSON.stringify(canvas.toJSON());
        history.splice(historyIndex + 1);
        history.push(state);
        historyIndex++;
      };
      
      const undo = () => {
        if (historyIndex > 0) {
          historyIndex--;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      const redo = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      saveState();
      
      // Add objects
      const rect1 = this.testUtils.createRectangle({ left: 100, top: 100 });
      const rect2 = this.testUtils.createRectangle({ left: 200, top: 200 });
      const rect3 = this.testUtils.createRectangle({ left: 300, top: 300 });
      
      canvas.add(rect1);
      canvas.add(rect2);
      canvas.add(rect3);
      saveState();
      
      // Delete middle object
      canvas.remove(rect2);
      saveState();
      
      // Test undo (should restore deleted object)
      const canUndo = undo();
      const objectsAfterUndo = canvas.getObjects();
      const rect2Restored = objectsAfterUndo.some(obj => 
        obj.type === 'rect' && obj.left === 200 && obj.top === 200
      );
      
      // Test redo (should delete object again)
      const canRedo = redo();
      const objectsAfterRedo = canvas.getObjects();
      
      return {
        testName: 'Undo/redo should handle object deletions correctly',
        passed: canUndo && canRedo && objectsAfterUndo.length === 3 && objectsAfterRedo.length === 2,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Undo/redo should handle object deletions correctly',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testUndoRedoWithProperties(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create history system
      const history: string[] = [];
      let historyIndex = -1;
      
      const saveState = () => {
        const state = JSON.stringify(canvas.toJSON());
        history.splice(historyIndex + 1);
        history.push(state);
        historyIndex++;
      };
      
      const undo = () => {
        if (historyIndex > 0) {
          historyIndex--;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      const redo = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      saveState();
      
      // Add object with initial properties
      const rect = this.testUtils.createRectangle({
        left: 100,
        top: 100,
        fill: '#ff0000',
        opacity: 1,
      });
      canvas.add(rect);
      saveState();
      
      // Change properties
      rect.set({
        fill: '#00ff00',
        opacity: 0.5,
        stroke: '#000000',
        strokeWidth: 2,
      });
      canvas.renderAll();
      saveState();
      
      // Test undo
      const canUndo = undo();
      const objAfterUndo = canvas.getObjects()[0];
      const originalProps = {
        fill: objAfterUndo.fill,
        opacity: objAfterUndo.opacity,
        stroke: objAfterUndo.stroke,
        strokeWidth: objAfterUndo.strokeWidth,
      };
      
      // Test redo
      const canRedo = redo();
      const objAfterRedo = canvas.getObjects()[0];
      const modifiedProps = {
        fill: objAfterRedo.fill,
        opacity: objAfterRedo.opacity,
        stroke: objAfterRedo.stroke,
        strokeWidth: objAfterRedo.strokeWidth,
      };
      
      const propertiesPreserved = 
        originalProps.fill === '#ff0000' && originalProps.opacity === 1 &&
        modifiedProps.fill === '#00ff00' && modifiedProps.opacity === 0.5 &&
        modifiedProps.stroke === '#000000' && modifiedProps.strokeWidth === 2;
      
      return {
        testName: 'Undo/redo should preserve property changes',
        passed: canUndo && canRedo && propertiesPreserved,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Undo/redo should preserve property changes',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testUndoRedoLimits(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create history system with limit
      const history: string[] = [];
      let historyIndex = -1;
      const maxHistory = 5;
      
      const saveState = () => {
        const state = JSON.stringify(canvas.toJSON());
        history.splice(historyIndex + 1);
        history.push(state);
        historyIndex++;
        
        // Enforce history limit
        if (history.length > maxHistory) {
          history.shift();
          historyIndex--;
        }
      };
      
      const undo = () => {
        if (historyIndex > 0) {
          historyIndex--;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      const redo = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      saveState();
      
      // Add more objects than history limit
      for (let i = 0; i < 10; i++) {
        const rect = this.testUtils.createRectangle({
          left: 100 + i * 10,
          top: 100 + i * 10,
        });
        canvas.add(rect);
        saveState();
      }
      
      // Count possible undos
      let undoCount = 0;
      while (undo()) {
        undoCount++;
      }
      
      // Count possible redos
      let redoCount = 0;
      while (redo()) {
        redoCount++;
      }
      
      return {
        testName: 'History should enforce maximum limit correctly',
        passed: undoCount <= maxHistory && redoCount <= maxHistory,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'History should enforce maximum limit correctly',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testUndoRedoMemoryUsage(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create history system
      const history: string[] = [];
      let historyIndex = -1;
      
      const saveState = () => {
        const state = JSON.stringify(canvas.toJSON());
        history.splice(historyIndex + 1);
        history.push(state);
        historyIndex++;
      };
      
      const undo = () => {
        if (historyIndex > 0) {
          historyIndex--;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      const redo = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      saveState();
      
      // Create complex content to test memory usage
      for (let i = 0; i < 20; i++) {
        const rect = this.testUtils.createRectangle({
          left: Math.random() * 400,
          top: Math.random() * 300,
          width: 50 + Math.random() * 50,
          height: 50 + Math.random() * 50,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
          stroke: '#000000',
          strokeWidth: 2,
        });
        canvas.add(rect);
        saveState();
      }
      
      // Check memory usage
      const totalMemory = history.reduce((sum, state) => sum + state.length, 0);
      const averageMemory = totalMemory / history.length;
      
      // Reasonable memory usage check (less than 1MB per state)
      const memoryUsageReasonable = averageMemory < 1000000;
      
      return {
        testName: 'Undo/redo memory usage should remain reasonable',
        passed: memoryUsageReasonable,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Undo/redo memory usage should remain reasonable',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testUndoRedoStateConsistency(): Promise<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const canvas = await this.testUtils.createCanvas();
      
      // Create history system
      const history: string[] = [];
      let historyIndex = -1;
      
      const saveState = () => {
        const state = JSON.stringify(canvas.toJSON());
        history.splice(historyIndex + 1);
        history.push(state);
        historyIndex++;
      };
      
      const undo = () => {
        if (historyIndex > 0) {
          historyIndex--;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      const redo = () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          const state = history[historyIndex];
          canvas.loadFromJSON(JSON.parse(state), () => {
            canvas.renderAll();
          });
          return true;
        }
        return false;
      };
      
      saveState();
      
      // Create complex state
      const rect1 = this.testUtils.createRectangle({ left: 100, top: 100 });
      const circle1 = this.testUtils.createCircle({ left: 200, top: 200 });
      const text1 = this.testUtils.createText('Test', { left: 300, top: 300 });
      
      canvas.add(rect1);
      canvas.add(circle1);
      canvas.add(text1);
      saveState();
      
      // Perform various operations
      rect1.set({ left: 150, top: 150 });
      canvas.remove(circle1);
      text1.set({ text: 'Modified', fill: '#ff0000' });
      saveState();
      
      // Test consistency
      const originalState = history[1];
      const modifiedState = history[2];
      
      // Undo to original state
      undo();
      const currentState = JSON.stringify(canvas.toJSON());
      
      // Check if states are identical
      const statesMatch = currentState === originalState;
      
      // Redo to modified state
      redo();
      const finalState = JSON.stringify(canvas.toJSON());
      const finalStatesMatch = finalState === modifiedState;
      
      return {
        testName: 'Undo/redo should maintain state consistency',
        passed: statesMatch && finalStatesMatch,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Undo/redo should maintain state consistency',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Usage example
export async function runUndoRedoTests(): Promise<void> {
  const tests = new UndoRedoTests();
  await tests.runAllTests();
}

// For direct execution
if (typeof window !== 'undefined' && window.location.search.includes('run-undo-tests')) {
  runUndoRedoTests().catch(console.error);
}