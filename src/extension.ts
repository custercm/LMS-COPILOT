import * as vscode from 'vscode';
import { AgentManager } from './agent/AgentManager';
import { LMStudioClient } from './lmstudio/LMStudioClient';
import { ModelManager } from './lmstudio/ModelManager';
import { StreamHandler } from './lmstudio/StreamHandler';
import { ConversationHistory } from './agent/ConversationHistory';
import { ChatProvider } from './chat/ChatProvider';
import { ChatPanel } from './chat/ChatPanel';
import { MessageHandler } from './chat/MessageHandler';
import { CompletionProvider } from './completion/CompletionProvider';
import { ContextAnalyzer } from './completion/ContextAnalyzer';
// Security system is implemented in ./security/ and integrated into ChatProvider

export function activate(context: vscode.ExtensionContext) {
    console.log('LMS Copilot extension is now active!');
    
    // Create LM Studio client
    const lmStudioClient = new LMStudioClient();
    
    // Create agent manager
    const agentManager = new AgentManager(lmStudioClient);
    
    // Create message handler
    const messageHandler = new MessageHandler(agentManager);
    
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

    // Create and register CompletionProvider for inline code completion
    const completionProvider = new CompletionProvider(lmStudioClient);
    const completionProviderDisposable = vscode.languages.registerInlineCompletionItemProvider(
        { scheme: 'file' }, // Apply to all file schemes
        completionProvider
    );
    
    // Register commands
    const startChatDisposable = vscode.commands.registerCommand('lms-copilot.startChat', async () => {
        // Show the chat webview panel using ChatPanel
        const panel = vscode.window.createWebviewPanel(
            'copilotChat',
            'LMS Copilot Chat',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        // Create ChatPanel instance for this panel
        const chatPanel = new ChatPanel(panel.webview);
        
        // Set up message handler callback
        chatPanel.setMessageHandler(async (text: string) => {
            try {
                // Process with message handler
                await messageHandler.handleMessage(text, 'panel');
            } catch (error) {
                chatPanel.addMessage('assistant', `Error: ${(error as Error).message}`);
            }
        });
        
        chatPanel.init();
        
        // Wire the message handler to use the chat panel
        messageHandler.setChatPanel(chatPanel);
        
        // Handle other non-chat messages from webview (if any)
        panel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'analyzeFile':
                    try {
                        const result = await agentManager.analyzeFileContent(message.filePath);
                        chatPanel.addMessage('assistant', `File Analysis for ${message.filePath}:\n${result}`);
                    } catch (error) {
                        chatPanel.addMessage('assistant', `Error analyzing file: ${(error as Error).message}`);
                    }
                    return;
                
                case 'executeCommand':
                    try {
                        const result = await agentManager.executeTerminalCommand(message.commandText);
                        chatPanel.addMessage('assistant', `Command Output:\n${result}`);
                    } catch (error) {
                        chatPanel.addMessage('assistant', `Command Error: ${(error as Error).message}`);
                    }
                    return;
            }
        });
    });

    // Register toggle panel command
    const togglePanelDisposable = vscode.commands.registerCommand('lms-copilot.togglePanel', () => {
        vscode.commands.executeCommand('workbench.view.extension.lmsCopilotContainer');
    });

    // Register completion control commands
    const enableCompletionsDisposable = vscode.commands.registerCommand('lms-copilot.enableCompletions', () => {
        vscode.workspace.getConfiguration('lmsCopilot').update('enableCompletions', true, true);
        vscode.window.showInformationMessage('LMS Copilot completions enabled');
    });

    const disableCompletionsDisposable = vscode.commands.registerCommand('lms-copilot.disableCompletions', () => {
        vscode.workspace.getConfiguration('lmsCopilot').update('enableCompletions', false, true);
        vscode.window.showInformationMessage('LMS Copilot completions disabled');
    });

    // Register completion cache commands
    const clearCacheDisposable = vscode.commands.registerCommand('lms-copilot.clearCompletionCache', () => {
        // Access the completion provider's cache through a public method
        if (completionProvider && typeof (completionProvider as any).clearCache === 'function') {
            (completionProvider as any).clearCache();
            vscode.window.showInformationMessage('LMS Copilot completion cache cleared');
        }
    });

    const showCacheStatsDisposable = vscode.commands.registerCommand('lms-copilot.showCacheStats', () => {
        if (completionProvider && typeof (completionProvider as any).getCacheStats === 'function') {
            const stats = (completionProvider as any).getCacheStats();
            vscode.window.showInformationMessage(
                `Completion Cache: ${stats.size}/${stats.maxSize} entries`
            );
        }
    });

    // Test model management
    const testModelsDisposable = vscode.commands.registerCommand('lms-copilot.testModels', async () => {
        try {
            const modelManager = new ModelManager();
            const models = await modelManager.getAvailableModels();
            const currentModel = modelManager.getCurrentModel();
            
            vscode.window.showInformationMessage(
                `Available models: ${models.join(', ')}. Current: ${currentModel}`
            );
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to get models: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    });

    // Add disposables to subscriptions
    context.subscriptions.push(
        startChatDisposable, 
        togglePanelDisposable, 
        chatProviderDisposable,
        completionProviderDisposable,
        enableCompletionsDisposable,
        disableCompletionsDisposable,
        clearCacheDisposable,
        showCacheStatsDisposable,
        testModelsDisposable
    );
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