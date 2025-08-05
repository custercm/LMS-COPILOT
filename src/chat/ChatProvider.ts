import * as vscode from 'vscode';
import { LMStudioClient } from '../lmstudio/LMStudioClient';
import { TerminalTools } from '../tools/TerminalTools';

export class ChatProvider implements vscode.WebviewViewProvider {
    private _webviewView: vscode.WebviewView | undefined;
    private client: LMStudioClient;
    private terminalTools = new TerminalTools();

    constructor(private readonly extensionUri: vscode.Uri) { 
        this.client = new LMStudioClient();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._webviewView = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        
        // Set the HTML content for the webview
        webviewView.webview.html = this.getWebviewContent();
        
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    await this.handleSendMessage(message.text);
                    return;
                case 'analyzeWorkspace':
                    await this.handleAnalyzeWorkspace(message.structure);
                    return;
                case 'getWorkspaceStructure':
                    await this.handleGetWorkspaceStructure();
                    return;
            }
        });
    }

    private async handleSendMessage(message: string): Promise<void> {
        if (!this._webviewView) return;

        try {
            // Show typing indicator while waiting for response
            this.appendTypingIndicator();
            
            // Send message to LMStudio backend
            const response = await this.client.sendMessage(message);
            
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
            // Analyze workspace structure with LMStudioClient
            const analysis = await this.client.analyzeWorkspace(structure);
            
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
            // Get workspace structure
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

    private async getWorkspaceStructure(): Promise<string> {
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

    private getWebviewContent(): string {
        // Use the built React webview instead of hardcoded HTML
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'webview.js');
        const webviewUri = this._webviewView?.webview.asWebviewUri(webviewPath);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
}