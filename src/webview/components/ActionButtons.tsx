import React from 'react';
import useWebviewApi from '../hooks/useWebviewApi';
import './ActionButtons.css';

interface ActionButtonsProps {
  codeBlock?: string;
  changeId?: string;
}

function ActionButtons({ codeBlock, changeId }: ActionButtonsProps) {
  const { sendMessage } = useWebviewApi();

  const handleCopy = async () => {
    if (codeBlock) {
      try {
        await navigator.clipboard.writeText(codeBlock);
        // Could show a toast notification here
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const handleApply = () => {
    if (codeBlock && changeId) {
      sendMessage({
        command: 'applyChange',
        changeId,
        content: codeBlock
      });
    }
  };

  const handleRun = () => {
    if (codeBlock) {
      sendMessage({
        command: 'runCode',
        code: codeBlock,
        changeId
      });
    }
  };

  const handleEdit = () => {
    if (codeBlock && changeId) {
      sendMessage({
        command: 'editInEditor',
        content: codeBlock,
        changeId
      });
    }
  };

  const handleRegenerate = () => {
    sendMessage({
      command: 'regenerateResponse',
      changeId
    });
  };

  return (
    <div className="action-buttons">
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
}

export default ActionButtons;