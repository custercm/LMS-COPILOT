/**
 * Error logging and reporting system for LMS Copilot
 */

export enum ErrorLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  message: string;
  error?: Error;
  context?: Record<string, any>;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorReportOptions {
  includeUserAgent?: boolean;
  includeUrl?: boolean;
  includeContext?: boolean;
  maxStackLines?: number;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private setupGlobalErrorHandlers(): void {
    // Catch unhandled errors
    window.addEventListener("error", (event) => {
      this.log(ErrorLevel.ERROR, "Unhandled error", event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.log(ErrorLevel.ERROR, "Unhandled promise rejection", event.reason, {
        promise: event.promise,
      });
    });

    // Catch console errors (optional)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.log(ErrorLevel.ERROR, "Console error", undefined, { args });
      originalConsoleError.apply(console, args);
    };
  }

  log(
    level: ErrorLevel,
    message: string,
    error?: Error,
    context?: Record<string, any>,
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      error,
      context,
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
    };

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      this.logToConsole(entry);
    }

    // Report critical errors immediately
    if (level === ErrorLevel.ERROR || level === ErrorLevel.FATAL) {
      this.reportError(entry);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp.toISOString()}`;

    switch (entry.level) {
      case ErrorLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context);
        break;
      case ErrorLevel.INFO:
        console.info(prefix, entry.message, entry.context);
        break;
      case ErrorLevel.WARN:
        console.warn(prefix, entry.message, entry.context);
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.FATAL:
        console.error(prefix, entry.message, entry.error, entry.context);
        break;
    }
  }

  private async reportError(entry: ErrorLogEntry): Promise<void> {
    try {
      // Send to VS Code extension
      try {
        const vscode = (window as any).vscode;
        if (vscode && vscode.postMessage) {
          vscode.postMessage({
            type: "errorReport",
            payload: this.sanitizeLogEntry(entry),
          });
        }
      } catch (vscodeError) {
        console.error("Failed to send error to VS Code:", vscodeError);
      }

      // Could also send to external error reporting service
      // await this.sendToExternalService(entry);
    } catch (error) {
      console.error("Failed to report error:", error);
    }
  }

  private sanitizeLogEntry(entry: ErrorLogEntry): Partial<ErrorLogEntry> {
    return {
      id: entry.id,
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      stack: entry.stack,
      userAgent: entry.userAgent,
      url: entry.url,
      sessionId: entry.sessionId,
      context: this.sanitizeContext(entry.context),
    };
  }

  private sanitizeContext(
    context?: Record<string, any>,
  ): Record<string, any> | undefined {
    if (!context) return undefined;

    // Remove sensitive information
    const sanitized = { ...context };
    const sensitiveKeys = ["password", "token", "apiKey", "secret", "auth"];

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  }

  // Public methods
  debug(message: string, context?: Record<string, any>): void {
    this.log(ErrorLevel.DEBUG, message, undefined, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(ErrorLevel.INFO, message, undefined, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(ErrorLevel.WARN, message, undefined, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(ErrorLevel.ERROR, message, error, context);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(ErrorLevel.FATAL, message, error, context);
  }

  getLogs(level?: ErrorLevel): ErrorLogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  getRecentLogs(count = 50): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(options: ErrorReportOptions = {}): string {
    const logs = this.logs.map((log) => {
      const exported: any = {
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        sessionId: log.sessionId,
      };

      if (options.includeUserAgent && log.userAgent) {
        exported.userAgent = log.userAgent;
      }

      if (options.includeUrl && log.url) {
        exported.url = log.url;
      }

      if (options.includeContext && log.context) {
        exported.context = this.sanitizeContext(log.context);
      }

      if (log.stack) {
        if (options.maxStackLines) {
          const stackLines = log.stack
            .split("\n")
            .slice(0, options.maxStackLines);
          exported.stack = stackLines.join("\n");
        } else {
          exported.stack = log.stack;
        }
      }

      return exported;
    });

    return JSON.stringify(logs, null, 2);
  }

  // Performance monitoring
  measurePerformance<T>(
    operation: string,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    const start = performance.now();

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = performance.now() - start;
            this.info(`Performance: ${operation}`, {
              duration: `${duration.toFixed(2)}ms`,
            });
            return value;
          })
          .catch((error) => {
            const duration = performance.now() - start;
            this.error(`Performance: ${operation} failed`, error, {
              duration: `${duration.toFixed(2)}ms`,
            });
            throw error;
          });
      } else {
        const duration = performance.now() - start;
        this.info(`Performance: ${operation}`, {
          duration: `${duration.toFixed(2)}ms`,
        });
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`Performance: ${operation} failed`, error as Error, {
        duration: `${duration.toFixed(2)}ms`,
      });
      throw error;
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions
export const logDebug = (message: string, context?: Record<string, any>) =>
  errorLogger.debug(message, context);

export const logInfo = (message: string, context?: Record<string, any>) =>
  errorLogger.info(message, context);

export const logWarn = (message: string, context?: Record<string, any>) =>
  errorLogger.warn(message, context);

export const logError = (
  message: string,
  error?: Error,
  context?: Record<string, any>,
) => errorLogger.error(message, error, context);

export const logFatal = (
  message: string,
  error?: Error,
  context?: Record<string, any>,
) => errorLogger.fatal(message, error, context);

// Decorator for automatic error logging
export function withErrorLogging<T extends (...args: any[]) => any>(
  target: T,
  context?: Record<string, any>,
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = target(...args);

      if (result instanceof Promise) {
        return result.catch((error) => {
          errorLogger.error(`Function ${target.name} failed`, error, context);
          throw error;
        });
      }

      return result;
    } catch (error) {
      errorLogger.error(
        `Function ${target.name} failed`,
        error as Error,
        context,
      );
      throw error;
    }
  }) as T;
}
