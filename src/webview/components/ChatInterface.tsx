import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import StreamingIndicator from './StreamingIndicator';
import { useStreaming } from '../hooks/useStreaming';
import { useChangeManagement } from '../hooks/useChangeManagement';
import useWebviewApi from '../hooks/useWebviewApi';
import { UserMessage, AssistantMessage } from '../types/messages';

function ChatInterface() {
  const [messages, setMessages] = useState<(UserMessage | AssistantMessage)[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { streamingState, startStreaming, appendToStream, endStreaming } = useStreaming();
  const { changeSets, pendingChanges, applyChange, revertChange, previewChange } = useChangeManagement();
  const { sendMessage: sendToBackend } = useWebviewApi();

  // Handle messages from VS Code extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'addMessage':
          const newMessage: UserMessage | AssistantMessage = {
            id: `msg-${Date.now()}`,
            role: message.message.role,
            content: message.message.content,
            timestamp: message.message.timestamp || Date.now()
          };
          setMessages(prev => [...prev, newMessage]);
          if (isTyping) setIsTyping(false);
          break;
          
        case 'showTypingIndicator':
          setIsTyping(true);
          break;
          
        case 'hideTypingIndicator':
          setIsTyping(false);
          break;
          
        case 'handleError':
          const errorMessage: AssistantMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Error: ${message.message}`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsTyping(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isTyping]);

  const handleSendMessage = (content: string) => {
    // Add user message to the list immediately
    const userMessage: UserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to VS Code extension backend
    sendToBackend({
      command: 'sendMessage',
      text: content
    });
  };

  return (
    <div className="chat-interface">
      <MessageList
        messages={messages}
        streamingState={streamingState}
        changeSets={changeSets}
      />
      {isTyping && <StreamingIndicator isStreaming={true} />}
      <InputArea
        onSendMessage={handleSendMessage}
        pendingChanges={pendingChanges}
        applyChange={applyChange}
        revertChange={revertChange}
      />
    </div>
  );
}
export default ChatInterface;
