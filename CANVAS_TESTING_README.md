# Canvas Testing Framework

A comprehensive automated testing framework for the Canva clone canvas functionality using Fabric.js.

## Overview

This testing framework provides extensive coverage for:
- Canvas initialization and state management
- Drawing tools functionality (shapes, text, images)
- Object manipulation (move, resize, rotate, transform)
- Layer management and z-index operations
- Export functionality (PNG, SVG, JSON)
- Undo/redo functionality
- Performance testing for large canvases
- Cross-browser compatibility

## Quick Start

### Basic Usage

```bash
# Run all canvas tests
npm run test:canvas:all

# Run basic tests only
npm run test:canvas:basic

# Run performance tests
npm run test:canvas:performance

# Run specific test suite
npm run test:canvas
```

### Interactive Testing

When running the application, add the test parameters to the URL:

```
# Run canvas initialization tests
http://localhost:3000/editor?run-tests=true

# Run drawing tools tests
http://localhost:3000/editor?run-drawing-tests=true

# Run object manipulation tests
http://localhost:3000/editor?run-manipulation-tests=true

# Run layer management tests
http://localhost:3000/editor?run-layer-tests=true

# Run export functionality tests
http://localhost:3000/editor?run-export-tests=true

# Run undo/redo tests
http://localhost:3000/editor?run-undo-tests=true

# Run performance tests
http://localhost:3000/editor?run-performance-tests=true
```

## Test Suites

### 1. Canvas Initialization Tests
Tests basic canvas setup, workspace initialization, clip paths, and zoom functionality.

**Files:**
- `canvas-initialization.test.ts`
- Tests: workspace creation, clip path handling, zoom initialization, event listeners

### 2. Drawing Tools Tests
Tests all drawing functionality including shapes, text, images, and drawing mode.

**Files:**
- `drawing-tools.test.ts`
- Tests: rectangle, circle, triangle creation, text formatting, image handling, drawing mode

### 3. Object Manipulation Tests
Tests object transformations including movement, resizing, rotation, and complex manipulations.

**Files:**
- `object-manipulation.test.ts`
- Tests: precise movement, constrained movement, scaling, rotation, skewing, flipping

### 4. Layer Management Tests
Tests z-index operations, layer visibility, grouping, and complex hierarchies.

**Files:**
- `layer-management.test.ts`
- Tests: z-index manipulation, visibility toggling, layer locking, grouping

### 5. Export Functionality Tests
Tests all export formats and quality settings.

**Files:**
- `export-functionality.test.ts`
- Tests: PNG/JPEG quality, SVG export, JSON serialization, transparency handling

### 6. Undo/Redo Tests
Tests history management and state consistency.

**Files:**
- `undo-redo.test.ts`
- Tests: basic undo/redo, transformations, deletions, property changes

### 7. Performance Tests
Tests rendering performance under various loads.

**Files:**
- `performance-tests.ts`
- Tests: large canvas performance, complex objects, memory usage, real-time rendering

## Programmatic Usage

### Basic API

```typescript
import { canvasTestingAgent } from '@/features/editor/testing';

// Run all tests
const results = await canvasTestingAgent.runAllTests();

// Run specific suite
const results = await canvasTestingAgent.runSpecificSuite('drawing-tools', true);

// Run with custom configuration
const results = await canvasTestingAgent.runAllTests({
  'canvas-initialization': { name: 'Canvas Init', enabled: true, advanced: false },
  'performance': { name: 'Performance', enabled: true, advanced: true },
});
```

### Individual Test Suites

```typescript
import { CanvasInitializationTests } from '@/features/editor/testing/canvas-initialization.test';

const tests = new CanvasInitializationTests();
await tests.runAllTests();
await tests.runAdvancedTests();
```

## Test Utilities

### CanvasTestUtils
Provides utilities for:
- Canvas creation and cleanup
- Object creation (rectangles, circles, text, images)
- Event simulation
- Performance measurement
- State validation

### Browser Compatibility
Tests automatically check for:
- HTML5 Canvas support
- WebGL support
- File API support
- Local Storage support

## Configuration

### Test Configuration
You can configure which tests to run:

```typescript
const config = {
  'canvas-initialization': { name: 'Canvas Init', enabled: true, advanced: false },
  'drawing-tools': { name: 'Drawing Tools', enabled: true, advanced: true },
  'performance': { name: 'Performance', enabled: true, advanced: true },
  // ... other suites
};

await canvasTestingAgent.runAllTests(config);
```

## Performance Benchmarks

The performance tests include:
- **Large Canvas**: 1000+ objects rendering under 1 second
- **Complex Objects**: Complex paths and transformations under 500ms
- **Memory Usage**: <1MB per 500 objects
- **Real-time Rendering**: 30fps (33ms per frame)
- **Export Performance**: <3 seconds for complex content

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Debugging

### Adding Test Logs
```typescript
// Enable verbose logging
window.location.search = '?verbose=true';

// Check console for detailed test output
```

### Test Failure Analysis
Each test provides:
- Detailed error messages
- Performance metrics
- State validation results
- Browser compatibility info

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Canvas Tests
  run: npm run test:canvas:all
```

### Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:canvas:basic"
    }
  }
}
```

## Contributing Tests

### Adding New Tests
1. Create a new test file in `src/features/editor/testing/`
2. Extend the appropriate test class
3. Add the test to the main index.ts
4. Update the package.json scripts

### Test Structure
```typescript
export class NewFeatureTests {
  async runAllTests(): Promise<void> {
    // Basic tests
  }
  
  async runAdvancedTests(): Promise<void> {
    // Advanced tests
  }
}
```

## Troubleshooting

### Common Issues

1. **Canvas not initialized**: Ensure Fabric.js is properly loaded
2. **Memory leaks**: Check for proper cleanup in tests
3. **Performance issues**: Reduce object count in tests
4. **Browser compatibility**: Check console for compatibility warnings

### Debug Mode
```bash
# Run with debug output
npm run test:canvas -- --debug

# Run specific test with verbose output
npm run test:canvas -- --verbose --suite=drawing-tools
```

## Test Results Format

Test results are provided in the following format:
```json
{
  "suiteName": "Drawing Tools",
  "tests": [
    {
      "testName": "Should add rectangle to canvas",
      "passed": true,
      "duration": 12.5,
      "error": null
    }
  ],
  "summary": {
    "total": 10,
    "passed": 8,
    "failed": 2,
    "duration": 125.3
  }
}
```

## License

This testing framework is part of the Canva clone project and follows the same MIT license.