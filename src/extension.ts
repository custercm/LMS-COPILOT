import * as vscode from 'vscode';
import { LMStudioClient } from './client/LMStudioClient';
import { ChatProvider } from './chat/ChatProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('LMS Copilot extension is now active!');

    const client = new LMStudioClient(
        vscode.workspace.getConfiguration('lmsCopilot').get('endpoint') || 'http://localhost:1234',
        vscode.workspace.getConfiguration('lmsCopilot').get('model') || 'llama3'
    );

  // Register the chat provider
  const chatProvider = new ChatProvider(client);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'lmsCopilotChat',
            chatProvider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

  // Register commands for file operations
    context.subscriptions.push(
    vscode.commands.registerCommand('lms-copilot.openFile', async (filePath, lineNumber) => {
        try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document, {
          preview: false,
          selection: lineNumber ? new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0) : undefined
        });

        // If a line number was provided, set cursor position
        if (lineNumber) {
          const position = new vscode.Position(lineNumber - 1, 0);
          editor.selection = new vscode.Selection(position, position);
        }
        } catch (error) {
        console.error('Failed to open file:', error);
        vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
      }
    })
  );
}

export function deactivate() {
  console.log('LMS Copilot extension is now deactivated!');
}
