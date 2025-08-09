import * as vscode from "vscode";
import { LMStudioClient } from "../lmstudio/LMStudioClient";
import { ModelManager } from "../lmstudio/ModelManager";
import { MessageHandler } from "./MessageHandler";
import { AgentManager } from "../agent/AgentManager";
import { ConversationStorage } from "../storage/ConversationStorage";

export class ChatProvider implements vscode.WebviewViewProvider {
  private _webviewView: vscode.WebviewView | undefined;
  private client: LMStudioClient;
  private modelManager: ModelManager;
  private extensionUri: vscode.Uri;
  private messageHandler: MessageHandler;
  private agentManager: AgentManager;
  private conversationStorage: ConversationStorage | undefined;
  private webviewReady: boolean = false;
  private pendingMessages: any[] = [];

  constructor(
    client: LMStudioClient,
    extensionUri: vscode.Uri,
    messageHandler?: MessageHandler,
    agentManager?: AgentManager,
    context?: vscode.ExtensionContext,
  ) {
    this.client = client;
    this.extensionUri = extensionUri;

    // Initialize conversation storage if context provided
    if (context) {
      this.conversationStorage = new ConversationStorage(context);
    }

    // Initialize LM Studio components
    this.modelManager = new ModelManager();

    // Use provided dependencies OR create new ones
    this.agentManager = agentManager || new AgentManager(client);
    this.messageHandler = messageHandler || new MessageHandler(this.agentManager);

    // Wire the message handler
    this.messageHandler.setChatProvider(this);
  }

  // Wire message handler (for external calls)
  public wireMessageHandler(): void {
    // Already done in constructor, but kept for compatibility
  }

  // Create file externally (for MessageHandler)
  public async createFileExternal(filePath: string, content: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(filePath);
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
      vscode.window.showInformationMessage(`File created: ${filePath}`);
    } catch (error) {
      console.error("Failed to create file:", error);
      vscode.window.showErrorMessage(`Failed to create file: ${filePath}`);
    }
  }

  // Public method to send messages to the webview
  public sendMessageToWebview(message: any): void {
    if (this._webviewView) {
      this._webviewView.webview.postMessage(message);
    }
  }

  // Set the extension context for conversation storage
  public setExtensionContext(context: vscode.ExtensionContext): void {
    this.conversationStorage = new ConversationStorage(context);
  }

  // Get conversation storage instance
  public getConversationStorage(): ConversationStorage | undefined {
    return this.conversationStorage;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ) {
    this._webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist")],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Setup message handling
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "webviewReady") {
        this.webviewReady = true;
        // Process any pending messages
        for (const pendingMessage of this.pendingMessages) {
          await this.processWebviewMessage(pendingMessage);
        }
        this.pendingMessages = [];
        return;
      }

      if (!this.webviewReady) {
        this.pendingMessages.push(message);
        return;
      }

      await this.processWebviewMessage(message);
    });
  }

  private async processWebviewMessage(message: any): Promise<void> {
    try {
      switch (message.command) {
        case "sendMessage":
          await this.handleSendMessage(message);
          break;
        case "getModels":
          await this.handleGetModels();
          break;
        case "setModel":
          await this.handleSetModel(message);
          break;
        case "openFile":
          await this.handleOpenFile(message);
          break;
        case "applyChange":
          await this.handleApplyChange(message);
          break;
        case "runCode":
          await this.handleRunCode(message);
          break;
        case "editInEditor":
          await this.handleEditInEditor(message);
          break;
        case "regenerateResponse":
          await this.handleRegenerateResponse(message);
          break;
        case "previewFile":
          await this.handlePreviewFile(message);
          break;
        case "fileUpload":
          await this.handleFileUpload(message);
          break;
        case "createFile":
          await this.handleCreateFile(message);
          break;
        case "securityApproval":
          await this.handleSecurityApproval(message);
          break;
        default:
          console.warn('Unknown command:', message.command);
      }
    } catch (error) {
      console.error('Error processing webview message:', error);
      this.sendMessageToWebview({
        command: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  private async handleSendMessage(message: any): Promise<void> {
    if (!message.message) {
      this.sendMessageToWebview({
        command: "error",
        message: "Message content is required"
      });
      return;
    }

    try {
      // Send user message to webview
      this.sendMessageToWebview({
        command: "addMessage",
        message: {
          id: `msg-${Date.now()}`,
          role: "user",
          content: message.message,
          timestamp: new Date().toISOString()
        }
      });

      // Get AI response using MessageHandler
      const response = await this.messageHandler.handleMessage(message.message, "provider");
      
      // Send AI response to webview
      this.sendMessageToWebview({
        command: "addMessage",
        message: {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Failed to handle send message:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to get response: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handleGetModels(): Promise<void> {
    try {
      const models = await this.modelManager.getAvailableModels();
      const currentModel = await this.modelManager.getCurrentModel();
      
      this.sendMessageToWebview({
        command: "modelsUpdated",
        models,
        currentModel
      });
    } catch (error) {
      console.error("Failed to get models:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to get available models: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handleSetModel(message: any): Promise<void> {
    try {
      await this.modelManager.setCurrentModel(message.model);
      this.sendMessageToWebview({
        command: "showNotification",
        message: `Model changed to ${message.model}`
      });
    } catch (error) {
      console.error("Failed to set model:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to set model: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handleOpenFile(message: any): Promise<void> {
    if (!message.filePath) {
      this.sendMessageToWebview({
        command: "error",
        message: "File path is required"
      });
      return;
    }

    try {
      const uri = vscode.Uri.file(message.filePath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      console.error("Failed to open file:", error);
      vscode.window.showErrorMessage(`Failed to open file: ${message.filePath}`);
    }
  }

  private async handleApplyChange(message: any): Promise<void> {
    try {
      // Delegate to MessageHandler if it has this capability
      if (this.messageHandler && typeof (this.messageHandler as any).applyChange === 'function') {
        await (this.messageHandler as any).applyChange(message.changeId, message.changes);
      } else {
        console.warn('Apply change not implemented in MessageHandler');
      }
      
      this.sendMessageToWebview({
        command: "showNotification",
        message: `Applied changes for ${message.changeId || "unnamed"}`
      });
    } catch (error) {
      console.error("Failed to apply change:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to apply changes: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handleRunCode(message: any): Promise<void> {
    try {
      // Delegate to MessageHandler if it has this capability
      if (this.messageHandler && typeof (this.messageHandler as any).executeCode === 'function') {
        const result = await (this.messageHandler as any).executeCode(message.code);
        this.sendMessageToWebview({
          command: "codeExecutionResult",
          result
        });
      } else {
        // Basic implementation - show in terminal
        const terminal = vscode.window.createTerminal('LMS Copilot');
        terminal.sendText(message.code);
        terminal.show();
        
        this.sendMessageToWebview({
          command: "showNotification",
          message: "Code sent to terminal"
        });
      }
    } catch (error) {
      console.error("Failed to run code:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to run code: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handleEditInEditor(message: any): Promise<void> {
    try {
      // Create a new untitled document with the content
      const document = await vscode.workspace.openTextDocument({
        content: message.content,
        language: 'plaintext'
      });
      await vscode.window.showTextDocument(document);
      
      this.sendMessageToWebview({
        command: "showNotification",
        message: "Opened content in editor"
      });
    } catch (error) {
      console.error("Failed to open editor:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to open editor: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handleRegenerateResponse(message: any): Promise<void> {
    try {
      // For now, just show a notification - could be enhanced later
      this.sendMessageToWebview({
        command: "showNotification",
        message: "Regenerate response requested"
      });
    } catch (error) {
      console.error("Failed to regenerate response:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to regenerate response: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handlePreviewFile(message: any): Promise<void> {
    try {
      if (!message.filePath) {
        this.sendMessageToWebview({
          command: "filePreviewResponse",
          requestId: message.requestId,
          error: "File path is required"
        });
        return;
      }

      const uri = vscode.Uri.file(message.filePath);
      const content = await vscode.workspace.fs.readFile(uri);
      const textContent = new TextDecoder().decode(content);
      
      this.sendMessageToWebview({
        command: "filePreviewResponse",
        requestId: message.requestId,
        content: textContent
      });
    } catch (error) {
      console.error("Failed to preview file:", error);
      this.sendMessageToWebview({
        command: "filePreviewResponse",
        requestId: message.requestId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  private async handleFileUpload(message: any): Promise<void> {
    try {
      // For now, just acknowledge the upload
      this.sendMessageToWebview({
        command: "showNotification",
        message: `Received ${message.files?.length || 0} file(s)`
      });
    } catch (error) {
      console.error("Failed to handle file upload:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to handle file upload: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handleCreateFile(message: any): Promise<void> {
    try {
      if (!message.filePath || !message.content) {
        this.sendMessageToWebview({
          command: "error",
          message: "File path and content are required"
        });
        return;
      }

      const uri = vscode.Uri.file(message.filePath);
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(uri, encoder.encode(message.content));
      
      this.sendMessageToWebview({
        command: "showNotification",
        message: `File created: ${message.filePath}`
      });

      if (message.requestId) {
        this.sendMessageToWebview({
          command: "fileCreated",
          requestId: message.requestId,
          filePath: message.filePath,
          success: true
        });
      }
    } catch (error) {
      console.error("Failed to create file:", error);
      
      if (message.requestId) {
        this.sendMessageToWebview({
          command: "fileCreated",
          requestId: message.requestId,
          filePath: message.filePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
      
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to create file: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private async handleSecurityApproval(message: any): Promise<void> {
    try {
      // For now, just acknowledge the security approval
      this.sendMessageToWebview({
        command: "hideSecurityPrompt",
        promptId: message.promptId
      });
      
      this.sendMessageToWebview({
        command: "showNotification",
        message: message.approved ? "Operation approved" : "Operation denied"
      });
    } catch (error) {
      console.error("Failed to handle security approval:", error);
      this.sendMessageToWebview({
        command: "error",
        message: `Failed to handle security approval: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview.css")
    );

    const cspPolicy = [
      "default-src 'none'",
      `script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `img-src ${webview.cspSource} data:`,
      `font-src ${webview.cspSource}`,
      "connect-src https: wss: ws: http://localhost:*"
    ].join("; ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${cspPolicy}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>LMS Copilot</title>
</head>
<body>
    <div id="root">
        <div class="chat-container">
            <div class="chat-header">
                <h2>LMS Copilot</h2>
                <div class="model-selector">
                    <select id="modelSelect">
                        <option value="">Loading models...</option>
                    </select>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages"></div>
            <div class="chat-input-container">
                <div class="chat-input">
                    <textarea id="messageInput" placeholder="Type your message here..." rows="1"></textarea>
                    <button id="sendButton">Send</button>
                </div>
            </div>
        </div>
    </div>
    <script>
        // Notify extension that webview is ready
        const vscode = acquireVsCodeApi();
        vscode.postMessage({ command: 'webviewReady' });
    </script>
    <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
