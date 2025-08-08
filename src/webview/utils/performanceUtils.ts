// Performance utilities for optimization

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  messageCount: number;
  bundleSize?: number;
  scrollPerformance?: number;
  inputLatency?: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    messageCount: 0,
  };
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureRenderTime<T>(fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.metrics.renderTime = end - start;
    this.notifyObservers();

    return result;
  }

  // Measure async operations
  async measureAsync<T>(fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    this.metrics.renderTime = end - start;
    this.notifyObservers();

    return result;
  }

  // Estimate memory usage
  estimateMemoryUsage(data: any): number {
    try {
      const json = JSON.stringify(data);
      const bytes = new TextEncoder().encode(json).length;
      this.metrics.memoryUsage = bytes;
      this.notifyObservers();
      return bytes;
    } catch (error) {
      console.warn("Failed to estimate memory usage:", error);
      return 0;
    }
  }

  // Measure scroll performance
  measureScrollPerformance(element: HTMLElement): void {
    let lastScrollTime = performance.now();
    let scrollSamples: number[] = [];

    const handleScroll = () => {
      const currentTime = performance.now();
      const scrollDelta = currentTime - lastScrollTime;

      scrollSamples.push(scrollDelta);

      // Keep only last 10 samples
      if (scrollSamples.length > 10) {
        scrollSamples = scrollSamples.slice(-10);
      }

      // Calculate average scroll performance
      const avgScrollTime =
        scrollSamples.reduce((a, b) => a + b, 0) / scrollSamples.length;
      this.metrics.scrollPerformance = avgScrollTime;

      lastScrollTime = currentTime;
      this.notifyObservers();
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
  }

  // Measure input latency
  measureInputLatency(inputElement: HTMLInputElement): void {
    let keydownTime = 0;

    inputElement.addEventListener("keydown", () => {
      keydownTime = performance.now();
    });

    inputElement.addEventListener("input", () => {
      if (keydownTime > 0) {
        const latency = performance.now() - keydownTime;
        this.metrics.inputLatency = latency;
        this.notifyObservers();
        keydownTime = 0;
      }
    });
  }

  // Update message count for memory tracking
  updateMessageCount(count: number): void {
    this.metrics.messageCount = count;
    this.notifyObservers();
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Subscribe to metrics updates
  subscribe(observer: (metrics: PerformanceMetrics) => void): void {
    this.observers.push(observer);
  }

  // Unsubscribe from metrics updates
  unsubscribe(observer: (metrics: PerformanceMetrics) => void): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  // Notify all observers
  private notifyObservers(): void {
    this.observers.forEach((observer) => observer(this.metrics));
  }

  // Check if performance is within acceptable limits
  isPerformanceAcceptable(): boolean {
    const { renderTime, scrollPerformance, inputLatency } = this.metrics;

    // Define performance thresholds (from Step 4 requirements)
    const RENDER_THRESHOLD = 16.67; // 60fps = 16.67ms per frame
    const SCROLL_THRESHOLD = 16.67;
    const INPUT_THRESHOLD = 100; // <100ms for instant feel

    return (
      (renderTime === 0 || renderTime <= RENDER_THRESHOLD) &&
      (scrollPerformance === undefined ||
        scrollPerformance <= SCROLL_THRESHOLD) &&
      (inputLatency === undefined || inputLatency <= INPUT_THRESHOLD)
    );
  }

  // Get performance report
  getPerformanceReport(): string {
    const metrics = this.getMetrics();
    const isAcceptable = this.isPerformanceAcceptable();

    return `
Performance Report:
- Render Time: ${metrics.renderTime.toFixed(2)}ms
- Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
- Message Count: ${metrics.messageCount}
- Scroll Performance: ${metrics.scrollPerformance?.toFixed(2) || "N/A"}ms
- Input Latency: ${metrics.inputLatency?.toFixed(2) || "N/A"}ms
- Status: ${isAcceptable ? "✅ Acceptable" : "⚠️ Needs Optimization"}
    `.trim();
  }
}

// Bundle size analyzer
export const analyzeBundleSize = async (): Promise<number> => {
  try {
    if ("navigator" in window && "connection" in navigator) {
      // Estimate bundle size from network timing
      const perfEntries = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      if (perfEntries.length > 0) {
        const entry = perfEntries[0];
        return entry.transferSize || 0;
      }
    }
    return 0;
  } catch (error) {
    console.warn("Failed to analyze bundle size:", error);
    return 0;
  }
};

// Virtualization helper
export const calculateVisibleRange = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  buffer: number = 5,
): { start: number; end: number; offset: number } => {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + buffer * 2);
  const offset = start * itemHeight;

  return { start, end, offset };
};

// Debounced scroll handler for better performance
export const createOptimizedScrollHandler = (
  callback: () => void,
  delay: number = 16,
): (() => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let isScrolling = false;

  return () => {
    if (!isScrolling) {
      isScrolling = true;
      requestAnimationFrame(() => {
        callback();
        isScrolling = false;
      });
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback();
    }, delay);
  };
};

// Memory cleanup utility
export const cleanupUnusedMemory = (): void => {
  // Force garbage collection if available
  if ("gc" in window && typeof (window as any).gc === "function") {
    (window as any).gc();
  }

  // Clear unused caches
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes("old") || name.includes("unused")) {
          caches.delete(name);
        }
      });
    });
  }
};

export default PerformanceMonitor;
