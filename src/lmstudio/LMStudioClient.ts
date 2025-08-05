import axios from 'axios';

interface LMStudioConfig {
  endpoint: string;        // Default: http://localhost:1234
  apiKey?: string;
  timeout: number;
  maxTokens: number;
}

class RiskAssessmentManager {
  static assessRisk(input: string): { level: 'low' | 'medium' | 'high'; color: string } {
    const highRiskKeywords = ['delete', 'rm -rf', 'format', 'shutdown'];
    const mediumRiskKeywords = ['install', 'update', 'upgrade'];

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
      apiKey: config.apiKey,
      timeout: config.timeout || 5000,
      maxTokens: config.maxTokens || 1000
    };
  }

  async sendMessage(message: string): Promise<string> {
    // Assess risk for the message
    const riskAssessment = RiskAssessmentManager.assessRisk(message);
    
    try {
      // HTTP client for /v1/chat/completions endpoint
      const response = await axios.post(`${this.config.endpoint}/v1/chat/completions`, {
        messages: [{ role: "user", content: message }],
        max_tokens: this.config.maxTokens
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        timeout: this.config.timeout
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error(`LM Studio API error: ${error}`);
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

  async executeCommandWithValidation(command: string, validateOnly?: boolean): Promise<{safe: boolean; output?: string}> {
    const riskAssessment = RiskAssessmentManager.assessRisk(command);

    if (riskAssessment.level === 'high') {
      return { safe: false, output: `High-risk command detected (${riskAssessment.color}). Validation failed.` };
    }

    // In a real implementation, this would request security approval
    const approved = await this.requestSecurityApproval(command);
    if (!approved) {
      return { safe: false, output: "Command execution denied by security manager." };
    }

    // If validation passes and command is not for validation only, execute it
    return { safe: true, output: validateOnly ? "Command validated successfully" : "Command executed" };
  }

  private async requestSecurityApproval(command: string): Promise<boolean> {
    const riskAssessment = RiskAssessmentManager.assessRisk(command);

    // In a real implementation, this would open a VS Code UI dialog
    console.log(`Requesting approval for ${command} - Risk Level: ${riskAssessment.level}`);

    // Simulate user interaction (in actual extension, you'd show a modal or quickpick)
    const securityManager = new SecurityManager();
    return securityManager.isCommandApproved(command);
  }
}