import * as vscode from 'vscode';
import { LMStudioClient } from '../lmstudio/LMStudioClient';
import { AdaptiveSecurityManager, SecurityConfigManager, SecurityLevel } from '../security/AdaptiveSecurity';

/**
 * Simplified ChatProvider with configurable security
 * Perfect for personal use with minimal overhead
 */
export class SimpleChatProvider implements vscode.WebviewViewProvider {
    private _webviewView: vscode.WebviewView | undefined;
    private client: LMStudioClient;
    private security: AdaptiveSecurityManager;
    private extensionUri: vscode.Uri;
    
    // Simple rate limiting (only when enabled)
    private lastRequestTime = 0;
    private requestCount = 0;

    constructor(client: LMStudioClient, extensionUri: vscode.Uri) { 
        this.client = client;
        this.extensionUri = extensionUri;
        this.security = new AdaptiveSecurityManager();
        
        // Read security level from VS Code settings
        this.updateSecurityFromSettings();
        
        // Listen for settings changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('lmsCopilot.securityLevel')) {
                this.updateSecurityFromSettings();
            }
        });
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

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ) { 
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'dist')
            ]
        };
        
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages with minimal overhead
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                // Optional rate limiting
                if (this.security.shouldRateLimit('chat_messages')) {
                    if (!this.checkSimpleRateLimit()) {
                        webviewView.webview.postMessage({
                            command: 'error',
                            message: 'Please slow down - too many requests.'
                        });
                        return;
                    }
                }

                // Optional input sanitization
                const text = this.security.shouldSanitizeInput(message.text) 
                    ? this.security.sanitizeInput(message.text)
                    : message.text;

                switch (message.command) {
                    case 'sendMessage':
                        await this.handleSendMessage(text);
                        break;
                    case 'runCode':
                        await this.handleRunCode(message.code);
                        break;
                    case 'openFile':
                        await this.handleOpenFile(message.filePath, message.lineNumber);
                        break;
                }
            } catch (error) {
                console.error('Error processing message:', error);
                webviewView.webview.postMessage({
                    command: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        this._webviewView = webviewView;
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'webview.js');
        const webviewUri = webview.asWebviewUri(webviewPath);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="${this.security.getCSPPolicy(webview)}">
    <title>LMS Copilot Chat</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        #root { height: 100vh; display: flex; flex-direction: column; }
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
            this._webviewView.webview.postMessage({ command: 'showTypingIndicator' });
            
            const response = await this.client.sendMessage(message);
            
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
            this._webviewView.webview.postMessage({
                command: 'error',
                message: `Failed to get response: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            this._webviewView.webview.postMessage({ command: 'hideTypingIndicator' });
        }
    }

    private async handleRunCode(code: string): Promise<void> {
        if (!this._webviewView) return;

        try {
            // Minimal command validation (only for obviously dangerous commands)
            const validation = this.security.validateCommand(code);
            if (!validation.isValid) {
                this._webviewView.webview.postMessage({
                    command: 'error',
                    message: `Command blocked: ${validation.reason}`
                });
                return;
            }

            // For personal use, we might just show the command without executing
            // You can modify this to actually execute if you want
            this._webviewView.webview.postMessage({
                command: 'showTerminalOutput',
                output: `Would execute: ${code}\n(Add actual execution logic here if desired)`,
                commandText: code
            });
        } catch (error) {
            console.error('Error running code:', error);
            this._webviewView.webview.postMessage({
                command: 'error',
                message: `Failed to run code: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleOpenFile(filePath: string, lineNumber?: number): Promise<void> {
        try {
            const fileUri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document, { 
                preview: false,
                selection: lineNumber ? new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0) : undefined
            });
        } catch (error) {
            console.error('Failed to open file:', error);
            vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
        }
    }

    private checkSimpleRateLimit(): boolean {
        const now = Date.now();
        
        // Reset counter every minute
        if (now - this.lastRequestTime > 60000) {
            this.requestCount = 0;
            this.lastRequestTime = now;
        }
        
        this.requestCount++;
        
        // Allow 50 requests per minute (reasonable for personal use)
        return this.requestCount <= 50;
    }
}
