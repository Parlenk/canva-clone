/**
 * AI Testing Configuration
 * 
 * Centralized configuration for AI feature testing
 */

export interface TestConfiguration {
  // API Endpoints
  endpoints: {
    generateImage: string;
    removeBackground: string;
    visionResize: string;
    adobeAIParse: string;
    trainingData: string;
  };

  // Mock responses
  mockResponses: {
    enabled: boolean;
    delay: number; // ms
    failRate: number; // 0-1
  };

  // Test data
  testData: {
    images: {
      valid: string[];
      invalid: string[];
      large: string[];
      corrupted: string[];
    };
    aiFiles: {
      valid: string[];
      invalid: string[];
      version: string[];
    };
    canvasConfigs: Array<{
      width: number;
      height: number;
      objects: number;
    }>;
  };

  // Performance thresholds
  performance: {
    maxApiResponseTime: number; // ms
    maxCanvasProcessingTime: number; // ms
    maxMemoryUsage: number; // MB
  };

  // Retry configuration
  retry: {
    maxAttempts: number;
    baseDelay: number; // ms
    maxDelay: number; // ms
    backoffMultiplier: number;
  };

  // Validation rules
  validation: {
    canvasBounds: {
      minWidth: number;
      maxWidth: number;
      minHeight: number;
      maxHeight: number;
    };
    objectLimits: {
      maxObjects: number;
      minScale: number;
      maxScale: number;
    };
    textLimits: {
      minFontSize: number;
      maxFontSize: number;
    };
  };

  // A/B testing
  abTesting: {
    variants: Array<{
      id: string;
      name: string;
      weight: number;
      prompt: string;
    }>;
    minSampleSize: number;
    significanceLevel: number;
  };
}

export const defaultTestConfig: TestConfiguration = {
  endpoints: {
    generateImage: '/api/ai/generate-image',
    removeBackground: '/api/ai/remove-bg',
    visionResize: '/api/ai/vision-resize',
    adobeAIParse: '/api/convert/adobe-ai',
    trainingData: '/api/ai/training-data',
  },

  mockResponses: {
    enabled: false,
    delay: 1000,
    failRate: 0.1,
  },

  testData: {
    images: {
      valid: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      ],
      invalid: [
        'https://invalid-url.com/image.jpg',
        'data:text/plain;base64,invalid',
        'file:///nonexistent.jpg',
      ],
      large: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=4000',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=4000',
      ],
      corrupted: [
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AB8A',
      ],
    },
    aiFiles: {
      valid: [
        'test-files/sample.ai',
        'test-files/simple-logo.ai',
        'test-files/complex-design.ai',
      ],
      invalid: [
        'test-files/not-ai.pdf',
        'test-files/corrupted.ai',
        'test-files/empty.ai',
      ],
      version: [
        'test-files/ai-v24.ai',
        'test-files/ai-v25.ai',
        'test-files/ai-v26.ai',
      ],
    },
    canvasConfigs: [
      { width: 400, height: 300, objects: 1 },
      { width: 800, height: 600, objects: 5 },
      { width: 1200, height: 800, objects: 10 },
      { width: 1920, height: 1080, objects: 20 },
      { width: 3840, height: 2160, objects: 50 },
    ],
  },

  performance: {
    maxApiResponseTime: 30000,
    maxCanvasProcessingTime: 10000,
    maxMemoryUsage: 512,
  },

  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },

  validation: {
    canvasBounds: {
      minWidth: 100,
      maxWidth: 10000,
      minHeight: 100,
      maxHeight: 10000,
    },
    objectLimits: {
      maxObjects: 1000,
      minScale: 0.1,
      maxScale: 10,
    },
    textLimits: {
      minFontSize: 8,
      maxFontSize: 200,
    },
  },

  abTesting: {
    variants: [
      {
        id: 'original',
        name: 'Original Prompt',
        weight: 50,
        prompt: 'Standard AI resize prompt',
      },
      {
        id: 'enhanced',
        name: 'Enhanced Prompt',
        weight: 30,
        prompt: 'Enhanced AI resize prompt with design principles',
      },
      {
        id: 'experimental',
        name: 'Experimental Prompt',
        weight: 20,
        prompt: 'Experimental AI resize prompt with advanced features',
      },
    ],
    minSampleSize: 100,
    significanceLevel: 0.05,
  },
};

// Environment-specific configurations
export const testConfigs = {
  development: {
    ...defaultTestConfig,
    mockResponses: {
      enabled: true,
      delay: 500,
      failRate: 0.05,
    },
    performance: {
      maxApiResponseTime: 60000,
      maxCanvasProcessingTime: 20000,
      maxMemoryUsage: 1024,
    },
  },

  staging: {
    ...defaultTestConfig,
    mockResponses: {
      enabled: false,
      delay: 1000,
      failRate: 0.1,
    },
  },

  production: {
    ...defaultTestConfig,
    mockResponses: {
      enabled: false,
      delay: 2000,
      failRate: 0.01,
    },
    performance: {
      maxApiResponseTime: 15000,
      maxCanvasProcessingTime: 5000,
      maxMemoryUsage: 256,
    },
  },

  ci: {
    ...defaultTestConfig,
    mockResponses: {
      enabled: true,
      delay: 100,
      failRate: 0,
    },
    performance: {
      maxApiResponseTime: 10000,
      maxCanvasProcessingTime: 5000,
      maxMemoryUsage: 128,
    },
  },
};

// Configuration factory
export function getTestConfig(environment?: string): TestConfiguration {
  const env = environment || process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return testConfigs.production;
    case 'staging':
      return testConfigs.staging;
    case 'ci':
    case 'test':
      return testConfigs.ci;
    case 'development':
    default:
      return testConfigs.development;
  }
}

// Validation helpers
export const validationHelpers = {
  isValidCanvasSize(width: number, height: number): boolean {
    const config = getTestConfig();
    const { minWidth, maxWidth, minHeight, maxHeight } = config.validation.canvasBounds;
    
    return width >= minWidth && width <= maxWidth &&
           height >= minHeight && height <= maxHeight;
  },

  isValidObjectCount(count: number): boolean {
    const config = getTestConfig();
    return count <= config.validation.objectLimits.maxObjects;
  },

  isValidScale(scale: number): boolean {
    const config = getTestConfig();
    const { minScale, maxScale } = config.validation.objectLimits;
    return scale >= minScale && scale <= maxScale;
  },

  isValidFontSize(size: number): boolean {
    const config = getTestConfig();
    const { minFontSize, maxFontSize } = config.validation.textLimits;
    return size >= minFontSize && size <= maxFontSize;
  },

  calculateRetryDelay(attempt: number): number {
    const config = getTestConfig();
    const { baseDelay, maxDelay, backoffMultiplier } = config.retry;
    
    const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
    return Math.min(delay, maxDelay);
  },

  shouldFailMock(): boolean {
    const config = getTestConfig();
    return config.mockResponses.enabled && 
           Math.random() < config.mockResponses.failRate;
  },
};

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  static getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  static getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((values, name) => {
      result[name] = this.getMetricStats(name);
    });
    return result;
  }

  static clear() {
    this.metrics.clear();
  }
}

// Environment variable helpers
export const envHelpers = {
  getRequiredEnvVars(): string[] {
    return [
      'REPLICATE_API_TOKEN',
      'OPENAI_API_KEY',
      'NEXT_PUBLIC_UNSPLASH_ACCESS_KEY',
    ];
  },

  getOptionalEnvVars(): string[] {
    return [
      'GOOGLE_CLOUD_PROJECT_ID',
      'GOOGLE_CLOUD_API_KEY',
      'STRIPE_SECRET_KEY',
    ];
  },

  validateEnvVars(): {
    required: Record<string, boolean>;
    optional: Record<string, boolean>;
  } {
    const required = this.getRequiredEnvVars().reduce((acc, key) => {
      acc[key] = !!process.env[key];
      return acc;
    }, {} as Record<string, boolean>);

    const optional = this.getOptionalEnvVars().reduce((acc, key) => {
      acc[key] = !!process.env[key];
      return acc;
    }, {} as Record<string, boolean>);

    return { required, optional };
  },
};

// Test data generators
export const testDataGenerators = {
  generateRandomCanvasConfig(): { width: number; height: number; objects: number } {
    const configs = getTestConfig().testData.canvasConfigs;
    return configs[Math.floor(Math.random() * configs.length)];
  },

  generateRandomObjects(count: number): Array<{
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
  }> {
    const types = ['rect', 'circle', 'text', 'image', 'path'];
    const objects = [];
    
    for (let i = 0; i < count; i++) {
      objects.push({
        type: types[Math.floor(Math.random() * types.length)],
        left: Math.random() * 800,
        top: Math.random() * 600,
        width: 50 + Math.random() * 200,
        height: 50 + Math.random() * 200,
        scaleX: 0.5 + Math.random() * 1.5,
        scaleY: 0.5 + Math.random() * 1.5,
      });
    }
    
    return objects;
  },

  generateInvalidInputs(): Array<{
    type: string;
    value: any;
    expectedError: string;
  }> {
    return [
      {
        type: 'canvas',
        value: { width: 0, height: 0 },
        expectedError: 'Invalid canvas dimensions',
      },
      {
        type: 'objects',
        value: [],
        expectedError: 'No objects provided',
      },
      {
        type: 'prompt',
        value: '',
        expectedError: 'Empty prompt provided',
      },
      {
        type: 'image',
        value: 'invalid-url',
        expectedError: 'Invalid image URL',
      },
    ];
  },
};

// Export for use in tests
export default {
  getTestConfig,
  testConfigs,
  validationHelpers,
  PerformanceMonitor,
  envHelpers,
  testDataGenerators,
};