import * as vscode from 'vscode';

/**
 * Comprehensive security manager for LMS Copilot extension
 * Handles validation, sanitization, permissions, and audit logging
 */
export class SecurityManager {
  private static instance: SecurityManager;
  private commandApprovals = new Set<string>();
  private rateLimit = new Map<string, { count: number; lastReset: number }>();
  private auditLog: AuditEntry[] = [];
  private readonly maxAuditEntries = 1000;
  
  // Rate limiting configuration
  private readonly rateLimits = {
    apiCalls: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    terminalCommands: { maxRequests: 20, windowMs: 60000 }, // 20 commands per minute
    fileOperations: { maxRequests: 50, windowMs: 60000 } // 50 file ops per minute
  };

  // Security risk levels
  private readonly riskLevels = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
  };

  // Dangerous command patterns
  private readonly dangerousPatterns = [
    /rm\s+-rf/i,
    /format\s+[a-z]:/i,
    /sudo\s+/i,
    /chmod\s+777/i,
    /curl.*\|\s*sh/i,
    /wget.*\|\s*sh/i,
    /eval\(/i,
    /exec\(/i,
    /\$\(.*\)/i, // Command substitution
    /`.*`/i, // Backtick execution
    />.*\/dev\/null/i // Redirection that might hide output
  ];

  // Safe commands whitelist
  private readonly safeCommands = [
    'ls', 'pwd', 'cd', 'cat', 'head', 'tail', 'grep', 'find',
    'git status', 'git log', 'git diff', 'git branch',
    'npm install', 'npm run', 'npm test', 'npm build',
    'node --version', 'python --version', 'python3 --version'
  ];

  private constructor() {}

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Assess security risk of input
   */
  public assessRisk(input: string): SecurityRiskAssessment {
    const sanitizedInput = this.sanitizeInput(input);
    let riskLevel = this.riskLevels.LOW;
    const concerns: string[] = [];

    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(input)) {
        riskLevel = Math.max(riskLevel, this.riskLevels.CRITICAL);
        concerns.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Check for file system operations
    if (/\b(delete|remove|unlink|rmdir)\b/i.test(input)) {
      riskLevel = Math.max(riskLevel, this.riskLevels.HIGH);
      concerns.push('File deletion operation detected');
    }

    // Check for network operations
    if (/\b(curl|wget|fetch|download)\b/i.test(input)) {
      riskLevel = Math.max(riskLevel, this.riskLevels.MEDIUM);
      concerns.push('Network operation detected');
    }

    // Check for system modifications
    if (/\b(install|update|upgrade)\b/i.test(input)) {
      riskLevel = Math.max(riskLevel, this.riskLevels.MEDIUM);
      concerns.push('System modification detected');
    }

    return {
      level: riskLevel,
      concerns,
      sanitizedInput,
      isApproved: this.isCommandApproved(input)
    };
  }

  /**
   * Validate terminal command
   */
  public validateTerminalCommand(command: string): ValidationResult {
    const assessment = this.assessRisk(command);
    
    // Check if command is in safe whitelist
    const baseCommand = command.trim().split(' ')[0];
    if (this.safeCommands.includes(baseCommand)) {
      return { isValid: true, reason: 'Command is whitelisted as safe' };
    }

    // Reject critical risk commands
    if (assessment.level >= this.riskLevels.CRITICAL) {
      return { 
        isValid: false, 
        reason: `Command blocked due to critical security risk: ${assessment.concerns.join(', ')}` 
      };
    }

    // High risk commands require approval
    if (assessment.level >= this.riskLevels.HIGH && !assessment.isApproved) {
      return { 
        isValid: false, 
        reason: 'High-risk command requires explicit user approval',
        requiresApproval: true
      };
    }

    return { isValid: true, reason: 'Command passed security validation' };
  }

  /**
   * Validate file operation
   */
  public validateFileOperation(operation: FileOperation): ValidationResult {
    const { type, path, content } = operation;

    // Check if file path is within workspace
    if (!this.isPathInWorkspace(path)) {
      return { 
        isValid: false, 
        reason: 'File operation outside workspace is not allowed' 
      };
    }

    // Check for dangerous file types
    if (this.isDangerousFileType(path)) {
      return { 
        isValid: false, 
        reason: 'Operation on system/executable files is not allowed' 
      };
    }

    // Additional validation for write operations
    if (['write', 'delete', 'modify'].includes(type)) {
      if (!this.checkWritePermissions(path)) {
        return { 
          isValid: false, 
          reason: 'Insufficient permissions for write operation' 
        };
      }
    }

    // Content validation for write operations
    if (content && type === 'write') {
      const contentAssessment = this.assessRisk(content);
      if (contentAssessment.level >= this.riskLevels.HIGH) {
        return { 
          isValid: false, 
          reason: `File content contains security risks: ${contentAssessment.concerns.join(', ')}` 
        };
      }
    }

    return { isValid: true, reason: 'File operation validated' };
  }

  /**
   * Check rate limits
   */
  public checkRateLimit(operation: string): boolean {
    const limit = this.rateLimits[operation as keyof typeof this.rateLimits];
    if (!limit) return true;

    const now = Date.now();
    const key = operation;
    const current = this.rateLimit.get(key);

    if (!current || (now - current.lastReset) > limit.windowMs) {
      // Reset or initialize
      this.rateLimit.set(key, { count: 1, lastReset: now });
      return true;
    }

    if (current.count >= limit.maxRequests) {
      return false; // Rate limit exceeded
    }

    current.count++;
    return true;
  }

  /**
   * Sanitize user input
   */
  public sanitizeInput(input: string): string {
    return input
      // Remove potentially dangerous HTML/script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      // Remove potentially dangerous attributes
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      // Limit length to prevent DoS
      .slice(0, 10000);
  }

  /**
   * Approve command for execution
   */
  public approveCommand(command: string): void {
    this.commandApprovals.add(command);
    this.logAuditEvent({
      type: 'command_approval',
      command,
      timestamp: new Date(),
      approved: true
    });
  }

  /**
   * Check if command is approved
   */
  public isCommandApproved(command: string): boolean {
    return this.commandApprovals.has(command);
  }

  /**
   * Log audit event
   */
  public logAuditEvent(event: AuditEntry): void {
    this.auditLog.push(event);
    
    // Keep audit log size manageable
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog.shift();
    }
  }

  /**
   * Get audit log
   */
  public getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Enhanced CSP policy generation
   */
  public generateCSP(webview: vscode.Webview): string {
    const cspSource = webview.cspSource;
    
    // More restrictive CSP without unsafe-inline and unsafe-eval
    return [
      `default-src 'none'`,
      `script-src ${cspSource}`, // Remove unsafe-inline and unsafe-eval
      `style-src ${cspSource} 'unsafe-inline'`, // Only allow unsafe-inline for styles
      `img-src ${cspSource} data: https:`,
      `font-src ${cspSource}`,
      `connect-src https: wss: ws:`, // Allow HTTPS and WebSocket connections
      `media-src 'none'`,
      `object-src 'none'`,
      `frame-src 'none'`,
      `worker-src 'none'`,
      `frame-ancestors 'none'`,
      `form-action 'none'`,
      `base-uri 'none'`
    ].join('; ');
  }

  /**
   * Private helper methods
   */
  private isPathInWorkspace(filePath: string): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return false;

    return workspaceFolders.some(folder => 
      filePath.startsWith(folder.uri.fsPath)
    );
  }

  private isDangerousFileType(filePath: string): boolean {
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.scr', '.com'];
    const systemPaths = ['/etc/', '/bin/', '/usr/bin/', '/System/', 'C:\\Windows\\'];
    
    return dangerousExtensions.some(ext => filePath.toLowerCase().endsWith(ext)) ||
           systemPaths.some(path => filePath.toLowerCase().includes(path.toLowerCase()));
  }

  private checkWritePermissions(filePath: string): boolean {
    // In VS Code extension context, we rely on workspace permissions
    // This is a simplified check - in production, you might want more sophisticated logic
    return this.isPathInWorkspace(filePath);
  }
}

// Type definitions
export interface SecurityRiskAssessment {
  level: number;
  concerns: string[];
  sanitizedInput: string;
  isApproved: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  requiresApproval?: boolean;
}

export interface FileOperation {
  type: 'read' | 'write' | 'delete' | 'modify';
  path: string;
  content?: string;
}

export interface AuditEntry {
  type: string;
  command?: string;
  filePath?: string;
  timestamp: Date;
  approved: boolean;
  userId?: string;
  details?: any;
}
