import React, { Component, ReactNode } from "react";
import "../styles/ErrorBoundary.css";
import { getVsCodeAPI } from "../utils/vscodeApi";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to VS Code output channel
    console.error("React Error Boundary caught an error:", error, errorInfo);

    // Report error to extension
    try {
      const vscode = getVsCodeAPI();
      vscode.postMessage({
        type: "error",
        payload: {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        },
      });
    } catch (e) {
      console.error("Failed to report error to extension:", e);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReport = () => {
    if (this.state.error) {
      try {
        const vscode = getVsCodeAPI();
        vscode.postMessage({
          type: "reportError",
          payload: {
            error: this.state.error.message,
            stack: this.state.error.stack,
            componentStack: this.state.errorInfo?.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        });
      } catch (e) {
        console.error("Failed to report error to extension:", e);
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 22h20L12 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 9v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 17h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h3 className="error-boundary__title">Something went wrong</h3>

            <p className="error-boundary__message">
              {this.state.error?.message ||
                "An unexpected error occurred in the chat interface."}
            </p>

            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.handleRetry}
              >
                Try Again
              </button>

              <button
                className="error-boundary__button error-boundary__button--secondary"
                onClick={this.handleReport}
              >
                Report Issue
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (Development)</summary>
                <pre className="error-boundary__stack">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="error-boundary__component-stack">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
