import { FileReference } from './api';

interface BaseMessage {
  id: string;
  timestamp: number;
  content: string;
  fileReferences?: FileReference[];
}

export interface UserMessage extends BaseMessage {
  role: 'user';
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  streaming?: boolean;
}

export type ChatMessage = UserMessage | AssistantMessage;

// Legacy compatibility for existing components
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  fileReferences?: FileReference[];
}