interface BaseMessage {
  id: string;
  timestamp: number;
  content: string;
}

export interface UserMessage extends BaseMessage {
  role: 'user';
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  streaming?: boolean;
}