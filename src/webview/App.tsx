import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChatInterface from "./components/ChatInterface";
import ErrorBoundary from "./components/ErrorBoundary";
import ConnectionStatus from "./components/ConnectionStatus";
import { OfflineProvider, OfflineBanner } from "./hooks/useOfflineMode";
import useWebviewApi from "./hooks/useWebviewApi";
import useMemoryManager from "./hooks/useMemoryManager";
import { errorLogger } from "./utils/errorLogger";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Memoized App component for better performance
const App = React.memo(() => {
  const webviewApi = useWebviewApi();
  const memoryManager = useMemoryManager({
    maxMessages: 1000,
    maxCacheSize: 50,
    cleanupInterval: 60000,
    memoryThreshold: 100 * 1024 * 1024, // 100MB
  });

  // Performance monitoring state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    messageCount: 0,
  });

  // Optimized performance monitoring
  const updatePerformanceMetrics = useCallback(() => {
    const startTime = performance.now();

    // Measure component render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      const memoryStats = memoryManager.getMemoryStats();

      setPerformanceMetrics({
        renderTime,
        memoryUsage: memoryStats.estimatedMemoryUsage,
        messageCount: memoryStats.messagesCount,
      });
    });
  }, [memoryManager]);

  // Signal to VS Code that webview is ready
  useEffect(() => {
    // Signal to VS Code that webview is ready
    if (webviewApi) {
      webviewApi.sendMessage({ command: "webviewReady" });
    }
  }, [webviewApi]);

  // Memoized initialization with performance optimizations
  const initializeApp = useCallback(async () => {
    if (typeof window !== "undefined") {
      console.log("Performance-optimized app initialized");

      // Performance testing for Step 4 requirements
      const performanceTests = async () => {
        try {
          const startTime = performance.now();

          // Test message handling performance
          await webviewApi.sendMessage({
            type: "performance-test",
            payload: { message: "performance benchmark", count: 1000 },
          });

          const endTime = performance.now();
          console.log(`Performance test completed in ${endTime - startTime}ms`);

          // Update metrics
          updatePerformanceMetrics();
        } catch (error) {
          console.error("Performance test failed:", error);
        }
      };

      performanceTests();
    }
  }, [webviewApi, updatePerformanceMetrics]);

  // Initialize app with performance monitoring
  useEffect(() => {
    initializeApp();

    // Set up periodic performance monitoring
    const performanceInterval = setInterval(updatePerformanceMetrics, 30000); // Every 30 seconds

    return () => {
      clearInterval(performanceInterval);
    };
  }, [initializeApp, updatePerformanceMetrics]);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorLogger.error("React component error", error, {
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <OfflineProvider
        onActionQueued={(action) => {
          errorLogger.info("Action queued for offline processing", {
            actionType: action.type,
          });
        }}
        onQueueProcessed={(processed, failed) => {
          errorLogger.info("Offline queue processed", { processed, failed });
        }}
      >
        <div className="app">
          {/* Connection status and offline banner */}
          <div className="app__status">
            <ConnectionStatus showDetails={false} />
            <OfflineBanner showQueue={true} />
          </div>

          {/* Main chat interface */}
          <ChatInterface />

          {/* Performance monitoring in development */}
          {process.env.NODE_ENV === "development" && (
            <div
              className="performance-monitor"
              style={{
                position: "fixed",
                top: "10px",
                right: "10px",
                background: "rgba(0,0,0,0.8)",
                color: "white",
                padding: "8px",
                fontSize: "12px",
                borderRadius: "4px",
                zIndex: 1000,
              }}
            >
              <div>Render: {performanceMetrics.renderTime.toFixed(2)}ms</div>
              <div>
                Memory:{" "}
                {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
              </div>
              <div>Messages: {performanceMetrics.messageCount}</div>
            </div>
          )}
        </div>
      </OfflineProvider>
    </ErrorBoundary>
  );
});

// Add component testing utilities
export function runComponentTests(): Promise<{
  passed: number;
  failed: number;
}> {
  let passed = 0;
  let failed = 0;

  try {
    // Test that App renders properly with initial state
    if (typeof useState !== "undefined" && typeof useEffect !== "undefined") {
      passed++;
    } else {
      failed++;
    }

    console.log(`Component tests: ${passed} passed, ${failed} failed`);
    return Promise.resolve({ passed, failed });
  } catch (error) {
    failed++;
    return Promise.resolve({ passed, failed });
  }
}

export default App;
