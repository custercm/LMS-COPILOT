import { ChatProvider } from './ChatProvider';
import { ChatPanel } from './ChatPanel';
import { AgentManager } from '../agent/AgentManager';
import * as vscode from 'vscode';

export class MessageHandler {
  private chatProvider: ChatProvider | null = null;
  private chatPanel: ChatPanel | null = null;
  private agentManager: AgentManager;

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
  }

  // Set the chat provider for webview view integration
  setChatProvider(chatProvider: ChatProvider): void {
    this.chatProvider = chatProvider;
  }

  // Set the chat panel for standalone panel integration
  setChatPanel(chatPanel: ChatPanel): void {
    this.chatPanel = chatPanel;
  }

  // Process incoming messages and route to appropriate handlers
  async handleMessage(message: string, source: 'provider' | 'panel' = 'provider'): Promise<string> {
    try {
      // Add user message to display
      if (source === 'provider' && this.chatProvider) {
        // ChatProvider handles its own message display
      } else if (source === 'panel' && this.chatPanel) {
        this.chatPanel.addMessage('user', message);
      }

      // Process the message
      if (message.startsWith('/')) {
        return await this.handleCommand(message);
      } else {
        return await this.handleChatMessage(message);
      }
    } catch (error) {
      const errorMessage = `Error processing message: ${(error as Error).message}`;
      
      // Add error message to display
      if (source === 'provider' && this.chatProvider) {
        // ChatProvider handles its own error display
      } else if (source === 'panel' && this.chatPanel) {
        this.chatPanel.addMessage('assistant', errorMessage);
      }
      
      return errorMessage;
    }
  }

  private async handleCommand(command: string): Promise<string> {
    const [cmd, ...args] = command.slice(1).split(' ');
    
    switch (cmd.toLowerCase()) {
      case 'help':
        return this.getHelpMessage();
      case 'clear':
        if (this.chatPanel) {
          this.chatPanel.clearMessages();
        }
        return 'Chat cleared.';
      case 'workspace':
        return await this.getWorkspaceInfo();
      case 'model':
        if (args.length > 0) {
          return await this.changeModel(args[0]);
        }
        return 'Current model: ' + (await this.getCurrentModel());
      default:
        return `Unknown command: ${cmd}. Type /help for available commands.`;
    }
  }

  private async handleChatMessage(message: string): Promise<string> {
    // Add user message to conversation history
    this.agentManager.getConversationHistory().addMessage('user', message);
    
    // Process with AI agent
    const response = await this.agentManager.processMessage(message);
    
    // Add AI response to history
    this.agentManager.getConversationHistory().addMessage('assistant', response);
    
    // Add response to display
    if (this.chatPanel) {
      this.chatPanel.addMessage('assistant', response);
    }
    
    return response;
  }

  private getHelpMessage(): string {
    return `
Available commands:
• /help - Show this help message
• /clear - Clear chat history
• /workspace - Show workspace information
• /model [name] - Change or show current model

You can also ask me anything about your code, and I'll help you with:
• Code analysis and explanation
• Bug fixes and improvements
• File operations
• Terminal commands
• And much more!
`;
  }

  private async getWorkspaceInfo(): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return 'No workspace folder is currently open.';
    }

    const folder = workspaceFolders[0];
    return `Workspace: ${folder.name}\nPath: ${folder.uri.fsPath}`;
  }

  private async changeModel(modelName: string): Promise<string> {
    try {
      // Update the configuration
      await vscode.workspace.getConfiguration('lmsCopilot').update('model', modelName, vscode.ConfigurationTarget.Global);
      return `Model changed to: ${modelName}`;
    } catch (error) {
      return `Failed to change model: ${(error as Error).message}`;
    }
  }

  private async getCurrentModel(): Promise<string> {
    const config = vscode.workspace.getConfiguration('lmsCopilot');
    return config.get('model', 'llama3');
  }
}