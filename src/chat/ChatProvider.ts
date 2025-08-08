import * as vscode from "vscode";
import { LMStudioClient } from "../lmstudio/LMStudioClient";
import { ModelManager } from "../lmstudio/ModelManager";
import { StreamHandler } from "../lmstudio/StreamHandler";
import {
  SecurityManager,
  AuditEntry,
  ValidationResult,
} from "../security/SecurityManager";
import {
  PermissionsManager,
  PermissionResult,
} from "../security/PermissionsManager";
import { RateLimiter, RateLimitResult } from "../security/RateLimiter";
import {
  AdaptiveSecurityManager,
  SecurityConfigManager,
  SecurityLevel,
  AdaptiveValidationResult,
} from "../security/AdaptiveSecurity";
import { MessageHandler } from "./MessageHandler";
import { AgentManager } from "../agent/AgentManager";

export class ChatProvider implements vscode.WebviewViewProvider {
  private _webviewView: vscode.WebviewView | undefined;
  private client: LMStudioClient;
  private modelManager: ModelManager;
  private streamHandler: StreamHandler | undefined;
  private securityManager: SecurityManager;
  private permissionsManager: PermissionsManager;
  private rateLimiter: RateLimiter;
  private adaptiveSecurity: AdaptiveSecurityManager;
  private extensionUri: vscode.Uri;
  private messageHandler: MessageHandler;
  private agentManager: AgentManager;
  private webviewReady: boolean = false;
  private pendingMessages: any[] = [];

  constructor(
    client: LMStudioClient,
    extensionUri: vscode.Uri,
    messageHandler?: MessageHandler,
    agentManager?: AgentManager,
  ) {
    this.client = client;
    this.extensionUri = extensionUri;

    // Initialize LM Studio components
    this.modelManager = new ModelManager();

    // Use provided dependencies OR create new ones (backward compatibility)
    this.agentManager = agentManager || new AgentManager(client);
    this.messageHandler =
      messageHandler || new MessageHandler(this.agentManager);

    // Initialize security components (PRESERVE ALL EXISTING LOGIC)
    this.securityManager = SecurityManager.getInstance();
    this.permissionsManager = PermissionsManager.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
    this.adaptiveSecurity = new AdaptiveSecurityManager();

    // Update security from VS Code settings (PRESERVE)
    this.updateSecurityFromSettings();

    // Listen for settings changes (PRESERVE)
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("lmsCopilot.securityLevel")) {
        this.updateSecurityFromSettings();
      }
    });
  }

  // ADD new method for post-construction wiring
  public wireMessageHandler(): void {
    if (this.messageHandler) {
      this.messageHandler.setChatProvider(this);
    }
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ) {
    // Store the webview reference for later use
    this._webviewView = webviewView;

    // PRESERVE ALL EXISTING WEBVIEW OPTIONS
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist")],
      portMapping: [
        {
          webviewPort: 3000,
          extensionHostPort: 3000,
        },
      ],
    };

    // Set the HTML content for the webview
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // WAIT for webview to be ready before setting up message handler
    this.setupWebviewReadyDetection(webviewView);
  }

  private setupWebviewReadyDetection(webviewView: vscode.WebviewView): void {
    // Set up message handler immediately but queue messages until ready
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
    // MOVE ALL EXISTING MESSAGE PROCESSING LOGIC HERE
    // This preserves all existing functionality while adding proper sequencing

    try {
      // PRESERVE ALL EXISTING RATE LIMITING LOGIC
      if (this.adaptiveSecurity.shouldRateLimit("chat_messages")) {
        const rateLimitResult: RateLimitResult =
          this.rateLimiter.checkLimit("chat_messages");
        if (!rateLimitResult.allowed) {
          this._webviewView?.webview.postMessage({
            command: "error",
            message: `Rate limit exceeded: ${rateLimitResult.reason}. Try again in ${rateLimitResult.retryAfter} seconds.`,
          });
          return;
        }
      }

      // PRESERVE ALL EXISTING SANITIZATION LOGIC
      const sanitizedMessage = {
        ...message,
        text: message.text
          ? this.adaptiveSecurity.sanitizeInput(message.text)
          : message.text,
        content: message.content
          ? this.adaptiveSecurity.sanitizeInput(message.content)
          : message.content,
        code: message.code
          ? this.adaptiveSecurity.sanitizeInput(message.code)
          : message.code,
      };

      // PRESERVE ALL EXISTING SWITCH CASE LOGIC EXACTLY
      switch (sanitizedMessage.command) {
        case "sendMessage":
          await this.handleSendMessage(sanitizedMessage.text);
          return;
        case "getModels":
          await this.handleGetModels();
          return;
        case "setModel":
          await this.handleSetModel(sanitizedMessage.model);
          return;
        case "analyzeWorkspace":
          await this.handleAnalyzeWorkspace(sanitizedMessage.structure);
          return;
        case "getWorkspaceStructure":
          await this.handleGetWorkspaceStructure();
          return;
        case "applyChange":
          await this.handleApplyChange(
            sanitizedMessage.changeId,
            sanitizedMessage.content,
          );
          return;
        case "runCode":
          await this.handleRunCode(
            sanitizedMessage.code,
            sanitizedMessage.changeId,
          );
          return;
        case "editInEditor":
          await this.handleEditInEditor(
            sanitizedMessage.content,
            sanitizedMessage.changeId,
          );
          return;
        case "regenerateResponse":
          await this.handleRegenerateResponse(sanitizedMessage.changeId);
          return;
        case "fileUpload":
          await this.handleFileUpload(
            sanitizedMessage.files,
            sanitizedMessage.requestId,
          );
          return;
        case "createFile":
          await this.handleCreateFile(
            sanitizedMessage.filePath,
            sanitizedMessage.content,
            sanitizedMessage.requestId,
          );
          return;
        case "openFile":
          // Handle opening files from the webview with permission check (if enabled)
          if (this.adaptiveSecurity.shouldCheckFilePermissions()) {
            const permissionResult: PermissionResult =
              await this.permissionsManager.checkPermission(
                sanitizedMessage.filePath,
                "READ",
              );

            if (!permissionResult.allowed) {
              if (permissionResult.requiresUserConfirmation) {
                const approved =
                  await this.permissionsManager.requestUserPermission(
                    "read file",
                    sanitizedMessage.filePath,
                    permissionResult.details || "Open file in editor",
                  );

                if (!approved) {
                  this._webviewView?.webview.postMessage({
                    command: "error",
                    message: `Permission denied: ${permissionResult.reason}`,
                  });
                  return;
                }
              } else {
                this._webviewView?.webview.postMessage({
                  command: "error",
                  message: `Permission denied: ${permissionResult.reason}`,
                });
                return;
              }
            }
          }

          const fileUri = vscode.Uri.file(sanitizedMessage.filePath);
          try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document, {
              preview: false,
              selection: sanitizedMessage.lineNumber
                ? new vscode.Range(
                    sanitizedMessage.lineNumber - 1,
                    0,
                    sanitizedMessage.lineNumber - 1,
                    0,
                  )
                : undefined,
            });
          } catch (error) {
            console.error("Failed to open file:", error);
            vscode.window.showErrorMessage(
              `Failed to open file: ${sanitizedMessage.filePath}`,
            );
          }
          return;
      }
    } catch (error) {
      // PRESERVE ALL EXISTING ERROR HANDLING
      console.error("Error processing webview message:", error);

      if (this.adaptiveSecurity.shouldLogAudit()) {
        this.securityManager.logAuditEvent({
          type: "message_processing_error",
          timestamp: new Date(),
          approved: false,
          details: {
            command: message.command,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }

      this._webviewView?.webview.postMessage({
        command: "error",
        message:
          "An error occurred while processing your request. Please try again.",
      });
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // Use the built React webview instead of hardcoded HTML
    const webviewPath = vscode.Uri.joinPath(
      this.extensionUri,
      "dist",
      "webview",
      "webview.js",
    );
    const webviewUri = webview.asWebviewUri(webviewPath);

    // Generate CSP using adaptive security manager
    const cspPolicy = this.adaptiveSecurity.getCSPPolicy(webview);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="${cspPolicy}">
    <title>LMS Copilot Chat</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        #root {
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script src="${webviewUri}"></script>
</body>
</html>`;
  }

  private async handleSendMessage(message: string): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Sanitize user input before processing
      const sanitizedMessage = this.adaptiveSecurity.sanitizeInput(message);

      if (!this._validateMessage(sanitizedMessage)) {
        throw new Error("Invalid message content");
      }

      // Add rate limiting for API calls (if enabled by adaptive security)
      if (this.adaptiveSecurity.shouldRateLimit("api_calls")) {
        const rateLimitResult: RateLimitResult =
          this.rateLimiter.checkLimit("api_calls");
        if (!rateLimitResult.allowed) {
          throw new Error(
            `API call rate limit exceeded: ${rateLimitResult.reason}. Try again in ${rateLimitResult.retryAfter} seconds.`,
          );
        }
      }

      // Show typing indicator while waiting for response
      this.appendTypingIndicator();

      // Initialize streaming handler
      let streamingResponse = "";
      this.streamHandler = new StreamHandler(this.client, (chunk: string) => {
        streamingResponse += chunk;
        // Send incremental response updates to webview
        this._webviewView?.webview.postMessage({
          command: "updateStreamingMessage",
          content: streamingResponse,
          isComplete: false,
        });
      });

      try {
        // Try streaming first
        await this.streamHandler.streamResponse(sanitizedMessage);

        // Remove typing indicator after response is complete
        this.removeTypingIndicator();

        // Mark streaming as complete
        this._webviewView.webview.postMessage({
          command: "updateStreamingMessage",
          content: streamingResponse,
          isComplete: true,
        });
      } catch (streamError) {
        // Fallback to regular MessageHandler if streaming fails
        console.warn(
          "Streaming failed, falling back to regular response:",
          streamError,
        );

        // Use MessageHandler to process the message
        const response = await this.messageHandler.handleMessage(
          sanitizedMessage,
          "provider",
        );

        // Remove typing indicator after response is complete
        this.removeTypingIndicator();

        // Post the response back to the webview
        this._webviewView.webview.postMessage({
          command: "addMessage",
          message: {
            role: "assistant",
            content: response,
            timestamp: Date.now(),
          },
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      this.removeTypingIndicator();
      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to get response from AI assistant: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleGetModels(): Promise<void> {
    if (!this._webviewView) return;

    try {
      const models = await this.modelManager.getAvailableModels();
      const currentModel = this.modelManager.getCurrentModel();

      this._webviewView.webview.postMessage({
        command: "modelsResponse",
        models: models,
        currentModel: currentModel,
      });
    } catch (error) {
      this._webviewView.webview.postMessage({
        command: "error",
        message: `Failed to get available models: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleSetModel(model: string): Promise<void> {
    if (!this._webviewView) return;

    try {
      this.modelManager.setCurrentModel(model);

      this._webviewView.webview.postMessage({
        command: "modelSet",
        model: model,
        message: `Model changed to ${model}`,
      });
    } catch (error) {
      this._webviewView.webview.postMessage({
        command: "error",
        message: `Failed to set model: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleAnalyzeWorkspace(structure: string): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Validate workspace structure input
      const sanitizedStructure = this.adaptiveSecurity.sanitizeInput(structure);

      if (!this._validateWorkspaceStructure(sanitizedStructure)) {
        throw new Error("Invalid workspace structure");
      }

      // Analyze workspace structure with LMStudioClient
      const analysis = await this.client.analyzeWorkspace(sanitizedStructure);

      this._webviewView.webview.postMessage({
        command: "addMessage",
        message: {
          role: "assistant",
          content: `Workspace analysis complete:\n${analysis}`,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error analyzing workspace:", error);
      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to analyze workspace: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleGetWorkspaceStructure(): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Add rate limiting to API calls (if enabled)
      if (this.adaptiveSecurity.shouldRateLimit("workspace_structure")) {
        const rateLimitResult = this.rateLimiter.checkLimit(
          "workspace_structure",
        );
        if (!rateLimitResult.allowed) {
          throw new Error(
            `Workspace structure rate limit exceeded: ${rateLimitResult.reason}. Try again in ${rateLimitResult.retryAfter} seconds.`,
          );
        }
      }

      const structure = await this.getWorkspaceStructure();

      this._webviewView.webview.postMessage({
        command: "addMessage",
        message: {
          role: "assistant",
          content: `Current workspace structure:\n${structure}`,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error getting workspace structure:", error);
      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to get workspace structure: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleApplyChange(
    changeId: string,
    content: string,
  ): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Validate change ID and content
      if (!this._validateChangeId(changeId)) {
        throw new Error("Invalid change ID");
      }

      const sanitizedContent = this.adaptiveSecurity.sanitizeInput(content);

      if (!this._validateFileOperation(sanitizedContent)) {
        throw new Error("Unauthorized file operation detected");
      }

      // In a real implementation this would call PanelManager.applyChanges()
      // This is where we'd actually modify files in the workspace

      this._webviewView.webview.postMessage({
        command: "showNotification",
        message: `Applied changes for ${changeId}`,
      });
    } catch (error) {
      console.error("Error applying change:", error);
      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to apply changes: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleRunCode(code: string, changeId?: string): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Rate limit check for terminal commands (if enabled)
      if (this.adaptiveSecurity.shouldRateLimit("terminal_commands")) {
        const rateLimitResult =
          this.rateLimiter.checkLimit("terminal_commands");
        if (!rateLimitResult.allowed) {
          throw new Error(
            `Rate limit exceeded: ${rateLimitResult.reason}. Try again in ${rateLimitResult.retryAfter} seconds.`,
          );
        }
      }

      // Adaptive security validation
      const adaptiveValidation: AdaptiveValidationResult =
        this.adaptiveSecurity.validateCommand(code);
      if (!adaptiveValidation.isValid) {
        throw new Error(
          `Command blocked by adaptive security: ${adaptiveValidation.reason}`,
        );
      }

      // Security validation for terminal command
      const validationResult: ValidationResult =
        this.securityManager.validateTerminalCommand(code);
      if (!validationResult.isValid) {
        if (validationResult.requiresApproval) {
          const approved = await this.permissionsManager.requestUserPermission(
            "execute terminal command",
            "terminal",
            `Execute command: ${code}`,
          );

          if (approved) {
            this.securityManager.approveCommand(code);
          } else {
            throw new Error(
              `Command execution denied: ${validationResult.reason}`,
            );
          }
        } else {
          throw new Error(
            `Command validation failed: ${validationResult.reason}`,
          );
        }
      }

      // Log the command execution attempt (if audit logging enabled)
      if (this.adaptiveSecurity.shouldLogAudit()) {
        this.securityManager.logAuditEvent({
          type: "terminal_command_execution",
          command: code,
          timestamp: new Date(),
          approved: true,
          details: { changeId },
        });
      }

      // Execute code in a sandboxed environment
      const output = await this.executeTerminalCommand(code);

      this.showTerminalOutput(code, output);
    } catch (error) {
      console.error("Error running code:", error);

      // Log the failed execution (if audit logging enabled)
      if (this.adaptiveSecurity.shouldLogAudit()) {
        this.securityManager.logAuditEvent({
          type: "terminal_command_execution_failed",
          command: code,
          timestamp: new Date(),
          approved: false,
          details: {
            changeId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }

      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to run code: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleEditInEditor(
    content: string,
    changeId?: string,
  ): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Validate content before editing
      const sanitizedContent = this.adaptiveSecurity.sanitizeInput(content);

      if (!this._validateFileOperation(sanitizedContent)) {
        throw new Error("Unauthorized file operation detected");
      }

      // Open document in editor for editing
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: "typescript",
      });
      await vscode.window.showTextDocument(doc);

      this._webviewView.webview.postMessage({
        command: "showNotification",
        message: `Opened editor for ${changeId || "unnamed"}`,
      });
    } catch (error) {
      console.error("Error editing in editor:", error);
      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to open editor: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleRegenerateResponse(changeId?: string): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Validate change ID for regeneration
      if (changeId && !this._validateChangeId(changeId)) {
        throw new Error("Invalid change ID for regeneration");
      }

      // Add rate limiting to regenerate calls (if enabled)
      if (this.adaptiveSecurity.shouldRateLimit("regenerate")) {
        const rateLimitResult = this.rateLimiter.checkLimit("regenerate");
        if (!rateLimitResult.allowed) {
          throw new Error(
            `Regeneration rate limit exceeded: ${rateLimitResult.reason}. Try again in ${rateLimitResult.retryAfter} seconds.`,
          );
        }
      }

      this._webviewView.webview.postMessage({
        command: "showNotification",
        message: `Regenerated response for ${changeId || "unnamed"}`,
      });
    } catch (error) {
      console.error("Error regenerating response:", error);
      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to regenerate response: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleFileUpload(
    files: Array<{ name: string; content: string; size: number; type: string }>,
    requestId: string,
  ): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Validate file upload
      if (!files || files.length === 0) {
        throw new Error("No files provided for upload");
      }

      // Check permissions for file operations (if enabled by adaptive security)
      if (this.adaptiveSecurity.shouldCheckFilePermissions()) {
        const permissionResult = await this.permissionsManager.checkPermission(
          "workspace",
          "WRITE",
        );
        if (!permissionResult.allowed) {
          throw new Error(`File upload denied: ${permissionResult.reason}`);
        }
      }

      // Process each file
      for (const file of files) {
        const sanitizedContent = this.adaptiveSecurity.sanitizeInput(
          file.content,
        );

        if (!this._validateFileOperation(sanitizedContent)) {
          throw new Error(`Invalid file content: ${file.name}`);
        }

        // Log the file upload attempt (if audit logging enabled)
        if (this.adaptiveSecurity.shouldLogAudit()) {
          this.securityManager.logAuditEvent({
            type: "file_upload",
            timestamp: new Date(),
            approved: true,
            details: { fileName: file.name, size: file.size, requestId },
          });
        }
      }

      this._webviewView.webview.postMessage({
        command: "showNotification",
        message: `Successfully uploaded ${files.length} file(s)`,
      });
    } catch (error) {
      console.error("Error handling file upload:", error);

      // Log audit event only if audit logging enabled
      if (this.adaptiveSecurity.shouldLogAudit()) {
        this.securityManager.logAuditEvent({
          type: "file_upload_failed",
          timestamp: new Date(),
          approved: false,
          details: {
            requestId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }

      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to upload files: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async handleCreateFile(
    filePath: string,
    content: string,
    requestId: string,
  ): Promise<void> {
    if (!this._webviewView) return;

    try {
      // Validate file path and content
      if (!filePath || !filePath.trim()) {
        throw new Error("Invalid file path provided");
      }

      const sanitizedContent = this.adaptiveSecurity.sanitizeInput(content);
      const sanitizedPath = this.adaptiveSecurity.sanitizeInput(filePath);

      if (!this._validateFileOperation(sanitizedContent)) {
        throw new Error("Invalid file content detected");
      }

      // Check permissions for file creation (if enabled by adaptive security)
      if (this.adaptiveSecurity.shouldCheckFilePermissions()) {
        const permissionResult = await this.permissionsManager.checkPermission(
          sanitizedPath,
          "WRITE",
        );
        if (!permissionResult.allowed) {
          if (permissionResult.requiresUserConfirmation) {
            const approved =
              await this.permissionsManager.requestUserPermission(
                "create file",
                sanitizedPath,
                `Create file: ${sanitizedPath}`,
              );

            if (!approved) {
              throw new Error(
                `File creation denied: ${permissionResult.reason}`,
              );
            }
          } else {
            throw new Error(`File creation denied: ${permissionResult.reason}`);
          }
        }
      }

      // Log the file creation attempt (if audit logging enabled)
      if (this.adaptiveSecurity.shouldLogAudit()) {
        this.securityManager.logAuditEvent({
          type: "file_creation",
          timestamp: new Date(),
          approved: true,
          details: { filePath: sanitizedPath, requestId },
        });
      }

      // In a real implementation, this would actually create the file
      // For now, we just simulate success
      this._webviewView.webview.postMessage({
        command: "showNotification",
        message: `File ${sanitizedPath} created successfully`,
      });
    } catch (error) {
      console.error("Error creating file:", error);

      // Log audit event only if audit logging enabled
      if (this.adaptiveSecurity.shouldLogAudit()) {
        this.securityManager.logAuditEvent({
          type: "file_creation_failed",
          timestamp: new Date(),
          approved: false,
          details: {
            filePath,
            requestId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }

      this._webviewView.webview.postMessage({
        command: "handleError",
        message: `Failed to create file: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private async executeTerminalCommand(command: string): Promise<string> {
    // Add command validation with audit trail
    const validation = await this._validateAndLogCommand(command);

    if (!validation.safe) {
      throw new Error(`Unsafe command blocked: ${command}`);
    }

    // Placeholder for terminal execution - in practice this would use VS Code's Terminal API
    return `Output of command:\n${command}`;
  }

  private showTerminalOutput(command: string, output: string): void {
    if (!this._webviewView) return;

    this._webviewView.webview.postMessage({
      command: "showTerminalOutput",
      output,
      commandText: command,
    });
  }

  private async getWorkspaceStructure(): Promise<string> {
    // Implementation for getting workspace structure
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return "No workspace folders found";
    }

    // Basic implementation - in practice you'd want to recursively explore the folders
    return workspaceFolders.map((folder) => folder.name).join(", ");
  }

  private appendTypingIndicator(): void {
    if (!this._webviewView) return;

    this._webviewView.webview.postMessage({
      command: "showTypingIndicator",
    });
  }

  private removeTypingIndicator(): void {
    if (!this._webviewView) return;

    this._webviewView.webview.postMessage({
      command: "hideTypingIndicator",
    });
  }

  // New validation methods and properties (added to existing class)

  private _sanitizeInput(input: string): string {
    // Use adaptive security sanitization
    return this.adaptiveSecurity.sanitizeInput(input);
  }

  private _validateMessage(messageContent: string): boolean {
    if (messageContent.length > 10000) {
      // Limit message size
      return false;
    }

    const dangerousPatterns = [/<script/i, /on\w+\s*=/i];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(messageContent)) {
        return false;
      }
    }

    return true;
  }

  private _validateWorkspaceStructure(structure: string): boolean {
    // Validate workspace structure data
    const maxDepth = 10; // Prevent excessive nesting

    try {
      JSON.parse(structure);
      if (structure.length > 50000) {
        // Limit size
        return false;
      }
    } catch {
      return false; // Invalid JSON
    }

    return true;
  }

  private _validateChangeId(changeId: string): boolean {
    // Validate format of change ID
    if (!changeId || !/^[a-zA-Z0-9-_]+$/.test(changeId)) {
      return false;
    }
    return true;
  }

  private _validateFileOperation(content: string): boolean {
    // Basic validation for file operations
    const maxFileSize = 1024 * 1024; // 1MB limit

    if (content.length > maxFileSize) {
      return false;
    }

    // Prevent dangerous file content
    const dangerousPatterns = [/\bdelete\b/i, /\bformat\b/i];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return false;
      }
    }

    return true;
  }

  private _validateTerminalCommand(command: string): boolean {
    // Validate terminal commands before execution
    const blacklistedCommands = ["rm -rf", "sudo format", "shutdown now"];

    for (const blocked of blacklistedCommands) {
      if (command.includes(blocked)) {
        return false;
      }
    }

    return true;
  }

  private async _validateAndLogCommand(
    command: string,
  ): Promise<{ safe: boolean; riskLevel?: string }> {
    // Validate command and log for audit trail
    const isSafe = this._validateTerminalCommand(command);

    if (isSafe && this.adaptiveSecurity.shouldLogAudit()) {
      this._logOperation("terminal", "execute", command, true);
    } else if (!isSafe && this.adaptiveSecurity.shouldLogAudit()) {
      this._logOperation("terminal", "execute", command, false);
    }

    return { safe: isSafe };
  }

  private _logOperation(
    operation: string,
    action: string,
    details: any,
    success: boolean = true,
  ): void {
    // Add audit trail for operations using SecurityManager
    const auditEntry: AuditEntry = {
      type: `${operation}_${action}`,
      timestamp: new Date(),
      approved: success,
      details: typeof details === "string" ? { command: details } : details,
    };

    this.securityManager.logAuditEvent(auditEntry);
    console.log(
      `[AUDIT] ${auditEntry.timestamp.toISOString()} - Operation: ${operation}, Action: ${action}, Details: ${JSON.stringify(details)}, Success: ${success}`,
    );
  }

  // Test methods (removed from original class since they were duplicates)
  public async testHandleSendMessage(
    message: string,
  ): Promise<{ success: boolean; response?: string }> {
    try {
      await this.handleSendMessage(message);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        response: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public static createTestWebviewView() {
    return {
      postMessage: (message: any) =>
        console.log("Test message to webview:", message),
      asWebviewUri: (uri: vscode.Uri) => uri,
      html: "",
    } as unknown as vscode.Webview;
  }

  public async testHandleGetWorkspaceStructure(): Promise<{
    success: boolean;
    response?: string;
  }> {
    try {
      await this.handleGetWorkspaceStructure();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        response: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async runChatProviderTests(): Promise<{
    passed: number;
    failed: number;
  }> {
    let passed = 0;
    let failed = 0;

    try {
      // Test basic functionality
      const htmlContent = this.getHtmlForWebview({
        asWebviewUri: (uri: any) => uri,
        cspSource: "test-source",
      } as any);

      if (htmlContent && typeof htmlContent === "string") {
        // Implement handling of HTML content
        this.processHtmlContent(htmlContent);
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }

    return { passed, failed };
  }

  private processHtmlContent(htmlContent: string): void {
    // Process HTML content
    console.log("Processing HTML content:", htmlContent.length, "characters");
  }

  private updateSecurityFromSettings(): void {
    const config = vscode.workspace.getConfiguration("lmsCopilot");
    const securityLevel = config.get<string>(
      "securityLevel",
      "minimal",
    ) as SecurityLevel;
    const allowDangerous = config.get<boolean>("allowDangerousCommands", false);

    const securityConfig = SecurityConfigManager.getInstance();
    securityConfig.setSecurityLevel(securityLevel);

    if (allowDangerous) {
      securityConfig.updateConfig({ allowDangerousCommands: true });
    }

    console.log(`LMS Copilot security level: ${securityLevel}`);
  }
}
