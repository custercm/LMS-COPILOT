import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import StreamingIndicator from './StreamingIndicator';
import CommandPalette, { Command } from './CommandPalette';
import ContextualMenu, { ContextMenuItem } from './ContextualMenu';
import EnhancedTooltip from './EnhancedTooltip';
import SkeletonLoader from './SkeletonLoader';
import { ChatResponse, ExtensionMessage, WebviewCommand, FileReference } from '../types/api';
import { Message } from '../types/messages';
import useWebviewApi from '../hooks/useWebviewApi';
import { useKeyboardNavigation, useFocusAnnouncement } from '../hooks/useKeyboardNavigation';
import { CommandHandler, CommandContext } from '../utils/commandHandler';
import { CommandHistoryManager } from '../utils/commandHistory';
import '../styles/ChatInterface.css';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileReferences, setFileReferences] = useState<FileReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    items: ContextMenuItem[];
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    items: []
  });

  const webviewApi = useWebviewApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Accessibility hooks
  const { announce, announceRef } = useFocusAnnouncement();
  const containerRef = useKeyboardNavigation({
    onEscape: () => {
      setShowCommandPalette(false);
      setContextMenu(prev => ({ ...prev, visible: false }));
    },
    focusOnMount: true
  }) as React.RefObject<HTMLDivElement>;

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

  // Context menu handlers
  const handleContextMenu = (event: React.MouseEvent, messageId?: string) => {
    event.preventDefault();
    
    const items: ContextMenuItem[] = [
      {
        id: 'copy',
        label: 'Copy Message',
        icon: '📋',
        shortcut: 'Ctrl+C',
        onClick: () => {
          if (messageId) {
            const message = messages.find(m => m.id === messageId);
            if (message) {
              navigator.clipboard.writeText(message.content);
              announce('Message copied to clipboard');
            }
          }
        }
      },
      {
        id: 'regenerate',
        label: 'Regenerate Response',
        icon: '🔄',
        onClick: () => {
          if (messageId) {
            handleRegenerateMessage(messageId);
            announce('Regenerating response');
          }
        },
        disabled: !messageId || messages.find(m => m.id === messageId)?.role !== 'assistant'
      },
      {
        id: 'edit',
        label: 'Edit Message',
        icon: '✏️',
        shortcut: 'E',
        onClick: () => {
          if (messageId) {
            handleEditMessage(messageId);
          }
        }
      },
      {
        id: 'separator1',
        label: '---',
        onClick: () => {},
        disabled: true
      },
      {
        id: 'export',
        label: 'Export Chat',
        icon: '💾',
        shortcut: 'Ctrl+S',
        onClick: () => {
          handleExportChat();
          announce('Chat export started');
        }
      },
      {
        id: 'clear',
        label: 'Clear Chat',
        icon: '🗑️',
        shortcut: 'Ctrl+Shift+L',
        onClick: () => {
          commandHandler.executeCommand('/clear');
          announce('Chat cleared');
        }
      }
    ];

    setContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      items
    });
  };

  const handleRegenerateMessage = (messageId: string) => {
    // Implementation for regenerating a message
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleEditMessage = (messageId: string) => {
    // Implementation for editing a message
    const message = messages.find(m => m.id === messageId);
    if (message) {
      // Open edit dialog or make message editable
      console.log('Editing message:', message);
    }
  };

  const handleExportChat = () => {
    // Implementation for exporting chat
    const chatData = {
      messages,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lms-copilot-chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
    <div 
      ref={containerRef}
      className="chat-interface"
      onContextMenu={(e) => handleContextMenu(e)}
      role="main"
      aria-label="LMS Copilot Chat Interface"
      tabIndex={-1}
    >
      {/* Skip link for accessibility */}
      <a href="#main-input" className="skip-link">
        Skip to message input
      </a>

      {/* Screen reader announcements */}
      <div
        ref={announceRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Enhanced notification system */}
      {notification && (
        <div className={`notification ${notification.type}`} role="alert" aria-live="assertive">
          <span className="notification-message">{notification.message}</span>
          <EnhancedTooltip content="Close notification">
            <button 
              className="notification-close interactive-element"
              onClick={() => setNotification(null)}
              aria-label="Close notification"
            >
              ×
            </button>
          </EnhancedTooltip>
        </div>
      )}

      {/* Command Palette with enhanced navigation */}
      <CommandPalette
        commands={availableCommands}
        onCommandSelect={handleCommandPaletteSelect}
        onClose={() => setShowCommandPalette(false)}
        isVisible={showCommandPalette}
      />

      {/* Loading state with enhanced skeleton loaders */}
      {isLoading && messages.length === 0 && (
        <div className="skeleton-loader-container" aria-label="Loading conversation">
          <SkeletonLoader variant="message" animation="wave" />
          <SkeletonLoader variant="message" animation="wave" />
        </div>
      )}
      
      {/* Message list with enhanced accessibility */}
      <MessageList
        messages={messages}
        fileReferences={fileReferences}
        onOpenFile={(filePath: string, lineNumber?: number) => {
          webviewApi.sendMessage({
            command: 'openFile',
            filePath: filePath,
            lineNumber: lineNumber
          });
          announce(`Opening file ${filePath}${lineNumber ? ` at line ${lineNumber}` : ''}`);
        }}
        onPreviewFile={async (filePath: string) => {
          announce(`Loading preview for ${filePath}`);
          return new Promise((resolve, reject) => {
            const requestId = Date.now().toString();
            
            const cleanup = () => {
              window.removeEventListener('message', messageHandler);
            };
            
            const messageHandler = (event: MessageEvent) => {
              const message = event.data;
              if (message.command === 'filePreviewResponse' && message.requestId === requestId) {
                cleanup();
                if (message.error) {
                  announce(`Failed to load preview: ${message.error}`);
                  reject(new Error(message.error));
                } else {
                  announce('File preview loaded');
                  resolve(message.content || '');
                }
              }
            };
            
            window.addEventListener('message', messageHandler);
            
            webviewApi.sendMessage({
              command: 'previewFile',
              filePath: filePath,
              requestId: requestId
            });
            
            setTimeout(() => {
              cleanup();
              announce('File preview timed out');
              reject(new Error('File preview timeout'));
            }, 5000);
          });
        }}
        onContextMenu={handleContextMenu}
      />
      
      {/* Active loading indicator for current messages */}
      {isLoading && messages.length > 0 && (
        <div className="progress-indicator" aria-label="Processing request">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '75%' }}></div>
          </div>
          <SkeletonLoader variant="message" animation="pulse" />
        </div>
      )}

      {/* Enhanced file attachment area */}
      <div className="file-attachment-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          multiple
          accept=".txt,.md,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.yaml,.yml"
          aria-label="File input for attachments"
        />
        <EnhancedTooltip content="Attach files to include in your conversation">
          <button 
            onClick={handleFileAttachment} 
            className="attach-button interactive-element"
            aria-label="Attach files"
          >
            📎 Attach Files
          </button>
        </EnhancedTooltip>
      </div>

      {/* Enhanced Input Area with comprehensive accessibility */}
      <InputArea
        onSendMessage={handleSendMessage}
        onCommandSelect={handleCommandSelect}
        onShowCommandPalette={() => {
          setShowCommandPalette(true);
          announce('Command palette opened');
        }}
        ariaLabel="Chat input area - Type your message or use / for commands"
        enableDragAndDrop={true}
      />

      {/* Enhanced streaming indicator */}
      <StreamingIndicator
        isStreaming={isLoading}
        progress={isLoading ? 75 : 0}
      />

      {/* Contextual menu */}
      <ContextualMenu
        items={contextMenu.items}
        visible={contextMenu.visible}
        position={contextMenu.position}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        ariaLabel="Message context menu"
      />
      
      {/* Auto-scroll target */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;