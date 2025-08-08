import * as vscode from "vscode";
import { SecurityManager } from "./SecurityManager";

/**
 * Manages file operation permissions and enforces security policies
 */
export class PermissionsManager {
  private static instance: PermissionsManager;
  private securityManager: SecurityManager;
  private permissionCache = new Map<string, PermissionEntry>();
  private readonly cacheTimeout = 300000; // 5 minutes

  // Permission levels
  public readonly PERMISSIONS = {
    READ: "READ",
    WRITE: "WRITE",
    EXECUTE: "EXECUTE",
    DELETE: "DELETE",
  } as const;

  private constructor() {
    this.securityManager = SecurityManager.getInstance();
  }

  public static getInstance(): PermissionsManager {
    if (!PermissionsManager.instance) {
      PermissionsManager.instance = new PermissionsManager();
    }
    return PermissionsManager.instance;
  }

  /**
   * Check if operation is allowed on file/directory
   */
  public async checkPermission(
    path: string,
    operation: keyof typeof this.PERMISSIONS,
    options: PermissionOptions = {},
  ): Promise<PermissionResult> {
    try {
      // Check cache first
      const cacheKey = `${path}:${operation}`;
      const cached = this.permissionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }

      // Perform permission check
      const result = await this.performPermissionCheck(
        path,
        operation,
        options,
      );

      // Cache result
      this.permissionCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      // Log the permission check
      this.securityManager.logAuditEvent({
        type: "permission_check",
        filePath: path,
        timestamp: new Date(),
        approved: result.allowed,
        details: { operation, reason: result.reason },
      });

      return result;
    } catch (error) {
      const errorResult: PermissionResult = {
        allowed: false,
        reason: `Permission check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        requiresUserConfirmation: false,
      };

      this.securityManager.logAuditEvent({
        type: "permission_error",
        filePath: path,
        timestamp: new Date(),
        approved: false,
        details: { operation, error: errorResult.reason },
      });

      return errorResult;
    }
  }

  /**
   * Request user permission for sensitive operations
   */
  public async requestUserPermission(
    operation: string,
    path: string,
    details: string,
  ): Promise<boolean> {
    const message = `LMS Copilot wants to ${operation} on "${path}". ${details}`;
    const options = ["Allow", "Deny", "Always Allow for This Session"];

    const choice = await vscode.window.showWarningMessage(message, ...options);

    const approved =
      choice === "Allow" || choice === "Always Allow for This Session";

    // Log the user's decision
    this.securityManager.logAuditEvent({
      type: "user_permission_request",
      filePath: path,
      timestamp: new Date(),
      approved,
      details: { operation, choice, details },
    });

    // If "Always Allow", add to approved commands
    if (choice === "Always Allow for This Session") {
      this.securityManager.approveCommand(`${operation}:${path}`);
    }

    return approved;
  }

  /**
   * Check workspace-level permissions
   */
  public checkWorkspacePermissions(): WorkspacePermissions {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return {
        hasWorkspace: false,
        canRead: false,
        canWrite: false,
        canExecute: false,
        trustedWorkspace: false,
      };
    }

    // Check if workspace is trusted
    const isTrusted = vscode.workspace.isTrusted;

    return {
      hasWorkspace: true,
      canRead: true, // Reading is generally allowed
      canWrite: isTrusted, // Writing requires trusted workspace
      canExecute: isTrusted, // Execution requires trusted workspace
      trustedWorkspace: isTrusted,
    };
  }

  /**
   * Get safe file operations based on current permissions
   */
  public getSafeOperations(path: string): Promise<SafeOperations> {
    return this.evaluateSafeOperations(path);
  }

  /**
   * Private methods
   */
  private async performPermissionCheck(
    path: string,
    operation: keyof typeof this.PERMISSIONS,
    options: PermissionOptions,
  ): Promise<PermissionResult> {
    // Check basic workspace permissions first
    const workspacePerms = this.checkWorkspacePermissions();

    if (!workspacePerms.hasWorkspace) {
      return {
        allowed: false,
        reason: "No workspace is open",
        requiresUserConfirmation: false,
      };
    }

    // Check if path is within workspace
    if (!this.isPathInWorkspace(path)) {
      return {
        allowed: false,
        reason: "Path is outside workspace boundaries",
        requiresUserConfirmation: false,
      };
    }

    // Check operation-specific permissions
    switch (operation) {
      case "READ":
        return this.checkReadPermission(path, workspacePerms, options);

      case "WRITE":
        return this.checkWritePermission(path, workspacePerms, options);

      case "EXECUTE":
        return this.checkExecutePermission(path, workspacePerms, options);

      case "DELETE":
        return this.checkDeletePermission(path, workspacePerms, options);

      default:
        return {
          allowed: false,
          reason: "Unknown operation type",
          requiresUserConfirmation: false,
        };
    }
  }

  private checkReadPermission(
    path: string,
    workspacePerms: WorkspacePermissions,
    options: PermissionOptions,
  ): PermissionResult {
    if (!workspacePerms.canRead) {
      return {
        allowed: false,
        reason: "Workspace does not allow read operations",
        requiresUserConfirmation: false,
      };
    }

    // Check for sensitive files
    if (this.isSensitiveFile(path)) {
      return {
        allowed: false,
        reason: "File contains sensitive information",
        requiresUserConfirmation: true,
        details:
          "This file may contain passwords, tokens, or other sensitive data",
      };
    }

    return {
      allowed: true,
      reason: "Read operation permitted",
      requiresUserConfirmation: false,
    };
  }

  private checkWritePermission(
    path: string,
    workspacePerms: WorkspacePermissions,
    options: PermissionOptions,
  ): PermissionResult {
    if (!workspacePerms.canWrite) {
      return {
        allowed: false,
        reason: "Workspace is not trusted for write operations",
        requiresUserConfirmation: false,
      };
    }

    // Check for critical system files
    if (this.isCriticalFile(path)) {
      return {
        allowed: false,
        reason: "Cannot modify critical system files",
        requiresUserConfirmation: true,
        details:
          "This file is critical to your project or system functionality",
      };
    }

    // Check for backup required
    if (this.requiresBackup(path) && !options.hasBackup) {
      return {
        allowed: false,
        reason: "File modification requires backup",
        requiresUserConfirmation: true,
        details: "This file should be backed up before modification",
      };
    }

    return {
      allowed: true,
      reason: "Write operation permitted",
      requiresUserConfirmation: false,
    };
  }

  private checkExecutePermission(
    path: string,
    workspacePerms: WorkspacePermissions,
    options: PermissionOptions,
  ): PermissionResult {
    if (!workspacePerms.canExecute) {
      return {
        allowed: false,
        reason: "Workspace is not trusted for execution",
        requiresUserConfirmation: false,
      };
    }

    // Check for executable files
    if (this.isExecutableFile(path)) {
      return {
        allowed: false,
        reason: "Direct execution of files is not permitted",
        requiresUserConfirmation: true,
        details: "Use terminal commands instead of direct file execution",
      };
    }

    return {
      allowed: true,
      reason: "Execute operation permitted",
      requiresUserConfirmation: false,
    };
  }

  private checkDeletePermission(
    path: string,
    workspacePerms: WorkspacePermissions,
    options: PermissionOptions,
  ): PermissionResult {
    if (!workspacePerms.canWrite) {
      return {
        allowed: false,
        reason: "Workspace is not trusted for delete operations",
        requiresUserConfirmation: false,
      };
    }

    // Critical files should never be deleted
    if (this.isCriticalFile(path)) {
      return {
        allowed: false,
        reason: "Cannot delete critical files",
        requiresUserConfirmation: false,
      };
    }

    // Always require confirmation for delete operations
    return {
      allowed: true,
      reason: "Delete operation permitted with confirmation",
      requiresUserConfirmation: true,
      details: "This action cannot be undone",
    };
  }

  private async evaluateSafeOperations(path: string): Promise<SafeOperations> {
    const operations = {
      canRead: false,
      canWrite: false,
      canExecute: false,
      canDelete: false,
      restrictions: [] as string[],
    };

    // Check each operation
    const readResult = await this.checkPermission(path, "READ");
    operations.canRead = readResult.allowed;
    if (!readResult.allowed) {
      operations.restrictions.push(`Read: ${readResult.reason}`);
    }

    const writeResult = await this.checkPermission(path, "WRITE");
    operations.canWrite = writeResult.allowed;
    if (!writeResult.allowed) {
      operations.restrictions.push(`Write: ${writeResult.reason}`);
    }

    const executeResult = await this.checkPermission(path, "EXECUTE");
    operations.canExecute = executeResult.allowed;
    if (!executeResult.allowed) {
      operations.restrictions.push(`Execute: ${executeResult.reason}`);
    }

    const deleteResult = await this.checkPermission(path, "DELETE");
    operations.canDelete = deleteResult.allowed;
    if (!deleteResult.allowed) {
      operations.restrictions.push(`Delete: ${deleteResult.reason}`);
    }

    return operations;
  }

  private isPathInWorkspace(path: string): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return false;

    return workspaceFolders.some((folder) =>
      path.startsWith(folder.uri.fsPath),
    );
  }

  private isSensitiveFile(path: string): boolean {
    const sensitivePatterns = [
      /\.env$/i,
      /\.env\./i,
      /password/i,
      /secret/i,
      /token/i,
      /key$/i,
      /\.pem$/i,
      /\.p12$/i,
      /\.pfx$/i,
      /config\/secrets/i,
    ];

    return sensitivePatterns.some((pattern) => pattern.test(path));
  }

  private isCriticalFile(path: string): boolean {
    const criticalPatterns = [
      /package\.json$/i,
      /package-lock\.json$/i,
      /yarn\.lock$/i,
      /tsconfig\.json$/i,
      /\.gitignore$/i,
      /README\.md$/i,
      /LICENSE$/i,
      /Dockerfile$/i,
      /docker-compose/i,
    ];

    return criticalPatterns.some((pattern) => pattern.test(path));
  }

  private isExecutableFile(path: string): boolean {
    const executableExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".sh",
      ".ps1",
      ".app",
    ];
    return executableExtensions.some((ext) => path.toLowerCase().endsWith(ext));
  }

  private requiresBackup(path: string): boolean {
    // Files that should be backed up before modification
    return (
      this.isCriticalFile(path) ||
      path.includes("src/") ||
      path.includes("lib/")
    );
  }
}

// Type definitions
interface PermissionOptions {
  hasBackup?: boolean;
  userConfirmed?: boolean;
  bypassCache?: boolean;
}

interface PermissionResult {
  allowed: boolean;
  reason: string;
  requiresUserConfirmation: boolean;
  details?: string;
}

interface PermissionEntry {
  result: PermissionResult;
  timestamp: number;
}

interface WorkspacePermissions {
  hasWorkspace: boolean;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  trustedWorkspace: boolean;
}

interface SafeOperations {
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  canDelete: boolean;
  restrictions: string[];
}

export type {
  PermissionOptions,
  PermissionResult,
  WorkspacePermissions,
  SafeOperations,
};
