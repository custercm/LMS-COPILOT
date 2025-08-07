/**
 * Security module exports
 * Complete security implementation for LMS Copilot extension
 */

export { SecurityManager } from './SecurityManager';
export { PermissionsManager } from './PermissionsManager';
export { RateLimiter, RateLimitError, rateLimit } from './RateLimiter';

// Type exports
export type { 
  SecurityRiskAssessment, 
  ValidationResult, 
  FileOperation, 
  AuditEntry 
} from './SecurityManager';

export type { 
  PermissionOptions, 
  PermissionResult, 
  WorkspacePermissions, 
  SafeOperations 
} from './PermissionsManager';

export type { 
  RateLimitConfig, 
  RateLimitResult, 
  RateLimitStatus 
} from './RateLimiter';
