import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import StreamingIndicator from './StreamingIndicator';
import { ChatResponse, ExtensionMessage, WebviewCommand, FileReference } from '../types/api';
import { useWebviewApi } from '../hooks/useWebviewApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  fileReferences?: FileReference[];
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileReferences, setFileReferences] = useState<FileReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const webviewApi = useWebviewApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Command suggestions for auto-completion
  const commandSuggestions = [
    '/help',
    '/clear',
    '/explain',
    '/workspace',
    '/install',
    '/run',
    '/debug'
  ];

  // Handle incoming messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      
      switch (message.command) {
        case 'addMessage':
          setMessages(prev => [...prev, message.message]);
          break;
        case 'showTypingIndicator':
          setIsLoading(true);
          break;
        case 'hideTypingIndicator':
          setIsLoading(false);
          break;
        case 'handleError':
          // Handle error messages in UI
          console.error(message.message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    // Check if it's a command
    if (content.startsWith('/')) {
      webviewApi.sendCommand(content.split(' ')[0], content.substring(content.indexOf(' ') + 1));
      return;
    }

    // Regular message
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Send to backend for processing
    webviewApi.sendMessage({
      type: 'message',
      payload: {
        content,
        messageId: newMessage.id
      }
    });
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Process uploaded files
      console.log('Files attached:', e.target.files);
      // In a real implementation, you would send the file to backend for processing
    }
  };

  return (
    <div className="chat-interface">
      {/* Loading state/skeleton loader */}
      {isLoading && (
        <div className="skeleton-loader-container">
          <div className="skeleton-message user-message">
            <div className="skeleton-content"></div>
          </div>
          <div className="skeleton-message assistant-message">
            <div className="skeleton-content"></div>
            <div className="skeleton-content short"></div>
          </div>
        </div>
      )}
      
      {/* Message list with smooth transitions */}
      <MessageList
        messages={messages}
        fileReferences={fileReferences}
        onOpenFile={(reference: FileReference) => {
          // Send command to open file in editor
          webviewApi.sendMessage({
            command: 'openFile',
            filePath: reference.path,
            lineNumber: reference.line
          });
        }}
      />
      
      {/* Progress indicator for long operations */}
      {isLoading && (
        <div className="progress-indicator">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '75%' }}></div>
          </div>
        </div>
      )}

      {/* File attachment area */}
      <div className="file-attachment-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          multiple
        />
        <button onClick={handleFileAttachment} className="attach-button">
          Attach Files
        </button>
      </div>

      {/* Contextual menu and tooltip implementation */}
      <div className="context-menu-container">
        <InputArea
          onSendMessage={handleSendMessage}
          aria-label="Chat input area"
        />

        {/* Tooltips for actions */}
        <button
          className="tooltip-trigger"
          data-tooltip="Send message"
          aria-describedby="send-message-tooltip"
        >
          Send
        </button>
        <div id="send-message-tooltip" className="tooltip">
          Click to send your message to the AI assistant
        </div>
      </div>

      {/* Streaming indicator with micro-interactions */}
      <StreamingIndicator
        isStreaming={isLoading}
        progress={isLoading ? 75 : 0}
      />
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;

// Add test utilities to existing component files

import React, { useState } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import StreamingIndicator from './StreamingIndicator';

interface ChatInterfaceProps {
  // ... existing props ...
}

function ChatInterface({ 
  messages,
  onSendMessage,
  isLoading,
  streamingState,
  onOpenFile
}: ChatInterfaceProps) { ... }

// Export test components for integration testing
export const TestChatInterface = (props: ChatInterfaceProps) => {
  return (
    <div className="chat-interface-test">
      <h3>Test Chat Interface</h3>
      {/* For testing purposes */}
      <MessageList 
        messages={props.messages || []}
        onOpenFile={onOpenFile}
      />
      <InputArea onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export const TestStreamingIndicator = (props: {isStreaming?: boolean}) => (
  <StreamingIndicator isStreaming={props.isStreaming || false} />
);