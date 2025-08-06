import React, { useState } from 'react';
import './ActionButtons.css';

interface ActionButtonsProps {
  codeBlock?: string;
  changeId?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  codeBlock,
  changeId 
}) => {
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  
  // Handle copy to clipboard
  const handleCopy = async () => {
    if (codeBlock) {
      try {
        await navigator.clipboard.writeText(codeBlock);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  // Handle apply change
  const handleApply = () => {
    if (codeBlock && changeId) {
      // This would typically send a message through the webview API
      // For now just showing an alert - actual implementation will use sendMessage from hooks
      alert(`Applying changes for ${changeId}`);
    }
  };

  // Handle run code
  const handleRun = () => {
    if (codeBlock) {
      // This would typically send a message through the webview API
      // For now just showing an alert - actual implementation will use sendMessage from hooks
      alert(`Running code: ${codeBlock.substring(0, 50)}...`);
    }
  };

  // Handle edit in editor
  const handleEdit = () => {
    if (codeBlock && changeId) {
      // This would typically send a message through the webview API
      // For now just showing an alert - actual implementation will use sendMessage from hooks
      alert(`Editing code for ${changeId}`);
    }
  };

  // Handle regenerate response
  const handleRegenerate = () => {
    if (changeId) {
      // This would typically send a message through the webview API
      // For now just showing an alert - actual implementation will use sendMessage from hooks
      alert(`Regenerating response for ${changeId}`);
    }
  };

  return (
    <div className="action-buttons">
      {showCopiedToast && (
        <div className="toast-notification">
          Copied to clipboard!
        </div>
      )}
      
      <button onClick={handleCopy} className="copy-button" title="Copy to clipboard">
        Copy
      </button>
      <button onClick={handleApply} className="apply-button" title="Apply changes">
        Apply
      </button>
      <button onClick={handleRun} className="run-button" title="Run code">
        Run
      </button>
      <button onClick={handleEdit} className="edit-button" title="Edit in editor">
        Edit
      </button>
      <button onClick={handleRegenerate} className="regenerate-button" title="Regenerate">
        Regenerate
      </button>
    </div>
  );
};

export default ActionButtons;