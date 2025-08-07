import React, { useState } from 'react';
import './CodeBlock.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

interface CodeBlockProps {
  code: string;
  language: string;
  onApplyChange?: (changeId: string) => void;
  changeId?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  onApplyChange,
  changeId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

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
    <div className="code-block">
      {showCopiedToast && (
        <div className="toast-notification">
          Copied to clipboard!
        </div>
      )}
      
      <pre className={`language-${language}`}>
        <code className={`language-${language}`}>{code}</code>
      </pre>
      
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