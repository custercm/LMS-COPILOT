import * as vscode from 'vscode';
import { LMStudioClient } from '../client/LMStudioClient';

export class ChatProvider implements vscode.WebviewViewProvider {
    private _webviewView: vscode.WebviewView | undefined;
    private client: LMStudioClient;

    constructor(client: LMStudioClient) {
        this.client = client;
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ) {
        this._webviewView = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(__dirname)]
        };
        
        // Set the HTML content for the webview
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

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
                case 'applyChange':
                    await this.handleApplyChange(message.changeId, message.content);
                    return;
                case 'runCode':
                    await this.handleRunCode(message.code, message.changeId);
                    return;
                case 'editInEditor':
                    await this.handleEditInEditor(message.content, message.changeId);
                    return;
                case 'regenerateResponse':
                    await this.handleRegenerateResponse(message.changeId);
                    return;
                case 'openFile':
                    // Handle opening files from the webview
                    const fileUri = vscode.Uri.file(message.filePath);
                    try {
                        const document = await vscode.workspace.openTextDocument(fileUri);
                        await vscode.window.showTextDocument(document, { 
                            preview: false,
                            selection: message.lineNumber ? new vscode.Range(message.lineNumber - 1, 0, message.lineNumber - 1, 0) : undefined
                        });
                    } catch (error) {
                        console.error('Failed to open file:', error);
                        vscode.window.showErrorMessage(`Failed to open file: ${message.filePath}`);
                    }
                    return;
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Use the built React webview instead of hardcoded HTML
        const webviewPath = vscode.Uri.joinPath(vscode.Uri.file(__dirname), 'dist', 'webview', 'webview.js');
        const webviewUri = webview.asWebviewUri(webviewPath);
        
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

    private async handleApplyChange(changeId: string, content: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
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
            // Execute code in a sandboxed environment
            const output = await this.executeTerminalCommand(code);
            
            this.showTerminalOutput(code, output);
        } catch (error) {
            console.error('Error running code:', error);
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to run code: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async handleEditInEditor(content: string, changeId?: string): Promise<void> {
        if (!this._webviewView) return;
        
        try {
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

    private async executeTerminalCommand(command: string): Promise<string> {
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
}
