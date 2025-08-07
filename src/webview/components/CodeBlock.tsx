import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import './CodeBlock.css';

// Lazy load PrismHighlighter for better performance
const PrismHighlighter = lazy(() => import('./PrismHighlighter'));

interface CodeBlockProps {
  code: string;
  language: string;
  onApplyChange?: (changeId: string) => void;
  changeId?: string;
}

// Loading placeholder component
const CodeLoadingPlaceholder: React.FC = () => (
  <div className="code-loading-placeholder">
    <div className="loading-spinner"></div>
    <span>Loading syntax highlighting...</span>
  </div>
);

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  onApplyChange,
  changeId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading syntax highlighting
  useEffect(() => {
    if (!codeRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
            // Delay syntax highlighting to avoid blocking the main thread
            setTimeout(() => setShouldHighlight(true), 100);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(codeRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isInView]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Toggle expand/collapse state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Copy code to clipboard with toast notification
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Apply changes functionality
  const applyChanges = () => {
    if (onApplyChange && changeId) {
      onApplyChange(changeId);
    }
  };

  // Run code functionality
  const runCode = () => {
    // This would typically send a command to the extension to execute in sandboxed environment
    // For now we'll just show an alert - actual implementation will use sendMessage from hooks
    alert(`Running code: ${code.substring(0, 50)}...`);
  };

  return (
    <div ref={codeRef} className="code-block">
      {showCopiedToast && (
        <div className="toast-notification">
          Copied to clipboard!
        </div>
      )}
      
      {shouldHighlight && isInView ? (
        <Suspense fallback={<CodeLoadingPlaceholder />}>
          <PrismHighlighter code={code} language={language} />
        </Suspense>
      ) : (
        <pre className={`language-${language} pre-highlight`}>
          <code className={`language-${language}`}>{code}</code>
        </pre>
      )}
      
      <div className="code-actions">
        <button 
          onClick={copyToClipboard}
          className="action-button copy-button"
          title="Copy to clipboard"
        >
          Copy
        </button>
        
        {onApplyChange && changeId && (
          <button 
            onClick={applyChanges}
            className="action-button apply-button"
            title="Apply changes"
          >
            Apply
          </button>
        )}
        
        <button 
          onClick={runCode}
          className="action-button run-button"
          title="Run code"
        >
          Run
        </button>
        
        {code.length > 200 && (
          <button 
            onClick={toggleExpand}
            className="action-button expand-button"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CodeBlock;