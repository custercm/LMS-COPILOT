import axios from 'axios';

export interface LMStudioConfig {
  endpoint: string;        // Default: http://localhost:1234
  model: string;
  apiKey?: string;
  timeout: number;
  maxTokens: number;
}

class RiskAssessmentManager {
  static assessRisk(input: string): { level: 'low' | 'medium' | 'high'; color: string } {
    const highRiskKeywords = ['delete', 'rm -rf', 'format', 'shutdown', 'sudo', 'chmod'];
    const mediumRiskKeywords = ['install', 'update', 'upgrade', 'mkdir', 'git'];

    if (highRiskKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
      return { level: 'high', color: '#ff0000' };
    } else if (mediumRiskKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
      return { level: 'medium', color: '#ffa500' };
    }

    return { level: 'low', color: '#00ff00' };
  }
}

class SecurityManager {
  isCommandApproved(command: string): boolean {
    const riskyCommands = ['rm -rf /', 'shutdown now'];
    return !riskyCommands.includes(command);
  }
}

export class LMStudioClient {
  private config: LMStudioConfig;

  constructor(config: Partial<LMStudioConfig> = {}) {
    this.config = {
      endpoint: config.endpoint || 'http://localhost:1234',
      model: config.model || 'llama3',
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
      maxTokens: config.maxTokens || 2048
    };
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await axios.post(`${this.config.endpoint}/v1/chat/completions`, {
        model: this.config.model,
        messages: [{ role: 'user', content: message }],
        max_tokens: this.config.maxTokens,
        temperature: 0.7
      });
      
      return response.data.choices[0]?.message?.content || 'No response received';
    } catch (error) {
      console.error('Error communicating with LM Studio:', error);
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v1/models`);
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Error listing models from LM Studio:', error);
      return [];
    }
  }
  
  // New method to analyze workspace structure
  async analyzeWorkspace(structure: string): Promise<string> {
    const riskAssessment = RiskAssessmentManager.assessRisk(structure);

    if (riskAssessment.level === 'high') {
      return `High-risk workspace detected (${riskAssessment.color}). Review structure before proceeding.`;
    }

    const message = `Analyze this project structure and list the files:
${structure}`;
    
    return this.sendMessage(message);
  }

  // Execute multi-step agent tasks
  async executeAgentTask(taskDescription: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/v1/agent/tasks`, {
        description: taskDescription,
        max_tokens: this.config.maxTokens,
        temperature: 0.7
      });
      
      return response.data;
    } catch (error) {
      console.error('Error executing agent task:', error);
      throw new Error(`Agent task failed: ${error.message}`);
    }
  }

  // Apply code changes to files  
  async applyChange(changeId: string, filePath?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/v1/changes/apply`, {
        id: changeId,
        ...(filePath && { file_path: filePath })
      });
      
      return response.data;
    } catch (error) {
      console.error('Error applying change:', error);
      throw new Error(`Change application failed: ${error.message}`);
    }
  }

  // Preview code changes before applying
  async previewChange(changeId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v1/changes/${changeId}/preview`);
      
      return response.data;
    } catch (error) {
      console.error('Error previewing change:', error);
      throw new Error(`Change preview failed: ${error.message}`);
    }
  }

  // Run terminal commands with security validation
  async runTerminalCommand(command: string, workingDirectory?: string): Promise<{safe: boolean; output?: string}> {
    const riskAssessment = RiskAssessmentManager.assessRisk(command);

    if (riskAssessment.level === 'high') {
      return { safe: false, output: `High-risk command detected (${riskAssessment.color}). Validation failed.` };
    }

    // Request security approval for the command
    const approved = await this.requestSecurityApproval(command);
    if (!approved) {
      return { safe: false, output: "Command execution denied by security manager." };
    }

    try {
      // Execute actual terminal command
      const response = await axios.post(`${this.config.endpoint}/v1/terminal/run`, {
        command,
        directory: workingDirectory || (typeof vscode !== 'undefined' ? vscode.workspace.rootPath : null)
      });
      
      return { safe: true, output: response.data.output };
    } catch (error) {
      console.error('Error executing terminal command:', error);
      throw new Error(`Terminal execution failed: ${error.message}`);
    }
  }

  private async requestSecurityApproval(command: string): Promise<boolean> {
    const riskAssessment = RiskAssessmentManager.assessRisk(command);

    // In a real implementation, this would open a VS Code UI dialog
    console.log(`Requesting approval for command: ${command} - Risk Level: ${riskAssessment.level}`);

    // Simulate user interaction (in actual extension, you'd show a modal or quickpick)
    const securityManager = new SecurityManager();
    return securityManager.isCommandApproved(command);
  }
  
  // Test methods for integration testing
  public async testSendMessage(message: string): Promise<{success: boolean, response?: string}> {
    try {
      const response = await this.sendMessage(message);
      return { success: true, response };
    } catch (error) {
      return { 
        success: false,
        response: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async testRunTerminalCommand(command: string): Promise<{success: boolean, result?: any}> {
    try {
      const result = await this.runTerminalCommand(command);
      return { success: true, result };
    } catch (error) {
      return { 
        success: false,
        result: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public static isTestEnvironment(): boolean {
    // Check for test environment in process or global variables
    if (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VSCODE_TEST_MODE === 'true')) {
      return true;
    }
    
    // For browser testing, check window object properties  
    if (typeof window !== 'undefined' && (window as any).__TESTING__) {
      return true;
    }
    
    return false; 
  }
  
  // Add performance benchmark method
  public async runPerformanceBenchmark(message: string): Promise<{duration: number}> {
    const startTime = Date.now();
    
    try {
      await this.sendMessage(message);
      const endTime = Date.now();
      
      return { duration: endTime - startTime };
    } catch (error) {
      console.error('Client performance benchmark failed:', error);
      const endTime = Date.now();
      return { duration: endTime - startTime };
    }
  }
}

// ... existing code ...

  // Test methods for integration testing
  public async testSendMessage(message: string): Promise<{success: boolean, response?: string}> {
    try {
      const response = await this.sendMessage(message);
      return { success: true, response };
    } catch (error) {
      return { success: false, response: undefined };
    }
  }

  public async testRunTerminalCommand(command: string): Promise<{success: boolean, result?: any}> {
    try {
      const result = await this.runTerminalCommand(command);
      return { success: true, result };
    } catch (error) {
      return { success: false, result: undefined };
    }
  }

  public static isTestEnvironment(): boolean {
    // Check if we're in a test environment
    return typeof process !== 'undefined' && 
           (process.env.NODE_ENV === 'test' || 
            process.env.VITEST !== undefined);
  }

  // Add performance benchmark method
  public async runPerformanceBenchmark(message: string): Promise<{duration: number}> {
    const startTime = Date.now();
    
    try {
      await this.sendMessage(message);
      
      const endTime = Date.now();
      return { duration: endTime - startTime };
    } catch (error) {
      const endTime = Date.now();
      return { duration: endTime - startTime };
    }
  }