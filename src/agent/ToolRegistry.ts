import * as vscode from 'vscode';

interface Tool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
  securityLevel: 'low' | 'medium' | 'high';
}

// Terminal integration for VS Code extension
class TerminalTools {
  private terminal: vscode.Terminal;

  constructor() {
    this.terminal = vscode.window.createTerminal('LMS Copilot Terminal');
  }

  // Execute commands in VS Code terminal
  async executeCommand(command: string): Promise<string> {
    this.terminal.show();
    this.terminal.sendText(command);

    // Implementation to capture and return command output would involve
    // setting up an event listener for terminal output or using a different approach

    // For now, returning placeholder - real implementation should listen to terminal events
    return `Executed: ${command}`;
  }
}

// SecurityManager class definition
class SecurityManager {
  private approvedCommands: Set<string> = new Set();
  
  approveCommand(command: string): void {
    this.approvedCommands.add(command);
  }
  
  isCommandApproved(command: string): boolean {
    return this.approvedCommands.has(command);
  }

  // Risk assessment logic for safety indicators
  assessRisk(command: string): { level: 'low' | 'medium' | 'high'; color: string } {
    const riskyCommands = [
      'delete', 'rm', 'format', 'shutdown', 'reboot'
    ];

    const mediumRiskCommands = [
      'move', 'rename', 'copy', 'install'
    ];

    if (riskyCommands.includes(command)) {
      return { level: 'high', color: '#e74c3c' }; // Red for high risk
    } else if (mediumRiskCommands.includes(command)) {
      return { level: 'medium', color: '#f1c40f' }; // Yellow for medium risk
    } else {
      return { level: 'low', color: '#2ecc71' }; // Green for low risk
    }
  }

  // Color coding safety indicators based on risk levels
  getColorForSafetyIndicator(riskLevel: 'low' | 'medium' | 'high'): string {
    switch (riskLevel) {
      case 'high':
        return '#e74c3c'; // Red
      case 'medium':
        return '#f1c40f'; // Yellow
      case 'low':
        return '#2ecc71'; // Green
      default:
        return '#95a5a6'; // Gray for unknown risk
    }
  }
}

// Enhanced ToolRegistry with security features
class ToolRegistry {
  private tools = new Map<string, any>();
  private securityManager = new SecurityManager();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  registerTool(name: string, tool: any): void {
    this.tools.set(name, tool);
  }

  getTool(name: string): any {
    return this.tools.get(name);
  }

  // Delegate assessRisk to SecurityManager
  assessRisk(input: string): { level: 'low' | 'medium' | 'high'; color: string } {
    return this.securityManager.assessRisk(input);
  }

  // Method to approve commands (used in TaskExecutor)
  approveCommand(command: string): void {
    this.securityManager.approveCommand(command);
  }

  // Check if command is safe/approved
  validateCommand(command: string): boolean {
    const dangerousPatterns = [
      /rm\s+-rf/,           // Remove entire directory tree
      /chmod\s+777/,        // Make files executable for all
      /sudo\s+/,            // Requires elevated privileges
      /sh\s+.*-c/,          // Execute shell commands from string
      /eval\s*\(/,          // Evaluates code dynamically
    ];

    return !dangerousPatterns.some(pattern => pattern.test(command));
  }

  // Color-coded safety indicators for command display (would be used in UI)
  getSafetyColor(command: string): string {
    const { level } = this.securityManager.assessRisk(command);
    if (level === 'high') return '#e74c3c';   // Red
    if (this.securityManager.isCommandApproved(command)) return '#2ecc71'; // Green
    return '#f1c40f';                  // Yellow
  }
}

// New methods for inline code completion and interaction handling
class CodeCompletionProvider {
  async provideInlineCompletions(message: string): Promise<string[]> {
    // Implementation for providing inline completions
    return [];
  }
}

class CodeBlockHandler {
  handleInteraction(action: 'copy' | 'apply' | 'run' | 'edit' | 'regenerate', content: string): void {
    switch (action) {
      case 'copy':
        this.copyCode(content);
        break;
      case 'apply':
        this.applyCode(content);
        break;
      case 'run':
        this.runCode(content);
        break;
      case 'edit':
        this.editCode(content);
        break;
      case 'regenerate':
        this.regenerateCode(content);
        break;
    }
  }

  private copyCode(content: string): void {
    // Implementation for copying code to clipboard
    vscode.env.clipboard.writeText(content);
  }

  private applyCode(content: string): void {
    // Implementation for applying changes to workspace
    // This would be implemented in PanelManager.ts
  }

  private runCode(content: string): void {
    // Implementation for executing code in a sandboxed environment
    // This would be implemented in PanelManager.ts
  }

  private async editCode(content: string): Promise<void> {
    // Implementation for editing code (would typically open in editor)
    const doc = await vscode.workspace.openTextDocument({ content, language: 'python' });
    vscode.window.showTextDocument(doc);
  }

  private regenerateCode(content: string): void {
    // Implementation for regenerating code based on user input
    // This would be implemented in ChatProvider.ts
  }
}

// Export these classes so they can be used elsewhere
export { ToolRegistry, SecurityManager, CodeCompletionProvider, CodeBlockHandler, TerminalTools };
