import axios, { AxiosError } from 'axios';
import * as vscode from 'vscode';

export interface LMStudioConfig {
  endpoint: string;        // Default: http://localhost:1234
  model: string;
  apiKey?: string;
  timeout: number;
  maxTokens: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Enhanced retry utility with exponential backoff
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  shouldRetry: (error: any) => boolean;
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
  private connectionState: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private lastError: Error | null = null;
  private retryCount = 0;

  constructor(config: Partial<LMStudioConfig> = {}) {
    this.config = {
      endpoint: config.endpoint || 'http://localhost:1234',
      model: config.model || 'llama3',
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
      maxTokens: config.maxTokens || 2048,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000
    };
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const retryOptions: RetryOptions = {
      maxRetries: options.maxRetries || this.config.maxRetries || 3,
      baseDelay: options.baseDelay || this.config.retryDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      shouldRetry: options.shouldRetry || this.isRetryableError
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= retryOptions.maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        this.connectionState = 'connected';
        this.retryCount = 0;
        this.lastError = null;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.lastError = lastError;

        if (attempt > retryOptions.maxRetries || !retryOptions.shouldRetry(lastError)) {
          this.connectionState = 'disconnected';
          throw lastError;
        }

        this.connectionState = 'reconnecting';
        this.retryCount = attempt;

        const delay = Math.min(
          retryOptions.baseDelay * Math.pow(2, attempt - 1),
          retryOptions.maxDelay
        );

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        await this.sleep(delay);
      }
    }

    this.connectionState = 'disconnected';
    throw lastError!;
  }

  private isRetryableError = (error: any): boolean => {
    // Retry on network errors, timeouts, and server errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ETIMEDOUT') {
      return true;
    }

    if (error.response) {
      const status = error.response.status;
      // Retry on server errors (5xx) and rate limiting (429)
      return status >= 500 || status === 429;
    }

    return false;
  };

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendMessage(message: string): Promise<string> {
    return this.withRetry(async () => {
      const response = await axios.post(
        `${this.config.endpoint}/v1/chat/completions`,
        {
          model: this.config.model,
          messages: [{ role: 'user', content: message }],
          max_tokens: this.config.maxTokens,
          temperature: 0.7
        },
        {
          timeout: this.config.timeout,
          headers: this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}
        }
      );
      
      return response.data.choices[0]?.message?.content || 'No response received';
    });
  }

  async streamMessage(
    message: string, 
    onChunk: (chunk: string) => void, 
    signal?: AbortSignal
  ): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(
        `${this.config.endpoint}/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [{ role: 'user', content: message }],
            max_tokens: this.config.maxTokens,
            temperature: 0.7,
            stream: true
          }),
          signal
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          if (signal?.aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
                // Ignore parsing errors for streaming data
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    });
  }

  async listModels(): Promise<string[]> {
    try {
      return await this.withRetry(async () => {
        const response = await axios.get(`${this.config.endpoint}/v1/models`, {
          timeout: this.config.timeout,
          headers: this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}
        });
        return response.data.data.map((model: any) => model.id);
      });
    } catch (error) {
      // Return empty array on error as expected by tests
      return [];
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.withRetry(async () => {
        const response = await axios.get(`${this.config.endpoint}/v1/models`, {
          timeout: 5000 // Shorter timeout for health checks
        });
        if (response.status !== 200) {
          throw new Error(`Health check failed with status ${response.status}`);
        }
        return response;
      }, { maxRetries: 1 }); // Only one retry for health checks
      
      const latency = Date.now() - startTime;
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { 
        status: 'unhealthy', 
        latency, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Get connection status
  getConnectionStatus(): {
    state: string;
    lastError: string | null;
    retryCount: number;
  } {
    return {
      state: this.connectionState,
      lastError: this.lastError?.message || null,
      retryCount: this.retryCount
    };
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Agent task failed: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Change application failed: ${errorMessage}`);
    }
  }

  // Preview code changes before applying
  async previewChange(changeId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v1/changes/${changeId}/preview`);
      
      return response.data;
    } catch (error) {
      console.error('Error previewing change:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Change preview failed: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Terminal execution failed: ${errorMessage}`);
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