import React from 'react';
import '../styles/StreamingIndicator.css';

interface StreamingIndicatorProps {
  isStreaming: boolean;
  progress?: number;
}

const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({ 
  isStreaming, 
  progress = 0 
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
      {progress > 0 && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default StreamingIndicator;
