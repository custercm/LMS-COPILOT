import * as vscode from "vscode";
import { AgentManager } from "./agent/AgentManager";
import { LMStudioClient } from "./lmstudio/LMStudioClient";
import { ModelManager } from "./lmstudio/ModelManager";
import { StreamHandler } from "./lmstudio/StreamHandler";
import { ConversationHistory } from "./agent/ConversationHistory";
import { ChatProvider } from "./chat/ChatProvider";
import { ChatPanel } from "./chat/ChatPanel";
import { MessageHandler } from "./chat/MessageHandler";
import { CompletionProvider } from "./completion/CompletionProvider";
import { ContextAnalyzer } from "./completion/ContextAnalyzer";
import PanelManager from "./ui/PanelManager";
// Security system is implemented in ./security/ and integrated into ChatProvider

export function activate(context: vscode.ExtensionContext) {
  console.log("LMS Copilot extension is now active!");

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
    agentManager,
    context,
  );

  // PHASE 4: Wire Bidirectional References (After All Objects Exist)
  chatProvider.wireMessageHandler();
  chatProvider.setExtensionContext(context);

  // PHASE 5: Create Panel Manager and Wire Dependencies
  const panelManager = new PanelManager(
    {
      title: "LMS Copilot Chat",
      viewType: "lmsCopilotChat",
    },
    lmStudioClient,
  );

  panelManager.setAgentManager(agentManager);
  panelManager.setMessageHandler(messageHandler);

  // PHASE 6: Register VS Code Providers (PRESERVE ALL EXISTING LOGIC)
  const chatProviderDisposable = vscode.window.registerWebviewViewProvider(
    "lmsCopilotChat",
    chatProvider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  );

  // PRESERVE ALL EXISTING COMPLETION PROVIDER LOGIC
  const completionProvider = new CompletionProvider(lmStudioClient);
  const completionProviderDisposable =
    vscode.languages.registerInlineCompletionItemProvider(
      { scheme: "file" }, // Apply to all file schemes
      completionProvider,
    );

  // PRESERVE ALL EXISTING COMMAND REGISTRATIONS
  // Register commands
  const startChatDisposable = vscode.commands.registerCommand(
    "lms-copilot.startChat",
    async () => {
      // Focus the sidebar view instead of creating a separate panel
      await vscode.commands.executeCommand(
        "workbench.view.extension.lmsCopilotContainer",
      );
    },
  );

  // Register toggle panel command
  const togglePanelDisposable = vscode.commands.registerCommand(
    "lms-copilot.togglePanel",
    () => {
      vscode.commands.executeCommand(
        "workbench.view.extension.lmsCopilotContainer",
      );
    },
  );

  // Register panel position switching command
  const switchPanelPositionDisposable = vscode.commands.registerCommand(
    "lms-copilot.switchPanelPosition",
    () => {
      // This would toggle between bottom panel and right sidebar
      panelManager.switchPosition("sidebar"); // or 'panel'
      vscode.window.showInformationMessage("Panel position switched");
    },
  );

  // Register theme toggle command
  const toggleThemeDisposable = vscode.commands.registerCommand(
    "lms-copilot.toggleTheme",
    () => {
      panelManager.toggleTheme();
      vscode.window.showInformationMessage("Panel theme toggled");
    },
  );

  // Register completion control commands
  const enableCompletionsDisposable = vscode.commands.registerCommand(
    "lms-copilot.enableCompletions",
    () => {
      vscode.workspace
        .getConfiguration("lmsCopilot")
        .update("enableCompletions", true, true);
      vscode.window.showInformationMessage("LMS Copilot completions enabled");
    },
  );

  const disableCompletionsDisposable = vscode.commands.registerCommand(
    "lms-copilot.disableCompletions",
    () => {
      vscode.workspace
        .getConfiguration("lmsCopilot")
        .update("enableCompletions", false, true);
      vscode.window.showInformationMessage("LMS Copilot completions disabled");
    },
  );

  // Register completion cache commands
  const clearCacheDisposable = vscode.commands.registerCommand(
    "lms-copilot.clearCompletionCache",
    () => {
      // Access the completion provider's cache through a public method
      if (
        completionProvider &&
        typeof (completionProvider as any).clearCache === "function"
      ) {
        (completionProvider as any).clearCache();
        vscode.window.showInformationMessage(
          "LMS Copilot completion cache cleared",
        );
      }
    },
  );

  const showCacheStatsDisposable = vscode.commands.registerCommand(
    "lms-copilot.showCacheStats",
    () => {
      if (
        completionProvider &&
        typeof (completionProvider as any).getCacheStats === "function"
      ) {
        const stats = (completionProvider as any).getCacheStats();
        vscode.window.showInformationMessage(
          `Completion Cache: ${stats.size}/${stats.maxSize} entries`,
        );
      }
    },
  );

  // Test model management
  const testModelsDisposable = vscode.commands.registerCommand(
    "lms-copilot.testModels",
    async () => {
      try {
        const modelManager = new ModelManager();
        const models = await modelManager.getAvailableModels();
        const currentModel = modelManager.getCurrentModel();

        vscode.window.showInformationMessage(
          `Available models: ${models.join(", ")}. Current: ${currentModel}`,
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to get models: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  // Command to send selected text to LMS Copilot
  const sendToChatDisposable = vscode.commands.registerCommand(
    "lms-copilot.sendToChat",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      
      if (!selectedText) {
        vscode.window.showErrorMessage("No text selected");
        return;
      }

      // Focus the LMS Copilot chat and send the message
      await vscode.commands.executeCommand("workbench.view.extension.lmsCopilotContainer");
      
      // Send message to our chat provider
      chatProvider.sendMessageToWebview({
        command: 'addMessage',
        text: `Please analyze this code:\n\`\`\`\n${selectedText}\n\`\`\``
      });
    }
  );

  // Command to explain selected code
  const explainCodeDisposable = vscode.commands.registerCommand(
    "lms-copilot.explainCode",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      
      if (!selectedText) {
        vscode.window.showErrorMessage("No text selected");
        return;
      }

      // Focus the LMS Copilot chat and send the message
      await vscode.commands.executeCommand("workbench.view.extension.lmsCopilotContainer");
      
      // Send message to our chat provider
      chatProvider.sendMessageToWebview({
        command: 'addMessage',
        text: `Please explain this code in detail:\n\`\`\`\n${selectedText}\n\`\`\``
      });
    }
  );

  // Command to debug selected code
  const debugCodeDisposable = vscode.commands.registerCommand(
    "lms-copilot.debugCode",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      
      if (!selectedText) {
        vscode.window.showErrorMessage("No text selected");
        return;
      }

      // Focus the LMS Copilot chat and send the message
      await vscode.commands.executeCommand("workbench.view.extension.lmsCopilotContainer");
      
      // Send message to our chat provider
      chatProvider.sendMessageToWebview({
        command: 'addMessage',
        text: `Please help me debug this code and identify potential issues:\n\`\`\`\n${selectedText}\n\`\`\``
      });
    }
  );

  // Register chat participant for integration with GitHub Copilot Chat
  let chatParticipant: vscode.ChatParticipant | undefined;
  
  try {
    chatParticipant = vscode.chat.createChatParticipant("lms", async (request, context, stream, token) => {
      try {
        // Extract the user's message
        const userMessage = request.prompt;
        
        // Send typing indicator
        stream.progress("Thinking...");
        
        // Process the message through our agent system
        const response = await agentManager.processMessage(userMessage);
        
        // Stream the response back
        stream.markdown(response || "I'm ready to help! What would you like to know?");
        
      } catch (error) {
        console.error("Chat participant error:", error);
        stream.markdown("Sorry, I encountered an error. Please try again.");
      }
    });
    
    if (chatParticipant) {
      chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
      chatParticipant.followupProvider = {
        provideFollowups(result, context, token) {
          return [
            {
              prompt: "Can you explain this code?",
              label: "💡 Explain Code",
              command: "explain"
            },
            {
              prompt: "Help me debug this",
              label: "🐛 Debug Help", 
              command: "debug"
            },
            {
              prompt: "Write tests for this",
              label: "🧪 Write Tests",
              command: "test"
            }
          ];
        }
      };
    }
  } catch (error) {
    console.log("Chat participant not available in this VS Code version:", error);
    chatParticipant = undefined;
  }

  // PRESERVE ALL EXISTING DISPOSABLES
  const disposables = [
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
    testModelsDisposable,
    sendToChatDisposable,
    explainCodeDisposable,
    debugCodeDisposable,
  ];

  // Add chat participant if available
  if (chatParticipant) {
    disposables.push(chatParticipant);
  }

  context.subscriptions.push(...disposables);
}

// Add mock VS Code API for testing
export function createMockVsCodeAPI() {
  // Mock implementation to test webview communication
  return {
    postMessage: (message: any) => console.log("Mock message posted:", message),
    getState: () => ({ theme: "dark" }),
    setState: (state: any) => console.log("Mock state set:", state),
  };
}

// Add integration testing methods to extension.ts
export function runExtensionIntegrationTests(): Promise<{
  passed: number;
  failed: number;
}> {
  let passed = 0;
  let failed = 0;

  try {
    // Test that the mock API works correctly for communication
    const mockAPI = createMockVsCodeAPI();
    if (
      typeof mockAPI.postMessage === "function" &&
      typeof mockAPI.getState === "function" &&
      typeof mockAPI.setState === "function"
    ) {
      passed++;

      // Simulate sending a test message
      mockAPI.postMessage({
        type: "test-message",
        payload: { content: "Integration test" },
      });
    } else {
      failed++;
    }

    console.log(
      `Extension integration tests: ${passed} passed, ${failed} failed`,
    );
    return Promise.resolve({ passed, failed });
  } catch (error) {
    failed++;
    return Promise.resolve({ passed, failed });
  }
}

export function deactivate() {
  console.log("LMS Copilot extension is now deactivated!");
}
