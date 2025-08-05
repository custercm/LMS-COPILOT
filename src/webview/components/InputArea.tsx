import React, { useState } from 'react';
interface InputAreaProps {
  onSendMessage: (content: string) => void;
  pendingChanges?: any[];
  applyChange?: (changeId: string) => void;
  revertChange?: (changeId: string) => void;
}

function InputArea({
  onSendMessage,
  pendingChanges,
  applyChange,
  revertChange
}: InputAreaProps) {
  const [inputValue, setInputValue] = useState('');
  return (
    <div className="input-area">
      {pendingChanges && pendingChanges.length > 0 && (
        <div className="pending-changes-bar">
          <span>{pendingChanges.length} changes pending</span>
          <button
            onClick={() => applyChange?.(pendingChanges[0].id)}
            className="apply-button"
          >
            Apply All
      </button>
          <button
            onClick={() => revertChange?.(pendingChanges[0].id)}
            className="revert-button"
          >
            Revert All
          </button>
        </div>
      )}

      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Ask a question or provide context..."
        className="message-input"
      />

      <div className="send-button-container">
        <button
          onClick={() => {
            onSendMessage(inputValue);
            setInputValue('');
          }}
          disabled={!inputValue.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default InputArea;
