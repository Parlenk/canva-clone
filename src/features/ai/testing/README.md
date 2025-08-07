# AI Testing Agent Documentation

## Overview

The AI Testing Agent is a comprehensive testing framework designed specifically for testing AI-powered features in the Canva Clone project. It provides defensive testing patterns, mock capabilities, and detailed reporting for all AI features.

## Features

- **Comprehensive Testing**: Tests all AI features including image generation, background removal, AI resize, Adobe AI parsing, and training pipelines
- **Mock Mode**: Run tests without real API calls for development and CI
- **Detailed Reporting**: JSON, CSV, and HTML test reports
- **Performance Monitoring**: Track API response times and resource usage
- **Retry Logic**: Automatic retry with exponential backoff
- **Environment Validation**: Check for required environment variables
- **Defensive Testing**: Graceful handling of API failures and edge cases

## Quick Start

### Basic Usage

```bash
# Run all AI tests
npm run test:ai

# Run tests in mock mode (no real API calls)
npm run test:ai:mock

# Run with verbose output
npm run test:ai:full

# Run specific test suite
npm run test:ai:suite "Image Generation API Tests"

# Run tests matching a filter
npm run test:ai:filter "resize"
```

### Programmatic Usage

```typescript
import { AITestingAgent } from './ai-testing-agent';

// Create test agent
const agent = new AITestingAgent({
  mockMode: false,
  verboseLogging: true,
  timeoutMs: 30000,
  retryAttempts: 3,
});

// Validate environment
const envValidation = await agent.validateEnvironment();
if (!envValidation.valid) {
  console.warn('Environment issues:', envValidation.issues);
}

// Run all tests
const report = await agent.runAllTests();
console.log(`Success rate: ${report.summary.successRate}%`);

// Export results
const jsonResults = agent.exportResults('json');
const csvResults = agent.exportResults('csv');
```

## Test Suites

### 1. Image Generation API Tests
- **Generate Image Success**: Tests successful image generation via Replicate API
- **Generate Image Invalid Prompt**: Tests handling of invalid prompts
- **Generate Image Rate Limit**: Tests rate limiting behavior
- **Generate Image Large Dimensions**: Tests large image generation

### 2. Background Removal API Tests
- **Remove Background Success**: Tests successful background removal
- **Remove Background Invalid Image**: Tests handling of invalid images
- **Remove Background Corrupted Image**: Tests handling of corrupted images

### 3. AI Resize Tests
- **AI Resize Canvas**: Tests AI-powered canvas resize
- **AI Resize Extreme Ratios**: Tests handling of extreme aspect ratio changes
- **AI Resize Empty Canvas**: Tests handling of empty canvas
- **AI Resize Complex Layout**: Tests complex layout preservation

### 4. Adobe AI Parser Tests
- **Parse AI File**: Tests Adobe AI file parsing
- **Parse Invalid AI File**: Tests handling of invalid AI files
- **Parse Different AI Versions**: Tests parsing different AI file versions
- **Convert to Fabric Objects**: Tests conversion to Fabric.js objects

### 5. Training Pipeline Tests
- **Extract Training Features**: Tests feature extraction for ML training
- **Calculate Quality Score**: Tests quality score calculation
- **Generate Training Batch**: Tests training data preparation
- **Analyze Patterns**: Tests pattern analysis for model improvement

### 6. A/B Testing Tests
- **A/B Test Variant Assignment**: Tests variant assignment consistency
- **A/B Test Metrics Recording**: Tests metrics recording
- **A/B Test Performance Comparison**: Tests performance comparison
- **A/B Test Statistical Significance**: Tests significance calculations

## Configuration

### Environment Variables

Required environment variables:
- `REPLICATE_API_TOKEN`: Replicate API token for image generation
- `OPENAI_API_KEY`: OpenAI API key for vision and AI features
- `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`: Unsplash API key for images

Optional environment variables:
- `GOOGLE_CLOUD_PROJECT_ID`: Google Cloud project for Vision API
- `GOOGLE_CLOUD_API_KEY`: Google Cloud API key

### Test Configuration

```typescript
// Custom test configuration
const config = {
  endpoints: {
    generateImage: '/api/ai/generate-image',
    removeBackground: '/api/ai/remove-bg',
  },
  mockResponses: {
    enabled: true,
    delay: 1000,
    failRate: 0.1,
  },
  performance: {
    maxApiResponseTime: 30000,
    maxCanvasProcessingTime: 10000,
  },
};
```

## Advanced Usage

### Custom Test Cases

```typescript
import { AITestSuite, AITestCase } from './ai-testing-agent';

const customSuite: AITestSuite = {
  name: 'Custom AI Tests',
  tests: [
    {
      name: 'My Custom Test',
      description: 'Tests custom AI functionality',
      testFn: async () => {
        // Your test logic here
        return {
          testName: 'My Custom Test',
          status: 'PASS',
          duration: 100,
          details: { custom: 'data' },
          warnings: [],
        };
      },
    },
  ],
};
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from './test-config';

// Record metrics during tests
PerformanceMonitor.recordMetric('api_response_time', 1234);

// Get performance statistics
const stats = PerformanceMonitor.getMetricStats('api_response_time');
console.log(stats); // { count, min, max, avg, median, p95, p99 }
```

### Test Data Generation

```typescript
import { testDataGenerators } from './test-config';

// Generate random test data
const canvasConfig = testDataGenerators.generateRandomCanvasConfig();
const objects = testDataGenerators.generateRandomObjects(5);
const invalidInputs = testDataGenerators.generateInvalidInputs();
```

## CI/CD Integration

### GitHub Actions

```yaml
name: AI Tests
on: [push, pull_request]

jobs:
  test-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run AI tests
        run: npm run test:ai:mock
        env:
          NODE_ENV: ci
```

### Environment Setup

```bash
# Create test environment file
cp .env.example .env.test

# Set test-specific variables
echo "NODE_ENV=test" >> .env.test
echo "REPLICATE_API_TOKEN=mock-token" >> .env.test
echo "OPENAI_API_KEY=mock-key" >> .env.test
```

## Troubleshooting

### Common Issues

1. **Test timeouts**: Increase timeout with `--timeout` flag
2. **Environment variables**: Check with `agent.validateEnvironment()`
3. **Network issues**: Use `--mock` flag for offline testing
4. **Memory issues**: Monitor with `PerformanceMonitor`

### Debug Mode

```typescript
const agent = new AITestingAgent({
  verboseLogging: true,
  timeoutMs: 60000,
});

// Run with detailed logging
console.log('Starting tests...');
const report = await agent.runAllTests();
console.log('Detailed results:', report);
```

## Output Formats

### JSON Report

```json
{
  "summary": {
    "totalTests": 50,
    "passedTests": 45,
    "failedTests": 3,
    "errorTests": 2,
    "skippedTests": 0,
    "successRate": 90,
    "totalDuration": 45000
  },
  "results": [...],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "recommendations": [...]
}
```

### HTML Report

Generates a comprehensive HTML report with:
- Interactive test results
- Performance charts
- Error details
- Recommendations
- Export functionality

## Contributing

To add new test cases:

1. Create test function in appropriate test suite
2. Add error handling and edge cases
3. Include performance assertions
4. Add mock responses if needed
5. Update documentation

```typescript
// Example new test
testFn: async () => {
  try {
    const result = await myAiFunction(testData);
    
    // Validate result
    assert(result.success === true);
    assert(result.data != null);
    assert(result.processingTime < 5000);
    
    return {
      testName: 'New AI Function',
      status: 'PASS',
      duration: Date.now() - startTime,
      details: result,
      warnings: [],
    };
  } catch (error) {
    return {
      testName: 'New AI Function',
      status: 'ERROR',
      duration: Date.now() - startTime,
      error: error.message,
      details: null,
      warnings: [],
    };
  }
}
```