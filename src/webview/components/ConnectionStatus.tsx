import React, { useState, useEffect, useCallback } from 'react';
import '../styles/ConnectionStatus.css';

export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

interface ConnectionStatusProps {
  className?: string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function useConnectionStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastConnected, setLastConnected] = useState<Date | null>(new Date());
  const [retryCount, setRetryCount] = useState(0);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionState('connected');
      setLastConnected(new Date());
      setRetryCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionState('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Connection test function
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionState('connecting');
      
      // Test connection to LM Studio endpoint
      const response = await fetch('http://localhost:1234/v1/models', {
        method: 'GET',
        timeout: 5000
      } as any);
      
      if (response.ok) {
        setConnectionState('connected');
        setLastConnected(new Date());
        setRetryCount(0);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionState('disconnected');
      return false;
    }
  }, []);

  // Retry with exponential backoff
  const retryConnection = useCallback(async () => {
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    if (retryCount >= maxRetries) {
      console.warn('Max retry attempts reached');
      return false;
    }

    setConnectionState('reconnecting');
    setRetryCount(prev => prev + 1);

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = baseDelay * Math.pow(2, retryCount);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return await testConnection();
  }, [retryCount, testConnection]);

  return {
    connectionState,
    isOnline,
    lastConnected,
    retryCount,
    testConnection,
    retryConnection
  };
}

function ConnectionStatus({ className, onRetry, showDetails = false }: ConnectionStatusProps) {
  const {
    connectionState,
    isOnline,
    lastConnected,
    retryCount,
    retryConnection
  } = useConnectionStatus();

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      await retryConnection();
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="spinning">
            <path
              d="M21 12a9 9 0 11-6.219-8.56"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'disconnected':
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting... (${retryCount}/5)`;
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    if (!isOnline) return 'offline';
    
    switch (connectionState) {
      case 'connected':
        return 'connected';
      case 'connecting':
      case 'reconnecting':
        return 'connecting';
      case 'disconnected':
        return 'disconnected';
      default:
        return 'disconnected';
    }
  };

  return (
    <div className={`connection-status ${getStatusClass()} ${className || ''}`}>
      <div className="connection-status__indicator">
        <span className="connection-status__icon">
          {getStatusIcon()}
        </span>
        <span className="connection-status__text">
          {getStatusText()}
        </span>
      </div>

      {showDetails && (
        <div className="connection-status__details">
          {lastConnected && (
            <div className="connection-status__last-connected">
              Last connected: {lastConnected.toLocaleTimeString()}
            </div>
          )}
          
          {(connectionState === 'disconnected' || connectionState === 'reconnecting') && (
            <button 
              className="connection-status__retry"
              onClick={handleRetry}
              disabled={connectionState === 'reconnecting'}
            >
              {connectionState === 'reconnecting' ? 'Retrying...' : 'Retry Connection'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;
