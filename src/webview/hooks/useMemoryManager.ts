import React, { useEffect, useRef, useCallback } from "react";

interface MemoryManagerOptions {
  maxMessages?: number;
  maxCacheSize?: number;
  cleanupInterval?: number;
  memoryThreshold?: number;
}

interface MemoryStats {
  messagesCount: number;
  cacheSize: number;
  estimatedMemoryUsage: number;
}

/**
 * Custom hook for managing memory usage in long chat sessions
 * @param options - Configuration options for memory management
 * @returns Memory management utilities
 */
export const useMemoryManager = (options: MemoryManagerOptions = {}) => {
  const {
    maxMessages = 1000,
    maxCacheSize = 50,
    cleanupInterval = 60000, // 1 minute
    memoryThreshold = 100 * 1024 * 1024, // 100MB
  } = options;

  const cacheRef = useRef<Map<string, any>>(new Map());
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const memoryStatsRef = useRef<MemoryStats>({
    messagesCount: 0,
    cacheSize: 0,
    estimatedMemoryUsage: 0,
  });

  // Estimate memory usage of an object
  const estimateMemoryUsage = useCallback((obj: any): number => {
    const json = JSON.stringify(obj);
    return new Blob([json]).size;
  }, []);

  // Add item to cache with memory-aware eviction
  const addToCache = useCallback(
    (key: string, value: any) => {
      const cache = cacheRef.current;
      const itemSize = estimateMemoryUsage(value);

      // Remove oldest items if cache is too large
      if (cache.size >= maxCacheSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey) {
          cache.delete(firstKey);
        }
      }

      cache.set(key, value);

      // Update memory stats
      memoryStatsRef.current.cacheSize = cache.size;
      memoryStatsRef.current.estimatedMemoryUsage += itemSize;
    },
    [maxCacheSize, estimateMemoryUsage],
  );

  // Get item from cache
  const getFromCache = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  // Clear cache when memory usage is too high
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    memoryStatsRef.current.cacheSize = 0;
    memoryStatsRef.current.estimatedMemoryUsage = 0;
  }, []);

  // Cleanup old messages beyond the limit
  const cleanupMessages = useCallback(
    (messages: any[]) => {
      if (messages.length > maxMessages) {
        const excessCount = messages.length - maxMessages;
        console.log(`Memory cleanup: removing ${excessCount} old messages`);
        return messages.slice(excessCount);
      }
      return messages;
    },
    [maxMessages],
  );

  // Force garbage collection (if available)
  const forceGarbageCollection = useCallback(() => {
    if ("gc" in window && typeof (window as any).gc === "function") {
      (window as any).gc();
    }
  }, []);

  // Check memory usage and perform cleanup if needed
  const checkMemoryUsage = useCallback(() => {
    const stats = memoryStatsRef.current;

    if (stats.estimatedMemoryUsage > memoryThreshold) {
      console.warn("Memory threshold exceeded, performing cleanup");
      clearCache();
      forceGarbageCollection();
    }
  }, [memoryThreshold, clearCache, forceGarbageCollection]);

  // Periodic cleanup
  useEffect(() => {
    cleanupTimerRef.current = setInterval(() => {
      checkMemoryUsage();
    }, cleanupInterval);

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [checkMemoryUsage, cleanupInterval]);

  // Memory optimization for React components
  const optimizeComponent = useCallback(
    (component: React.ComponentType<any>) => {
      return React.memo(component, (prevProps, nextProps) => {
        // Custom comparison logic for memory optimization
        return JSON.stringify(prevProps) === JSON.stringify(nextProps);
      });
    },
    [],
  );

  // Get current memory statistics
  const getMemoryStats = useCallback((): MemoryStats => {
    return { ...memoryStatsRef.current };
  }, []);

  // Update message count for memory tracking
  const updateMessageCount = useCallback((count: number) => {
    memoryStatsRef.current.messagesCount = count;
  }, []);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      clearCache();
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [clearCache]);

  return {
    addToCache,
    getFromCache,
    clearCache,
    cleanupMessages,
    forceGarbageCollection,
    checkMemoryUsage,
    optimizeComponent,
    getMemoryStats,
    updateMessageCount,
    estimateMemoryUsage,
  };
};

export default useMemoryManager;
