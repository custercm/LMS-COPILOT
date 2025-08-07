import { useState, useEffect } from 'react';
import { WebviewCommand } from '../types/api';

// This would normally use VS Code's webview API
function useWebviewApi() {
  const [vscode, setVscode] = useState<any>(null);
  
  useEffect(() => {
    // @ts-ignore - This is provided by VS Code's webview environment
    if (window.acquireVsCodeApi) {
      // @ts-ignore
      setVscode(window.acquireVsCodeApi());
    }
    
    // For testing: mock the API when running tests
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      // Mock implementation for unit tests
      const mockVscode = {
        postMessage: (message: any) => console.log('Test message:', message),
        getState: () => ({ theme: 'dark', lastCommand: null }),
        setState: (state: any) => console.log('Test state update:', state)
      };
      setVscode(mockVscode);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const sendMessage = (message: WebviewCommand) => {
    vscode?.postMessage(message);
  };

  // Handle command messages specifically
  const sendCommand = (command: string, args?: any) => {
    sendMessage({
      type: 'command',
      payload: { command, args }
    });
  };

  return { 
    vscode, 
    sendMessage,
    sendCommand
  };
}

// Enhanced test methods for webview hooks
export function createTestWebviewHookWithValidation() {
  const mockVscode = {
    postMessage: (message: any) => console.log('Test message posted:', message),
    getState: () => ({ theme: 'dark', lastCommand: null }),
    setState: (state: any) => console.log('Test state set:', state)
  };

  return {
    vscode: mockVscode,
    sendMessage: mockVscode.postMessage,
    sendCommand: (command: string, args?: any) => {
      mockVscode.postMessage({
        type: 'command',
        payload: { command, args }
      });
    },

    // Add validation method for testing
    validateHookUsage: (): boolean => {
      try {
        const result = createTestWebviewHook();
        return typeof result.sendMessage === 'function' &&
               typeof result.sendCommand === 'function';
      } catch (error) {
        console.error('Hook validation failed:', error);
        return false;
      }
    },

    // Add performance benchmark for hook
    runHookPerformanceBenchmark: async (): Promise<{duration: number}> => {
      const startTime = Date.now();

      try {
        const result = createTestWebviewHook();
        const isValid = result.validateHookUsage();

        if (!isValid) throw new Error('Hook validation failed');

        const endTime = Date.now();
        return { duration: endTime - startTime };
      } catch (error) {
        console.error('Hook performance benchmark failed:', error);
        const endTime = Date.now();
        return { duration: endTime - startTime };
      }
    }
  };
}

// Test methods for integration testing of the hook
export function createTestWebviewHook() {
  // Mock implementation specifically for E2E tests
  const mockVscode = {
    postMessage: (message: any) => console.log('Test message posted:', message),
    getState: () => ({ theme: 'dark', lastCommand: null }),
    setState: (state: any) => console.log('Test state set:', state)
  };

  return {
    vscode: mockVscode,
    sendMessage: mockVscode.postMessage,
    sendCommand: (command: string, args?: any) => {
      mockVscode.postMessage({
        type: 'command',
        payload: { command, args }
      });
    },

    // Add testing methods for webview communication
    testWebviewCommunication: async (): Promise<{success: boolean, latency?: number}> => {
      const startTime = Date.now();

      try {
        mockVscode.postMessage({ type: 'test-communication', payload: { timestamp: startTime } });

        const endTime = Date.now();
        return {
          success: true,
          latency: endTime - startTime
        };
      } catch (error) {
        return { success: false };
      }
    },

    // Performance benchmark for API hooks
    runApiPerformanceTest: async (): Promise<{duration: number}> => {
      const startTime = Date.now();

      try {
        await mockVscode.postMessage({ type: 'performance-test', payload: {} });

        const endTime = Date.now();
        return { duration: endTime - startTime };
      } catch (error) {
        console.error('API performance test failed:', error);
        const endTime = Date.now();
        return { duration: endTime - startTime };
      }
    }
  };
}

export default useWebviewApi;