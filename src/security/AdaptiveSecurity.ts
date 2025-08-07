/**
 * Configurable security levels for LMS Copilot
 * Allows users to choose appropriate security for their use case
 */

export enum SecurityLevel {
  DISABLED = 'disabled',      // No security (fastest, personal use)
  MINIMAL = 'minimal',        // Basic protection (recommended for personal)
  STANDARD = 'standard',      // Moderate security (team use)
  STRICT = 'strict'          // Full security (enterprise/public)
}

export interface SecurityConfig {
  level: SecurityLevel;
  enableRateLimiting: boolean;
  enableInputSanitization: boolean;
  enableCommandValidation: boolean;
  enableFilePermissions: boolean;
  enableAuditLogging: boolean;
  enableCSPStrict: boolean;
  allowDangerousCommands: boolean;
}

export class SecurityConfigManager {
  private static instance: SecurityConfigManager;
  private config: SecurityConfig;

  private constructor() {
    // Default to minimal for personal use
    this.config = this.getDefaultConfig(SecurityLevel.MINIMAL);
  }

  public static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager();
    }
    return SecurityConfigManager.instance;
  }

  public setSecurityLevel(level: SecurityLevel): void {
    this.config = this.getDefaultConfig(level);
  }

  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  private getDefaultConfig(level: SecurityLevel): SecurityConfig {
    switch (level) {
      case SecurityLevel.DISABLED:
        return {
          level,
          enableRateLimiting: false,
          enableInputSanitization: false,
          enableCommandValidation: false,
          enableFilePermissions: false,
          enableAuditLogging: false,
          enableCSPStrict: false,
          allowDangerousCommands: true
        };

      case SecurityLevel.MINIMAL:
        return {
          level,
          enableRateLimiting: true,         // Prevent overwhelming LM Studio
          enableInputSanitization: true,    // Prevent crashes
          enableCommandValidation: true,    // Basic safety (prevent rm -rf)
          enableFilePermissions: false,     // Skip complex file checks
          enableAuditLogging: false,        // Skip logging overhead
          enableCSPStrict: false,           // Allow unsafe-inline for convenience
          allowDangerousCommands: false     // Block obviously dangerous commands
        };

      case SecurityLevel.STANDARD:
        return {
          level,
          enableRateLimiting: true,
          enableInputSanitization: true,
          enableCommandValidation: true,
          enableFilePermissions: true,
          enableAuditLogging: true,
          enableCSPStrict: true,
          allowDangerousCommands: false
        };

      case SecurityLevel.STRICT:
        return {
          level,
          enableRateLimiting: true,
          enableInputSanitization: true,
          enableCommandValidation: true,
          enableFilePermissions: true,
          enableAuditLogging: true,
          enableCSPStrict: true,
          allowDangerousCommands: false
        };

      default:
        return this.getDefaultConfig(SecurityLevel.MINIMAL);
    }
  }
}

/**
 * Lightweight security manager that respects user preferences
 */
export class AdaptiveSecurityManager {
  private configManager: SecurityConfigManager;

  constructor() {
    this.configManager = SecurityConfigManager.getInstance();
  }

  public shouldValidateCommand(command: string): boolean {
    const config = this.configManager.getConfig();
    
    if (!config.enableCommandValidation) {
      return false;
    }

    // Only validate obviously dangerous commands even in minimal mode
    const criticalPatterns = [
      /rm\s+-rf\s+\/(?!\w)/,  // rm -rf / (but allow rm -rf /specific/path)
      /format\s+[a-z]:/i,
      /sudo\s+shutdown/i,
      /sudo\s+reboot/i
    ];

    return criticalPatterns.some(pattern => pattern.test(command));
  }

  public shouldRateLimit(operation: string): boolean {
    const config = this.configManager.getConfig();
    return config.enableRateLimiting;
  }

  public shouldSanitizeInput(input: string): boolean {
    const config = this.configManager.getConfig();
    return config.enableInputSanitization;
  }

  public shouldCheckFilePermissions(): boolean {
    const config = this.configManager.getConfig();
    return config.enableFilePermissions;
  }

  public shouldLogAudit(): boolean {
    const config = this.configManager.getConfig();
    return config.enableAuditLogging;
  }

  public getCSPPolicy(webview: any): string {
    const config = this.configManager.getConfig();
    
    if (!config.enableCSPStrict) {
      // Relaxed CSP for personal use - allows more flexibility
      return [
        `default-src 'none'`,
        `script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'`,
        `style-src ${webview.cspSource} 'unsafe-inline'`,
        `img-src ${webview.cspSource} data: https:`,
        `font-src ${webview.cspSource}`,
        `connect-src https: wss: ws: http://localhost:*`, // Allow local connections
      ].join('; ');
    }

    // Strict CSP (original implementation)
    return [
      `default-src 'none'`,
      `script-src ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `img-src ${webview.cspSource} data: https:`,
      `font-src ${webview.cspSource}`,
      `connect-src https: wss: ws:`,
      `media-src 'none'`,
      `object-src 'none'`,
      `frame-src 'none'`,
      `worker-src 'none'`,
      `frame-ancestors 'none'`,
      `form-action 'none'`,
      `base-uri 'none'`
    ].join('; ');
  }

  public validateCommand(command: string): { isValid: boolean; reason?: string } {
    if (!this.shouldValidateCommand(command)) {
      return { isValid: true };
    }

    // Only block the most dangerous commands
    if (command.includes('rm -rf /')) {
      return { isValid: false, reason: 'Prevented deletion of root directory' };
    }

    return { isValid: true };
  }

  public sanitizeInput(input: string): string {
    if (!this.shouldSanitizeInput(input)) {
      return input;
    }

    // Minimal sanitization - just prevent obvious script injection
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .slice(0, 100000); // Reasonable length limit
  }
}
