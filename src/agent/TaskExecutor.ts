interface Task {
  execute(): Promise<any>;
}

class SecurityManager {
  async validateCommand(command: string): Promise<boolean> {
    // Basic security validation
    const dangerousCommands = ['rm -rf /', 'format', 'shutdown', 'reboot'];
    return !dangerousCommands.some(dangerous => command.includes(dangerous));
  }

  isCommandApproved(command: string): boolean {
    // Simple approval logic
    const dangerousCommands = ['rm -rf /', 'format', 'shutdown', 'reboot'];
    return !dangerousCommands.some(dangerous => command.includes(dangerous));
  }
}

class RiskAssessmentManager {
  // Define risk levels with corresponding colors
  private static riskLevels = {
    low: '#2ecc71',     // Green
    medium: '#f39c12', // Orange
    high: '#e74c3c'    // Red
  };

  /**
   * Determine the risk level of a command based on its content
   */
  static assessRisk(command: string): { level: 'low' | 'medium' | 'high'; color: string } {
    const riskyCommands = [
      'delete', 'rm', 'format', 'shutdown', 'reboot'
    ];

    const mediumRiskCommands = [
      'move', 'rename', 'copy', 'install'
    ];

    if (riskyCommands.includes(command)) {
      return { level: 'high', color: this.riskLevels.high };
    } else if (mediumRiskCommands.includes(command)) {
      return { level: 'medium', color: this.riskLevels.medium };
    } else {
      return { level: 'low', color: this.riskLevels.low };
    }
  }

  // Color coding safety indicators based on risk levels
  static getColorForSafetyIndicator(riskLevel: 'low' | 'medium' | 'high'): string {
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

export class TaskExecutor {
  private tasks: Array<() => Promise<any>> = [];
  
  addTask(task: () => Promise<any>): void {
    this.tasks.push(task);
  }
  
  async executeAll(): Promise<any[]> {
    const results: any[] = [];
    for (const task of this.tasks) {
      results.push(await task());
    }
    return results;
  }

  clearTasks(): void {
    this.tasks = [];
  }
  
  // New method to add multiple tasks at once
  addMultipleTasks(tasks: Array<() => Promise<any>>): void {
    this.tasks.push(...tasks);
  }
  
  // Method for executing a single task step by step
  async executeTask(task: Task): Promise<any> {
    return await task.execute();
  }
  
  // Method to get current tasks status
  getCurrentTasksStatus(): string[] {
    return this.tasks.map(() => 'pending');
  }

  // New method for terminal integration - execute commands safely
  async executeTerminalCommand(command: string): Promise<string> {
    if (!this.isValidCommand(command)) {
      throw new Error('Invalid command');
    }
    
    if (!this.isCommandApproved(command)) {
      const approved = await this.requestCommandApproval(command);
      if (!approved) {
        throw new Error('Command not approved');
      }
    }
    
    return await this.runSafeCommand(command);
  }

  private isValidCommand(command: string): boolean {
    // Basic validation - commands should not contain dangerous patterns
    const dangerousPatterns = [
      /;.*;/,     // Multiple semicolons
      /\|.*\|/,   // Pipes within pipes
      /&&.*&&/    // Double ampersands
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(command));
  }

  private isCommandApproved(command: string): boolean {
    const securityManager = new SecurityManager();
    return securityManager.isCommandApproved(command);
  }

  private async requestCommandApproval(command: string): Promise<boolean> {
    // In a real implementation, this would show a VS Code dialog
    console.log(`Requesting approval for command: ${command}`);
    
    // For now, simulate approval
    return true;
  }

  private async runSafeCommand(command: string): Promise<string> {
    // This is where the actual command execution would happen
    // In a real implementation this would use Node.js child_process
    
    // Simulate response
    const responses = [
      "Command executed successfully",
      "Output generated as expected", 
      "Process completed without errors"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Method to get risk assessment for a command
  getCommandRiskAssessment(command: string): { level: 'low' | 'medium' | 'high'; color: string } {
    return RiskAssessmentManager.assessRisk(command);
  }
}