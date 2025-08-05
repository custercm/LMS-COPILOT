import React from 'react';
import MessageItem from './MessageItem';
import { UserMessage, AssistantMessage } from '../types/messages';
import { ChangeSet } from '../types/changes';

interface MessageListProps {
  messages: (UserMessage | AssistantMessage)[];
  streamingState?: any;
  changeSets: ChangeSet[];
}

function MessageList({ messages, streamingState, changeSets }: MessageListProps) {
  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageItem 
          key={msg.id} 
          message={msg}
          isStreaming={streamingState?.messageId === msg.id && streamingState.isStreaming}
        />
      ))}
      
      {/* Display pending changes */}
      {changeSets.length > 0 && (
        <div className="changes-summary">
          <h3>Pending Changes</h3>
          <ul>
            {changeSets.map(changeSet => (
              <li key={changeSet.id}>
                {changeSet.description} ({changeSet.changes.length} files)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MessageList;