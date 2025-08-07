/**
 * Centralized Error Handling for AI Training System
 * 
 * This module provides robust error handling utilities to prevent system failures
 * and provide meaningful error messages to users and developers.
 */

export class AITrainingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AITrainingError';
  }
}

export class ValidationError extends AITrainingError {
  constructor(message: string, field: string, value?: any) {
    super(
      `Validation failed for ${field}: ${message}`,
      'VALIDATION_ERROR',
      { field, value },
      `Invalid ${field}: ${message}`
    );
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AITrainingError {
  constructor(message: string, operation: string, details?: any) {
    super(
      `Database operation failed: ${message}`,
      'DATABASE_ERROR',
      { operation, ...details },
      'Database operation failed. Please try again.'
    );
    this.name = 'DatabaseError';
  }
}

export class AIProcessingError extends AITrainingError {
  constructor(message: string, step: string, details?: any) {
    super(
      `AI processing failed at ${step}: ${message}`,
      'AI_PROCESSING_ERROR',
      { step, ...details },
      'AI processing failed. Please try again.'
    );
    this.name = 'AIProcessingError';
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse(jsonString: string, fallback: any = null): any {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return fallback;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safely stringify JSON with error handling
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    if (obj === null || obj === undefined) {
      return fallback;
    }
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('Failed to stringify JSON:', error);
    return fallback;
  }
}

/**
 * Validate and sanitize user input
 */
export function validateUserInput(input: any, rules: {
  required?: boolean;
  type?: 'string' | 'number' | 'object' | 'array' | 'boolean';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  allowedValues?: any[];
}): { isValid: boolean; error?: string; sanitized?: any } {
  const { required = false, type, minLength, maxLength, min, max, allowedValues } = rules;

  // Check if required
  if (required && (input === null || input === undefined || input === '')) {
    return { isValid: false, error: 'This field is required' };
  }

  // If not required and empty, return as valid
  if (!required && (input === null || input === undefined || input === '')) {
    return { isValid: true, sanitized: input };
  }

  // Type validation
  if (type) {
    const inputType = Array.isArray(input) ? 'array' : typeof input;
    if (inputType !== type) {
      return { isValid: false, error: `Expected ${type}, got ${inputType}` };
    }
  }

  let sanitized = input;

  // String validations
  if (type === 'string' && typeof input === 'string') {
    sanitized = input.trim();
    
    if (minLength && sanitized.length < minLength) {
      return { isValid: false, error: `Minimum length is ${minLength}` };
    }
    
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength);
    }
  }

  // Number validations
  if (type === 'number' && typeof input === 'number') {
    if (isNaN(input) || !isFinite(input)) {
      return { isValid: false, error: 'Invalid number' };
    }
    
    if (min !== undefined && input < min) {
      return { isValid: false, error: `Minimum value is ${min}` };
    }
    
    if (max !== undefined && input > max) {
      return { isValid: false, error: `Maximum value is ${max}` };
    }
  }

  // Allowed values validation
  if (allowedValues && !allowedValues.includes(input)) {
    return { isValid: false, error: `Value must be one of: ${allowedValues.join(', ')}` };
  }

  return { isValid: true, sanitized };
}

/**
 * Safely execute async operations with retries
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    exponentialBackoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, exponentialBackoff = true, onRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      if (onRetry) {
        onRetry(attempt, error instanceof Error ? error : new Error(String(error)));
      }

      const currentDelay = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  throw new Error('Operation failed after all retries');
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of Array.from(this.requests.entries())) {
      const validRequests = requests.filter(time => now - time < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeMs: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Global error handler for unhandled promises
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    // Client-side error handling
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    });

    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });
  } else {
    // Server-side error handling
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }
}

/**
 * Create rate limiter instances for different operations
 */
export const rateLimiters = {
  feedback: new RateLimiter(10, 60000), // 10 feedback submissions per minute
  retraining: new RateLimiter(1, 300000), // 1 retraining per 5 minutes
  analytics: new RateLimiter(100, 60000), // 100 analytics requests per minute
};

/**
 * Circuit breakers for external services
 */
export const circuitBreakers = {
  openai: new CircuitBreaker(5, 60000), // 5 failures, 1 minute recovery
  database: new CircuitBreaker(3, 30000), // 3 failures, 30 seconds recovery
};

// Initialize global error handling
setupGlobalErrorHandling();