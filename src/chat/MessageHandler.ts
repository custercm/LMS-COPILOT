import { ChatProvider } from "./ChatProvider";
import { ChatPanel } from "./ChatPanel";
import { AgentManager } from "../agent/AgentManager";
import * as vscode from "vscode";

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
  async handleMessage(
    message: string,
    source: "provider" | "panel" = "provider",
  ): Promise<string> {
    try {
      // Add user message to display with null safety
      if (source === "provider" && this.chatProvider) {
        // ChatProvider handles its own message display
      } else if (source === "panel" && this.chatPanel) {
        this.chatPanel.addMessage("user", message);
      } else {
        console.warn(
          `MessageHandler: No ${source} available for message display`,
        );
      }

      // Process the message
      if (message.startsWith("/")) {
        return await this.handleCommand(message);
      } else {
        return await this.handleChatMessage(message);
      }
    } catch (error) {
      const errorMessage = `Error processing message: ${(error as Error).message}`;

      // Add error message to display with null safety
      if (source === "provider" && this.chatProvider) {
        // ChatProvider handles its own error display
      } else if (source === "panel" && this.chatPanel) {
        this.chatPanel.addMessage("assistant", errorMessage);
      } else {
        console.error(
          `MessageHandler: No ${source} available for error display:`,
          errorMessage,
        );
      }

      return errorMessage;
    }
  }

  private async handleCommand(command: string): Promise<string> {
    const [cmd, ...args] = command.slice(1).split(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        return this.getHelpMessage();
      case "clear":
        if (this.chatPanel) {
          this.chatPanel.clearMessages();
          return "Chat cleared.";
        } else {
          console.warn(
            "MessageHandler: No chat panel available for clearing messages",
          );
          return "Chat clear requested, but no active chat panel.";
        }
      case "workspace":
        return await this.getWorkspaceInfo();
      case "model":
        if (args.length > 0) {
          return await this.changeModel(args[0]);
        }
        return "Current model: " + (await this.getCurrentModel());
      case "tools":
        return this.getAvailableTools();
      case "task":
        if (args.length > 0) {
          return await this.executeTask(args.join(" "));
        }
        return "Usage: /task <task description>";
      case "agent":
        if (args[0] === "status") {
          return this.getAgentStatus();
        }
        return "Usage: /agent status";
      default:
        return `Unknown command: ${cmd}. Type /help for available commands.`;
    }
  }

  private async handleChatMessage(message: string): Promise<string> {
    // Add user message to conversation history
    this.agentManager.getConversationHistory().addMessage("user", message);

    // Process with AI agent (now includes TaskExecutor and ToolRegistry integration)
    const response = await this.agentManager.processMessage(message);

    // Add AI response to history
    this.agentManager
      .getConversationHistory()
      .addMessage("assistant", response);

    // Add response to display with null safety
    if (this.chatPanel) {
      this.chatPanel.addMessage("assistant", response);
    } else {
      console.warn(
        "MessageHandler: No chat panel available for response display",
      );
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
• /tools - Show available agent tools
• /task <description> - Execute a specific task
• /agent status - Show agent status

You can also ask me anything about your code, and I'll help you with:
• Code analysis and explanation
• Bug fixes and improvements
• File operations
• Terminal commands
• And much more!
`;
  }

  private getAvailableTools(): string {
    const toolRegistry = this.agentManager.getToolRegistry();
    const tools = toolRegistry.getAllTools();

    if (tools.length === 0) {
      return "No tools are currently available.";
    }

    let result = "Available Agent Tools:\n";
    tools.forEach((tool: any) => {
      result += `• ${tool.name} (${tool.securityLevel}): ${tool.description}\n`;
    });

    return result;
  }

  private async executeTask(taskDescription: string): Promise<string> {
    try {
      const result = await this.agentManager.processTask(taskDescription);
      return `Task executed successfully:\n${JSON.stringify(result, null, 2)}`;
    } catch (error) {
      return `Task execution failed: ${(error as Error).message}`;
    }
  }

  private getAgentStatus(): string {
    const history = this.agentManager.getConversationHistory();
    const messages = history.getMessages();

    return `Agent Status:
• Conversation messages: ${messages.length}
• Task executor: Available
• Tool registry: Available
• Capabilities: File operations, Terminal access, Workspace analysis, Code generation, Planning`;
  }

  private async getWorkspaceInfo(): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return "No workspace folder is currently open.";
    }

    const folder = workspaceFolders[0];
    return `Workspace: ${folder.name}\nPath: ${folder.uri.fsPath}`;
  }

  private async changeModel(modelName: string): Promise<string> {
    try {
      // Update the configuration
      await vscode.workspace
        .getConfiguration("lmsCopilot")
        .update("model", modelName, vscode.ConfigurationTarget.Global);
      return `Model changed to: ${modelName}`;
    } catch (error) {
      return `Failed to change model: ${(error as Error).message}`;
    }
  }

  private async getCurrentModel(): Promise<string> {
    const config = vscode.workspace.getConfiguration("lmsCopilot");
    return config.get("model", "llama3");
  }
}
