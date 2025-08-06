import * as vscode from 'vscode';

export class TerminalTools {
  private terminal: vscode.Terminal;
  private activeCommandId: string | null = null;

  constructor() {
    this.terminal = vscode.window.createTerminal('LMS Copilot Terminal');
  }

  // Execute commands in VS Code terminal with approval prompt
  async executeCommand(command: string, changeId?: string): Promise<{ output: string; status: 'success' | 'error' | 'cancelled' }> {
    try {
      // First validate the command for safety
      const validation = this.validateCommand(command);
      if (!validation.safe) {
        // Show approval dialog for dangerous commands
        const result = await vscode.window.showWarningMessage(
          `Dangerous command detected: ${command}\n\nRisk level: ${validation.riskLevel}`,
          { modal: true },
          'Execute',
          'Cancel'
        );
        
        if (result !== 'Execute') {
          return { output: '', status: 'cancelled' };
        }
      }

      // Show typing indicator before execution
      this.activeCommandId = changeId || Date.now().toString();
      
      // Send command to terminal
      this.terminal.show();
      this.terminal.sendText(command);
      
      // Simulate capturing command output (in a real implementation, 
      // you'd need to listen for terminal output events)
      const output = await this.waitForTerminalOutput(command);
      
      return { output, status: 'success' };
    } catch (error) {
      console.error('Command execution failed:', error);
      return { output: '', status: 'error' };
    }
  }

  // Validate command for safety
  validateCommand(command: string): { safe: boolean; riskLevel: 'low' | 'medium' | 'high' } {
    const dangerousPatterns = [
      /rm\s+-rf/,           // Remove entire directory tree
      /chmod\s+777/,        // Make files executable for all
      /sudo\s+/,            // Requires elevated privileges
      /sh\s+.*-c/,          // Execute shell commands from string
      /eval\s*\(/,          // Evaluates code dynamically
    ];

    const highRiskPatterns = [
      /rm\s+-rf\s+\/\s*$/,  // Remove entire root directory
      /format\s+\/dev\/hd[a-z]/,   // Format disk command
      /shutdown\s+(now|-h)/,       // Shutdown command
    ];

    if (highRiskPatterns.some(pattern => pattern.test(command))) {
      return { safe: false, riskLevel: 'high' };
    }

    if (dangerousPatterns.some(pattern => pattern.test(command))) {
      return { safe: false, riskLevel: 'medium' };
    }

    return { safe: true, riskLevel: 'low' };
  }

  // Assess command safety level
  assessRisk(command: string): { level: 'low' | 'medium' | 'high'; color: string } {
    const validation = this.validateCommand(command);
    
    if (validation.riskLevel === 'high') return { level: 'high', color: '#e74c3c' };
    if (validation.riskLevel === 'medium') return { level: 'medium', color: '#f1c40f' };
    return { level: 'low', color: '#2ecc71' };
  }

  // Simple command approval logic
  isCommandApproved(command: string): boolean {
    const riskyCommands = ['rm -rf /', 'shutdown now'];
    return !riskyCommands.includes(command);
  }

  // Create a whitelist/blacklist system for commands (simplified example)
  private readonly whitelist = [
    'git status',
    'npm install',
    'npm run build',
    'ls -la',
    'pwd'
  ];

  private readonly blacklist = [
    'rm -rf /',
    'sudo format',
    'shutdown now',
    'reboot'
  ];

  // Check if command is in whitelist
  isInWhitelist(command: string): boolean {
    return this.whitelist.some(whitelisted => 
      command.trim().toLowerCase() === whitelisted.toLowerCase()
    );
  }

  // Check if command is in blacklist
  isInBlacklist(command: string): boolean {
    return this.blacklist.some(blacklisted => 
      command.trim().toLowerCase() === blacklisted.toLowerCase()
    );
  }

  // Wait for terminal output (mock implementation)
  private waitForTerminalOutput(_command: string): Promise<string> {
    return new Promise((resolve) => {
      // In a real implementation, you'd listen to the terminal's onDidWrite event
      // For now we'll resolve with placeholder text
      setTimeout(() => resolve('Command executed successfully'), 1000);
    });
  }

  // Get command output by ID (would be implemented in a full version)
  getTerminalOutput(commandId: string): Promise<string> {
    return new Promise((resolve) => {
      resolve(`Output for command ${commandId}`);
    });
  }
}