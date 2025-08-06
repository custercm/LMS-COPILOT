import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { ChatResponse, ExtensionMessage, WebviewCommand, FileReference } from '../types/api';
import { useWebviewApi } from '../hooks/useWebviewApi';

interface ChatInterfaceProps {
  // No props needed for now
}
const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [fileReferences, setFileReferences] = useState<FileReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const webviewApi = useWebviewApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    // Add user message immediately
    const userMessage = {
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to extension
    webviewApi.sendMessage({
      command: 'sendMessage',
      text: content
    });
  };

  return (
    <div className="chat-interface">
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
      
      {isLoading && (
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      
      <InputArea
        onSendMessage={handleSendMessage}
        onFileSelect={(fileRef: FileReference) => {
          setFileReferences(prev => [...prev, fileRef]);
        }}
      />
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;