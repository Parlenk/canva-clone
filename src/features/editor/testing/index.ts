import { CanvasInitializationTests } from './canvas-initialization.test';
import { DrawingToolsTests } from './drawing-tools.test';
import { ObjectManipulationTests } from './object-manipulation.test';
import { LayerManagementTests } from './layer-management.test';
import { ExportFunctionalityTests } from './export-functionality.test';
import { UndoRedoTests } from './undo-redo.test';
import { PerformanceTests } from './performance-tests';
import { BrowserCompatibilityUtils } from './canvas-test-utils';
import { TestRunner } from './test-runner';

export interface TestSuiteConfig {
  name: string;
  enabled: boolean;
  advanced: boolean;
}

export interface TestResults {
  suiteName: string;
  tests: Array<{
    testName: string;
    passed: boolean;
    duration: number;
    error?: string;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

export class CanvasTestingAgent {
  private testSuites: Record<string, any> = {};
  private runner: TestRunner;

  constructor() {
    this.runner = new TestRunner();
    this.initializeTestSuites();
  }

  private initializeTestSuites(): void {
    this.testSuites = {
      'canvas-initialization': new CanvasInitializationTests(),
      'drawing-tools': new DrawingToolsTests(),
      'object-manipulation': new ObjectManipulationTests(),
      'layer-management': new LayerManagementTests(),
      'export-functionality': new ExportFunctionalityTests(),
      'undo-redo': new UndoRedoTests(),
      'performance': new PerformanceTests(),
    };
  }

  async runAllTests(config: Partial<Record<string, TestSuiteConfig>> = {}): Promise<TestResults[]> {
    console.log('🚀 Starting Comprehensive Canvas Testing Suite...\n');
    
    const defaultConfig: Record<string, TestSuiteConfig> = {
      'canvas-initialization': { name: 'Canvas Initialization', enabled: true, advanced: false },
      'drawing-tools': { name: 'Drawing Tools', enabled: true, advanced: false },
      'object-manipulation': { name: 'Object Manipulation', enabled: true, advanced: false },
      'layer-management': { name: 'Layer Management', enabled: true, advanced: false },
      'export-functionality': { name: 'Export Functionality', enabled: true, advanced: false },
      'undo-redo': { name: 'Undo/Redo', enabled: true, advanced: false },
      'performance': { name: 'Performance', enabled: true, advanced: true },
    };

    const finalConfig = { ...defaultConfig, ...config };
    const results: TestResults[] = [];
    
    // Check browser compatibility first
    await this.checkBrowserCompatibility();
    
    // Run enabled test suites
    for (const [suiteKey, suiteConfig] of Object.entries(finalConfig)) {
      if (suiteConfig?.enabled && this.testSuites[suiteKey]) {
        console.log(`\n🧪 Running ${suiteConfig.name} Tests...`);
        
        const startTime = performance.now();
        
        try {
          await this.testSuites[suiteKey].runAllTests();
          
          if (suiteConfig.advanced) {
            console.log(`\n🔬 Running Advanced ${suiteConfig.name} Tests...`);
            await this.testSuites[suiteKey].runAdvancedTests();
          }
          
          const duration = performance.now() - startTime;
          
          results.push({
            suiteName: suiteConfig.name,
            tests: this.runner.getResults().filter(r => r.testName.includes(suiteConfig.name)),
            summary: {
              total: this.runner.getResults().length,
              passed: this.runner.getResults().filter(r => r.passed).length,
              failed: this.runner.getResults().filter(r => !r.passed).length,
              duration,
            },
          });
          
        } catch (error) {
          console.error(`❌ Error running ${suiteConfig.name} tests:`, error);
          results.push({
            suiteName: suiteConfig.name,
            tests: [],
            summary: {
              total: 0,
              passed: 0,
              failed: 0,
              duration: 0,
            },
          });
        }
      }
    }
    
    this.generateReport(results);
    return results;
  }

  async runSpecificSuite(suiteName: string, advanced = false): Promise<TestResults> {
    if (!this.testSuites[suiteName]) {
      throw new Error(`Test suite "${suiteName}" not found`);
    }

    console.log(`🧪 Running ${suiteName} tests...`);
    const startTime = performance.now();

    try {
      await this.testSuites[suiteName].runAllTests();
      
      if (advanced) {
        await this.testSuites[suiteName].runAdvancedTests();
      }

      const duration = performance.now() - startTime;
      
      return {
        suiteName,
        tests: this.runner.getResults(),
        summary: {
          total: this.runner.getResults().length,
          passed: this.runner.getResults().filter(r => r.passed).length,
          failed: this.runner.getResults().filter(r => !r.passed).length,
          duration,
        },
      };
    } catch (error) {
      console.error(`❌ Error running ${suiteName} tests:`, error);
      throw error;
    }
  }

  async checkBrowserCompatibility(): Promise<void> {
    console.log('🔍 Checking browser compatibility...');
    
    const compatibility = {
      canvas: BrowserCompatibilityUtils.checkCanvasSupport(),
      webGL: BrowserCompatibilityUtils.checkWebGLSupport(),
      fileAPI: BrowserCompatibilityUtils.checkFileAPISupport(),
      localStorage: BrowserCompatibilityUtils.checkLocalStorageSupport(),
      browserInfo: BrowserCompatibilityUtils.getBrowserInfo(),
    };

    console.log('📊 Browser Compatibility Report:');
    console.log(`- Canvas Support: ${compatibility.canvas ? '✅' : '❌'}`);
    console.log(`- WebGL Support: ${compatibility.webGL ? '✅' : '❌'}`);
    console.log(`- File API Support: ${compatibility.fileAPI ? '✅' : '❌'}`);
    console.log(`- Local Storage Support: ${compatibility.localStorage ? '✅' : '❌'}`);
    console.log('- Browser Info:', compatibility.browserInfo);
  }

  generateReport(results: TestResults[]): string {
    const totalTests = results.reduce((sum, result) => sum + result.summary.total, 0);
    const totalPassed = results.reduce((sum, result) => sum + result.summary.passed, 0);
    const totalFailed = results.reduce((sum, result) => sum + result.summary.failed, 0);
    const totalDuration = results.reduce((sum, result) => sum + result.summary.duration, 0);

    const report = [
      '# Comprehensive Canvas Testing Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Total Tests: ${totalTests}`,
      `- Passed: ${totalPassed}`,
      `- Failed: ${totalFailed}`,
      `- Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`,
      `- Total Duration: ${totalDuration.toFixed(2)}ms`,
      '',
      '## Detailed Results by Suite',
      ...results.map(result => [
        `### ${result.suiteName}`,
        `- Total: ${result.summary.total}`,
        `- Passed: ${result.summary.passed}`,
        `- Failed: ${result.summary.failed}`,
        `- Duration: ${result.summary.duration.toFixed(2)}ms`,
        result.summary.failed > 0 
          ? `- Failed Tests: ${result.tests.filter(t => !t.passed).map(t => t.testName).join(', ')}`
          : '- All tests passed ✅',
        '',
      ]).flat(),
    ];

    const reportString = report.join('\n');
    console.log('\n' + reportString);
    
    return reportString;
  }

  async createTestRunnerInterface(): Promise<{
    runAll: () => Promise<TestResults[]>;
    runSuite: (suiteName: string, advanced?: boolean) => Promise<TestResults>;
    getReport: () => string;
  }> {
    return {
      runAll: () => this.runAllTests(),
      runSuite: (suiteName: string, advanced = false) => this.runSpecificSuite(suiteName, advanced),
      getReport: () => this.generateReport([]),
    };
  }

  static async createInteractiveTestRunner(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Create test runner UI
    const testRunnerUI = document.createElement('div');
    testRunnerUI.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      max-height: 400px;
      overflow-y: auto;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 12px;
    `;

    testRunnerUI.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 14px;">Canvas Test Runner</h3>
      <div style="margin-bottom: 12px;">
        <button id="run-all-tests" style="margin-right: 8px; padding: 4px 8px; font-size: 11px;">Run All</button>
        <button id="run-basic-tests" style="margin-right: 8px; padding: 4px 8px; font-size: 11px;">Basic</button>
        <button id="run-performance-tests" style="padding: 4px 8px; font-size: 11px;">Performance</button>
      </div>
      <div id="test-results" style="font-size: 11px; max-height: 300px; overflow-y: auto;"></div>
    `;

    document.body.appendChild(testRunnerUI);

    const agent = new CanvasTestingAgent();

    // Add event listeners
    const runAllBtn = testRunnerUI.querySelector('#run-all-tests') as HTMLButtonElement;
    const runBasicBtn = testRunnerUI.querySelector('#run-basic-tests') as HTMLButtonElement;
    const runPerfBtn = testRunnerUI.querySelector('#run-performance-tests') as HTMLButtonElement;
    const resultsDiv = testRunnerUI.querySelector('#test-results') as HTMLDivElement;

    const runTests = async (type: string) => {
      try {
        resultsDiv.innerHTML = 'Running tests...';
        
        let results = [];
        switch (type) {
          case 'all':
            results = await agent.runAllTests();
            break;
          case 'basic':
            results = await agent.runAllTests({
              'canvas-initialization': { name: 'Canvas Initialization', enabled: true, advanced: false },
              'drawing-tools': { name: 'Drawing Tools', enabled: true, advanced: false },
              'object-manipulation': { name: 'Object Manipulation', enabled: true, advanced: false },
            });
            break;
          case 'performance':
            results = await agent.runSpecificSuite('performance', true);
            break;
        }

        resultsDiv.innerHTML = results
          .map(result => `
            <div style="margin-bottom: 8px;">
              <strong>${result.suiteName}</strong>
              <div style="color: ${result.summary.failed > 0 ? '#e74c3c' : '#27ae60'};">
                ${result.summary.passed}/${result.summary.total} passed
              </div>
            </div>
          `)
          .join('');
      } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
      }
    };

    runAllBtn.addEventListener('click', () => runTests('all'));
    runBasicBtn.addEventListener('click', () => runTests('basic'));
    runPerfBtn.addEventListener('click', () => runTests('performance'));
  }
}

// Export for programmatic use
export const canvasTestingAgent = new CanvasTestingAgent();

// Auto-create UI if running in browser
if (typeof window !== 'undefined') {
  // Create test runner UI when page loads
  window.addEventListener('load', () => {
    // Only create if not already present
    if (!document.querySelector('#canvas-test-runner')) {
      CanvasTestingAgent.createInteractiveTestRunner().catch(console.error);
    }
  });

  // Add global access
  (window as any).CanvasTestingAgent = CanvasTestingAgent;
  (window as any).runCanvasTests = () => canvasTestingAgent.runAllTests();
}

// CLI-style exports
export {
  CanvasInitializationTests,
  DrawingToolsTests,
  ObjectManipulationTests,
  LayerManagementTests,
  ExportFunctionalityTests,
  UndoRedoTests,
  PerformanceTests,
};