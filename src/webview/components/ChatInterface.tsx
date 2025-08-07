import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import StreamingIndicator from './StreamingIndicator';
import CommandPalette, { Command } from './CommandPalette';
import { ChatResponse, ExtensionMessage, WebviewCommand, FileReference } from '../types/api';
import { Message } from '../types/messages';
import useWebviewApi from '../hooks/useWebviewApi';
import { CommandHandler, CommandContext } from '../utils/commandHandler';
import { CommandHistoryManager } from '../utils/commandHistory';
import '../styles/ChatInterface.css';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileReferences, setFileReferences] = useState<FileReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const webviewApi = useWebviewApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create command context
  const commandContext: CommandContext = {
    sendMessage: (message: string) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: message,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);
    },
    sendCommand: (command: string, args?: string) => {
      webviewApi.sendCommand(command, args);
    },
    clearChat: () => {
      setMessages([]);
    },
    showError: (message: string) => {
      setNotification({ type: 'error', message });
      setTimeout(() => setNotification(null), 5000);
    },
    showSuccess: (message: string) => {
      setNotification({ type: 'success', message });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Initialize command handler
  const commandHandler = new CommandHandler(commandContext);
  const availableCommands = commandHandler.getCommands();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette shortcut
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Help shortcut
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        commandHandler.executeCommand('/help');
      }
      
      // Clear chat shortcut
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        commandHandler.executeCommand('/clear');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), notification.type === 'error' ? 5000 : 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  // Handle incoming messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      
      switch (message.command) {
        case 'addMessage':
          const newMessage: Message = {
            ...message.message,
            id: message.message.id || Date.now().toString()
          };
          setMessages(prev => [...prev, newMessage]);
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
          setNotification({ type: 'error', message: message.message });
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
      const parsed = CommandHandler.parseCommand(content);
      if (parsed) {
        // Add user message to chat
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Execute command
        commandHandler.executeCommand(parsed.command, parsed.args);
      }
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
      command: 'sendMessage',
      text: content
    });
  };

  const handleCommandSelect = (command: string, args?: string) => {
    const fullCommand = args ? `${command} ${args}` : command;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: fullCommand,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Add to command history
    CommandHistoryManager.addToHistory(command, args);
    
    // Execute command
    const parsed = CommandHandler.parseCommand(fullCommand);
    if (parsed) {
      commandHandler.executeCommand(parsed.command, parsed.args);
    }
  };

  const handleCommandPaletteSelect = (command: Command, args?: string) => {
    // Add user message showing the command
    const commandText = args ? `${command.name} ${args}` : command.name;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: commandText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Execute the command
    command.handler(args);
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
      {/* Notification system */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        commands={availableCommands}
        onCommandSelect={handleCommandPaletteSelect}
        onClose={() => setShowCommandPalette(false)}
        isVisible={showCommandPalette}
      />

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
        onOpenFile={(filePath: string) => {
          // Send command to open file in editor
          webviewApi.sendMessage({
            command: 'openFile',
            filePath: filePath,
            lineNumber: undefined
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

      {/* Enhanced Input Area with command support */}
      <InputArea
        onSendMessage={handleSendMessage}
        onCommandSelect={handleCommandSelect}
        onShowCommandPalette={() => setShowCommandPalette(true)}
        ariaLabel="Chat input area"
        enableDragAndDrop={true}
      />

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