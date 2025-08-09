/**
 * Rate limiter implementation for API calls and operations
 * Prevents abuse and ensures fair usage of resources
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private limits = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval = 60000; // Clean up every minute
  private cleanupTimer?: NodeJS.Timeout;

  // Default rate limit configurations
  private readonly defaultLimits: Record<string, RateLimitConfig> = {
    api_calls: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      burstAllowance: 10, // Allow burst of 10 requests
    },
    terminal_commands: {
      maxRequests: 20,
      windowMs: 60000,
      burstAllowance: 5,
    },
    file_operations: {
      maxRequests: 50,
      windowMs: 60000,
      burstAllowance: 10,
    },
    chat_messages: {
      maxRequests: 200,
      windowMs: 60000,
      burstAllowance: 20,
    },
    code_completion: {
      maxRequests: 500,
      windowMs: 60000,
      burstAllowance: 50,
    },
  };

  private constructor() {
    // Start cleanup timer
    this.startCleanupTimer();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if request is allowed under rate limit
   */
  public checkLimit(
    key: string,
    customConfig?: Partial<RateLimitConfig>,
  ): RateLimitResult {
    const config = { ...this.getConfig(key), ...customConfig };
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entry = this.limits.get(key);

    if (!entry) {
      // First request for this key
      entry = {
        requests: [],
        burstCount: 0,
        lastReset: now,
      };
      this.limits.set(key, entry);
    }

    // Clean old requests outside the window
    entry.requests = entry.requests.filter(
      (timestamp) => timestamp > windowStart,
    );

    // Reset burst count if enough time has passed (reset every 10 seconds)
    if (now - entry.lastReset > 10000) {
      entry.burstCount = 0;
      entry.lastReset = now;
    }

    // Check burst limit first
    if (entry.burstCount >= config.burstAllowance) {
      const timeUntilBurstReset = 10000 - (now - entry.lastReset);
      return {
        allowed: false,
        reason: "Burst limit exceeded",
        retryAfter: Math.ceil(timeUntilBurstReset / 1000),
        remainingRequests: 0,
        resetTime: new Date(now + timeUntilBurstReset),
      };
    }

    // Check rate limit
    if (entry.requests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...entry.requests);
      const timeUntilReset = config.windowMs - (now - oldestRequest);

      return {
        allowed: false,
        reason: "Rate limit exceeded",
        retryAfter: Math.ceil(timeUntilReset / 1000),
        remainingRequests: 0,
        resetTime: new Date(now + timeUntilReset),
      };
    }

    // Allow the request
    entry.requests.push(now);
    entry.burstCount++;

    const remainingRequests = config.maxRequests - entry.requests.length;
    const resetTime = new Date(now + config.windowMs);

    return {
      allowed: true,
      reason: "Request allowed",
      retryAfter: 0,
      remainingRequests,
      resetTime,
    };
  }

  /**
   * Record a successful request (for tracking purposes)
   */
  public recordRequest(key: string): void {
    const result = this.checkLimit(key);
    if (!result.allowed) {
      throw new Error(`Rate limit exceeded for ${key}: ${result.reason}`);
    }
  }

  /**
   * Get current status for a key
   */
  public getStatus(key: string): RateLimitStatus {
    const config = this.getConfig(key);
    const entry = this.limits.get(key);
    const now = Date.now();

    if (!entry) {
      return {
        remainingRequests: config.maxRequests,
        resetTime: new Date(now + config.windowMs),
        burstRemaining: config.burstAllowance,
        isLimited: false,
      };
    }

    const windowStart = now - config.windowMs;
    const activeRequests = entry.requests.filter(
      (timestamp) => timestamp > windowStart,
    );
    const remainingRequests = Math.max(
      0,
      config.maxRequests - activeRequests.length,
    );
    const burstRemaining = Math.max(
      0,
      config.burstAllowance - entry.burstCount,
    );

    return {
      remainingRequests,
      resetTime: new Date(now + config.windowMs),
      burstRemaining,
      isLimited: remainingRequests === 0 || burstRemaining === 0,
    };
  }

  /**
   * Reset limits for a specific key
   */
  public resetLimit(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Reset all limits
   */
  public resetAllLimits(): void {
    this.limits.clear();
  }

  /**
   * Set custom rate limit for a key
   */
  public setCustomLimit(key: string, config: RateLimitConfig): void {
    // Store custom config (could be persisted to settings)
    this.defaultLimits[key] = config;
  }

  /**
   * Get all current limits status
   */
  public getAllStatus(): Record<string, RateLimitStatus> {
    const status: Record<string, RateLimitStatus> = {};

    // Include all default limits
    for (const key of Object.keys(this.defaultLimits)) {
      status[key] = this.getStatus(key);
    }

    // Include any additional keys that have been used
    for (const key of Array.from(this.limits.keys())) {
      if (!status[key]) {
        status[key] = this.getStatus(key);
      }
    }

    return status;
  }

  /**
   * Create a rate-limited wrapper function
   */
  public createLimitedFunction<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    config?: Partial<RateLimitConfig>,
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const result = this.checkLimit(key, config);

      if (!result.allowed) {
        throw new RateLimitError(
          `Rate limit exceeded for ${key}: ${result.reason}`,
          result.retryAfter,
          result.resetTime,
        );
      }

      return fn(...args);
    };
  }

  /**
   * Dispose and cleanup
   */
  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.limits.clear();
  }

  /**
   * Private methods
   */
  private getConfig(key: string): RateLimitConfig {
    return this.defaultLimits[key] || this.defaultLimits["api_calls"];
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.cleanupInterval);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of Array.from(this.limits.entries())) {
      const config = this.getConfig(key);
      const windowStart = now - config.windowMs;

      // Clean old requests
      entry.requests = entry.requests.filter(
        (timestamp) => timestamp > windowStart,
      );

      // Remove empty entries
      if (
        entry.requests.length === 0 &&
        now - entry.lastReset > config.windowMs
      ) {
        this.limits.delete(key);
      }
    }
  }
}

/**
 * Custom error for rate limit violations
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public resetTime: Date,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Decorator for rate limiting methods
 */
export function rateLimit(key: string, config?: Partial<RateLimitConfig>) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const limiter = RateLimiter.getInstance();
      const result = limiter.checkLimit(key, config);

      if (!result.allowed) {
        throw new RateLimitError(
          `Rate limit exceeded for ${key}: ${result.reason}`,
          result.retryAfter,
          result.resetTime,
        );
      }

      return method.apply(this, args);
    };

    return descriptor;
  };
}

// Type definitions
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstAllowance: number;
}

interface RateLimitEntry {
  requests: number[];
  burstCount: number;
  lastReset: number;
}

export interface RateLimitResult {
  allowed: boolean;
  reason: string;
  retryAfter: number;
  remainingRequests: number;
  resetTime: Date;
}

export interface RateLimitStatus {
  remainingRequests: number;
  resetTime: Date;
  burstRemaining: number;
  isLimited: boolean;
}

export type { RateLimitConfig };
