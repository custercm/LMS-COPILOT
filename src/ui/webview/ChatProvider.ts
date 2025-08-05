import * as vscode from 'vscode';

// Import LMStudioClient - assuming it's defined elsewhere in your project
// You may need to adjust this import path based on where your client is located
import LMStudioClient from '../../common/LMStudioClient';
import TerminalTools from '../../common/TerminalTools';

class ChatProvider implements vscode.WebviewViewProvider {
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
            
            // Send message to LMStudio backend and get streaming response
            const stream = await this.client.streamMessage(message);
            
            // Create a new message element for streaming
            const messageId = Date.now().toString();
            const messageElement = document.createElement('div');
            messageElement.id = `message-${messageId}`;
            messageElement.className = 'message-bubble ai-message';
            
            const contentElement = document.createElement('div');
            contentElement.className = 'message-content';
            messageElement.appendChild(contentElement);
            
            // Add to chat container
            this._webviewView.webview.postMessage({
                command: 'appendMessage',
                element: messageElement.outerHTML,
                id: messageId
            });
            
            let accumulatedContent = '';
            
            // Process streaming response chunks
            for await (const chunk of stream) {
                if (chunk.choices && chunk.choices[0]?.delta?.content) {
                    const deltaContent = chunk.choices[0].delta.content;
                    accumulatedContent += deltaContent;
                    
                    // Update the message element with new content
                    this._webviewView.webview.postMessage({
                        command: 'updateMessage',
                        id: messageId,
                        content: accumulatedContent
                    });
                }
            }
            
            // Remove typing indicator after response is complete
            this.removeTypingIndicator();
        } catch (error) {
            console.error('Error sending message:', error);
            this.removeTypingIndicator();
            this._webviewView.webview.postMessage({
                command: 'handleError',
                message: `Failed to get response from AI assistant: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    private async executeTerminalCommand(command: string): Promise<string> {
        try {
            const output = await this.terminalTools.executeCommand(command);
            return output;
        } catch (error) {
            return `Error executing command: ${error}`;
        }
    }

    private async handleAnalyzeWorkspace(structure: string): Promise<void> {
        if (!this._webviewView) return;

        try {
            const response = await this.client.analyzeWorkspace(structure);
            
            // Create message object for display
            const analysisMessage = {
                role: 'assistant',
                content: `Workspace Analysis Complete:\n\n${response}`,
                timestamp: Date.now()
            };
            
            this._webviewView.webview.postMessage({
                command: 'appendMessage',
                data: analysisMessage
            });
        } catch (error) {
            console.error('Workspace analysis error:', error);
            
            const errorMessage = {
                role: 'assistant',
                content: `Error analyzing workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: Date.now()
            };
            
            this._webviewView.webview.postMessage({
                command: 'appendMessage',
                data: errorMessage
            });
        }
    }

    private async handleGetWorkspaceStructure(): Promise<void> {
        if (!this._webviewView) return;

        try {
            const structure = await this.getWorkspaceStructure();
            
            this._webviewView.webview.postMessage({
                command: 'workspaceStructure',
                text: structure
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
        // Get the current workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return "No workspace folder found";
        }
        
        const workspaceFolder = workspaceFolders[0];
        try {
            // You would implement actual file system traversal here
            // For now, returning placeholder content
            const structure = await this.client.getWorkspaceStructure(workspaceFolder.uri.fsPath);
            return structure;
        } catch (error) {
            console.error('Failed to get workspace structure:', error);
            throw new Error(`Could not retrieve workspace structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private appendTypingIndicator(): void {
        if (!this._webviewView) return;
        
        this._webviewView.webview.postMessage({
            command: 'typingIndicator',
            show: true
        });
    }

    private removeTypingIndicator(): void {
        if (!this._webviewView) return;
        
        this._webviewView.webview.postMessage({
            command: 'typingIndicator',
            show: false
        });
    }

    // Method to display terminal output in chat UI
    private showTerminalOutput(command: string, output: string): void {
        if (this._webviewView) {
            this._webviewView.webview.postMessage({
                command: 'appendTerminalOutput',
                data: {
                    command,
                    output,
                    timestamp: Date.now()
                }
            });
        }
    }

    private getWebviewContent(): string {
        // This would be the HTML content that loads your React app
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LMS Copilot Chat</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: #1e1e1e; /* Dark theme */
                        color: #cccccc;
                        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    }
                    .chat-container {
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                    }
                    .messages-area {
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                    }
                    .message-bubble {
                        margin-bottom: 12px;
                        border-radius: 8px;
                        padding: 12px 16px;
                        line-height: 1.4;
                        max-width: 80%;
                    }
                    .user-message {
                        background-color: #0078d4; /* GitHub Copilot user color */
                        align-self: flex-end;
                    }
                    .ai-message {
                        background-color: #2d2d30; /* GitHub Copilot AI color */
                    }
                    .input-form {
                        display: flex;
                        padding: 16px;
                        border-top: 1px solid #3c3c3c;
                    }
                    .message-input {
                        flex: 1;
                        background-color: #2d2d30;
                        color: #cccccc;
                        border: 1px solid #3c3c3c;
                        padding: 8px 12px;
                        border-radius: 4px;
                    }
                    .send-button {
                        margin-left: 8px;
                        background-color: #0078d4;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <div class="messages-area" id="messagesArea"></div>
                    <form class="input-form" id="inputForm">
                        <input type="text" class="message-input" id="messageInput" placeholder="Ask about your code..." />
                        <button type="submit" class="send-button">Send</button>
                    </form>
                </div>
                
                <!-- React app would be mounted here -->
                <script>
                    // Message passing between webview and extension
                    const vscode = acquireVsCodeApi();
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'appendMessage':
                                // Add to UI
                                const messagesArea = document.getElementById('messagesArea');
                                if (messagesArea) {
                                    messagesArea.insertAdjacentHTML('beforeend', message.element);
                                    messagesArea.scrollTop = messagesArea.scrollHeight;
                                }
                                break;
                            case 'updateMessage':
                                // Update existing message content
                                const messageElement = document.getElementById(\`message-\${message.id}\`);
                                if (messageElement) {
                                    const contentElement = messageElement.querySelector('.message-content');
                                    if (contentElement) {
                                        contentElement.textContent = message.content;
                                    }
                                }
                                break;
                            case 'typingIndicator':
                                // Handle typing indicator
                                const typingIndicator = document.getElementById('typingIndicator');
                                if (message.show) {
                                    if (!typingIndicator) {
                                        const indicator = document.createElement('div');
                                        indicator.id = 'typingIndicator';
                                        indicator.className = 'message-bubble ai-message';
                                        indicator.innerHTML = '<div class="message-content">AI is typing...</div>';
                                        document.getElementById('messagesArea')?.appendChild(indicator);
                                    }
                                } else if (typingIndicator) {
                                    typingIndicator.remove();
                                }
                                break;
                            case 'displayAnalysis':
                                // Display workspace analysis
                                const messagesArea2 = document.getElementById('messagesArea');
                                if (messagesArea2) {
                                    const analysisElement = document.createElement('div');
                                    analysisElement.className = 'message-bubble ai-message';
                                    analysisElement.innerHTML = '<div class="message-content">' + message.text.replace(/\n/g, '<br>') + '</div>';
                                    messagesArea2.appendChild(analysisElement);
                                    messagesArea2.scrollTop = messagesArea2.scrollHeight;
                                }
                                break;
                            case 'workspaceStructure':
                                // Display workspace structure
                                const structureElement = document.createElement('div');
                                structureElement.className = 'message-bubble ai-message';
                                structureElement.innerHTML = '<div class="message-content"><pre>' + message.text + '</pre></div>';
                                document.getElementById('messagesArea')?.appendChild(structureElement);
                                break;
                            case 'handleError':
                                // Display error messages
                                const errorElement = document.createElement('div');
                                errorElement.className = 'message-bubble ai-message';
                                errorElement.innerHTML = '<div class="message-content" style="color: #ff6b6b;">' + message.message + '</div>';
                                document.getElementById('messagesArea')?.appendChild(errorElement);
                                break;
                            case 'appendTerminalOutput':
                                // Display terminal output
                                const messagesArea3 = document.getElementById('messagesArea');
                                if (messagesArea3) {
                                    const outputElement = document.createElement('div');
                                    outputElement.className = 'message-bubble ai-message';
                                    outputElement.innerHTML = '<div class="message-content"><pre>Command: ' + message.data.command + '\n\nOutput:\n' + message.data.output.replace(/\n/g, '<br>') + '</pre></div>';
                                    messagesArea3.appendChild(outputElement);
                                    messagesArea3.scrollTop = messagesArea3.scrollHeight;
                                }
                                break;
                        }
                    });
                    
                    // Handle form submission
                    document.getElementById('inputForm')?.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const input = document.getElementById('messageInput') as HTMLInputElement;
                        if (input && input.value.trim() !== '') {
                            vscode.postMessage({
                                command: 'sendMessage',
                                text: input.value
                            });
                            input.value = '';
                        }
                    });
                </script>
            </body>
            </html>
        `;
        
        return html;
    }
}

export default ChatProvider;



class ChatProvider implements vscode.WebviewViewProvider {
    private _webviewView: vscode.WebviewView | undefined;
    private client: LMStudioClient;
    private terminalTools = new TerminalTools();

    constructor(private readonly extensionUri: vscode.Uri) { ... }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) { ... }

    private async handleSendMessage(message: string): Promise<void> { 
      // Add risk assessment to user messages before sending
      const riskAssessment = RiskAssessmentManager.assessRisk(message);
      
      // Implementation would send message with risk level information
    }

    private async executeTerminalCommand(command: string): Promise<string> {
      // Assess command safety before execution
      const riskAssessment = RiskAssessmentManager.assessRisk(command);
      
      if (riskAssessment.level === 'high') {
        // Show warning UI for high-risk commands
        return `High risk command detected (${riskAssessment.color}). Please confirm execution.`;
      }
      
      // Execute safe command
      return await this.terminalTools.executeCommand(command);
    }

    private async handleAnalyzeWorkspace(structure: string): Promise<void> { ... }

    private async handleGetWorkspaceStructure(): Promise<void> { ... }

    private async getWorkspaceStructure(): Promise<string> { ... }

    private appendTypingIndicator(): void { ... }

    private removeTypingIndicator(): void { ... }

    // Method to display terminal output in chat UI with safety indicators
    private showTerminalOutput(command: string, output: string): void {
      const riskAssessment = RiskAssessmentManager.assessRisk(command);
      
      // Implementation would update webview with color-coded safety indicator
    }

    private getWebviewContent(): string { 
      // Return content with proper styling for safety indicators
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LMS Copilot Chat</title>
            <link rel="stylesheet" href="styles.css">
            <style>
              .risk-high { color: #e74c3c; }
              .risk-medium { color: #f1c40f; } 
              .risk-low { color: #2ecc71; }
            </style>
        </head>
        <body>
            <div id="root"></div>
            <script type="text/babel" src="main.tsx"></script>
        </body>
        </html>
      `;
    }
}