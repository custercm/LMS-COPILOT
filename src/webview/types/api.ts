import { FileChange } from './changes';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  id: string;
  messages: ChatMessage[];
  changes?: FileChange[]; // Optional file changes in the response
}

export interface ApplyChangeRequest {
  changeId: string;
}

export interface RevertChangeRequest {
  changeId: string;
}

// Define message commands sent between webview and extension
export interface SendMessageCommand {
  command: 'sendMessage';
  text: string;
}

export interface ApplyChangeCommand {
  command: 'applyChange';
  changeId: string;
  changes: FileChange[];
}

export interface RunCodeCommand {
  command: 'runCode';
  code: string;
  changeId?: string;
}

export interface EditInEditorCommand {
  command: 'editInEditor';
  content: string;
  changeId?: string;
}

export interface RegenerateResponseCommand {
  command: 'regenerateResponse';
  changeId?: string;
}

export type WebviewCommand = 
  | SendMessageCommand 
  | ApplyChangeCommand 
  | RunCodeCommand 
  | EditInEditorCommand 
  | RegenerateResponseCommand;

// Messages received from extension
export interface AddMessageEvent {
  command: 'addMessage';
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  };
}

export interface ShowTypingIndicatorEvent {
  command: 'showTypingIndicator';
}

export interface HideTypingIndicatorEvent {
  command: 'hideTypingIndicator';
}

export interface HandleErrorEvent {
  command: 'handleError';
  message: string;
}

export type ExtensionMessage = 
  | AddMessageEvent 
  | ShowTypingIndicatorEvent 
  | HideTypingIndicatorEvent 
  | HandleErrorEvent;
