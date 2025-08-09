/**
 * Integration tests for MessageHandler + AIResponseParser
 * Step 3: Wire AI Parser to File Creation
 */

import { MessageHandler } from "../../src/chat/MessageHandler";
import { AgentManager } from "../../src/agent/AgentManager";
import { ChatProvider } from "../../src/chat/ChatProvider";
import { LMStudioClient } from "../../src/lmstudio/LMStudioClient";
import { SecurityManager } from "../../src/security/SecurityManager";
import { PermissionsManager } from "../../src/security/PermissionsManager";
import { ConversationHistory } from "../../src/agent/ConversationHistory";
import { TaskExecutor } from "../../src/agent/TaskExecutor";
import { ToolRegistry } from "../../src/agent/ToolRegistry";
import * as vscode from "vscode";

// Mock VS Code
jest.mock("vscode", () => ({
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue: any) => {
        if (key === "enableAutoFileCreation") return true; // Feature enabled for tests
        return defaultValue;
      }),
    })),
    onDidChangeConfiguration: jest.fn(),
    fs: {
      writeFile: jest.fn(),
    },
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path })),
  },
}));

describe("MessageHandler + AIResponseParser Integration", () => {
  let messageHandler: MessageHandler;
  let agentManager: AgentManager;
  let chatProvider: ChatProvider;
  let mockLMStudioClient: jest.Mocked<LMStudioClient>;
  let mockSecurityManager: jest.Mocked<SecurityManager>;
  let mockPermissionsManager: jest.Mocked<PermissionsManager>;

  beforeEach(() => {
    // Reset VS Code configuration mock to default state
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, defaultValue: any) => {
        if (key === "enableAutoFileCreation") return true; // Feature enabled for tests
        return defaultValue;
      }),
    });

    // Create mock dependencies
    mockLMStudioClient = {
      sendMessage: jest.fn(),
      isConnected: jest.fn(() => true),
      getCurrentModel: jest.fn(() => "test-model"),
    } as any;

    mockSecurityManager = {
      validateInput: jest.fn(() => ({ isValid: true, sanitized: "test" })),
      validateFileOperation: jest.fn(() => true),
      shouldCheckFilePermissions: jest.fn(() => false),
    } as any;

    mockPermissionsManager = {
      checkPermission: jest.fn(() => ({ allowed: true })),
    } as any;

    // Create AgentManager with correct constructor
    agentManager = new AgentManager(mockLMStudioClient);

    // Create MessageHandler 
    messageHandler = new MessageHandler(agentManager);

    // Create ChatProvider with correct constructor
    chatProvider = new ChatProvider(
      mockLMStudioClient,
      { fsPath: "/test", scheme: "file", authority: "", path: "/test", query: "", fragment: "" } as any,
      messageHandler,
      agentManager
    );

    // Wire them together
    messageHandler.setChatProvider(chatProvider);
  });

  describe("Auto File Creation Feature", () => {
    it("should detect and execute file creation from AI response", async () => {
      // Mock AI response containing file creation pattern
      const aiResponse = "I'll create `src/example.ts` with the following content:\n```typescript\nexport const test = 'hello';\n```";
      
      // Mock AgentManager to return our test response
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      
      // Mock ChatProvider's file creation method
      const createFileSpy = jest.spyOn(chatProvider, "createFileExternal").mockResolvedValue();

      // Process message
      const result = await messageHandler.handleMessage("Create a TypeScript example file");

      // Verify AI response was returned
      expect(result).toBe(aiResponse);
      
      // Verify file creation was triggered
      expect(createFileSpy).toHaveBeenCalledWith(
        "src/example.ts",
        "export const test = 'hello';"
      );
    });

    it("should handle multiple file creation patterns in one response", async () => {
      const aiResponse = `I'll create src/types.ts with interfaces and I'll create src/utils.ts with helper functions`;
      
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      const createFileSpy = jest.spyOn(chatProvider, "createFileExternal").mockResolvedValue();

      await messageHandler.handleMessage("Create some TypeScript files");

      // Should create both files
      expect(createFileSpy).toHaveBeenCalledTimes(2);
      expect(createFileSpy).toHaveBeenCalledWith("src/types.ts", expect.any(String));
      expect(createFileSpy).toHaveBeenCalledWith("src/utils.ts", expect.any(String));
    });

    it("should not trigger file creation when feature is disabled", async () => {
      // Mock feature disabled
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
        get: jest.fn((key: string, defaultValue: any) => {
          if (key === "enableAutoFileCreation") return false;
          return defaultValue;
        }),
      });

      const aiResponse = "I'll create `src/test.ts` with some code";
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      const createFileSpy = jest.spyOn(chatProvider, "createFileExternal").mockResolvedValue();

      await messageHandler.handleMessage("Create a file");

      // Should not create file when feature is disabled
      expect(createFileSpy).not.toHaveBeenCalled();
    });

    it("should handle parser errors gracefully", async () => {
      const aiResponse = "I'll create a file but with invalid syntax";
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      
      // Mock parser to throw error
      const mockParser = messageHandler['aiResponseParser'] as any;
      jest.spyOn(mockParser, "parseForActions").mockImplementation(() => {
        throw new Error("Parser error");
      });

      // Should not throw, should handle error gracefully
      const result = await messageHandler.handleMessage("Create a file");
      expect(result).toBe(aiResponse);
    });

    it("should handle file creation errors gracefully", async () => {
      const aiResponse = "I'll create `src/test.ts` with code";
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      
      // Mock file creation to fail
      jest.spyOn(chatProvider, "createFileExternal").mockRejectedValue(new Error("File creation failed"));

      // Should not throw, should handle error gracefully
      const result = await messageHandler.handleMessage("Create a file");
      expect(result).toBe(aiResponse);
    });
  });

  describe("Feature Flag Integration", () => {
    it("should check feature flag from VS Code settings", async () => {
      const configSpy = vscode.workspace.getConfiguration as jest.Mock;
      
      await messageHandler.handleMessage("test");
      
      expect(configSpy).toHaveBeenCalledWith("lmsCopilot");
    });

    it("should respect feature flag changes", async () => {
      let featureEnabled = true;
      
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
        get: jest.fn((key: string, defaultValue: any) => {
          if (key === "enableAutoFileCreation") return featureEnabled;
          return defaultValue;
        }),
      });

      const aiResponse = "I'll create src/test.ts with code";
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      const createFileSpy = jest.spyOn(chatProvider, "createFileExternal").mockResolvedValue();

      // Feature enabled - should create file
      await messageHandler.handleMessage("Create a file");
      expect(createFileSpy).toHaveBeenCalledTimes(1);

      // Disable feature
      featureEnabled = false;
      createFileSpy.mockClear();

      // Feature disabled - should not create file
      await messageHandler.handleMessage("Create a file");
      expect(createFileSpy).not.toHaveBeenCalled();
    });
  });

  describe("Action Type Support", () => {
    it("should only execute supported action types", async () => {
      const aiResponse = "I'll create src/test.ts and run npm install";
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      
      const createFileSpy = jest.spyOn(chatProvider, "createFileExternal").mockResolvedValue();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await messageHandler.handleMessage("Create and run");

      // Should create file
      expect(createFileSpy).toHaveBeenCalled();
      
      // Command execution is not yet implemented, so just verify file creation worked
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Auto-created file src/test.ts")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling and Logging", () => {
    it("should log successful file creation", async () => {
      const aiResponse = "I'll create `src/test.ts` with code";
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      jest.spyOn(chatProvider, "createFileExternal").mockResolvedValue();
      
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await messageHandler.handleMessage("Create a file");

      expect(consoleSpy).toHaveBeenCalledWith(
        "MessageHandler: Auto-created file src/test.ts"
      );

      consoleSpy.mockRestore();
    });

    it("should log when no ChatProvider is available", async () => {
      // Create MessageHandler without ChatProvider
      const isolatedHandler = new MessageHandler(agentManager);
      
      const aiResponse = "I'll create src/test.ts with code";
      jest.spyOn(agentManager, "processMessage").mockResolvedValue(aiResponse);
      
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await isolatedHandler.handleMessage("Create a file");

      // Check that the specific file creation warning was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        "MessageHandler: Cannot create file - no ChatProvider available"
      );

      consoleSpy.mockRestore();
    });
  });
});
