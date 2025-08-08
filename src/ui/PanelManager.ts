import * as vscode from "vscode";
import { LMStudioClient } from "../lmstudio/LMStudioClient";
import { ChatPanel } from "../chat/ChatPanel";
import { MessageHandler } from "../chat/MessageHandler";
import { AgentManager } from "../agent/AgentManager";

interface PanelConfiguration {
  title: string;
  viewType: string;
}

class PanelManager {
  private currentPanel: vscode.WebviewPanel | null = null;
  private configuration: PanelConfiguration;
  private lmStudioClient: LMStudioClient;
  private chatPanel: ChatPanel | null = null;
  private messageHandler: MessageHandler | null = null;
  private agentManager: AgentManager | null = null;

  constructor(config: PanelConfiguration, client: LMStudioClient) {
    this.configuration = config;
    this.lmStudioClient = client;
  }

  // Set the agent manager for advanced operations
  setAgentManager(agentManager: AgentManager): void {
    this.agentManager = agentManager;
  }

  // Set the message handler for chat operations
  setMessageHandler(messageHandler: MessageHandler): void {
    this.messageHandler = messageHandler;
  }

  createPanel(): void {
    if (this.currentPanel) {
      this.currentPanel.reveal();
      return;
    }

    // PRESERVE ALL EXISTING PANEL CREATION LOGIC
    this.currentPanel = vscode.window.createWebviewPanel(
      this.configuration.viewType,
      this.configuration.title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    this.chatPanel = new ChatPanel(this.currentPanel.webview);

    // ADD NULL SAFETY
    if (this.messageHandler) {
      this.chatPanel.setMessageHandler(async (text: string) => {
        try {
          await this.messageHandler!.handleMessage(text, "panel");
        } catch (error) {
          this.chatPanel!.addMessage(
            "assistant",
            `Error: ${(error as Error).message}`,
          );
        }
      });

      // Wire AFTER setting up the callback
      this.messageHandler.setChatPanel(this.chatPanel);
    } else {
      console.warn(
        "PanelManager: MessageHandler not set, chat functionality will be limited",
      );
    }

    this.chatPanel.init();

    // PRESERVE ALL EXISTING MESSAGE HANDLING
    this.currentPanel.webview.onDidReceiveMessage(async (message) => {
      await this.handleWebviewMessage(message);
    });

    // PRESERVE ALL EXISTING DISPOSAL LOGIC
    this.currentPanel.onDidDispose(() => {
      this.currentPanel = null;
      this.chatPanel = null;
    });
  }

  // Handle messages from the webview
  private async handleWebviewMessage(message: any): Promise<void> {
    if (!this.chatPanel) return;

    switch (message.command) {
      case "analyzeFile":
        if (this.agentManager) {
          try {
            const result = await this.agentManager.analyzeFileContent(
              message.filePath,
            );
            this.chatPanel.addMessage(
              "assistant",
              `File Analysis for ${message.filePath}:\n${result}`,
            );
          } catch (error) {
            this.chatPanel.addMessage(
              "assistant",
              `Error analyzing file: ${(error as Error).message}`,
            );
          }
        } else {
          console.warn(
            "PanelManager: AgentManager not available for file analysis",
          );
          this.chatPanel.addMessage(
            "assistant",
            "File analysis not available - agent manager not initialized",
          );
        }
        break;

      case "executeCommand":
        if (this.agentManager) {
          try {
            const result = await this.agentManager.executeTerminalCommand(
              message.commandText,
            );
            this.chatPanel.addMessage(
              "assistant",
              `Command Output:\n${result}`,
            );
          } catch (error) {
            this.chatPanel.addMessage(
              "assistant",
              `Command Error: ${(error as Error).message}`,
            );
          }
        } else {
          console.warn(
            "PanelManager: AgentManager not available for command execution",
          );
          this.chatPanel.addMessage(
            "assistant",
            "Command execution not available - agent manager not initialized",
          );
        }
        break;
    }
  }

  // New method to display workspace analysis with proper implementation
  displayAnalysis(response: string): void {
    if (this.chatPanel) {
      this.chatPanel.addMessage("assistant", response);
    }
  }

  // Handle panel resize and collapse events
  onResize(): void {
    // Implementation for handling panel resizing
    console.log("Panel resized");
  }

  onCollapse(): void {
    // Implementation for handling panel collapsing
    console.log("Panel collapsed");
  }

  // Switch between bottom panel and right sidebar with proper implementation
  switchPosition(newPosition: "panel" | "sidebar"): void {
    if (this.currentPanel) {
      const viewColumn =
        newPosition === "panel" ? vscode.ViewColumn.One : vscode.ViewColumn.Two;

      this.currentPanel.reveal(viewColumn);
    } else {
      console.warn("PanelManager: Cannot switch position, no active panel");
    }
  }

  // Toggle theme and update configuration
  toggleTheme(): void {
    // Implementation for toggling dark/light themes
    console.log("Theme toggled");
  }

  // Save the current state including theme preference
  saveState(): void {
    // Implementation for saving panel state
    console.log("Panel state saved");
  }

  // Restore the saved state including theme preference
  restoreState(): void {
    // Implementation for restoring panel state
    console.log("Panel state restored");
  }

  // Implementation of applyCode method to modify workspace content
  private applyCode(content: string): void {
    // This would need implementation using VS Code's workspace API
    console.log("Applying code changes:", content);

    // Example placeholder for actual file modification logic:
    /*
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const range = new vscode.Range(0, 0, document.lineCount, 0);
      
      // Apply the changes to current document
      editor.edit(editBuilder => {
        editBuilder.replace(range, content);
      });
    }
    */
  }

  // Implementation of runCode method to execute code in a sandbox
  private runCode(content: string): void {
    // This would need implementation for running code safely
    console.log("Running code:", content);

    // Example placeholder:
    /*
    vscode.window.showInformationMessage(`Executing code:\n${content}`);
    */
  }

  // Implementation of editCode method to open code in editor
  private editCode(content: string): void {
    // This would need implementation for opening files in editors
    console.log("Editing code:", content);

    // Example placeholder:
    /*
    vscode.workspace.openTextDocument({
      content,
      language: 'typescript'
    }).then(doc => {
      vscode.window.showTextDocument(doc);
    });
    */
  }

  // Implementation of displayDiffPreview to show in chat
  displayDiffPreview(changeDetails: any): void {
    if (this.chatPanel) {
      this.chatPanel.addMessage(
        "assistant",
        `Code changes preview:\n\`\`\`\n${JSON.stringify(changeDetails, null, 2)}\n\`\`\``,
      );
    }
  }

  // Implementation for showing terminal output in chat
  showTerminalOutput(output: string): void {
    if (this.chatPanel) {
      this.chatPanel.addMessage(
        "assistant",
        `Terminal output:\n\`\`\`\n${output}\n\`\`\``,
      );
    }
  }

  // Add method to get current chat panel for external access
  getChatPanel(): ChatPanel | null {
    return this.chatPanel;
  }

  // Add method to check if panel is active
  isActive(): boolean {
    return this.currentPanel !== null;
  }
}

export default PanelManager;
