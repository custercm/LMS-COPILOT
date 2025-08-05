import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

// Define types for message and reaction data
interface Message {
  id: string;
  content: string;
  timestamp?: Date;
  isUser: boolean;
  files?: string[];
}

interface Reactions {
  [key: string]: number;
}

// Helper function to format relative time
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  // For longer periods, use a more descriptive format
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays === 1) return "yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  // For weeks and beyond, show date
  return date.toLocaleDateString();
};

// Helper function to escape HTML
const escapeHtml = (text: string) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Function to render message content with code blocks
const renderMessageContent = (content: string) => {
  // Basic regex to detect code blocks (```language\n...```)
  const codeBlockRegex = /(```(\w+)\n([\s\S]*?)```)/g;
  
  return content.replace(codeBlockRegex, (match, fullMatch, language, code) => {
    const escapedCode = escapeHtml(code);
    return `<pre data-language="${language}"><code class="language-${language}">${escapedCode}</code></pre>`;
  });
};

// MessageBubble component
const MessageBubble = ({
  message,
  timestamp,
  isUser,
  reactions,
  onReactionChange,
  messageId,
  onHover,
  onHide
}: {
  message: string;
  timestamp?: Date;
  isUser: boolean;
  reactions?: Reactions;
  onReactionChange?: (messageId: string, reaction: string) => void;
  messageId: string;
  onHover?: () => void;
  onHide?: () => void;
}) => {
  return (
    <div 
      className={`message-bubble ${isUser ? 'user' : 'bot'}`}
      onMouseEnter={onHover}
      onMouseLeave={onHide}
    >
      <div className="message-content" dangerouslySetInnerHTML={{ __html: renderMessageContent(message) }} />

      {/* Display timestamp */}
      {timestamp && (
        <div className="timestamp">
          {formatRelativeTime(timestamp)}
        </div>
      )}

      {/* Reaction buttons - added to each message bubble */}
      <div className="reaction-buttons">
        {['👍', '👎'].map((emoji) => (
          <button 
            key={emoji}
            onClick={() => onReactionChange && onReactionChange(messageId, emoji)}
            className="reaction-button"
          >
            {emoji} {reactions?.[emoji] || ''}
          </button>
        ))}
      </div>

      {/* Copy/Edit/Regenerate actions - shown on hover */}
      <div className="message-actions">
        <button className="action-button">Copy</button>
        <button className="action-button">Edit</button>
        <button className="action-button">Regenerate</button>
      </div>
    </div>
  );
};

// FileDropZone component for drag and drop file upload
const FileDropZone = ({ onFileUpload }: { onFileUpload: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden-file-input"
        style={{ display: 'none' }}
      />
      Drag & drop files here or click to select
    </div>
  );
};

// ImagePreview component with zoom functionality
const ImagePreview = ({ src, alt }: { src: string; alt?: string }) => {
  const [zoomed, setZoomed] = useState(false);
  
  return (
    <div className="image-preview-container">
      <img 
        src={src} 
        alt={alt}
        onClick={() => setZoomed(!zoomed)}
        className={`preview-image ${zoomed ? 'zoomed' : ''}`}
      />
      {zoomed && (
        <div className="zoom-overlay" onClick={() => setZoomed(false)}>
          <img src={src} alt={alt} className="zoomedImage" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

// FileList component for displaying files with icons
const FileList = ({ files }: { files: string[] }) => {
  const getFileIcon = (fileName: string) => {
    // Simple file type detection - in real app this would be more comprehensive
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'js':
      case 'jsx':
        return '📄';
      case 'ts':
      case 'tsx':
        return '📝';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '⚙️';
      case 'py':
        return '🐍';
      default:
        return '📁';
    }
  };

  return (
    <div className="file-list-container">
      <ul>
        {files.map((file, index) => (
          <li key={index} className="file-item">
            <span className="file-icon">{getFileIcon(file)}</span>
            <span>{file}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ModifiedFilesList component
const ModifiedFilesList = ({ files }: { files: string[] }) => {
  // Display list of changed files with options to view or revert them
  return (
    <div className="modified-files-list">
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <span>{file}</span>
            <button onClick={() => console.log(`Preview file: ${file}`)}>Preview</button>
            <button onClick={() => console.log(`Revert file: ${file}`)}>Revert</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// DiffPreviewPanel component
const DiffPreviewPanel = ({ changes }: { changes: any[] }) => {
  // Render side-by-side diffs with approval buttons
  return (
    <div className="diff-preview-panel">
      {/* Implementation would go here */}
      {changes.map((change, index) => (
        <div key={index} className="diff-change">
          <pre>{JSON.stringify(change, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
};

// MediaPreview component
const MediaPreview = ({ fileUrl }: { fileUrl: string }) => {
  return (
    <div className="media-preview">
      <img src={fileUrl} alt="Uploaded content" />
    </div>
  );
};

// Initialize the React application
const App = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<{ [messageId: string]: Reactions }>({});
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Handle messages from the VS Code extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.command === 'appendTypingIndicator') {
        // Show typing indicator
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
          typingIndicator.style.display = 'flex';
        }
      } else if (event.data.command === 'removeTypingIndicator') {
        // Hide typing indicator
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
          typingIndicator.style.display = 'none';
        }
      } else if (event.data.command === 'addMessage') {
        // Add message to the chat interface
        setMessages(prev => [...prev, event.data.message]);

        // Initialize reactions for new message
        const newReactions: Reactions = { '👍': 0, '👎': 0 };
        setReactions(prev => ({
          ...prev,
          [event.data.message.id]: newReactions
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Apply the theme to the body class dynamically
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  // Handle reaction changes
  const handleReactionChange = (messageId: string, reaction: string) => {
    setReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [reaction]: (prev[messageId]?.[reaction] || 0) + 1
      }
    }));
  };

  // Highlight code blocks after DOM update
  useEffect(() => {
    const highlightCodeBlocks = () => {
      if (rootRef.current) {
        const codeBlocks = rootRef.current.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
      }
    };

    // Run highlighting after initial render
    highlightCodeBlocks();
    
    // Set up a MutationObserver to handle dynamically added content
    const observer = new MutationObserver(() => {
      setTimeout(highlightCodeBlocks, 0);
    });

    if (rootRef.current) {
      observer.observe(rootRef.current, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // ChatInterface component
  const ChatInterface = () => {
    return (
      <div className="chat-interface">
        <header className="chat-header">
          <h2>Chat</h2>
          <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
            Toggle Theme
          </button>
        </header>

        <div className="messages-container">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg.content}
              timestamp={msg.timestamp}
              isUser={msg.isUser}
              reactions={reactions[msg.id]}
              onReactionChange={(messageId, reaction) => handleReactionChange(messageId, reaction)}
              messageId={msg.id}
              onHover={() => setHoveredMessageId(msg.id)} 
              onHide={() => setHoveredMessageId(null)}
            />
          ))}
        </div>

        {/* Animated typing indicator */}
        <div id="typingIndicator" className="typing-indicator">
          <span>Thinking</span>
          <div className="dots-loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container" ref={rootRef}>
      <ChatInterface />
    </div>
  );
};

// Mount the app to the root element
ReactDOM.render(<App />, document.getElementById('root'));