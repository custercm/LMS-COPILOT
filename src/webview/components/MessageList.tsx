import React from 'react';
import MessageItem from './MessageItem';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  fileReferences?: FileReference[];
}

interface MessageListProps {
  messages: Message[];
  fileReferences: FileReference[];
  onOpenFile: (reference: FileReference) => void;
}

function MessageList({ messages, fileReferences, onOpenFile }: MessageListProps) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageItem 
          key={message.id}
          message={message}
          fileReferences={fileReferences.filter(ref => ref.path.includes(message.id))}
          onOpenFile={onOpenFile}
        />
      ))}
    </div>
  );
}

export default MessageList;