import React, { useState, useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Message } from '../types/messages';
import { FileReference } from '../types/api';

interface MessageListProps {
  messages: Message[];
  fileReferences?: FileReference[];
  onOpenFile?: (filePath: string) => void;
  isHovered?: boolean;
}

// Test helper functions for integration testing
export const createTestMessageItem = (content: string, role: 'user' | 'assistant') => ({
  id: Date.now().toString(),
  content,
  role,
  timestamp: Date.now()
});

export const createEmptyMessagesArray = () => [];

function MessageList({ 
  messages, 
  fileReferences = [],
  onOpenFile,
  isHovered = false
}: MessageListProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const messageListRef = useRef<HTMLDivElement>(null);
  
  // Virtualization constants
  const MESSAGE_HEIGHT = 80; // Approximate height of each message item in pixels
  const BUFFER_SIZE = 5; // Number of extra messages to render above/below viewport

  // Calculate visible range based on scroll position
  useEffect(() => {
    if (!messageListRef.current) return;
    
    const containerHeight = messageListRef.current.clientHeight;
    const scrollTop = messageListRef.current.scrollTop || 0;
    
    const newStartIndex = Math.max(0, Math.floor(scrollTop / MESSAGE_HEIGHT) - BUFFER_SIZE);
    const visibleCount = Math.ceil(containerHeight / MESSAGE_HEIGHT) + (BUFFER_SIZE * 2);
    const endIndex = Math.min(messages.length, newStartIndex + visibleCount);
    
    setVisibleMessages(messages.slice(newStartIndex, endIndex));
    setStartIndex(newStartIndex);
  }, [messages]);

  // Handle scroll events for virtualization
  const handleScroll = () => {
    if (!messageListRef.current) return;
    
    const containerHeight = messageListRef.current.clientHeight;
    const scrollTop = messageListRef.current.scrollTop || 0;
    
    const newStartIndex = Math.max(0, Math.floor(scrollTop / MESSAGE_HEIGHT) - BUFFER_SIZE);
    const visibleCount = Math.ceil(containerHeight / MESSAGE_HEIGHT) + (BUFFER_SIZE * 2);
    const endIndex = Math.min(messages.length, newStartIndex + visibleCount);
    
    setVisibleMessages(messages.slice(newStartIndex, endIndex));
    setStartIndex(newStartIndex);
  };

  // This function would be used to render the change tracking panel
  const renderChangeTrackingPanel = () => {
    return (
      <div className="change-tracking-panel">
        <h3>Modified Files</h3>
        <div className="change-summary">3 additions, 2 deletions</div>
        <div className="global-controls">
          <button className="keep-all-btn">Keep All Changes</button>
          <button className="undo-all-btn">Undo All Changes</button>
        </div>
        <div className="file-list">
          {/* This would be populated with actual file changes */}
          <div className="file-item pending">
            <span>src/extension.ts</span>
            <span className="status-indicator pending">Pending</span>
          </div>
          <div className="file-item applied">
            <span>package.json</span>
            <span className="status-indicator applied">Applied</span>
          </div>
        </div>
      </div>
    );
  };

  // Calculate total height for scroll container
  const totalHeight = messages.length * MESSAGE_HEIGHT;

  return (
    <div 
      ref={messageListRef}
      className={`message-list ${isHovered ? 'hovered' : ''}`}
      onScroll={handleScroll}
    >
      {/* Virtualized message rendering */}
      <div 
        style={{ 
          height: `${totalHeight}px`, 
          position: 'relative' 
        }}
      >
        {visibleMessages.map((message, index) => (
          // Calculate actual index based on virtualization
          <div
            key={message.id}
            style={{
              position: 'absolute',
              top: `${(startIndex + index) * MESSAGE_HEIGHT}px`,
              width: '100%',
              height: `${MESSAGE_HEIGHT}px`
            }}
          >
            <MessageItem 
              message={message}
              onOpenFile={onOpenFile}
            />
          </div>
        ))}
      </div>

      {/* Render change tracking panel if there are pending changes */}
      {renderChangeTrackingPanel()}
    </div>
  );
}

export default MessageList;