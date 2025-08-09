import { useState, useCallback, useEffect, useRef } from 'react';
import { ConversationItem, ConversationMetadata, ConversationStorage } from '../../storage/ConversationStorage';

export interface UseConversationManagerOptions {
  /**
   * VS Code extension context for storage operations
   * This will be injected by the webview provider
   */
  storage?: ConversationStorage;
  
  /**
   * Enable/disable conversation persistence
   * When false, operates in memory-only mode
   */
  enablePersistence?: boolean;
  
  /**
   * Auto-save interval in milliseconds
   * Set to 0 to disable auto-save
   */
  autoSaveInterval?: number;

  /**
   * Callback when active conversation changes
   */
  onActiveConversationChange?: (conversation: ConversationItem | null) => void;

  /**
   * Callback when conversation list updates
   */
  onConversationListChange?: (conversations: ConversationMetadata[]) => void;
}

export interface UseConversationManagerReturn {
  // Current state
  conversations: ConversationMetadata[];
  activeConversation: ConversationItem | null;
  isLoading: boolean;
  error: string | null;

  // Conversation management
  createNewConversation: (firstMessage?: string, title?: string) => Promise<ConversationItem>;
  switchToConversation: (conversationId: string) => Promise<ConversationItem | null>;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, newTitle: string) => Promise<void>;

  // Message operations
  addMessage: (message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
  }) => Promise<void>;
  updateLastMessage: (content: string) => Promise<void>;

  // Search and filtering
  searchConversations: (query: string) => Promise<ConversationMetadata[]>;
  filterConversations: (filter: (conv: ConversationMetadata) => boolean) => ConversationMetadata[];

  // Import/Export
  exportConversations: () => Promise<string>;
  importConversations: (jsonData: string) => Promise<number>;

  // Storage management
  clearAllConversations: () => Promise<void>;
  saveCurrentConversation: () => Promise<void>;
  loadConversations: () => Promise<void>;

  // Feature flags
  isPersistenceEnabled: boolean;
  togglePersistence: () => void;
  clearError: () => void;
}

/**
 * Custom hook for managing conversation state and persistence
 * Provides a complete conversation management API with optional persistence
 */
export function useConversationManager(options: UseConversationManagerOptions = {}): UseConversationManagerReturn {
  const {
    storage,
    enablePersistence = true,
    autoSaveInterval = 5000, // 5 seconds
    onActiveConversationChange,
    onConversationListChange
  } = options;

  // State management
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPersistenceEnabled, setIsPersistenceEnabled] = useState(enablePersistence);

  // Refs for auto-save functionality
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef(false);

  // Clear any pending auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Schedule auto-save when active conversation changes
  const scheduleAutoSave = useCallback(() => {
    if (!isPersistenceEnabled || !storage || autoSaveInterval <= 0 || !activeConversation) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Schedule new save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (pendingSaveRef.current) return; // Avoid concurrent saves
      
      try {
        pendingSaveRef.current = true;
        await storage.saveConversation(activeConversation);
      } catch (saveError) {
        console.warn('Auto-save failed:', saveError);
      } finally {
        pendingSaveRef.current = false;
      }
    }, autoSaveInterval);
  }, [isPersistenceEnabled, storage, autoSaveInterval, activeConversation]);

  // Error handling helper
  const handleError = useCallback((error: unknown, operation: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullMessage = `${operation} failed: ${errorMessage}`;
    setError(fullMessage);
    console.error(fullMessage, error);
  }, []);

  // Load conversations from storage
  const loadConversations = useCallback(async () => {
    if (!storage || !isPersistenceEnabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [conversationList, activeConv] = await Promise.all([
        storage.getConversationMetadata(),
        storage.getActiveConversation()
      ]);

      setConversations(conversationList);
      setActiveConversation(activeConv);

      // Notify callbacks
      onConversationListChange?.(conversationList);
      onActiveConversationChange?.(activeConv);
    } catch (error) {
      handleError(error, 'Load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [storage, isPersistenceEnabled, onConversationListChange, onActiveConversationChange, handleError]);

  // Load conversations on mount and when persistence is enabled
  useEffect(() => {
    if (isPersistenceEnabled && storage) {
      loadConversations();
    }
  }, [isPersistenceEnabled, storage, loadConversations]);

  // Create a new conversation
  const createNewConversation = useCallback(async (firstMessage?: string, title?: string): Promise<ConversationItem> => {
    setError(null);

    try {
      let newConversation: ConversationItem;

      if (storage && isPersistenceEnabled) {
        // Create with persistence
        newConversation = await storage.createNewConversation(firstMessage);
        if (title) {
          newConversation.title = title;
          await storage.saveConversation(newConversation);
        }
      } else {
        // Create in-memory only
        const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        newConversation = {
          id: conversationId,
          title: title || (firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') : `New Conversation - ${new Date().toLocaleDateString()}`),
          lastMessage: firstMessage || '',
          lastUpdated: new Date(),
          messageCount: firstMessage ? 1 : 0,
          isActive: true,
          messages: firstMessage ? [{
            id: `msg-${Date.now()}`,
            role: 'user',
            content: firstMessage,
            timestamp: Date.now()
          }] : []
        };
      }

      // Update local state
      setActiveConversation(newConversation);
      
      // Update conversations list
      setConversations(currentConversations => {
        const updatedConversations = [...currentConversations];
        const existingIndex = updatedConversations.findIndex(c => c.id === newConversation.id);
        const metadata: ConversationMetadata = {
          id: newConversation.id,
          title: newConversation.title,
          lastMessage: newConversation.lastMessage,
          lastUpdated: newConversation.lastUpdated,
          messageCount: newConversation.messageCount,
          isActive: true
        };

        // Mark all other conversations as inactive
        updatedConversations.forEach(c => c.isActive = false);

        if (existingIndex >= 0) {
          updatedConversations[existingIndex] = metadata;
        } else {
          updatedConversations.unshift(metadata);
        }

        // Notify callbacks
        onConversationListChange?.(updatedConversations);
        
        return updatedConversations;
      });

      // Notify callbacks
      onActiveConversationChange?.(newConversation);

      return newConversation;
    } catch (error) {
      handleError(error, 'Create conversation');
      throw error;
    }
  }, [storage, isPersistenceEnabled, onActiveConversationChange, onConversationListChange, handleError]);

  // Switch to an existing conversation
  const switchToConversation = useCallback(async (conversationId: string): Promise<ConversationItem | null> => {
    setError(null);
    setIsLoading(true);

    try {
      let conversation: ConversationItem | null = null;

      if (storage && isPersistenceEnabled) {
        conversation = await storage.loadConversation(conversationId);
        if (conversation) {
          await storage.setActiveConversationId(conversationId);
        }
      } else {
        // In memory mode - conversation should be the active one
        if (activeConversation?.id === conversationId) {
          conversation = activeConversation;
        }
      }

      if (conversation) {
        setActiveConversation(conversation);
        
        // Update conversations list to mark this one as active
        setConversations(currentConversations => {
          const updatedConversations = currentConversations.map(c => ({
            ...c,
            isActive: c.id === conversationId
          }));
          
          // Notify callbacks
          onConversationListChange?.(updatedConversations);
          return updatedConversations;
        });
        
        // Notify callbacks
        onActiveConversationChange?.(conversation);
      }

      return conversation;
    } catch (error) {
      handleError(error, 'Switch conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [storage, isPersistenceEnabled, activeConversation, onActiveConversationChange, onConversationListChange, handleError]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string): Promise<void> => {
    setError(null);

    try {
      if (storage && isPersistenceEnabled) {
        await storage.deleteConversation(conversationId);
      }

      // Update local state
      setConversations(currentConversations => {
        const updatedConversations = currentConversations.filter(c => c.id !== conversationId);
        onConversationListChange?.(updatedConversations);
        return updatedConversations;
      });

      // If we deleted the active conversation, clear it
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        onActiveConversationChange?.(null);
      }
    } catch (error) {
      handleError(error, 'Delete conversation');
      throw error;
    }
  }, [storage, isPersistenceEnabled, activeConversation, onActiveConversationChange, onConversationListChange, handleError]);

  // Update conversation title
  const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string): Promise<void> => {
    setError(null);

    try {
      // Update active conversation if it matches
      if (activeConversation?.id === conversationId) {
        const updatedConversation = {
          ...activeConversation,
          title: newTitle
        };
        setActiveConversation(updatedConversation);

        if (storage && isPersistenceEnabled) {
          await storage.saveConversation(updatedConversation);
        }
      }

      // Update conversations list
      setConversations(currentConversations => {
        const updatedConversations = currentConversations.map(c => 
          c.id === conversationId ? { ...c, title: newTitle } : c
        );
        onConversationListChange?.(updatedConversations);
        return updatedConversations;
      });
    } catch (error) {
      handleError(error, 'Update conversation title');
      throw error;
    }
  }, [activeConversation, storage, isPersistenceEnabled, onConversationListChange, handleError]);

  // Add a message to the active conversation
  const addMessage = useCallback(async (message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
  }): Promise<void> => {
    if (!activeConversation) {
      throw new Error('No active conversation to add message to');
    }

    setError(null);

    try {
      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp || Date.now()
      };

      const updatedConversation: ConversationItem = {
        ...activeConversation,
        messages: [...activeConversation.messages, newMessage],
        lastMessage: message.content,
        lastUpdated: new Date(),
        messageCount: activeConversation.messageCount + 1
      };

      setActiveConversation(updatedConversation);

      // Update conversations list
      const updatedConversations = conversations.map(c => 
        c.id === activeConversation.id 
          ? {
              ...c,
              lastMessage: message.content,
              lastUpdated: updatedConversation.lastUpdated,
              messageCount: updatedConversation.messageCount
            }
          : c
      );
      setConversations(updatedConversations);

      // Schedule auto-save
      scheduleAutoSave();

      // Notify callbacks
      onActiveConversationChange?.(updatedConversation);
      onConversationListChange?.(updatedConversations);
    } catch (error) {
      handleError(error, 'Add message');
      throw error;
    }
  }, [activeConversation, conversations, scheduleAutoSave, onActiveConversationChange, onConversationListChange, handleError]);

  // Update the last message in the active conversation
  const updateLastMessage = useCallback(async (content: string): Promise<void> => {
    if (!activeConversation || activeConversation.messages.length === 0) {
      throw new Error('No active conversation or messages to update');
    }

    setError(null);

    try {
      const updatedMessages = [...activeConversation.messages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content
      };

      const updatedConversation: ConversationItem = {
        ...activeConversation,
        messages: updatedMessages,
        lastMessage: content,
        lastUpdated: new Date()
      };

      setActiveConversation(updatedConversation);

      // Update conversations list
      const updatedConversations = conversations.map(c => 
        c.id === activeConversation.id 
          ? {
              ...c,
              lastMessage: content,
              lastUpdated: updatedConversation.lastUpdated
            }
          : c
      );
      setConversations(updatedConversations);

      // Schedule auto-save
      scheduleAutoSave();

      // Notify callbacks
      onActiveConversationChange?.(updatedConversation);
      onConversationListChange?.(updatedConversations);
    } catch (error) {
      handleError(error, 'Update last message');
      throw error;
    }
  }, [activeConversation, conversations, scheduleAutoSave, onActiveConversationChange, onConversationListChange, handleError]);

  // Search conversations
  const searchConversations = useCallback(async (query: string): Promise<ConversationMetadata[]> => {
    setError(null);

    try {
      if (storage && isPersistenceEnabled) {
        return await storage.searchConversations(query);
      } else {
        // Search in-memory conversations
        const lowercaseQuery = query.toLowerCase();
        return conversations.filter(conv => 
          conv.title.toLowerCase().includes(lowercaseQuery) ||
          conv.lastMessage.toLowerCase().includes(lowercaseQuery)
        );
      }
    } catch (error) {
      handleError(error, 'Search conversations');
      return [];
    }
  }, [storage, isPersistenceEnabled, handleError]);

  // Filter conversations
  const filterConversations = useCallback((filter: (conv: ConversationMetadata) => boolean): ConversationMetadata[] => {
    return conversations.filter(filter);
  }, [conversations]);

  // Export conversations
  const exportConversations = useCallback(async (): Promise<string> => {
    setError(null);

    try {
      if (storage && isPersistenceEnabled) {
        return await storage.exportConversations();
      } else {
        // Export in-memory data
        const exportData = {
          exportDate: new Date().toISOString(),
          version: '1.0',
          conversations: activeConversation ? [activeConversation] : [],
          activeConversationId: activeConversation?.id || null
        };
        return JSON.stringify(exportData, null, 2);
      }
    } catch (error) {
      handleError(error, 'Export conversations');
      throw error;
    }
  }, [storage, isPersistenceEnabled, activeConversation, handleError]);

  // Import conversations
  const importConversations = useCallback(async (jsonData: string): Promise<number> => {
    setError(null);

    try {
      if (storage && isPersistenceEnabled) {
        const importedCount = await storage.importConversations(jsonData);
        // Reload conversations after import
        await loadConversations();
        return importedCount;
      } else {
        // Import to in-memory (limited functionality)
        const data = JSON.parse(jsonData);
        if (data.conversations && Array.isArray(data.conversations) && data.conversations.length > 0) {
          // For in-memory mode, we can only set the first conversation as active
          const firstConversation = data.conversations[0];
          setActiveConversation(firstConversation);
          
          const metadata: ConversationMetadata = {
            id: firstConversation.id,
            title: firstConversation.title,
            lastMessage: firstConversation.lastMessage,
            lastUpdated: new Date(firstConversation.lastUpdated),
            messageCount: firstConversation.messageCount,
            isActive: true
          };
          setConversations([metadata]);

          onActiveConversationChange?.(firstConversation);
          onConversationListChange?.([metadata]);

          return 1;
        }
        return 0;
      }
    } catch (error) {
      handleError(error, 'Import conversations');
      throw error;
    }
  }, [storage, isPersistenceEnabled, loadConversations, onActiveConversationChange, onConversationListChange, handleError]);

  // Clear all conversations
  const clearAllConversations = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      if (storage && isPersistenceEnabled) {
        await storage.clearAllConversations();
      }

      // Clear local state
      setConversations([]);
      setActiveConversation(null);

      // Notify callbacks
      onActiveConversationChange?.(null);
      onConversationListChange?.([]);
    } catch (error) {
      handleError(error, 'Clear all conversations');
      throw error;
    }
  }, [storage, isPersistenceEnabled, onActiveConversationChange, onConversationListChange, handleError]);

  // Save current conversation
  const saveCurrentConversation = useCallback(async (): Promise<void> => {
    if (!activeConversation || !storage || !isPersistenceEnabled) {
      return;
    }

    setError(null);

    try {
      await storage.saveConversation(activeConversation);
    } catch (error) {
      handleError(error, 'Save current conversation');
      throw error;
    }
  }, [activeConversation, storage, isPersistenceEnabled, handleError]);

  // Toggle persistence mode
  const togglePersistence = useCallback(() => {
    setIsPersistenceEnabled(prev => !prev);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    conversations,
    activeConversation,
    isLoading,
    error,

    // Conversation management
    createNewConversation,
    switchToConversation,
    deleteConversation,
    updateConversationTitle,

    // Message operations
    addMessage,
    updateLastMessage,

    // Search and filtering
    searchConversations,
    filterConversations,

    // Import/Export
    exportConversations,
    importConversations,

    // Storage management
    clearAllConversations,
    saveCurrentConversation,
    loadConversations,

    // Feature flags
    isPersistenceEnabled,
    togglePersistence,
    clearError
  };
}
