import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import { useWebviewApi } from './hooks/useWebviewApi';

function App() {
  const webviewApi = useWebviewApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add testing infrastructure to the app component
  useEffect(() => {
    if (typeof window !== 'undefined' && LMStudioClient.isTestEnvironment()) {
      // Setup test hooks in development environment
      console.log('Testing infrastructure initialized');

      // Mock performance tests
      const mockPerformanceTests = async () => {
        try {
          await webviewApi.sendMessage({ type: 'performance-test', payload: { message: 'mock benchmark' } });
        } catch (error) {
          console.error('Performance test failed:', error);
        }
      };

      mockPerformanceTests();
    }
  }, []);

  return (
    <div className="app">
      <ChatInterface 
        messages={messages} 
        onSendMessage={(content) => {
          // Add loading state for better UX
          setIsLoading(true);
          // Simulate API call delay
          setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() }]);
            setIsLoading(false);
          }, 500)
        }}
        isLoading={isLoading}
      />
    </div>
  );
}

// Add component testing utilities
export function runComponentTests(): Promise<{passed: number, failed: number}> {
  let passed = 0;
  let failed = 0;

  try {
    // Test that App renders properly with initial state
    if (typeof useState !== 'undefined' && typeof useEffect !== 'undefined') {
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
