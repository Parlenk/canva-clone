/**
 * AI Testing Agent - Example Usage
 * 
 * This file demonstrates how to use the AI Testing Agent
 * for various testing scenarios and use cases.
 */

import { AITestingAgent } from './ai-testing-agent';
import { TestRunner } from './test-runner';
import { getTestConfig } from './test-config';

async function basicUsageExample() {
  console.log('🚀 Basic Usage Example');
  console.log('='.repeat(50));

  // Create test agent with default settings
  const agent = new AITestingAgent({
    mockMode: true, // Use mock responses for demo
    verboseLogging: true,
    timeoutMs: 10000,
  });

  // Validate environment
  console.log('🔍 Validating environment...');
  const envValidation = await agent.validateEnvironment();
  console.log('Environment valid:', envValidation.valid);
  
  if (!envValidation.valid) {
    console.log('Issues:', envValidation.issues);
  }

  // Run all tests
  console.log('\n🧪 Running all AI tests...');
  const report = await agent.runAllTests();

  // Display summary
  console.log('\n📊 Test Summary:');
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passedTests}`);
  console.log(`Failed: ${report.summary.failedTests}`);
  console.log(`Errors: ${report.summary.errorTests}`);
  console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);

  return report;
}

async function advancedUsageExample() {
  console.log('\n\n🔬 Advanced Usage Example');
  console.log('='.repeat(50));

  // Custom test configuration
  const config = getTestConfig('development');
  console.log('Using development config:', {
    mockEnabled: config.mockResponses.enabled,
    maxApiTime: config.performance.maxApiResponseTime,
  });

  // Create agent with custom settings
  const agent = new AITestingAgent({
    mockMode: config.mockResponses.enabled,
    verboseLogging: true,
    timeoutMs: config.performance.maxApiResponseTime,
    retryAttempts: config.retry.maxAttempts,
  });

  // Run tests and get specific results
  const report = await agent.runAllTests();

  // Get results by status
  const failedTests = agent.getResultsByStatus('FAIL');
  const errorTests = agent.getResultsByStatus('ERROR');

  console.log('\n📋 Detailed Results:');
  console.log(`Failed tests: ${failedTests.length}`);
  console.log(`Error tests: ${errorTests.length}`);

  // Export results in different formats
  const jsonResults = agent.exportResults('json');
  const csvResults = agent.exportResults('csv');

  console.log('\n📄 Exported Results:');
  console.log(`JSON length: ${jsonResults.length} characters`);
  console.log(`CSV length: ${csvResults.length} characters`);

  return { report, failedTests, errorTests };
}

async function ciIntegrationExample() {
  console.log('\n\n⚙️ CI Integration Example');
  console.log('='.repeat(50));

  // CI-specific configuration
  const config = getTestConfig('ci');
  console.log('Using CI configuration');

  const agent = new AITestingAgent({
    mockMode: true, // Always use mock mode in CI
    verboseLogging: false, // Reduce logging in CI
    timeoutMs: 10000,
  });

  try {
    const report = await agent.runAllTests();
    
    // CI-specific assertions
    const successRate = report.summary.successRate;
    const minSuccessRate = 80; // 80% minimum success rate
    
    console.log(`\n✅ CI Check: Success rate ${successRate.toFixed(1)}%`);
    
    if (successRate < minSuccessRate) {
      console.error(`❌ CI Failed: Success rate ${successRate.toFixed(1)}% < ${minSuccessRate}%`);
      process.exit(1);
    } else {
      console.log(`✅ CI Passed: Success rate ${successRate.toFixed(1)}% >= ${minSuccessRate}%`);
    }

    return report;
  } catch (error) {
    console.error('❌ CI Tests failed:', error);
    process.exit(1);
  }
}

async function customTestRunnerExample() {
  console.log('\n\n🏃 Custom Test Runner Example');
  console.log('='.repeat(50));

  // Use the TestRunner class
  const runner = new TestRunner({
    mock: true,
    verbose: true,
    output: './test-results',
    timeout: 15000,
  });

  try {
    const report = await runner.run();
    console.log('Custom runner completed successfully');
    return report;
  } catch (error) {
    console.error('Custom runner failed:', error);
    throw error;
  }
}

async function performanceTestingExample() {
  console.log('\n\n📊 Performance Testing Example');
  console.log('='.repeat(50));

  const { PerformanceMonitor } = await import('./test-config');
  
  // Simulate performance testing
  const startTime = Date.now();
  
  // Record some sample metrics
  PerformanceMonitor.recordMetric('api_response_time', 1200);
  PerformanceMonitor.recordMetric('api_response_time', 800);
  PerformanceMonitor.recordMetric('api_response_time', 1500);
  PerformanceMonitor.recordMetric('canvas_processing_time', 2500);
  PerformanceMonitor.recordMetric('canvas_processing_time', 1800);

  // Get performance statistics
  const apiStats = PerformanceMonitor.getMetricStats('api_response_time');
  const canvasStats = PerformanceMonitor.getMetricStats('canvas_processing_time');

  console.log('📈 Performance Statistics:');
  console.log('API Response Times:', apiStats);
  console.log('Canvas Processing Times:', canvasStats);

  // Check against thresholds
  const config = getTestConfig();
  const maxApiTime = config.performance.maxApiResponseTime;
  const maxCanvasTime = config.performance.maxCanvasProcessingTime;

  if (apiStats && apiStats.avg > maxApiTime) {
    console.warn(`⚠️ API response time exceeds threshold: ${apiStats.avg}ms > ${maxApiTime}ms`);
  }

  if (canvasStats && canvasStats.avg > maxCanvasTime) {
    console.warn(`⚠️ Canvas processing time exceeds threshold: ${canvasStats.avg}ms > ${maxCanvasTime}ms`);
  }

  PerformanceMonitor.clear();
  return { apiStats, canvasStats };
}

// Main execution function
async function runAllExamples() {
  console.log('🎯 AI Testing Agent - Examples');
  console.log('================================');

  try {
    // Run basic example
    await basicUsageExample();

    // Run advanced example
    await advancedUsageExample();

    // Run CI integration example
    await ciIntegrationExample();

    // Run custom test runner example
    await customTestRunnerExample();

    // Run performance testing example
    await performanceTestingExample();

    console.log('\n🎉 All examples completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run test:ai:mock');
    console.log('2. Run: npm run test:ai:full');
    console.log('3. Check: ./test-results/ directory for reports');

  } catch (error) {
    console.error('❌ Examples failed:', error);
    process.exit(1);
  }
}

// Run examples if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

// Export for use in other files
export {
  basicUsageExample,
  advancedUsageExample,
  ciIntegrationExample,
  customTestRunnerExample,
  performanceTestingExample,
  runAllExamples,
};