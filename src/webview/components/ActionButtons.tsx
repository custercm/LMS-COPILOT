import React from 'react';
import '../styles/ActionButtons.css';

interface ActionButtonsProps {
  message: string;
  changeId?: string;
  onApplyClick: (changeId: string, content: string) => void;
  onInsertClick: (content: string) => void;
  onRunClick: (code: string, changeId?: string) => void;
  onEditClick: (content: string, changeId?: string) => void;
  onRegenerateClick: (changeId?: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  message,
  changeId,
  onApplyClick,
  onInsertClick,
  onRunClick,
  onEditClick,
  onRegenerateClick
}) => {
  // Check if the message contains a command that should not show action buttons
  const isCommandMessage = message.startsWith('/');

  // For commands, only show regenerate button
  if (isCommandMessage) {
    return (
    <div className="action-buttons">
        <button
          onClick={() => onRegenerateClick(changeId)}
          className="regenerate-button"
        >
        Regenerate
      </button>
    </div>
  );
  }

  // For regular messages, show all action buttons
  return (
    <div className="action-buttons">
      <button
        onClick={() => onInsertClick(message)}
        className="insert-button"
      >
        Insert
      </button>

      <button
        onClick={() => onRunClick(message, changeId)}
        className="run-button"
      >
        Run
      </button>

      <button
        onClick={() => onEditClick(message, changeId)}
        className="edit-button"
      >
        Edit
      </button>

      <button
        onClick={() => onRegenerateClick(changeId)}
        className="regenerate-button"
      >
        Regenerate
      </button>
    </div>
  );
};

export default ActionButtons;