import * as vscode from 'vscode';

export interface ConversationItem {
  id: string;
  title: string;
  lastMessage: string;
  lastUpdated: Date;
  messageCount: number;
  isActive: boolean;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export interface ConversationMetadata {
  id: string;
  title: string;
  lastMessage: string;
  lastUpdated: Date;
  messageCount: number;
  isActive: boolean;
}

/**
 * ConversationStorage handles persisting conversations to VS Code's global storage
 * This provides conversation persistence across VS Code sessions
 */
export class ConversationStorage {
  private context: vscode.ExtensionContext;
  private readonly STORAGE_KEY_PREFIX = 'lms-copilot-conversation';
  private readonly METADATA_KEY = 'lms-copilot-conversation-metadata';
  private readonly ACTIVE_CONVERSATION_KEY = 'lms-copilot-active-conversation';
  private readonly FEATURE_FLAGS_KEY = 'lms-copilot-feature-flags';
  private readonly MAX_CONVERSATIONS = 50; // Limit storage usage

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Save a complete conversation to storage
   */
  async saveConversation(conversation: ConversationItem): Promise<void> {
    try {
      // Save conversation data
      const conversationKey = `${this.STORAGE_KEY_PREFIX}-${conversation.id}`;
      await this.context.globalState.update(conversationKey, conversation);

      // Update metadata index
      await this.updateMetadataIndex(conversation);

      // Clean up old conversations if we exceed the limit
      await this.cleanupOldConversations();

    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw new Error(`Failed to save conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a conversation by ID
   */
  async loadConversation(conversationId: string): Promise<ConversationItem | null> {
    try {
      const conversationKey = `${this.STORAGE_KEY_PREFIX}-${conversationId}`;
      const conversation = this.context.globalState.get<ConversationItem>(conversationKey);

      if (conversation && typeof conversation === 'object' && conversation.id) {
        // Ensure dates are properly deserialized
        return {
          ...conversation,
          lastUpdated: new Date(conversation.lastUpdated),
          messages: (conversation.messages || []).map(msg => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' ? Date.parse(msg.timestamp) : msg.timestamp
          }))
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to load conversation ${conversationId}:`, error);
      return null;
    }
  }

  /**
   * Get all conversation metadata (for conversation list)
   */
  async getConversationMetadata(): Promise<ConversationMetadata[]> {
    try {
      const metadata = this.context.globalState.get<ConversationMetadata[]>(this.METADATA_KEY, []);
      
      // Ensure dates are properly deserialized
      return metadata.map(item => ({
        ...item,
        lastUpdated: new Date(item.lastUpdated)
      })).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
    } catch (error) {
      console.error('Failed to load conversation metadata:', error);
      return [];
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Remove conversation data
      const conversationKey = `${this.STORAGE_KEY_PREFIX}-${conversationId}`;
      await this.context.globalState.update(conversationKey, undefined);

      // Update metadata index
      const metadata = await this.getConversationMetadata();
      const filteredMetadata = metadata.filter(item => item.id !== conversationId);
      await this.context.globalState.update(this.METADATA_KEY, filteredMetadata);

      // Clear active conversation if it was deleted
      const activeId = await this.getActiveConversationId();
      if (activeId === conversationId) {
        await this.setActiveConversationId(null);
      }
    } catch (error) {
      console.error(`Failed to delete conversation ${conversationId}:`, error);
      throw new Error(`Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set the active conversation ID
   */
  async setActiveConversationId(conversationId: string | null): Promise<void> {
    try {
      await this.context.globalState.update(this.ACTIVE_CONVERSATION_KEY, conversationId);
      
      // Update isActive flag in metadata
      const metadata = await this.getConversationMetadata();
      const updatedMetadata = metadata.map(item => ({
        ...item,
        isActive: item.id === conversationId
      }));
      await this.context.globalState.update(this.METADATA_KEY, updatedMetadata);
    } catch (error) {
      console.error('Failed to set active conversation:', error);
    }
  }

  /**
   * Get the active conversation ID
   */
  async getActiveConversationId(): Promise<string | null> {
    try {
      return this.context.globalState.get<string | null>(this.ACTIVE_CONVERSATION_KEY, null);
    } catch (error) {
      console.error('Failed to get active conversation ID:', error);
      return null;
    }
  }

  /**
   * Get the active conversation
   */
  async getActiveConversation(): Promise<ConversationItem | null> {
    const activeId = await this.getActiveConversationId();
    if (!activeId) {
      return null;
    }
    return this.loadConversation(activeId);
  }

  /**
   * Create a new conversation with auto-generated title
   */
  async createNewConversation(firstMessage?: string): Promise<ConversationItem> {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const title = this.generateConversationTitle(firstMessage);
    
    const newConversation: ConversationItem = {
      id: conversationId,
      title,
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

    await this.saveConversation(newConversation);
    await this.setActiveConversationId(conversationId);
    
    return newConversation;
  }

  /**
   * Search conversations by content
   */
  async searchConversations(query: string): Promise<ConversationMetadata[]> {
    try {
      const metadata = await this.getConversationMetadata();
      const lowercaseQuery = query.toLowerCase();
      
      return metadata.filter(item => 
        item.title.toLowerCase().includes(lowercaseQuery) ||
        item.lastMessage.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Failed to search conversations:', error);
      return [];
    }
  }

  /**
   * Export all conversations for backup
   */
  async exportConversations(): Promise<string> {
    try {
      const metadata = await this.getConversationMetadata();
      const conversations: ConversationItem[] = [];
      
      for (const meta of metadata) {
        const conversation = await this.loadConversation(meta.id);
        if (conversation) {
          conversations.push(conversation);
        }
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        conversations,
        activeConversationId: await this.getActiveConversationId()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export conversations:', error);
      throw new Error(`Failed to export conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import conversations from backup
   */
  async importConversations(jsonData: string): Promise<number> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.conversations || !Array.isArray(data.conversations)) {
        throw new Error('Invalid backup format: missing conversations array');
      }

      let importedCount = 0;
      for (const conversation of data.conversations) {
        try {
          // Ensure the conversation has required fields
          const validConversation: ConversationItem = {
            id: conversation.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: conversation.title || 'Imported Conversation',
            lastMessage: conversation.lastMessage || '',
            lastUpdated: new Date(conversation.lastUpdated || Date.now()),
            messageCount: conversation.messageCount || 0,
            isActive: false, // Don't activate imported conversations by default
            messages: conversation.messages || []
          };

          await this.saveConversation(validConversation);
          importedCount++;
        } catch (convError) {
          console.warn(`Failed to import conversation ${conversation.id}:`, convError);
        }
      }

      return importedCount;
    } catch (error) {
      console.error('Failed to import conversations:', error);
      throw new Error(`Failed to import conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all conversations (for testing/reset)
   */
  async clearAllConversations(): Promise<void> {
    try {
      const metadata = await this.getConversationMetadata();
      
      // Delete all conversation data
      for (const item of metadata) {
        const conversationKey = `${this.STORAGE_KEY_PREFIX}-${item.id}`;
        await this.context.globalState.update(conversationKey, undefined);
      }

      // Clear metadata and active conversation
      await this.context.globalState.update(this.METADATA_KEY, []);
      await this.context.globalState.update(this.ACTIVE_CONVERSATION_KEY, null);
    } catch (error) {
      console.error('Failed to clear all conversations:', error);
      throw new Error(`Failed to clear conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private: Update metadata index when saving a conversation
   */
  private async updateMetadataIndex(conversation: ConversationItem): Promise<void> {
    const metadata = await this.getConversationMetadata();
    const existingIndex = metadata.findIndex(item => item.id === conversation.id);
    
    const metadataItem: ConversationMetadata = {
      id: conversation.id,
      title: conversation.title,
      lastMessage: conversation.lastMessage,
      lastUpdated: conversation.lastUpdated,
      messageCount: conversation.messageCount,
      isActive: conversation.isActive
    };

    if (existingIndex >= 0) {
      metadata[existingIndex] = metadataItem;
    } else {
      metadata.push(metadataItem);
    }

    await this.context.globalState.update(this.METADATA_KEY, metadata);
  }

  /**
   * Private: Clean up old conversations if we exceed the limit
   */
  private async cleanupOldConversations(): Promise<void> {
    const metadata = await this.getConversationMetadata();
    
    if (metadata.length > this.MAX_CONVERSATIONS) {
      // Sort by last updated (oldest first) and remove excess
      const sortedMetadata = metadata.sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime());
      const toDelete = sortedMetadata.slice(0, metadata.length - this.MAX_CONVERSATIONS);
      
      for (const item of toDelete) {
        try {
          await this.deleteConversation(item.id);
        } catch (error) {
          console.warn(`Failed to cleanup conversation ${item.id}:`, error);
        }
      }
    }
  }

  /**
   * Private: Generate a conversation title from the first message
   */
  private generateConversationTitle(firstMessage?: string): string {
    if (!firstMessage) {
      return `New Conversation - ${new Date().toLocaleDateString()}`;
    }

    // Extract first meaningful words (up to 50 characters)
    const cleaned = firstMessage.trim().replace(/\s+/g, ' ');
    if (cleaned.length <= 50) {
      return cleaned;
    }

    // Find a good break point
    const words = cleaned.split(' ');
    let title = '';
    for (const word of words) {
      if ((title + ' ' + word).length > 50) {
        break;
      }
      title += (title ? ' ' : '') + word;
    }

    return title + '...';
  }

  /**
   * Feature flag management
   */
  async isFeatureEnabled(flagName: string): Promise<boolean> {
    try {
      const flags = this.context.globalState.get<Record<string, boolean>>(this.FEATURE_FLAGS_KEY, {});
      // Default enabled features
      const defaultFlags: Record<string, boolean> = {
        'conversationPersistence': true,
        'autoSave': true,
        'conversationSearch': true,
        'conversationExport': true,
      };
      
      return flags[flagName] ?? defaultFlags[flagName] ?? false;
    } catch (error) {
      console.warn(`Failed to check feature flag ${flagName}:`, error);
      return false;
    }
  }

  async setFeatureEnabled(flagName: string, enabled: boolean): Promise<void> {
    try {
      const flags = this.context.globalState.get<Record<string, boolean>>(this.FEATURE_FLAGS_KEY, {});
      flags[flagName] = enabled;
      await this.context.globalState.update(this.FEATURE_FLAGS_KEY, flags);
    } catch (error) {
      console.error(`Failed to set feature flag ${flagName}:`, error);
      throw new Error(`Failed to set feature flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllFeatureFlags(): Promise<Record<string, boolean>> {
    try {
      const flags = this.context.globalState.get<Record<string, boolean>>(this.FEATURE_FLAGS_KEY, {});
      const defaultFlags: Record<string, boolean> = {
        'conversationPersistence': true,
        'autoSave': true,
        'conversationSearch': true,
        'conversationExport': true,
      };
      
      return { ...defaultFlags, ...flags };
    } catch (error) {
      console.warn('Failed to get feature flags:', error);
      return {
        'conversationPersistence': true,
        'autoSave': true,
        'conversationSearch': true,
        'conversationExport': true,
      };
    }
  }
}
