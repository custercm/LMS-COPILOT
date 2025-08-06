import React, { useState } from 'react';
import FilePathLink from './FilePathLink'; // This will need to be added to existing file or import properly
import BreadcrumbNavigation from './BreadcrumbNavigation'; // This will need to be added to existing file or import properly

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface FileReference {
  path: string;
  line?: number;
}

interface MessageItemProps {
  message: Message;
  fileReferences: FileReference[];
  onOpenFile: (reference: FileReference) => void;
}

function MessageItem({ message, fileReferences, onOpenFile }: MessageItemProps) {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  
  // Add the FilePreview component here as a nested component
  const FilePreview = ({ filePath, content }: { filePath: string; content: string }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="file-preview-container">
        {isVisible && (
          <div className="preview-content">
            <h4>Preview of {filePath}</h4>
            <pre>{content}</pre>
          </div>
        )}
      </div>
    );
  };

  // Add the BreadcrumbNavigation component here as a nested component
  const BreadcrumbNavigation = ({ path }: { path: string }) => {
    const parts = path.split('/');
    
    return (
      <div className="breadcrumb-navigation">
        {parts.map((part, index) => (
          <span key={index}>
            {index > 0 && ' / '}
            <a href="#" onClick={(e) => e.preventDefault()}>
              {part}
            </a>
          </span>
        ))}
      </div>
    );
  };

  // Add the FilePathLink component here as a nested component
  const FilePathLink = ({ reference, onOpen }: { reference: FileReference; onOpen?: () => void }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (onOpen) {
        onOpen();
      }
    };

    return (
      <span className="file-path-link">
        <a 
          href="#" 
          onClick={handleClick}
          title={`Open ${reference.path}`}
        >
          {reference.path}
        </a>
      </span>
    );
  };

  return (
    <div className={`message-item ${message.role}`}>
      <div className="content">
        {message.content}

        {/* File references in messages */}
        {fileReferences && fileReferences.length > 0 && (
          <div className="file-references">
            {fileReferences.map((ref, index) => (
              <div key={index} className="file-reference-item">
                <FilePathLink
                  reference={ref}
                  onOpen={() => onOpenFile(ref)}
                />
                <BreadcrumbNavigation path={ref.path} />
              </div>
            ))}
          </div>
      )}
      </div>
    </div>
  );
}

export default MessageItem;