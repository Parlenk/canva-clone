/**
 * AI Test Runner
 * 
 * Command-line interface for running AI feature tests with various options
 */

import { AITestingAgent } from './ai-testing-agent';
import { promises as fs } from 'fs';
import * as path from 'path';

interface TestRunnerOptions {
  mock?: boolean;
  verbose?: boolean;
  output?: string;
  suite?: string;
  filter?: string;
  parallel?: boolean;
  timeout?: number;
}

class TestRunner {
  private options: TestRunnerOptions;

  constructor(options: TestRunnerOptions = {}) {
    this.options = {
      mock: options.mock ?? false,
      verbose: options.verbose ?? true,
      output: options.output ?? './test-results',
      suite: options.suite,
      filter: options.filter,
      parallel: options.parallel ?? false,
      timeout: options.timeout ?? 30000,
    };
  }

  async run() {
    console.log('🧪 AI Test Runner Starting...');
    console.log(`Options: ${JSON.stringify(this.options, null, 2)}`);

    // Ensure output directory exists
    await this.ensureOutputDir();

    // Create test agent
    const agent = new AITestingAgent({
      mockMode: this.options.mock,
      verboseLogging: this.options.verbose,
      timeoutMs: this.options.timeout,
    });

    // Run environment validation
    console.log('🔍 Validating environment...');
    const envValidation = await agent.validateEnvironment();
    if (!envValidation.valid) {
      console.warn('⚠️ Environment issues detected:', envValidation.issues);
      
      if (this.options.mock) {
        console.log('🎭 Running in mock mode - bypassing environment issues');
      } else {
        console.log('💡 Use --mock flag to run in mock mode');
      }
    }

    // Run tests
    console.log('\n🚀 Running tests...');
    const startTime = Date.now();
    
    try {
      const report = await agent.runAllTests();
      
      // Save results
      await this.saveResults(report);
      
      // Display summary
      this.displaySummary(report, Date.now() - startTime);
      
      return report;
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }

  private async ensureOutputDir() {
    try {
      await fs.mkdir(this.options.output!, { recursive: true });
    } catch (error) {
      console.warn('Could not create output directory:', error);
    }
  }

  private async saveResults(report: any) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ai-test-results-${timestamp}`;
    
    // Save JSON
    await fs.writeFile(
      path.join(this.options.output!, `${filename}.json`),
      JSON.stringify(report, null, 2)
    );
    
    // Save CSV
    const csvContent = this.generateCSV(report);
    await fs.writeFile(
      path.join(this.options.output!, `${filename}.csv`),
      csvContent
    );
    
    // Save HTML report
    const htmlContent = this.generateHTML(report);
    await fs.writeFile(
      path.join(this.options.output!, `${filename}.html`),
      htmlContent
    );
    
    console.log(`📄 Results saved to: ${this.options.output}/${filename}.*`);
  }

  private generateCSV(report: any): string {
    const headers = ['Test Suite', 'Test Name', 'Status', 'Duration (ms)', 'Error', 'Timestamp'];
    const rows = report.results.map((result: any) => [
      result.suite || 'Unknown',
      result.testName,
      result.status,
      result.duration.toString(),
      result.error || '',
      report.timestamp,
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateHTML(report: any): string {
    const passed = report.summary.passedTests;
    const total = report.summary.totalTests;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>AI Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .pass { color: green; }
        .fail { color: red; }
        .error { color: orange; }
        .skip { color: gray; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>AI Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${total}</p>
        <p><strong>Passed:</strong> <span class="pass">${passed}</span></p>
        <p><strong>Failed:</strong> <span class="fail">${report.summary.failedTests}</span></p>
        <p><strong>Errors:</strong> <span class="error">${report.summary.errorTests}</span></p>
        <p><strong>Skipped:</strong> <span class="skip">${report.summary.skippedTests}</span></p>
        <p><strong>Success Rate:</strong> ${successRate}%</p>
        <p><strong>Total Duration:</strong> ${report.summary.totalDuration}ms</p>
        <p><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <thead>
            <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Duration (ms)</th>
                <th>Error</th>
            </tr>
        </thead>
        <tbody>
            ${report.results.map((result: any) => `
                <tr>
                    <td>${result.testName}</td>
                    <td class="${result.status.toLowerCase()}">${result.status}</td>
                    <td>${result.duration}</td>
                    <td>${result.error || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
  }

  private displaySummary(report: any, duration: number) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ✅ ${report.summary.passedTests}`);
    console.log(`Failed: ❌ ${report.summary.failedTests}`);
    console.log(`Errors: ⚠️ ${report.summary.errorTests}`);
    console.log(`Skipped: ⏭️ ${report.summary.skippedTests}`);
    console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`Total Duration: ${duration}ms`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec: string) => console.log(`  • ${rec}`));
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: TestRunnerOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--mock':
        options.mock = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--output':
        if (next) {
          options.output = next;
          i++;
        }
        break;
      case '--suite':
        if (next) {
          options.suite = next;
          i++;
        }
        break;
      case '--filter':
        if (next) {
          options.filter = next;
          i++;
        }
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--timeout':
        if (next) {
          options.timeout = parseInt(next);
          i++;
        }
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        console.warn(`Unknown option: ${arg}`);
    }
  }

  try {
    const runner = new TestRunner(options);
    await runner.run();
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
🧪 AI Test Runner

Usage: npm run test:ai [options]

Options:
  --mock              Run tests in mock mode (bypass real APIs)
  --verbose           Enable verbose logging
  --output DIR        Output directory for results (default: ./test-results)
  --suite NAME        Run specific test suite
  --filter PATTERN    Filter tests by name pattern
  --parallel          Run tests in parallel (experimental)
  --timeout MS        Test timeout in milliseconds (default: 30000)
  --help              Show this help message

Examples:
  npm run test:ai -- --mock --verbose
  npm run test:ai -- --output ./reports --filter "resize"
  npm run test:ai -- --suite "Image Generation"
`);
}

// Export for programmatic use
export { TestRunner };
export type { TestRunnerOptions };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}