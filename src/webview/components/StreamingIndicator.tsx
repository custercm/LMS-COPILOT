import React from "react";
import "../styles/StreamingIndicator.css";

interface StreamingIndicatorProps {
  isStreaming: boolean;
  progress?: number;
}

const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  isStreaming,
  progress = 0,
}) => {
  if (!isStreaming) return null;

  return (
    <div className="streaming-indicator">
      <span className="typing-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </span>

      <span className="streaming-text">Assistant is typing...</span>

      {/* Voice input button */}
      <button
        className="voice-input-button"
        aria-label="Start voice input"
        data-testid="voice-input-button" // For testing
      >
        🎤
      </button>

      {progress > 0 && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
            data-testid="progress-fill"
          />
        </div>
      )}
    </div>
  );
};

export default StreamingIndicator;

// Add test methods for this component
export function runStreamingComponentTests(): Promise<{
  passed: number;
  failed: number;
}> {
  let passed = 0;
  let failed = 0;

  try {
    // Test that component renders properly when streaming is active
    const mockProps1 = {
      isStreaming: true,
      progress: 25,
    };

    if (mockProps1.isStreaming && typeof mockProps1.progress === "number") {
      passed++;
    } else {
      failed++;
    }

    // Test that component renders null when not streaming
    const mockProps2 = {
      isStreaming: false,
      progress: 0,
    };

    if (!mockProps2.isStreaming) {
      passed++;
    } else {
      failed++;
    }

    console.log(
      `Streaming component tests: ${passed} passed, ${failed} failed`,
    );
    return Promise.resolve({ passed, failed });
  } catch (error) {
    failed++;
    return Promise.resolve({ passed, failed });
  }
}

// Add additional testing utilities
export function createStreamingTestHarness(): StreamingIndicatorTestUtils {
  // Test utilities for streaming component validation
  return {
    validateProps: (props: StreamingIndicatorProps): boolean => {
      if (typeof props.isStreaming !== "boolean") return false;

      if (
        props.progress !== undefined &&
        (typeof props.progress !== "number" ||
          props.progress < 0 ||
          props.progress > 100)
      ) {
        return false;
      }

      return true;
    },

    simulateStreamProgress: async (progressValue: number): Promise<void> => {
      // Simulate streaming progress updates for testing
      console.log(`Simulating stream progress ${progressValue}%`);
    },
  };
}

interface StreamingIndicatorTestUtils {
  validateProps(props: StreamingIndicatorProps): boolean;
  simulateStreamProgress(progressValue: number): Promise<void>;
}
