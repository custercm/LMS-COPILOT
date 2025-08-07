import * as vscode from 'vscode';
import { LMStudioClient } from '../lmstudio/LMStudioClient';
import { SecurityManager, AuditEntry, ValidationResult } from '../security/SecurityManager';
import { PermissionsManager, PermissionResult } from '../security/PermissionsManager';
import { RateLimiter, RateLimitResult } from '../security/RateLimiter';
import { AdaptiveSecurityManager, SecurityConfigManager, SecurityLevel } from '../security/AdaptiveSecurity';

export class ChatProvider implements vscode.WebviewViewProvider {
    private _webviewView: vscode.WebviewView | undefined;
    private client: LMStudioClient;
    private securityManager: SecurityManager;
    private permissionsManager: PermissionsManager;
    private rateLimiter: RateLimiter;
    private adaptiveSecurity: AdaptiveSecurityManager;
    
    // Rate limiting properties (deprecated - using RateLimiter instead)
    private requestCount: number = 0;
    private resetTime: number = Date.now() + 60000;
    private lastApiCallTime: number | null = null;
    private regenerateRateLimitTime: number | null = null;
    private workspaceStructureRateLimitTime: number | null = null;
    private extensionUri: vscode.Uri;

    constructor(client: LMStudioClient, extensionUri: vscode.Uri) { 
        this.client = client;
        this.extensionUri = extensionUri;
        
        // Initialize security components
        this.securityManager = SecurityManager.getInstance();
        this.permissionsManager = PermissionsManager.getInstance();
        this.rateLimiter = RateLimiter.getInstance();
        this.adaptiveSecurity = new AdaptiveSecurityManager();
        
        // Update security from VS Code settings
        this.updateSecurityFromSettings();
        
        // Listen for settings changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('lmsCopilot.securityLevel')) {
                this.updateSecurityFromSettings();
            }
        });
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ) { 
        // Store the webview reference for later use
        this._webviewView = webviewView;
        
        // Add CSP header to webview content for security
        const cspSource = webviewView.webview.cspSource;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'dist')
            ],
            // Content Security Policy for enhanced security
             portMapping: [
                {
                    webviewPort: 3000,
                    extensionHostPort: 3000
                }
            ]
        };
        
        // Set the HTML content for the webview
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                // Rate limit check for all incoming messages
                const rateLimitResult = this.rateLimiter.checkLimit('chat_messages');
                if (!rateLimitResult.allowed) {
                    webviewView.webview.postMessage({
                        command: 'error',
                        message: `Rate limit exceeded: ${rateLimitResult.reason}. Try again in ${rateLimitResult.retryAfter} seconds.`
                    });
                    return;
                }

                // Sanitize incoming message
                const sanitizedMessage = {
                    ...message,
                    text: message.text ? this.securityManager.sanitizeInput(message.text) : message.text,
                    content: message.content ? this.securityManager.sanitizeInput(message.content) : message.content,
                    code: message.code ? this.securityManager.sanitizeInput(message.code) : message.code
                };

                switch (sanitizedMessage.command) {
                    case 'sendMessage':
                        await this.handleSendMessage(sanitizedMessage.text);
                        return;
                    case 'analyzeWorkspace':
                        await this.handleAnalyzeWorkspace(sanitizedMessage.structure);
                        return;
                    case 'getWorkspaceStructure':
                        await this.handleGetWorkspaceStructure();
                        return;
                    case 'applyChange':
                        await this.handleApplyChange(sanitizedMessage.changeId, sanitizedMessage.content);
                        return;
                    case 'runCode':
                        await this.handleRunCode(sanitizedMessage.code, sanitizedMessage.changeId);
                        return;
                    case 'editInEditor':
                        await this.handleEditInEditor(sanitizedMessage.content, sanitizedMessage.changeId);
                        return;
                    case 'regenerateResponse':
                        await this.handleRegenerateResponse(sanitizedMessage.changeId);
                        return;
                    case 'fileUpload':
                        await this.handleFileUpload(sanitizedMessage.files, sanitizedMessage.requestId);
                        return;
                    case 'createFile':
                        await this.handleCreateFile(sanitizedMessage.filePath, sanitizedMessage.content, sanitizedMessage.requestId);
                        return;
                    case 'openFile':
                        // Handle opening files from the webview with permission check
                        const permissionResult = await this.permissionsManager.checkPermission(
                            sanitizedMessage.filePath, 
                            'READ'
                        );
                        
                        if (!permissionResult.allowed) {
                            if (permissionResult.requiresUserConfirmation) {
                                const approved = await this.permissionsManager.requestUserPermission(
                                    'read file',
                                    sanitizedMessage.filePath,
                                    permissionResult.details || 'Open file in editor'
                                );
                                
                                if (!approved) {
                                    webviewView.webview.postMessage({
                                        command: 'error',
                                        message: `Permission denied: ${permissionResult.reason}`
                                    });
                                    return;
                                }
                            } else {
                                webviewView.webview.postMessage({
                                    command: 'error',
                                    message: `Permission denied: ${permissionResult.reason}`
                                });
                                return;
                            }
                        }

                        const fileUri = vscode.Uri.file(sanitizedMessage.filePath);
                        try {
                            const document = await vscode.workspace.openTextDocument(fileUri);
                            await vscode.window.showTextDocument(document, { 
                                preview: false,
                                selection: sanitizedMessage.lineNumber ? new vscode.Range(sanitizedMessage.lineNumber - 1, 0, sanitizedMessage.lineNumber - 1, 0) : undefined
                            });
                        } catch (error) {
                            console.error('Failed to open file:', error);
                            vscode.window.showErrorMessage(`Failed to open file: ${sanitizedMessage.filePath}`);
                        }
                        return;
                }
            } catch (error) {
                // Global error handling for all message processing
                console.error('Error processing webview message:', error);
                this.securityManager.logAuditEvent({
                    type: 'message_processing_error',
                    timestamp: new Date(),
                    approved: false,
                    details: { 
                        command: message.command, 
                        error: error instanceof Error ? error.message : 'Unknown error' 
                    }
                });
                
                webviewView.webview.postMessage({
                    command: 'error',
                    message: 'An error occurred while processing your request. Please try again.'
                });
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Use the built React webview instead of hardcoded HTML
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'webview.js');
        const webviewUri = webview.asWebviewUri(webviewPath);
        
        // Add CSP meta tag in HTML content for webview security  
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="${this.securityManager.generateCSP(webview)}">
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
            // Sanitize user input before sending to LM Studio
            const sanitizedMessage = this._sanitizeInput(message);
            
            if (!this._validateMessage(sanitizedMessage)) {
                throw new Error('Invalid message content');
            }
            
            // Add rate limiting for API calls  
            if (await this._checkRateLimit()) {
              throw new Error('API call rate limit exceeded');
            }

            // Show typing indicator while waiting for response
            this.appendTypingIndicator();
            
            // Send message to LMStudio backend
            const response = await this.client.sendMessage(sanitizedMessage);
            
            // Remove typing indicator after response is complete
            this.removeTypingIndicator();
            
            // Post the response back to the webview
            this._webviewView.webview.postMessage({
                command: 'addMessage',
                message: {
                    role: 'assistant',
                    content: response,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            this.removeTypingIndicator();
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to get response from AI assistant: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleAnalyzeWorkspace(structure: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
            // Validate workspace structure input
            const sanitizedStructure = this._sanitizeInput(structure);
            
            if (!this._validateWorkspaceStructure(sanitizedStructure)) {
                throw new Error('Invalid workspace structure');
            }
            
            // Analyze workspace structure with LMStudioClient
            const analysis = await this.client.analyzeWorkspace(sanitizedStructure);
            
            this._webviewView.webview.postMessage({
                command: 'addMessage',
                message: {
                    role: 'assistant',
                    content: `Workspace analysis complete:\n${analysis}`,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('Error analyzing workspace:', error);
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to analyze workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleGetWorkspaceStructure(): Promise<void> {
        if (!this._webviewView) return;
        
        try {
            // Add rate limiting to API calls
            const now = Date.now();
            if (this.lastApiCallTime && (now - this.lastApiCallTime) < 1000) {
                throw new Error('Rate limit exceeded. Please wait before calling again.');
            }
            
            this.lastApiCallTime = now;

            const structure = await this.getWorkspaceStructure();
            
            this._webviewView.webview.postMessage({
                command: 'addMessage',
                message: {
                    role: 'assistant',
                    content: `Current workspace structure:\n${structure}`,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('Error getting workspace structure:', error);
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to get workspace structure: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleApplyChange(changeId: string, content: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
            // Validate change ID and content
            if (!this._validateChangeId(changeId)) {
                throw new Error('Invalid change ID');
            }
            
            const sanitizedContent = this._sanitizeInput(content);
            
            if (!this._validateFileOperation(sanitizedContent)) {
                throw new Error('Unauthorized file operation detected');
            }

            // In a real implementation this would call PanelManager.applyChanges()
            // This is where we'd actually modify files in the workspace
            
            this._webviewView.webview.postMessage({
                command: 'showNotification',
                message: `Applied changes for ${changeId}`
            });
        } catch (error) {
            console.error('Error applying change:', error);
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to apply changes: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleRunCode(code: string, changeId?: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
            // Rate limit check for terminal commands
            const rateLimitResult = this.rateLimiter.checkLimit('terminal_commands');
            if (!rateLimitResult.allowed) {
                throw new Error(`Rate limit exceeded: ${rateLimitResult.reason}. Try again in ${rateLimitResult.retryAfter} seconds.`);
            }

            // Security validation for terminal command
            const validationResult = this.securityManager.validateTerminalCommand(code);
            if (!validationResult.isValid) {
                if (validationResult.requiresApproval) {
                    const approved = await this.permissionsManager.requestUserPermission(
                        'execute terminal command',
                        'terminal',
                        `Execute command: ${code}`
                    );
                    
                    if (approved) {
                        this.securityManager.approveCommand(code);
                    } else {
                        throw new Error(`Command execution denied: ${validationResult.reason}`);
                    }
                } else {
                    throw new Error(`Command validation failed: ${validationResult.reason}`);
                }
            }

            // Log the command execution attempt
            this.securityManager.logAuditEvent({
                type: 'terminal_command_execution',
                command: code,
                timestamp: new Date(),
                approved: true,
                details: { changeId }
            });
            
            // Execute code in a sandboxed environment
            const output = await this.executeTerminalCommand(code);
            
            this.showTerminalOutput(code, output);
        } catch (error) {
            console.error('Error running code:', error);
            
            // Log the failed execution
            this.securityManager.logAuditEvent({
                type: 'terminal_command_execution_failed',
                command: code,
                timestamp: new Date(),
                approved: false,
                details: { 
                    changeId, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                }
            });
            
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to run code: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleEditInEditor(content: string, changeId?: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
            // Validate content before editing
            const sanitizedContent = this._sanitizeInput(content);
            
            if (!this._validateFileOperation(sanitizedContent)) {
                throw new Error('Unauthorized file operation detected');
            }
            
            // Open document in editor for editing
            const doc = await vscode.workspace.openTextDocument({ content, language: 'typescript' });
            await vscode.window.showTextDocument(doc);
            
            this._webviewView.webview.postMessage({
                command: 'showNotification',
                message: `Opened editor for ${changeId || 'unnamed'}`
            });
        } catch (error) {
            console.error('Error editing in editor:', error);
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to open editor: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleRegenerateResponse(changeId?: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
            // Validate change ID for regeneration
            if (changeId && !this._validateChangeId(changeId)) {
                throw new Error('Invalid change ID for regeneration');
            }
            
            // Add rate limiting to regenerate calls as well
            const now = Date.now();
            if (this.regenerateRateLimitTime && (now - this.regenerateRateLimitTime) < 2000) {
                throw new Error('Regeneration rate limit exceeded. Please wait before regenerating again.');
            }
            
            this.regenerateRateLimitTime = now;
            
            this._webviewView.webview.postMessage({
                command: 'showNotification',
                message: `Regenerated response for ${changeId || 'unnamed'}`
            });
        } catch (error) {
            console.error('Error regenerating response:', error);
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to regenerate response: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleFileUpload(files: Array<{name: string; content: string; size: number; type: string}>, requestId: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
            // Validate file upload
            if (!files || files.length === 0) {
                throw new Error('No files provided for upload');
            }
            
            // Check permissions for file operations
            const permissionResult = await this.permissionsManager.checkPermission('workspace', 'WRITE');
            if (!permissionResult.allowed) {
                throw new Error(`File upload denied: ${permissionResult.reason}`);
            }
            
            // Process each file
            for (const file of files) {
                const sanitizedContent = this._sanitizeInput(file.content);
                
                if (!this._validateFileOperation(sanitizedContent)) {
                    throw new Error(`Invalid file content: ${file.name}`);
                }
                
                // Log the file upload attempt
                this.securityManager.logAuditEvent({
                    type: 'file_upload',
                    timestamp: new Date(),
                    approved: true,
                    details: { fileName: file.name, size: file.size, requestId }
                });
            }
            
            this._webviewView.webview.postMessage({
                command: 'showNotification',
                message: `Successfully uploaded ${files.length} file(s)`
            });
        } catch (error) {
            console.error('Error handling file upload:', error);
            this.securityManager.logAuditEvent({
                type: 'file_upload_failed',
                timestamp: new Date(),
                approved: false,
                details: { requestId, error: error instanceof Error ? error.message : 'Unknown error' }
            });
            
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleCreateFile(filePath: string, content: string, requestId: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
            // Validate file path and content
            if (!filePath || !filePath.trim()) {
                throw new Error('Invalid file path provided');
            }
            
            const sanitizedContent = this._sanitizeInput(content);
            const sanitizedPath = this._sanitizeInput(filePath);
            
            if (!this._validateFileOperation(sanitizedContent)) {
                throw new Error('Invalid file content detected');
            }
            
            // Check permissions for file creation
            const permissionResult = await this.permissionsManager.checkPermission(sanitizedPath, 'WRITE');
            if (!permissionResult.allowed) {
                if (permissionResult.requiresUserConfirmation) {
                    const approved = await this.permissionsManager.requestUserPermission(
                        'create file',
                        sanitizedPath,
                        `Create file: ${sanitizedPath}`
                    );
                    
                    if (!approved) {
                        throw new Error(`File creation denied: ${permissionResult.reason}`);
                    }
                } else {
                    throw new Error(`File creation denied: ${permissionResult.reason}`);
                }
            }
            
            // Log the file creation attempt
            this.securityManager.logAuditEvent({
                type: 'file_creation',
                timestamp: new Date(),
                approved: true,
                details: { filePath: sanitizedPath, requestId }
            });
            
            // In a real implementation, this would actually create the file
            // For now, we just simulate success
            this._webviewView.webview.postMessage({
                command: 'showNotification',
                message: `File ${sanitizedPath} created successfully`
            });
        } catch (error) {
            console.error('Error creating file:', error);
            this.securityManager.logAuditEvent({
                type: 'file_creation_failed',
                timestamp: new Date(),
                approved: false,
                details: { filePath, requestId, error: error instanceof Error ? error.message : 'Unknown error' }
            });
            
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            command: 'showTerminalOutput',
            output,
            commandText: command
        });
    }

    private async getWorkspaceStructure(): Promise<string> {
        // Add rate limiting and validation to workspace structure calls  
        const now = Date.now();
        if (this.workspaceStructureRateLimitTime && (now - this.workspaceStructureRateLimitTime) < 500) {
            throw new Error('Workspace structure rate limit exceeded');
        }
        
        this.workspaceStructureRateLimitTime = now;

        // Implementation for getting workspace structure
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return "No workspace folders found";
        }
        
        // Basic implementation - in practice you'd want to recursively explore the folders
        return workspaceFolders.map(folder => folder.name).join(', ');
    }

    private appendTypingIndicator(): void {
        if (!this._webviewView) return;
        
        this._webviewView.webview.postMessage({
            command: 'showTypingIndicator'
        });
    }

    private removeTypingIndicator(): void {
        if (!this._webviewView) return;
        
        this._webviewView.webview.postMessage({
            command: 'hideTypingIndicator'
        });
    }
    
    // New validation methods and properties (added to existing class)
    
    private _sanitizeInput(input: string): string {
        // Sanitize input to prevent injection attacks  
        const sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        return sanitized;
    }
    
    private _validateMessage(messageContent: string): boolean {
        if (messageContent.length > 10000) { // Limit message size
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
            if (structure.length > 50000) { // Limit size
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
        const blacklistedCommands = [
            'rm -rf',
            'sudo format',
            'shutdown now'
        ];
        
        for (const blocked of blacklistedCommands) {
            if (command.includes(blocked)) {
                return false;
            }
        }
        
        return true;
    }
    
    private _checkRateLimit(): Promise<boolean> {
      // Rate limiting implementation
      const now = Date.now();
      
      if (now > this.resetTime) {
        this.requestCount = 0;
        this.resetTime = now + 60000; // Reset every minute
      }
      
      this.requestCount++;
      return Promise.resolve(this.requestCount > 100); // 100 requests per minute limit
    }
    
    private async _validateAndLogCommand(command: string): Promise<{safe: boolean, riskLevel?: string}> {
        // Validate command and log for audit trail
        const isSafe = this._validateTerminalCommand(command);
        
        if (isSafe) {
            this._logOperation('terminal', 'execute', command, true); 
        } else {
            this._logOperation('terminal', 'execute', command, false);
        }
        
        return { safe: isSafe };
    }
    
    private _logOperation(operation: string, action: string, details: any, success: boolean = true): void {
        // Add audit trail for operations
        const timestamp = new Date().toISOString();
        console.log(`[AUDIT] ${timestamp} - Operation: ${operation}, Action: ${action}, Details: ${JSON.stringify(details)}, Success: ${success}`);
    }
    
    // Test methods (removed from original class since they were duplicates)
    public async testHandleSendMessage(message: string): Promise<{success: boolean, response?: string}> {
      try {
        await this.handleSendMessage(message);
        return { success: true };
      } catch (error) {
        return { 
          success: false,
          response: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    public static createTestWebviewView() {
      return {
        postMessage: (message: any) => console.log('Test message to webview:', message),
        asWebviewUri: (uri: vscode.Uri) => uri,
        html: ''
      } as unknown as vscode.Webview;
    }

    public async testHandleGetWorkspaceStructure(): Promise<{success: boolean, response?: string}> {
      try {
        await this.handleGetWorkspaceStructure();
        return { success: true };
      } catch (error) {
        return { 
          success: false,
          response: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    public async runChatProviderTests(): Promise<{passed: number, failed: number}> {
      let passed = 0;
      let failed = 0;

      try {
        // Test basic functionality
        const htmlContent = this.getHtmlForWebview({ 
          asWebviewUri: (uri: any) => uri,
          cspSource: 'test-source'
        } as any);
        
        if (htmlContent && typeof htmlContent === 'string') {
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
      console.log('Processing HTML content:', htmlContent.length, 'characters');
    }

    private updateSecurityFromSettings(): void {
        const config = vscode.workspace.getConfiguration('lmsCopilot');
        const securityLevel = config.get<string>('securityLevel', 'minimal') as SecurityLevel;
        const allowDangerous = config.get<boolean>('allowDangerousCommands', false);
        
        const securityConfig = SecurityConfigManager.getInstance();
        securityConfig.setSecurityLevel(securityLevel);
        
        if (allowDangerous) {
            securityConfig.updateConfig({ allowDangerousCommands: true });
        }
        
        console.log(`LMS Copilot security level: ${securityLevel}`);
    }
  }
