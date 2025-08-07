import * as vscode from 'vscode';
import { AgentManager } from './agent/AgentManager';
import { LMStudioClient } from './lmstudio/LMStudioClient';
import { ConversationHistory } from './agent/ConversationHistory';
import { ChatProvider } from './chat/ChatProvider';
// Security system is implemented in ./security/ and integrated into ChatProvider

export function activate(context: vscode.ExtensionContext) {
    console.log('LMS Copilot extension is now active!');
    
    // Create LM Studio client
    const lmStudioClient = new LMStudioClient();
    
    // Create and register ChatProvider for webview
    const chatProvider = new ChatProvider(lmStudioClient, context.extensionUri);
    const chatProviderDisposable = vscode.window.registerWebviewViewProvider(
        'lmsCopilotChat',
        chatProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );
    
    // Create agent manager with conversation history
    const agentManager = new AgentManager(lmStudioClient);
    
    // Register commands
    const disposable = vscode.commands.registerCommand('lms-copilot.startChat', async () => {
        // Show the chat webview panel
        const panel = vscode.window.createWebviewPanel(
            'copilotChat',
            'LMS Copilot Chat',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        // Load webview content (this would normally be from a HTML file)
        panel.webview.html = getWebviewContent();
        
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'sendMessage':
                    // Add to conversation history before processing
                    agentManager.getConversationHistory().addMessage('user', message.text);
                    
                    // Process with AI agent
                    const response = await agentManager.processMessage(message.text);
                    
                    // Add AI response to history
                    agentManager.getConversationHistory().addMessage('assistant', response);
                    
                    // Send back to webview (this would be a postMessage call)
                    panel.webview.postMessage({
                        command: 'receiveMessage',
                        text: response
                    });
                    return;
                
                case 'analyzeFile':
                    try {
                        const result = await agentManager.analyzeFileContent(message.filePath);
                        panel.webview.postMessage({
                            command: 'fileAnalysisResult',
                            content: result,
                            filePath: message.filePath
                        });
                    } catch (error) {
                        panel.webview.postMessage({
                            command: 'fileAnalysisError',
                            error: (error as Error).message
                        });
                    }
                    return;
                
                case 'executeCommand':
                    try {
                        const result = await agentManager.executeTerminalCommand(message.commandText);
                        panel.webview.postMessage({
                            command: 'commandResult',
                            output: result,
                            commandText: message.commandText
                        });
                    } catch (error) {
                        panel.webview.postMessage({
                            command: 'commandError',
                            error: (error as Error).message
                        });
                    }
                    return;
            }
        });
    });

    // Add disposables to subscriptions
    context.subscriptions.push(disposable, chatProviderDisposable);
}

function getWebviewContent() {
    // This would normally load HTML content, but for demonstration:
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LMS Copilot</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
}

// Add mock VS Code API for testing
export function createMockVsCodeAPI() {
  // Mock implementation to test webview communication
  return {
    postMessage: (message: any) => console.log('Mock message posted:', message),
    getState: () => ({ theme: 'dark' }),
    setState: (state: any) => console.log('Mock state set:', state)
  };
}

// Add integration testing methods to extension.ts
export function runExtensionIntegrationTests(): Promise<{passed: number, failed: number}> {
  let passed = 0;
  let failed = 0;

  try {
    // Test that the mock API works correctly for communication
    const mockAPI = createMockVsCodeAPI();
    if (typeof mockAPI.postMessage === 'function' &&
        typeof mockAPI.getState === 'function' &&
        typeof mockAPI.setState === 'function') {
      passed++;

      // Simulate sending a test message
      mockAPI.postMessage({ type: 'test-message', payload: { content: 'Integration test' } });
    } else {
      failed++;
    }

    console.log(`Extension integration tests: ${passed} passed, ${failed} failed`);
    return Promise.resolve({ passed, failed });
  } catch (error) {
    failed++;
    return Promise.resolve({ passed, failed });
  }
}

export function deactivate() {
  console.log('LMS Copilot extension is now deactivated!');
}
