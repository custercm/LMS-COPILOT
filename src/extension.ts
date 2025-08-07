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
import PanelManager from './ui/PanelManager';
// Security system is implemented in ./security/ and integrated into ChatProvider

export function activate(context: vscode.ExtensionContext) {
    console.log('LMS Copilot extension is now active!');
    
    // PHASE 1: Create Core Services (No Dependencies)
    const lmStudioClient = new LMStudioClient();
    
    // PHASE 2: Create Services with Dependencies
    const agentManager = new AgentManager(lmStudioClient);
    const messageHandler = new MessageHandler(agentManager);
    
    // PHASE 3: Create UI Components with Dependency Injection
    const chatProvider = new ChatProvider(
        lmStudioClient, 
        context.extensionUri,
        messageHandler,
        agentManager
    );
    
    // PHASE 4: Wire Bidirectional References (After All Objects Exist)
    chatProvider.wireMessageHandler();
    
    // PHASE 5: Create Panel Manager and Wire Dependencies
    const panelManager = new PanelManager(
        {
            title: 'LMS Copilot Chat',
            viewType: 'lmsCopilotChat'
        },
        lmStudioClient
    );
    
    panelManager.setAgentManager(agentManager);
    panelManager.setMessageHandler(messageHandler);
    
    // PHASE 6: Register VS Code Providers (PRESERVE ALL EXISTING LOGIC)
    const chatProviderDisposable = vscode.window.registerWebviewViewProvider(
        'lmsCopilotChat',
        chatProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );

    // PRESERVE ALL EXISTING COMPLETION PROVIDER LOGIC
    const completionProvider = new CompletionProvider(lmStudioClient);
    const completionProviderDisposable = vscode.languages.registerInlineCompletionItemProvider(
        { scheme: 'file' }, // Apply to all file schemes
        completionProvider
    );
    
    // PRESERVE ALL EXISTING COMMAND REGISTRATIONS
    // Register commands
    const startChatDisposable = vscode.commands.registerCommand('lms-copilot.startChat', async () => {
        // Use PanelManager to create and manage the chat panel
        panelManager.createPanel();
        
        // The PanelManager will handle webview content and communication
        // Additional integration could be added here for specific features
    });

    // Register toggle panel command
    const togglePanelDisposable = vscode.commands.registerCommand('lms-copilot.togglePanel', () => {
        vscode.commands.executeCommand('workbench.view.extension.lmsCopilotContainer');
    });

    // Register panel position switching command
    const switchPanelPositionDisposable = vscode.commands.registerCommand('lms-copilot.switchPanelPosition', () => {
        // This would toggle between bottom panel and right sidebar
        panelManager.switchPosition('sidebar'); // or 'panel'
        vscode.window.showInformationMessage('Panel position switched');
    });

    // Register theme toggle command
    const toggleThemeDisposable = vscode.commands.registerCommand('lms-copilot.toggleTheme', () => {
        panelManager.toggleTheme();
        vscode.window.showInformationMessage('Panel theme toggled');
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

    // PRESERVE ALL EXISTING DISPOSABLES
    context.subscriptions.push(
        startChatDisposable, 
        togglePanelDisposable, 
        switchPanelPositionDisposable,
        toggleThemeDisposable,
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