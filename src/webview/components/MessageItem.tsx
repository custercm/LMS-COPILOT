import React from 'react';
import CodeBlock from './CodeBlock';
import { hasCodeBlocks, parseMessageContent } from '../utils/messageParser';
import { UserMessage, AssistantMessage } from '../types/messages';

interface MessageItemProps {
  message: UserMessage | AssistantMessage;
  isStreaming?: boolean;
}

function MessageItem({ message, isStreaming }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message-item ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-header">
        <span className="message-author">{isUser ? 'You' : 'Assistant'}</span>
        <span className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="message-content">
        {hasCodeBlocks(message.content) ? (
          <CodeBlock
            content={message.content}
            isStreaming={isStreaming}
          />
        ) : (
          <div 
            dangerouslySetInnerHTML={{ 
              __html: parseMessageContent(message.content) 
            }} 
          />
        )}
      </div>
    </div>
  );
}
export default MessageItem;
