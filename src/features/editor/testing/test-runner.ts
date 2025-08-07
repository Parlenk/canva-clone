import { CanvasTestUtils, TestDataGenerator, BrowserCompatibilityUtils } from './canvas-test-utils';
import { fabric } from 'fabric';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestFunction[];
}

type TestFunction = () => Promise<TestResult>;

export class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private testUtils: CanvasTestUtils;

  constructor() {
    this.testUtils = new CanvasTestUtils();
  }

  async runSuite(suite: TestSuite): Promise<TestResult[]> {
    console.log(`🧪 Running test suite: ${suite.name}`);
    
    const suiteResults: TestResult[] = [];
    
    for (const test of suite.tests) {
      try {
        const result = await this.runTest(test);
        suiteResults.push(result);
        
        if (result.passed) {
          console.log(`✅ ${result.testName}: ${result.duration.toFixed(2)}ms`);
        } else {
          console.log(`❌ ${result.testName}: ${result.error}`);
        }
      } catch (error) {
        suiteResults.push({
          testName: test.name,
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    this.results.push(...suiteResults);
    return suiteResults;
  }

  async runTest(test: TestFunction): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const result = await test();
      const duration = performance.now() - startTime;
      
      return {
        ...result,
        duration,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        testName: test.name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async runAllSuites(suites: TestSuite[]): Promise<TestResult[]> {
    this.startTime = performance.now();
    this.results = [];
    
    console.log('🚀 Starting comprehensive canvas testing...');
    
    for (const suite of suites) {
      await this.runSuite(suite);
    }
    
    const totalTime = performance.now() - this.startTime;
    console.log(`\n📊 Test Summary:`);
    console.log(`Total tests: ${this.results.length}`);
    console.log(`Passed: ${this.results.filter(r => r.passed).length}`);
    console.log(`Failed: ${this.results.filter(r => !r.passed).length}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    
    return this.results;
  }

  getResults(): TestResult[] {
    return this.results;
  }

  generateReport(): string {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    const report = [
      '# Canvas Testing Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Total Tests: ${total}`,
      `- Passed: ${passed}`,
      `- Failed: ${failed}`,
      `- Success Rate: ${successRate.toFixed(1)}%`,
      '',
      '## Detailed Results',
      ...this.results.map(result =>
        `- ${result.passed ? '✅' : '❌'} ${result.testName} (${result.duration.toFixed(2)}ms)${
          result.error ? ` - ${result.error}` : ''
        }`
      ),
      '',
    ];

    return report.join('\n');
  }

  exportToJSON(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      },
    }, null, 2);
  }
}

// Predefined test suites
export class TestSuites {
  static getCanvasInitializationSuite(testUtils: CanvasTestUtils): TestSuite {
    return {
      name: 'Canvas Initialization',
      tests: [
        async () => {
          const canvas = await testUtils.createCanvas();
          const state = testUtils.getCanvasState();
          
          return {
            testName: 'Canvas should initialize with correct dimensions',
            passed: state.width === 800 && state.height === 600,
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const state = testUtils.getCanvasState();
          
          return {
            testName: 'Canvas should start with empty objects array',
            passed: state.objects.length === 0,
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas({ backgroundColor: '#ff0000' });
          const state = testUtils.getCanvasState();
          
          return {
            testName: 'Canvas should set background color correctly',
            passed: state.backgroundColor === '#ff0000',
            duration: 0,
          };
        },
      ],
    };
  }

  static getDrawingToolsSuite(testUtils: CanvasTestUtils): TestSuite {
    return {
      name: 'Drawing Tools',
      tests: [
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect = testUtils.createRectangle();
          canvas.add(rect);
          
          return {
            testName: 'Should add rectangle to canvas',
            passed: canvas.getObjects().length === 1 && canvas.getObjects()[0].type === 'rect',
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const circle = testUtils.createCircle();
          canvas.add(circle);
          
          return {
            testName: 'Should add circle to canvas',
            passed: canvas.getObjects().length === 1 && canvas.getObjects()[0].type === 'circle',
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const text = testUtils.createText('Test');
          canvas.add(text);
          
          return {
            testName: 'Should add text to canvas',
            passed: canvas.getObjects().length === 1 && canvas.getObjects()[0].type === 'textbox',
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const image = await testUtils.createImage();
          canvas.add(image);
          
          return {
            testName: 'Should add image to canvas',
            passed: canvas.getObjects().length === 1 && canvas.getObjects()[0].type === 'image',
            duration: 0,
          };
        },
      ],
    };
  }

  static getObjectManipulationSuite(testUtils: CanvasTestUtils): TestSuite {
    return {
      name: 'Object Manipulation',
      tests: [
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect = testUtils.createRectangle({ left: 100, top: 100 });
          canvas.add(rect);
          
          rect.set({ left: 200, top: 200 });
          canvas.renderAll();
          
          return {
            testName: 'Should move objects correctly',
            passed: rect.left === 200 && rect.top === 200,
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect = testUtils.createRectangle({ width: 100, height: 50 });
          canvas.add(rect);
          
          rect.set({ scaleX: 2, scaleY: 1.5 });
          canvas.renderAll();
          
          return {
            testName: 'Should resize objects correctly',
            passed: rect.scaleX === 2 && rect.scaleY === 1.5,
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect = testUtils.createRectangle({ angle: 0 });
          canvas.add(rect);
          
          rect.set({ angle: 45 });
          canvas.renderAll();
          
          return {
            testName: 'Should rotate objects correctly',
            passed: rect.angle === 45,
            duration: 0,
          };
        },
      ],
    };
  }

  static getLayerManagementSuite(testUtils: CanvasTestUtils): TestSuite {
    return {
      name: 'Layer Management',
      tests: [
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect1 = testUtils.createRectangle({ fill: '#ff0000' });
          const rect2 = testUtils.createRectangle({ fill: '#00ff00' });
          
          canvas.add(rect1);
          canvas.add(rect2);
          
          canvas.bringToFront(rect1);
          
          return {
            testName: 'Should bring objects to front',
            passed: canvas.getObjects()[canvas.getObjects().length - 1] === rect1,
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect1 = testUtils.createRectangle({ fill: '#ff0000' });
          const rect2 = testUtils.createRectangle({ fill: '#00ff00' });
          
          canvas.add(rect1);
          canvas.add(rect2);
          
          canvas.sendToBack(rect2);
          
          return {
            testName: 'Should send objects to back',
            passed: canvas.getObjects()[0] === rect2,
            duration: 0,
          };
        },
      ],
    };
  }

  static getExportSuite(testUtils: CanvasTestUtils): TestSuite {
    return {
      name: 'Export Functionality',
      tests: [
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect = testUtils.createRectangle();
          canvas.add(rect);
          
          const json = await testUtils.exportToJSON();
          const parsed = JSON.parse(json);
          
          return {
            testName: 'Should export canvas to JSON',
            passed: parsed.objects.length === 1 && parsed.objects[0].type === 'rect',
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect = testUtils.createRectangle();
          canvas.add(rect);
          
          const dataUrl = await testUtils.exportToDataURL('png');
          
          return {
            testName: 'Should export canvas to PNG data URL',
            passed: dataUrl.startsWith('data:image/png'),
            duration: 0,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const rect = testUtils.createRectangle();
          canvas.add(rect);
          
          const json = await testUtils.exportToJSON();
          canvas.clear();
          await testUtils.importFromJSON(json);
          
          return {
            testName: 'Should import/export JSON correctly',
            passed: canvas.getObjects().length === 1 && canvas.getObjects()[0].type === 'rect',
            duration: 0,
          };
        },
      ],
    };
  }

  static getPerformanceSuite(testUtils: CanvasTestUtils): TestSuite {
    return {
      name: 'Performance Tests',
      tests: [
        async () => {
          const canvas = await testUtils.createCanvas();
          const state = TestDataGenerator.generateComplexCanvasState(100);
          
          const { duration } = await testUtils.measurePerformance(async () => {
            await testUtils.importFromJSON(JSON.stringify(state));
          });
          
          return {
            testName: 'Should load 100 objects within reasonable time',
            passed: duration < 2000, // 2 seconds
            duration,
          };
        },
        async () => {
          const canvas = await testUtils.createCanvas();
          const state = TestDataGenerator.generateComplexCanvasState(50);
          await testUtils.importFromJSON(JSON.stringify(state));
          
          const { duration } = await testUtils.measurePerformance(() => {
            canvas.renderAll();
          });
          
          return {
            testName: 'Should render 50 objects within reasonable time',
            passed: duration < 100, // 100ms
            duration,
          };
        },
      ],
    };
  }

  static getBrowserCompatibilitySuite(): TestSuite {
    return {
      name: 'Browser Compatibility',
      tests: [
        async () => {
          const supported = BrowserCompatibilityUtils.checkCanvasSupport();
          
          return {
            testName: 'Should support HTML5 Canvas',
            passed: supported,
            duration: 0,
          };
        },
        async () => {
          const supported = BrowserCompatibilityUtils.checkWebGLSupport();
          
          return {
            testName: 'Should support WebGL',
            passed: supported,
            duration: 0,
          };
        },
        async () => {
          const supported = BrowserCompatibilityUtils.checkFileAPISupport();
          
          return {
            testName: 'Should support File API',
            passed: supported,
            duration: 0,
          };
        },
        async () => {
          const supported = BrowserCompatibilityUtils.checkLocalStorageSupport();
          
          return {
            testName: 'Should support Local Storage',
            passed: supported,
            duration: 0,
          };
        },
      ],
    };
  }

  static getAllSuites(testUtils: CanvasTestUtils): TestSuite[] {
    return [
      this.getCanvasInitializationSuite(testUtils),
      this.getDrawingToolsSuite(testUtils),
      this.getObjectManipulationSuite(testUtils),
      this.getLayerManagementSuite(testUtils),
      this.getExportSuite(testUtils),
      this.getPerformanceSuite(testUtils),
      this.getBrowserCompatibilitySuite(),
    ];
  }
}