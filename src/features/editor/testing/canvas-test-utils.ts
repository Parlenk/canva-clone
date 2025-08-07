import { fabric } from 'fabric';
import { act } from '@testing-library/react';

export interface TestCanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface CanvasState {
  objects: fabric.Object[];
  backgroundColor?: string;
  width: number;
  height: number;
  zoom: number;
}

export class CanvasTestUtils {
  private canvas: fabric.Canvas | null = null;
  private container: HTMLDivElement;

  constructor() {
    // Create a mock container for testing
    this.container = document.createElement('div');
    this.container.style.width = '800px';
    this.container.style.height = '600px';
    document.body.appendChild(this.container);
  }

  async createCanvas(options: TestCanvasOptions = {}): Promise<fabric.Canvas> {
    const canvasEl = document.createElement('canvas');
    this.container.appendChild(canvasEl);
    
    this.canvas = new fabric.Canvas(canvasEl, {
      width: options.width || 800,
      height: options.height || 600,
      backgroundColor: options.backgroundColor || '#ffffff',
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    // Wait for canvas to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.canvas;
  }

  async cleanup(): Promise<void> {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  getCanvas(): fabric.Canvas | null {
    return this.canvas;
  }

  getContainer(): HTMLDivElement {
    return this.container;
  }

  // Object creation utilities
  createRectangle(options: Partial<fabric.IRectOptions> = {}): fabric.Rect {
    return new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 50,
      fill: '#ff0000',
      ...options,
    });
  }

  createCircle(options: Partial<fabric.ICircleOptions> = {}): fabric.Circle {
    return new fabric.Circle({
      left: 150,
      top: 150,
      radius: 50,
      fill: '#00ff00',
      ...options,
    });
  }

  createText(text: string = 'Test Text', options: Partial<fabric.ITextboxOptions> = {}): fabric.Textbox {
    return new fabric.Textbox(text, {
      left: 200,
      top: 200,
      fontSize: 20,
      fill: '#000000',
      ...options,
    });
  }

  createImage(width: number = 100, height: number = 100): Promise<fabric.Image> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      
      // Create a simple pattern
      ctx.fillStyle = '#0066cc';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 10, width - 20, height - 20);
      
      fabric.Image.fromURL(canvas.toDataURL(), (img) => {
        resolve(img);
      });
    });
  }

  // Canvas state utilities
  getCanvasState(): CanvasState {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    return {
      objects: this.canvas.getObjects(),
      backgroundColor: this.canvas.backgroundColor as string,
      width: this.canvas.width!,
      height: this.canvas.height!,
      zoom: this.canvas.getZoom(),
    };
  }

  async waitForRender(): Promise<void> {
    if (!this.canvas) return;
    
    return new Promise(resolve => {
      this.canvas!.on('after:render', () => {
        resolve();
      });
      this.canvas!.renderAll();
    });
  }

  // Event simulation utilities
  simulateMouseEvent(type: string, x: number, y: number): void {
    if (!this.canvas) return;

    const event = new MouseEvent(type, {
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    });

    this.canvas.upperCanvasEl.dispatchEvent(event);
  }

  simulateClick(x: number, y: number): void {
    this.simulateMouseEvent('mousedown', x, y);
    this.simulateMouseEvent('mouseup', x, y);
  }

  simulateDrag(startX: number, startY: number, endX: number, endY: number): void {
    this.simulateMouseEvent('mousedown', startX, startY);
    
    // Simulate drag movement
    const steps = 10;
    const deltaX = (endX - startX) / steps;
    const deltaY = (endY - startY) / steps;
    
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        this.simulateMouseEvent('mousemove', startX + deltaX * i, startY + deltaY * i);
      }, i * 10);
    }
    
    setTimeout(() => {
      this.simulateMouseEvent('mouseup', endX, endY);
    }, steps * 10 + 50);
  }

  // Performance utilities
  async measurePerformance(operation: () => void | Promise<void>): Promise<{ duration: number; memoryDelta?: number }> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize;

    await operation();

    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize;

    return {
      duration: endTime - startTime,
      memoryDelta: startMemory && endMemory ? endMemory - startMemory : undefined,
    };
  }

  // Validation utilities
  validateObjectCount(expectedCount: number): boolean {
    if (!this.canvas) return false;
    return this.canvas.getObjects().length === expectedCount;
  }

  validateObjectProperties(object: fabric.Object, expectedProps: Record<string, any>): boolean {
    return Object.entries(expectedProps).every(([key, value]) => {
      const actual = object.get(key);
      return actual === value;
    });
  }

  validateCanvasDimensions(expectedWidth: number, expectedHeight: number): boolean {
    if (!this.canvas) return false;
    return this.canvas.width === expectedWidth && this.canvas.height === expectedHeight;
  }

  // Serialization utilities
  async exportToJSON(): Promise<string> {
    if (!this.canvas) return '{}';
    
    const json = this.canvas.toJSON();
    return JSON.stringify(json, null, 2);
  }

  async importFromJSON(jsonString: string): Promise<void> {
    if (!this.canvas) return;
    
    const json = JSON.parse(jsonString);
    return new Promise(resolve => {
      this.canvas!.loadFromJSON(json, () => {
        this.canvas!.renderAll();
        resolve();
      });
    });
  }

  async exportToDataURL(format: 'png' | 'jpeg' = 'png', quality: number = 1): Promise<string> {
    if (!this.canvas) return '';
    
    return this.canvas.toDataURL({
      format,
      quality,
      width: this.canvas.width,
      height: this.canvas.height,
    });
  }
}

// Test data generators
export class TestDataGenerator {
  static generateComplexCanvasState(objectCount: number = 50): any {
    const objects = [];
    const shapes = ['rect', 'circle', 'triangle', 'text'];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    for (let i = 0; i < objectCount; i++) {
      const shape = shapes[i % shapes.length];
      const color = colors[i % colors.length];
      const left = Math.random() * 700;
      const top = Math.random() * 500;

      switch (shape) {
        case 'rect':
          objects.push({
            type: 'rect',
            left,
            top,
            width: 50 + Math.random() * 100,
            height: 30 + Math.random() * 70,
            fill: color,
            angle: Math.random() * 360,
          });
          break;
        case 'circle':
          objects.push({
            type: 'circle',
            left,
            top,
            radius: 20 + Math.random() * 50,
            fill: color,
          });
          break;
        case 'triangle':
          objects.push({
            type: 'triangle',
            left,
            top,
            width: 40 + Math.random() * 80,
            height: 40 + Math.random() * 80,
            fill: color,
          });
          break;
        case 'text':
          objects.push({
            type: 'textbox',
            left,
            top,
            text: `Text ${i}`,
            fontSize: 12 + Math.random() * 24,
            fill: color,
          });
          break;
      }
    }

    return {
      version: '5.3.0',
      objects,
    };
  }

  static generateSimpleCanvasState(): any {
    return {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 100,
          top: 100,
          width: 100,
          height: 50,
          fill: '#ff0000',
        },
        {
          type: 'circle',
          left: 300,
          top: 200,
          radius: 50,
          fill: '#00ff00',
        },
        {
          type: 'textbox',
          left: 200,
          top: 300,
          text: 'Hello World',
          fontSize: 20,
          fill: '#000000',
        },
      ],
    };
  }
}

// Browser compatibility utilities
export class BrowserCompatibilityUtils {
  static checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  static checkCanvasSupport(): boolean {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  }

  static checkFileAPISupport(): boolean {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
  }

  static checkLocalStorageSupport(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getBrowserInfo(): {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
  } {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  }
}