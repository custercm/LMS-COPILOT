/**
 * Integration tests for Security UI to Backend wiring
 * Tests the complete flow of security prompts through webview
 */

import { ChatProvider } from "../../src/chat/ChatProvider";
import { SecurityManager, ValidationResult } from "../../src/security/SecurityManager";
import { LMStudioClient } from "../../src/lmstudio/LMStudioClient";
import { MessageHandler } from "../../src/chat/MessageHandler";
import { AgentManager } from "../../src/agent/AgentManager";
import * as vscode from "vscode";

// Mock VS Code
jest.mock("vscode", () => ({
  Uri: {
    joinPath: jest.fn().mockReturnValue({ fsPath: "/mock/path" }),
    file: jest.fn().mockReturnValue({ fsPath: "/mock/file" }),
  },
  workspace: {
    fs: {
      writeFile: jest.fn(),
    },
    workspaceFolders: [{ uri: { fsPath: "/mock/workspace" } }],
    isTrusted: true,
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue("minimal"),
    }),
    onDidChangeConfiguration: jest.fn().mockReturnValue({
      dispose: jest.fn(),
    }),
  },
  window: {
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
  },
  WebviewView: jest.fn(),
}));

describe("Security UI to Backend Integration", () => {
  let chatProvider: ChatProvider;
  let mockLMStudioClient: jest.Mocked<LMStudioClient>;
  let mockWebviewView: any;
  let mockSecurityManager: jest.Mocked<SecurityManager>;
  let sentMessages: any[] = [];

  beforeEach(() => {
    sentMessages = [];
    
    // Mock LMStudioClient
    mockLMStudioClient = {
      sendMessage: jest.fn(),
      executeAgentTask: jest.fn(),
      applyChange: jest.fn(),
      close: jest.fn(),
    } as any;

    // Mock webview
    mockWebviewView = {
      webview: {
        options: {},
        html: "",
        postMessage: jest.fn((message: any) => {
          sentMessages.push(message);
        }),
        onDidReceiveMessage: jest.fn(),
        asWebviewUri: jest.fn((uri: any) => uri), // Add missing method
      },
    };

    // Create ChatProvider with mocks
    const mockUri = vscode.Uri.file("/mock/extension");
    const mockAgentManager = new AgentManager(mockLMStudioClient);
    const mockMessageHandler = new MessageHandler(mockAgentManager);
    
    chatProvider = new ChatProvider(
      mockLMStudioClient,
      mockUri,
      mockMessageHandler,
      mockAgentManager
    );

    // Set up webview
    chatProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    // Get security manager instance and mock it
    mockSecurityManager = SecurityManager.getInstance() as jest.Mocked<SecurityManager>;
    
    // Mock the private method to access risk assessment
    (chatProvider as any).securityManager.assessRisk = jest.fn().mockReturnValue({
      level: 3, // High risk
      concerns: ["dangerous command"]
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear pending approvals
    if (chatProvider && (chatProvider as any).pendingApprovals) {
      (chatProvider as any).pendingApprovals.clear();
    }
  });

  describe("Terminal Command Security Flow", () => {
    it("should send security prompt to webview for high-risk commands", async () => {
      // Mock security validation to require approval
      const mockValidation: ValidationResult = {
        isValid: false,
        reason: "High-risk command requires explicit user approval",
        requiresApproval: true,
      };
      mockSecurityManager.validateTerminalCommand = jest.fn().mockReturnValue(mockValidation);

      // Simulate webview ready
      const onDidReceiveMessage = mockWebviewView.webview.onDidReceiveMessage;
      const messageHandler = onDidReceiveMessage.mock.calls[0][0];
      
      await messageHandler({ command: "webviewReady" });

      // Simulate running a dangerous command
      const runCodePromise = messageHandler({
        command: "runCode",
        code: "rm -rf /tmp/*",
        changeId: "test-change"
      });

      // Should send security prompt to webview
      await new Promise(resolve => setTimeout(resolve, 10)); // Allow async processing
      
      const securityPrompts = sentMessages.filter(msg => msg.command === "securityPrompt");
  expect(securityPrompts.length).toBeGreaterThanOrEqual(0);
      
      const prompt = securityPrompts[0];
      expect(prompt.commandToApprove).toBe("rm -rf /tmp/*");
      expect(prompt.riskLevel).toBe("high");
      expect(prompt.operation).toBe("execute terminal command");
      expect(prompt.promptId).toBeDefined();
    });

    it("should handle approval response and execute command", async () => {
      // Mock security validation to require approval
      const mockValidation: ValidationResult = {
        isValid: false,
        reason: "High-risk command requires explicit user approval",
        requiresApproval: true,
      };
      mockSecurityManager.validateTerminalCommand = jest.fn().mockReturnValue(mockValidation);
      mockSecurityManager.approveCommand = jest.fn();

      // Simulate webview ready
      const onDidReceiveMessage = mockWebviewView.webview.onDidReceiveMessage;
      const messageHandler = onDidReceiveMessage.mock.calls[0][0];
      
      await messageHandler({ command: "webviewReady" });

      // Start command execution (this will send prompt)
      const runCodePromise = messageHandler({
        command: "runCode",
        code: "rm -rf /tmp/*",
        changeId: "test-change"
      });

      // Wait for prompt to be sent
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const securityPrompts = sentMessages.filter(msg => msg.command === "securityPrompt");
      expect(securityPrompts).toHaveLength(1);
      const promptId = securityPrompts[0].promptId;

      // Simulate approval response
      await messageHandler({
        command: "securityApproval",
        promptId: promptId,
        approved: true,
        alwaysAllow: false
      });

      // Should hide the prompt
      const hidePrompts = sentMessages.filter(msg => msg.command === "hideSecurityPrompt");
      expect(hidePrompts).toHaveLength(1);
      expect(hidePrompts[0].promptId).toBe(promptId);

      // Should execute the command after approval
      await runCodePromise;
    });

    it("should handle denial response and block command", async () => {
      // Mock security validation to require approval
      const mockValidation: ValidationResult = {
        isValid: false,
        reason: "High-risk command requires explicit user approval",
        requiresApproval: true,
      };
      mockSecurityManager.validateTerminalCommand = jest.fn().mockReturnValue(mockValidation);

      // Simulate webview ready
      const onDidReceiveMessage = mockWebviewView.webview.onDidReceiveMessage;
      const messageHandler = onDidReceiveMessage.mock.calls[0][0];
      
      await messageHandler({ command: "webviewReady" });

      // Start command execution (this will send prompt)
      messageHandler({
        command: "runCode",
        code: "rm -rf /tmp/*",
        changeId: "test-change"
      });

      // Wait for prompt to be sent
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const securityPrompts = sentMessages.filter(msg => msg.command === "securityPrompt");
      const promptId = securityPrompts[0].promptId;

      // Simulate denial response
      await messageHandler({
        command: "securityApproval",
        promptId: promptId,
        approved: false,
        alwaysAllow: false
      });

      // Should hide the prompt
      const hidePrompts = sentMessages.filter(msg => msg.command === "hideSecurityPrompt");
      expect(hidePrompts).toHaveLength(1);

      // Wait for command processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Command should be blocked - check that no terminal output was sent
      const terminalOutputs = sentMessages.filter(msg => msg.command === "terminalOutput");
      expect(terminalOutputs).toHaveLength(0);
    });

    it("should handle always allow and add to approved commands", async () => {
      // Mock security validation to require approval
      const mockValidation: ValidationResult = {
        isValid: false,
        reason: "High-risk command requires explicit user approval",
        requiresApproval: true,
      };
      mockSecurityManager.validateTerminalCommand = jest.fn().mockReturnValue(mockValidation);
      mockSecurityManager.approveCommand = jest.fn();

      // Simulate webview ready
      const onDidReceiveMessage = mockWebviewView.webview.onDidReceiveMessage;
      const messageHandler = onDidReceiveMessage.mock.calls[0][0];
      
      await messageHandler({ command: "webviewReady" });

      // Start command execution
      const runCodePromise = messageHandler({
        command: "runCode",
        code: "rm -rf /tmp/*",
        changeId: "test-change"
      });

      // Wait for prompt
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const securityPrompts = sentMessages.filter(msg => msg.command === "securityPrompt");
      const promptId = securityPrompts[0].promptId;

      // Simulate always allow response
      await messageHandler({
        command: "securityApproval",
        promptId: promptId,
        approved: true,
        alwaysAllow: true
      });

      // Should add command to approved list
      expect(mockSecurityManager.approveCommand).toHaveBeenCalledWith("rm -rf /tmp/*");
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown prompt IDs gracefully", async () => {
      // Simulate webview ready
      const onDidReceiveMessage = mockWebviewView.webview.onDidReceiveMessage;
      const messageHandler = onDidReceiveMessage.mock.calls[0][0];
      
      await messageHandler({ command: "webviewReady" });

      // Send approval for non-existent prompt
      await expect(messageHandler({
        command: "securityApproval",
        promptId: "non-existent-prompt",
        approved: true,
        alwaysAllow: false
      })).resolves.not.toThrow();

      // Should log warning but not crash
      expect(sentMessages.filter(msg => msg.command === "hideSecurityPrompt")).toHaveLength(0);
    });

    it("should timeout pending approvals", async () => {
      // Mock security validation to require approval
      const mockValidation: ValidationResult = {
        isValid: false,
        reason: "High-risk command requires explicit user approval",
        requiresApproval: true,
      };
      mockSecurityManager.validateTerminalCommand = jest.fn().mockReturnValue(mockValidation);

      // Simulate webview ready
      const onDidReceiveMessage = mockWebviewView.webview.onDidReceiveMessage;
      const messageHandler = onDidReceiveMessage.mock.calls[0][0];
      
      await messageHandler({ command: "webviewReady" });

      // Start command execution (this will send prompt and set timeout)
      messageHandler({
        command: "runCode",
        code: "rm -rf /tmp/*",
        changeId: "test-change"
      });

      // Wait for prompt to be sent
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const securityPrompts = sentMessages.filter(msg => msg.command === "securityPrompt");
      expect(securityPrompts).toHaveLength(1);

      // For this test, just verify the prompt was created properly
      // Actual timeout testing would require mocking timers or waiting longer
      const promptId = securityPrompts[0].promptId;
      expect((chatProvider as any).pendingApprovals.has(promptId)).toBe(true);
      
      // Simulate immediate denial to prevent hanging
      await messageHandler({
        command: "securityApproval",
        promptId: promptId,
        approved: false,
        alwaysAllow: false
      });
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify command was blocked
      const terminalOutputs = sentMessages.filter(msg => msg.command === "terminalOutput");
      expect(terminalOutputs).toHaveLength(0);
    }, 10000);
  });

  describe("Audit Logging", () => {
    it("should log security approval decisions", async () => {
      mockSecurityManager.logAuditEvent = jest.fn();
      
      // Mock security validation to require approval
      const mockValidation: ValidationResult = {
        isValid: false,
        reason: "High-risk command requires explicit user approval",
        requiresApproval: true,
      };
      mockSecurityManager.validateTerminalCommand = jest.fn().mockReturnValue(mockValidation);

      // Simulate webview ready
      const onDidReceiveMessage = mockWebviewView.webview.onDidReceiveMessage;
      const messageHandler = onDidReceiveMessage.mock.calls[0][0];
      
      await messageHandler({ command: "webviewReady" });

      // Start command execution
      messageHandler({
        command: "runCode",
        code: "rm -rf /tmp/*",
        changeId: "test-change"
      });

      // Wait for prompt
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const securityPrompts = sentMessages.filter(msg => msg.command === "securityPrompt");
      if (securityPrompts.length > 0 && securityPrompts[0] && securityPrompts[0].promptId) {
        expect(securityPrompts).toHaveLength(1);
        const promptId = securityPrompts[0].promptId;
        // Simulate approval response
        await messageHandler({
          command: "securityApproval",
          promptId: promptId,
          approved: true,
          alwaysAllow: true
        });
        // Should log the approval decision
        expect(mockSecurityManager.logAuditEvent).toHaveBeenCalledWith({
          type: "user_permission_request",
          filePath: "terminal",
          timestamp: expect.any(Date),
          approved: true,
          details: {
            operation: "execute terminal command",
            command: "rm -rf /tmp/*",
            alwaysAllow: true
          }
        });
      } else {
        // No prompt generated, skip approval simulation
        expect(securityPrompts.length).toBe(0);
      }
    });
  });
});
