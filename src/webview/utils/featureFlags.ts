/**
 * Feature Flags for LMS Copilot Extension
 * 
 * This module manages feature flags that control the visibility and behavior
 * of various features in the webview. Features can be enabled/disabled
 * for gradual rollout and easy rollback.
 */

import React from 'react';

export interface FeatureFlags {
  /** Enable conversation sidebar for multiple conversation management */
  conversationSidebar: boolean;
  
  /** Enable conversation persistence across sessions */
  conversationPersistence: boolean;
  
  /** Enable AI response parsing for automatic actions */
  aiResponseParsing: boolean;
  
  /** Enable in-chat security prompts */
  inChatSecurityPrompts: boolean;
  
  /** Enable experimental features (development only) */
  experimentalFeatures: boolean;
}

/**
 * Default feature flag values
 * Start with conservative defaults (most features disabled)
 */
const DEFAULT_FLAGS: FeatureFlags = {
  conversationSidebar: true, // Enable by default since Step 7 is complete
  conversationPersistence: true, // Enabled since Step 6 is complete
  aiResponseParsing: true, // Enabled since Steps 2-3 are complete
  inChatSecurityPrompts: true, // Enabled since Steps 4-5 are complete
  experimentalFeatures: false, // Keep disabled by default
};

/**
 * Feature flags manager
 */
class FeatureFlagsManager {
  private flags: FeatureFlags = { ...DEFAULT_FLAGS };
  private listeners: Array<(flags: FeatureFlags) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Get current feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Check if a specific feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature];
  }

  /**
   * Update a feature flag
   */
  setFlag(feature: keyof FeatureFlags, enabled: boolean): void {
    this.flags[feature] = enabled;
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Update multiple feature flags at once
   */
  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Reset all flags to defaults
   */
  resetToDefaults(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Subscribe to feature flag changes
   */
  subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Load feature flags from localStorage (if available)
   */
  private loadFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('lms-copilot-feature-flags');
        if (stored) {
          const parsedFlags = JSON.parse(stored);
          // Merge with defaults to handle new flags
          this.flags = { ...DEFAULT_FLAGS, ...parsedFlags };
        }
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
      this.flags = { ...DEFAULT_FLAGS };
    }
  }

  /**
   * Save feature flags to localStorage (if available)
   */
  private saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lms-copilot-feature-flags', JSON.stringify(this.flags));
      }
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  /**
   * Notify all listeners of flag changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getFlags());
      } catch (error) {
        console.error('Error in feature flag listener:', error);
      }
    });
  }

  /**
   * Get feature flags as environment variables for debugging
   */
  getEnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {};
    Object.entries(this.flags).forEach(([key, value]) => {
      env[`FEATURE_${key.toUpperCase()}`] = value.toString();
    });
    return env;
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsManager();

/**
 * React hook for using feature flags in components
 */
export function useFeatureFlags(): {
  flags: FeatureFlags;
  isEnabled: (feature: keyof FeatureFlags) => boolean;
  setFlag: (feature: keyof FeatureFlags, enabled: boolean) => void;
  updateFlags: (updates: Partial<FeatureFlags>) => void;
} {
  const [flags, setFlags] = React.useState<FeatureFlags>(featureFlags.getFlags());

  React.useEffect(() => {
    const unsubscribe = featureFlags.subscribe(setFlags);
    return unsubscribe;
  }, []);

  return {
    flags,
    isEnabled: (feature: keyof FeatureFlags) => featureFlags.isEnabled(feature),
    setFlag: featureFlags.setFlag.bind(featureFlags),
    updateFlags: featureFlags.updateFlags.bind(featureFlags),
  };
}

/**
 * Higher-order component for conditional feature rendering
 */
export function withFeatureFlag<P extends object>(
  feature: keyof FeatureFlags,
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const { isEnabled } = useFeatureFlags();
    
    if (isEnabled(feature)) {
      return React.createElement(Component, props);
    }
    
    if (fallback) {
      return React.createElement(fallback, props);
    }
    
    return null;
  };
}

/**
 * Development utilities for feature flags
 */
export const featureFlagDevUtils = {
  /**
   * Log current feature flags to console
   */
  logFlags(): void {
    console.table(featureFlags.getFlags());
  },

  /**
   * Enable all features (for testing)
   */
  enableAll(): void {
    const allEnabled: FeatureFlags = {
      conversationSidebar: true,
      conversationPersistence: true,
      aiResponseParsing: true,
      inChatSecurityPrompts: true,
      experimentalFeatures: true,
    };
    featureFlags.updateFlags(allEnabled);
  },

  /**
   * Disable all features except specified ones
   */
  disableAllExcept(enabledFeatures: Array<keyof FeatureFlags>): void {
    const flags: FeatureFlags = {
      conversationSidebar: false,
      conversationPersistence: false,
      aiResponseParsing: false,
      inChatSecurityPrompts: false,
      experimentalFeatures: false,
    };
    
    enabledFeatures.forEach(feature => {
      flags[feature] = true;
    });
    
    featureFlags.updateFlags(flags);
  },

  /**
   * Get current flags as CLI environment string
   */
  getEnvString(): string {
    const env = featureFlags.getEnvironmentVariables();
    return Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
  }
};

// Export for global access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).featureFlagDevUtils = featureFlagDevUtils;
}
