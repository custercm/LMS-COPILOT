import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import '../styles/OfflineMode.css';

export interface OfflineContextType {
  isOnline: boolean;
  isOfflineMode: boolean;
  lastOnlineTime: Date | null;
  queuedActions: OfflineAction[];
  addToQueue: (action: OfflineAction) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function useOfflineMode(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOfflineMode must be used within an OfflineProvider');
  }
  return context;
}

interface OfflineProviderProps {
  children: ReactNode;
  onActionQueued?: (action: OfflineAction) => void;
  onQueueProcessed?: (processedCount: number, failedCount: number) => void;
}

export function OfflineProvider({ 
  children, 
  onActionQueued,
  onQueueProcessed 
}: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(new Date());
  const [queuedActions, setQueuedActions] = useState<OfflineAction[]>([]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineMode(false);
      setLastOnlineTime(new Date());
      
      // Auto-process queue when coming back online
      if (queuedActions.length > 0) {
        processQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
    };

    // Enhanced connection checking
    const checkConnection = async () => {
      try {
        // Try to fetch a small resource with cache-busting
        const response = await fetch(`http://localhost:1234/v1/models?_t=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-cache',
          timeout: 5000
        } as any);
        
        if (response.ok && !isOnline) {
          handleOnline();
        }
      } catch (error) {
        if (isOnline) {
          handleOffline();
        }
      }
    };

    // Initial connection check
    checkConnection();

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connection check (every 30 seconds)
    const intervalId = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, queuedActions.length]);

  // Load queued actions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lms-copilot-offline-queue');
      if (stored) {
        const parsed = JSON.parse(stored);
        setQueuedActions(parsed.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        })));
      }
    } catch (error) {
      console.error('Failed to load offline queue from localStorage:', error);
    }
  }, []);

  // Save queued actions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lms-copilot-offline-queue', JSON.stringify(queuedActions));
    } catch (error) {
      console.error('Failed to save offline queue to localStorage:', error);
    }
  }, [queuedActions]);

  const addToQueue = (action: OfflineAction) => {
    setQueuedActions(prev => [...prev, action]);
    onActionQueued?.(action);
  };

  const processQueue = async (): Promise<void> => {
    if (queuedActions.length === 0 || !isOnline) {
      return;
    }

    let processedCount = 0;
    let failedCount = 0;
    const remainingActions: OfflineAction[] = [];

    for (const action of queuedActions) {
      try {
        await executeOfflineAction(action);
        processedCount++;
      } catch (error) {
        console.error(`Failed to process offline action ${action.id}:`, error);
        failedCount++;
        
        // Retry logic: keep action in queue if under retry limit
        if (action.retryCount < 3) {
          remainingActions.push({
            ...action,
            retryCount: action.retryCount + 1
          });
        }
      }
    }

    setQueuedActions(remainingActions);
    onQueueProcessed?.(processedCount, failedCount);
  };

  const clearQueue = () => {
    setQueuedActions([]);
  };

  const contextValue: OfflineContextType = {
    isOnline,
    isOfflineMode,
    lastOnlineTime,
    queuedActions,
    addToQueue,
    processQueue,
    clearQueue
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
}

// Helper function to execute queued actions
async function executeOfflineAction(action: OfflineAction): Promise<void> {
  // This would be implemented based on your action types
  switch (action.type) {
    case 'sendMessage':
      // Re-send the message
      break;
    case 'saveSettings':
      // Save settings
      break;
    default:
      console.warn(`Unknown offline action type: ${action.type}`);
  }
}

// Offline mode banner component
interface OfflineBannerProps {
  onDismiss?: () => void;
  showQueue?: boolean;
}

export function OfflineBanner({ onDismiss, showQueue = true }: OfflineBannerProps) {
  const { isOfflineMode, isOnline, queuedActions, processQueue, clearQueue, lastOnlineTime } = useOfflineMode();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isOfflineMode || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleRetryConnection = async () => {
    try {
      const response = await fetch('http://localhost:1234/v1/models', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        // Connection restored
        window.dispatchEvent(new Event('online'));
      }
    } catch (error) {
      console.error('Manual connection retry failed:', error);
    }
  };

  return (
    <div className="offline-banner">
      <div className="offline-banner__content">
        <div className="offline-banner__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12h18m-9-9v18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        
        <div className="offline-banner__message">
          <strong>You're currently offline</strong>
          <p>
            {lastOnlineTime 
              ? `Last connected: ${lastOnlineTime.toLocaleTimeString()}`
              : 'Check your internet connection'
            }
          </p>
          {showQueue && queuedActions.length > 0 && (
            <p>{queuedActions.length} action(s) queued for when you're back online</p>
          )}
        </div>

        <div className="offline-banner__actions">
          <button 
            className="offline-banner__button offline-banner__button--retry"
            onClick={handleRetryConnection}
          >
            Retry Connection
          </button>
          
          {showQueue && queuedActions.length > 0 && isOnline && (
            <button 
              className="offline-banner__button offline-banner__button--process"
              onClick={processQueue}
            >
              Process Queue ({queuedActions.length})
            </button>
          )}
          
          {showQueue && queuedActions.length > 0 && (
            <button 
              className="offline-banner__button offline-banner__button--clear"
              onClick={clearQueue}
            >
              Clear Queue
            </button>
          )}
        </div>
      </div>

      <button 
        className="offline-banner__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss offline notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    </div>
  );
}

// Hook for offline-aware API calls
export function useOfflineAwareRequest() {
  const { isOnline, addToQueue } = useOfflineMode();

  const makeRequest = async (
    requestFn: () => Promise<any>,
    fallbackAction?: OfflineAction
  ): Promise<any> => {
    if (!isOnline) {
      if (fallbackAction) {
        addToQueue(fallbackAction);
      }
      throw new Error('Cannot perform request while offline');
    }

    try {
      return await requestFn();
    } catch (error) {
      // If request fails and we have a fallback, queue it
      if (fallbackAction && !isOnline) {
        addToQueue(fallbackAction);
      }
      throw error;
    }
  };

  return { makeRequest, isOnline };
}
