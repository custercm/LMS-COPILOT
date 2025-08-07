"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMStudioClient = void 0;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
class RiskAssessmentManager {
    static assessRisk(input) {
        const highRiskKeywords = ['delete', 'rm -rf', 'format', 'shutdown', 'sudo', 'chmod'];
        const mediumRiskKeywords = ['install', 'update', 'upgrade', 'mkdir', 'git'];
        if (highRiskKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
            return { level: 'high', color: '#ff0000' };
        }
        else if (mediumRiskKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
            return { level: 'medium', color: '#ffa500' };
        }
        return { level: 'low', color: '#00ff00' };
    }
}
class SecurityManager {
    isCommandApproved(command) {
        const riskyCommands = ['rm -rf /', 'shutdown now'];
        return !riskyCommands.includes(command);
    }
}
class LMStudioClient {
    constructor(config = {}) {
        this.connectionState = 'disconnected';
        this.lastError = null;
        this.retryCount = 0;
        this.isRetryableError = (error) => {
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
    async withRetry(operation, options = {}) {
        const retryOptions = {
            maxRetries: options.maxRetries || this.config.maxRetries || 3,
            baseDelay: options.baseDelay || this.config.retryDelay || 1000,
            maxDelay: options.maxDelay || 30000,
            shouldRetry: options.shouldRetry || this.isRetryableError
        };
        let lastError;
        for (let attempt = 1; attempt <= retryOptions.maxRetries + 1; attempt++) {
            try {
                const result = await operation();
                this.connectionState = 'connected';
                this.retryCount = 0;
                this.lastError = null;
                return result;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                this.lastError = lastError;
                if (attempt > retryOptions.maxRetries || !retryOptions.shouldRetry(lastError)) {
                    this.connectionState = 'disconnected';
                    throw lastError;
                }
                this.connectionState = 'reconnecting';
                this.retryCount = attempt;
                const delay = Math.min(retryOptions.baseDelay * Math.pow(2, attempt - 1), retryOptions.maxDelay);
                console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
                await this.sleep(delay);
            }
        }
        this.connectionState = 'disconnected';
        throw lastError;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async sendMessage(message) {
        return this.withRetry(async () => {
            const response = await axios_1.default.post(`${this.config.endpoint}/v1/chat/completions`, {
                model: this.config.model,
                messages: [{ role: 'user', content: message }],
                max_tokens: this.config.maxTokens,
                temperature: 0.7
            }, {
                timeout: this.config.timeout,
                headers: this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}
            });
            return response.data.choices[0]?.message?.content || 'No response received';
        });
    }
    async streamMessage(message, onChunk, signal) {
        return this.withRetry(async () => {
            const response = await fetch(`${this.config.endpoint}/v1/chat/completions`, {
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
            });
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
                    if (done)
                        break;
                    if (signal?.aborted)
                        break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.trim() === '')
                            continue;
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]')
                                break;
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    onChunk(content);
                                }
                            }
                            catch (e) {
                                // Ignore parsing errors for streaming data
                            }
                        }
                    }
                }
            }
            finally {
                reader.releaseLock();
            }
        });
    }
    async listModels() {
        return this.withRetry(async () => {
            const response = await axios_1.default.get(`${this.config.endpoint}/v1/models`, {
                timeout: this.config.timeout,
                headers: this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}
            });
            return response.data.data.map((model) => model.id);
        });
    }
    // Health check method
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.withRetry(async () => {
                const response = await axios_1.default.get(`${this.config.endpoint}/v1/models`, {
                    timeout: 5000 // Shorter timeout for health checks
                });
                if (response.status !== 200) {
                    throw new Error(`Health check failed with status ${response.status}`);
                }
                return response;
            }, { maxRetries: 1 }); // Only one retry for health checks
            const latency = Date.now() - startTime;
            return { status: 'healthy', latency };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                status: 'unhealthy',
                latency,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    // Get connection status
    getConnectionStatus() {
        return {
            state: this.connectionState,
            lastError: this.lastError?.message || null,
            retryCount: this.retryCount
        };
    }
    // New method to analyze workspace structure
    async analyzeWorkspace(structure) {
        const riskAssessment = RiskAssessmentManager.assessRisk(structure);
        if (riskAssessment.level === 'high') {
            return `High-risk workspace detected (${riskAssessment.color}). Review structure before proceeding.`;
        }
        const message = `Analyze this project structure and list the files:
${structure}`;
        return this.sendMessage(message);
    }
    // Execute multi-step agent tasks
    async executeAgentTask(taskDescription) {
        try {
            const response = await axios_1.default.post(`${this.config.endpoint}/v1/agent/tasks`, {
                description: taskDescription,
                max_tokens: this.config.maxTokens,
                temperature: 0.7
            });
            return response.data;
        }
        catch (error) {
            console.error('Error executing agent task:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Agent task failed: ${errorMessage}`);
        }
    }
    // Apply code changes to files  
    async applyChange(changeId, filePath) {
        try {
            const response = await axios_1.default.post(`${this.config.endpoint}/v1/changes/apply`, {
                id: changeId,
                ...(filePath && { file_path: filePath })
            });
            return response.data;
        }
        catch (error) {
            console.error('Error applying change:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Change application failed: ${errorMessage}`);
        }
    }
    // Preview code changes before applying
    async previewChange(changeId) {
        try {
            const response = await axios_1.default.get(`${this.config.endpoint}/v1/changes/${changeId}/preview`);
            return response.data;
        }
        catch (error) {
            console.error('Error previewing change:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Change preview failed: ${errorMessage}`);
        }
    }
    // Run terminal commands with security validation
    async runTerminalCommand(command, workingDirectory) {
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
            const response = await axios_1.default.post(`${this.config.endpoint}/v1/terminal/run`, {
                command,
                directory: workingDirectory || (typeof vscode !== 'undefined' ? vscode.workspace.rootPath : null)
            });
            return { safe: true, output: response.data.output };
        }
        catch (error) {
            console.error('Error executing terminal command:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Terminal execution failed: ${errorMessage}`);
        }
    }
    async requestSecurityApproval(command) {
        const riskAssessment = RiskAssessmentManager.assessRisk(command);
        // In a real implementation, this would open a VS Code UI dialog
        console.log(`Requesting approval for command: ${command} - Risk Level: ${riskAssessment.level}`);
        // Simulate user interaction (in actual extension, you'd show a modal or quickpick)
        const securityManager = new SecurityManager();
        return securityManager.isCommandApproved(command);
    }
    // Test methods for integration testing
    async testSendMessage(message) {
        try {
            const response = await this.sendMessage(message);
            return { success: true, response };
        }
        catch (error) {
            return {
                success: false,
                response: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async testRunTerminalCommand(command) {
        try {
            const result = await this.runTerminalCommand(command);
            return { success: true, result };
        }
        catch (error) {
            return {
                success: false,
                result: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    static isTestEnvironment() {
        // Check for test environment in process or global variables
        if (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VSCODE_TEST_MODE === 'true')) {
            return true;
        }
        // For browser testing, check window object properties  
        if (typeof window !== 'undefined' && window.__TESTING__) {
            return true;
        }
        return false;
    }
    // Add performance benchmark method
    async runPerformanceBenchmark(message) {
        const startTime = Date.now();
        try {
            await this.sendMessage(message);
            const endTime = Date.now();
            return { duration: endTime - startTime };
        }
        catch (error) {
            console.error('Client performance benchmark failed:', error);
            const endTime = Date.now();
            return { duration: endTime - startTime };
        }
    }
}
exports.LMStudioClient = LMStudioClient;
