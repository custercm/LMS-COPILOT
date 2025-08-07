import { LMStudioClient } from '../lmstudio/LMStudioClient';
import { AgentCapabilities } from './AgentManager';

interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
  error?: Error;
}

interface Task {
  description: string;
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
  private client: LMStudioClient;
  private capabilities: AgentCapabilities;

  constructor(client: LMStudioClient, capabilities: AgentCapabilities) {
    this.client = client;
    this.capabilities = capabilities;
  }

  private tasks: Array<() => Promise<any>> = [];
  
  addTask(task: () => Promise<any>): void {
    this.tasks.push(task);
  }
  
  async executeAll(): Promise<any[]> {
    const results: any[] = [];
    for (const task of this.tasks) {
      try {
        const result = await task();
        results.push(result);
      } catch (error) {
        console.error('Task execution failed:', error);
        // Continue with other tasks even if one fails
        results.push({ success: false, error: (error as Error).message });
      }
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
    try {
      const result = await this.client.executeAgentTask(task.description);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  
  // Method to get current tasks status
  getCurrentTasksStatus(): string[] {
    return this.tasks.map((_, index) => `Task ${index + 1}: pending`);
  }

  /**
   * Execute a multi-step task with proper planning and context management
   */
  async executeTaskWithPlanning(taskDescription: string): Promise<any> {
    try {
      // Plan the task into steps
      const steps = await this.planTask(taskDescription);
      
      // Initialize progress tracking
      const executionContext = {
        taskId: Date.now().toString(),
        steps: steps.map(step => ({ ...step, status: 'pending' as const })),
        currentStepIndex: 0,
        startTime: new Date()
      };

      // Execute each step sequentially
      for (let i = 0; i < steps.length; i++) {
        executionContext.currentStepIndex = i;
        
        try {
          await this.executeStep(steps[i], executionContext);
          
          // Update step status to completed
          steps[i].status = 'completed';
        } catch (error) {
          // Handle step failure
          steps[i].status = 'failed';
          steps[i].error = error as Error;
          
          // Attempt recovery if enabled
          const recovered = await this.attemptRecovery(steps, i, taskDescription);
          if (!recovered) {
            throw new Error(`Task execution failed at step ${i}: ${(error as Error).message}`);
          }
        }
      }

      // Return final result after all steps are completed
      return {
        taskId: executionContext.taskId,
        status: 'completed',
        steps: steps,
        endTime: new Date(),
        duration: Math.floor((new Date().getTime() - executionContext.startTime.getTime()) / 1000)
      };
    } catch (error) {
      throw new Error(`Task execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Plan a task into logical steps
   */
  private async planTask(taskDescription: string): Promise<TaskStep[]> {
    // In a real implementation, this would use AI to break down the task
    // For now we'll create simple step-based planning
    
    const steps: TaskStep[] = [
      {
        id: 'step-1',
        description: `Analyze requirements for "${taskDescription}"`,
        status: 'pending'
      },
      {
        id: 'step-2', 
        description: `Prepare workspace context`,
        status: 'pending'
      },
      {
        id: 'step-3',
        description: `Generate code solution for "${taskDescription}"`,
        status: 'pending'
      },
      {
        id: 'step-4',
        description: `Validate and review generated code`,
        status: 'pending'
      }
    ];

    return steps;
  }

  /**
   * Execute a single task step
   */
  private async executeStep(step: TaskStep, context: any): Promise<void> {
    // Update step status to in-progress
    step.status = 'in-progress';
    
    try {
      let result: any;
      
      switch (step.id) {
        case 'step-1':
          // Simulate requirement analysis
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
          
        case 'step-2':
          // Get workspace structure for context
          const workspaceStructure = await this.client.analyzeWorkspace('');
          result = { 
            type: 'workspace-context', 
            data: workspaceStructure 
          };
          step.result = result;
          break;
          
        case 'step-3':
          // Generate code using LM Studio
          result = await this.client.executeAgentTask(step.description);
          step.result = result;
          break;
          
        case 'step-4':
          // Validate the solution
          if (step.result?.code) {
            // In a real implementation, validate code quality and syntax
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          break;
          
        default:
          throw new Error(`Unknown step ID: ${step.id}`);
      }
      
      // For demonstration purposes - in reality this would be more sophisticated
      if (result) {
        console.log(`Step ${step.id} result:`, result);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Attempt to recover from a failed step
   */
  private async attemptRecovery(steps: TaskStep[], failedIndex: number, taskDescription: string): Promise<boolean> {
    // Simple retry mechanism - in real implementation could be more complex
    
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`Attempting recovery for step ${failedIndex} (retry #${retries + 1})`);
        
        // Reset the failed step
        steps[failedIndex] = {
          id: steps[failedIndex].id,
          description: steps[failedIndex].description,
          status: 'pending',
          result: undefined,
          error: undefined
        };
        
        // Re-execute just this one failed step
        await this.executeStep(steps[failedIndex], { 
          currentStepIndex: failedIndex, 
          taskId: Date.now().toString() 
        });
        
        return true;
      } catch (error) {
        retries++;
        console.error(`Recovery attempt ${retries} failed:`, error);
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    return false; // Exhausted all recovery attempts
  }

  /**
   * Get progress status for a task
   */
  getProgress(taskId: string): { completedSteps: number; totalSteps: number; percentage: number } {
    // This would normally query the actual execution context
    // For now returning placeholder values
    
    return {
      completedSteps: 0,
      totalSteps: 4,
      percentage: 0
    };
  }

  /**
   * Select appropriate tools for task execution based on capabilities
   */
  selectTools(taskDescription: string): string[] {
    const availableTools = Object.keys(this.capabilities.tools || {});
    
    // Simple heuristic - in reality would use AI to determine best tools
    if (taskDescription.toLowerCase().includes('file') || 
        taskDescription.toLowerCase().includes('workspace')) {
      return ['fileOperations', 'workspaceAnalysis'];
    }
    
    if (taskDescription.toLowerCase().includes('terminal') ||
        taskDescription.toLowerCase().includes('command')) {
      return ['terminalTools'];
    }
    
    // Default to general tools
    return availableTools;
  }

  /**
   * Manage context across multiple steps in a task
   */
  manageContext(taskId: string, stepIndex: number, contextData: any): void {
    // In a real implementation this would store and pass context between steps
    console.log(`Managing context for task ${taskId}, step ${stepIndex}:`, contextData);
  }

  /**
   * Get current execution status
   */
  getExecutionStatus(taskId: string): 'running' | 'completed' | 'failed' {
    // In a real implementation this would check actual execution state
    return 'running';
  }
  
  // Method to execute terminal commands safely (from the previous version)
  async executeTerminalCommand(command: string): Promise<string> {
    // Check if command is valid and safe
    const securityManager = new SecurityManager();
    if (!securityManager.isCommandApproved(command)) {
      throw new Error('Invalid command');
    }
    
    return await this.runSafeCommand(command);
  }

  private async runSafeCommand(command: string): Promise<string> {
    // In a real implementation, execute the actual terminal command
    // This is where you'd use Node.js child_process
    
    // Simulate response for now
    const responses = [
      "Command executed successfully",
      "Output generated as expected", 
      "Process completed without errors"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Method to get risk assessment for a command (from previous version)
  getCommandRiskAssessment(command: string): { level: 'low' | 'medium' | 'high'; color: string } {
    return RiskAssessmentManager.assessRisk(command);
  }
}
