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

export interface CommandMessage {
  type: 'command';
  payload: any;
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

export interface OpenFileCommand {
  command: 'openFile';
  filePath: string;
  lineNumber?: number;
}

export interface PreviewFileCommand {
  command: 'previewFile';
  filePath: string;
  requestId: string;
}

export interface FileUploadCommand {
  command: 'fileUpload';
  files: Array<{
    name: string;
    content: string;
    size: number;
    type: string;
  }>;
  requestId: string;
}

export interface CreateFileCommand {
  command: 'createFile';
  filePath: string;
  content: string;
  requestId: string;
}

export interface PerformanceTestCommand {
  type: 'performance-test';
  payload: any;
}

export interface FileReference {
  path: string;
  line?: number;
  column?: number;
}

export type WebviewCommand = 
  | SendMessageCommand 
  | ApplyChangeCommand 
  | RunCodeCommand 
  | EditInEditorCommand 
  | RegenerateResponseCommand
  | OpenFileCommand
  | PreviewFileCommand
  | FileUploadCommand
  | CreateFileCommand
  | PerformanceTestCommand
  | CommandMessage;

// Messages received from extension
export interface AddMessageEvent {
  command: 'addMessage';
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    fileReferences?: FileReference[];
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

export interface AddFileReferenceEvent {
  command: 'addFileReference';
  reference: FileReference;
}

export interface FilePreviewResponseEvent {
  command: 'filePreviewResponse';
  requestId: string;
  content?: string;
  error?: string;
}

export type ExtensionMessage = 
  | AddMessageEvent 
  | ShowTypingIndicatorEvent 
  | HideTypingIndicatorEvent 
  | HandleErrorEvent
  | AddFileReferenceEvent
  | FilePreviewResponseEvent;
