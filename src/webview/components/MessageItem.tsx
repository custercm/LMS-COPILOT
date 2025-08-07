import React from 'react';
import { parseMessageContent } from '../utils/messageParser';
import CodeBlock from './CodeBlock';
import DiffViewer from './DiffViewer';

interface MessageItemProps {
  message: AssistantMessage;
  onOpenFile?: (filePath: string) => void;
  // Add new prop for media file handling
  onHandleMediaOperation?: (filePath: string, operation: 'preview' | 'convert' | 'metadata') => void;
}

function MessageItem({
  message,
  onOpenFile,
  onHandleMediaOperation
}: MessageItemProps) {
  const extractFilePaths = (content: string): string[] => {
    // Extract file paths from message content
    const filePathRegex = /(\w+\/[\w\-\.\/]+(?:\.\w+)?)/g;
    const matches = content.match(filePathRegex);
    return matches || [];
  };

  const hasCodeBlocks = (content: string): boolean => {
    // Check if the content includes code blocks
    return /```([\s\S]*?)```/.test(content);
  };

  const renderContent = () => {
    if (!message.content) return null;

    // Check for file paths in the content
    const filePaths = extractFilePaths(message.content);

    // If it's a media file response, handle accordingly
    if (message.content.includes('media_file')) {
      try {
        const parsedContent = JSON.parse(message.content);

        if (parsedContent.type === 'image') {
          return (
            <div className="media-content">
              <h4>Image Preview</h4>
              <img
                src={parsedContent.data}
                alt={`Thumbnail of ${parsedContent.fileName}`}
                className="thumbnail"
                onClick={() => onHandleMediaOperation && onHandleMediaOperation(parsedContent.filePath, 'preview')}
              />
            </div>
          );
        } else if (parsedContent.type === 'pdf' || parsedContent.type === 'csv') {
          return (
            <div className="media-content">
              <h4>File Analysis</h4>
              <p>{parsedContent.content}</p>
              {parsedContent.summary && (
                <div className="file-summary">
                  <p>Rows: {parsedContent.summary.rowCount}, Columns: {parsedContent.summary.columnCount}</p>
                  <button
                    onClick={() => onHandleMediaOperation && onHandleMediaOperation(parsedContent.filePath, 'convert')}
                    className="action-button"
                  >
                    Convert to Text/JSON
                  </button>
                </div>
              )}
            </div>
          );
        }
      } catch (e) {
        // If it's not valid JSON, treat as regular markdown content
      }
    }

    // Render code blocks if present
    const hasCode = hasCodeBlocks(message.content);
    if (hasCode) {
      return (
        <div className="message-content">
          {parseMessageContent(message.content)}
          <CodeBlock
            content={message.content}
            onOpenFile={onOpenFile}
          />
        </div>
      );
    }

    // Render regular markdown content
    return (
      <div
        className="message-content"
        dangerouslySetInnerHTML={{ __html: parseMessageContent(message.content) }}
      />
    );
  };

  // Extract file paths from the message content
  const filePaths = extractFilePaths(message.content);

  return (
    <div className={`message-item ${message.role}`}>
      {renderContent()}

      {/* Add action buttons for media files */}
      {filePaths.length > 0 && onHandleMediaOperation && (
        <div className="media-actions">
          {filePaths.map((filePath, index) => (
            <button
              key={index}
              onClick={() => onHandleMediaOperation(filePath, 'metadata')}
              className="action-button"
            >
              View Metadata
            </button>
          ))}
        </div>
      )}

      {/* Add diff viewer if it's a file change */}
      {message.content.includes('diff') && (
        <DiffViewer
          originalContent={message.content}
          proposedContent=""
        />
      )}
    </div>
  );
}

export default MessageItem;