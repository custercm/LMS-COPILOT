import * as vscode from 'vscode';
// Import ChatProvider
import { ChatProvider } from './chat/ChatProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating LMS Copilot Agent extension');

    // Register the chat provider
    const chatProvider = new ChatProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('lmsCopilot.chat', chatProvider)
    );
    
    // Add command handler for startChat
    const startChatCommand = vscode.commands.registerCommand('lmsCopilot.startChat', () => {
        // Implementation for starting a new chat session
        vscode.window.showInformationMessage('Starting new chat session');
        // Show the webview panel if it exists, or create one
        // This would typically involve calling a method on the ChatProvider
    });
    
    // Add command handler for togglePanel
    const togglePanelCommand = vscode.commands.registerCommand('lmsCopilot.togglePanel', () => {
        // Implementation for toggling the panel visibility
        // This would involve checking if the webview is visible and toggling accordingly
        vscode.window.showInformationMessage('Toggling panel visibility');
    });

    context.subscriptions.push(startChatCommand, togglePanelCommand);
}

export function deactivate() {
    console.log('Deactivating LMS Copilot Agent extension');
}