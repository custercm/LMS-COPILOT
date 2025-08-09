import { ConversationStorage, ConversationItem, ConversationMetadata } from '../../../src/storage/ConversationStorage';
import * as vscode from 'vscode';

// Mock VS Code extension context
class MockExtensionContext implements Partial<vscode.ExtensionContext> {
  private globalStateData = new Map<string, any>();

  globalState = {
    get: <T>(key: string, defaultValue?: T): T => {
      return this.globalStateData.has(key) ? this.globalStateData.get(key) : defaultValue as T;
    },
    update: async (key: string, value: any): Promise<void> => {
      if (value === undefined) {
        this.globalStateData.delete(key);
      } else {
        this.globalStateData.set(key, value);
      }
    },
    keys: (): readonly string[] => Array.from(this.globalStateData.keys()),
    setKeysForSync: (keys: readonly string[]): void => {},
  } as vscode.Memento & { setKeysForSync(keys: readonly string[]): void; };

  // Clear state for testing
  clearState(): void {
    this.globalStateData.clear();
  }
}

describe('ConversationStorage', () => {
  let storage: ConversationStorage;
  let mockContext: MockExtensionContext;

  beforeEach(() => {
    mockContext = new MockExtensionContext();
    storage = new ConversationStorage(mockContext as any);
  });

  afterEach(() => {
    mockContext.clearState();
  });

  describe('Basic Storage Operations', () => {
    it('should save and load a conversation', async () => {
      const conversation: ConversationItem = {
        id: 'test-conv-1',
        title: 'Test Conversation',
        lastMessage: 'Hello world',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: true,
        messages: [{
          id: 'msg-1',
          role: 'user',
          content: 'Hello world',
          timestamp: Date.now()
        }]
      };

      await storage.saveConversation(conversation);
      const loaded = await storage.loadConversation('test-conv-1');

      expect(loaded).toBeTruthy();
      expect(loaded?.id).toBe('test-conv-1');
      expect(loaded?.title).toBe('Test Conversation');
      expect(loaded?.messages).toHaveLength(1);
      expect(loaded?.messages[0].content).toBe('Hello world');
    });

    it('should return null for non-existent conversation', async () => {
      const loaded = await storage.loadConversation('non-existent');
      expect(loaded).toBeNull();
    });

    it('should delete a conversation', async () => {
      const conversation: ConversationItem = {
        id: 'test-conv-delete',
        title: 'To Delete',
        lastMessage: 'Will be deleted',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: false,
        messages: []
      };

      await storage.saveConversation(conversation);
      
      // Verify it exists
      let loaded = await storage.loadConversation('test-conv-delete');
      expect(loaded).toBeTruthy();

      // Delete it
      await storage.deleteConversation('test-conv-delete');

      // Verify it's gone
      loaded = await storage.loadConversation('test-conv-delete');
      expect(loaded).toBeNull();
    });
  });

  describe('Metadata Management', () => {
    it('should maintain conversation metadata index', async () => {
      const conv1: ConversationItem = {
        id: 'conv-1',
        title: 'First Conversation',
        lastMessage: 'First message',
        lastUpdated: new Date('2025-01-01'),
        messageCount: 1,
        isActive: false,
        messages: []
      };

      const conv2: ConversationItem = {
        id: 'conv-2',
        title: 'Second Conversation',
        lastMessage: 'Second message',
        lastUpdated: new Date('2025-01-02'),
        messageCount: 2,
        isActive: true,
        messages: []
      };

      await storage.saveConversation(conv1);
      await storage.saveConversation(conv2);

      const metadata = await storage.getConversationMetadata();
      expect(metadata).toHaveLength(2);
      
      // Should be sorted by last updated (newest first)
      expect(metadata[0].id).toBe('conv-2');
      expect(metadata[1].id).toBe('conv-1');
      expect(metadata[0].title).toBe('Second Conversation');
      expect(metadata[1].title).toBe('First Conversation');
    });

    it('should update metadata when conversation changes', async () => {
      const conversation: ConversationItem = {
        id: 'conv-update',
        title: 'Original Title',
        lastMessage: 'Original message',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: false,
        messages: []
      };

      await storage.saveConversation(conversation);

      // Update the conversation
      conversation.title = 'Updated Title';
      conversation.lastMessage = 'Updated message';
      conversation.messageCount = 2;
      await storage.saveConversation(conversation);

      const metadata = await storage.getConversationMetadata();
      const item = metadata.find(m => m.id === 'conv-update');
      
      expect(item?.title).toBe('Updated Title');
      expect(item?.lastMessage).toBe('Updated message');
      expect(item?.messageCount).toBe(2);
    });
  });

  describe('Active Conversation Management', () => {
    it('should set and get active conversation ID', async () => {
      await storage.setActiveConversationId('active-conv');
      const activeId = await storage.getActiveConversationId();
      expect(activeId).toBe('active-conv');
    });

    it('should clear active conversation ID', async () => {
      await storage.setActiveConversationId('some-conv');
      await storage.setActiveConversationId(null);
      const activeId = await storage.getActiveConversationId();
      expect(activeId).toBeNull();
    });

    it('should update isActive flag in metadata', async () => {
      const conv1: ConversationItem = {
        id: 'conv-1',
        title: 'First',
        lastMessage: 'Message 1',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: false,
        messages: []
      };

      const conv2: ConversationItem = {
        id: 'conv-2',
        title: 'Second',
        lastMessage: 'Message 2',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: false,
        messages: []
      };

      await storage.saveConversation(conv1);
      await storage.saveConversation(conv2);

      // Set conv-2 as active
      await storage.setActiveConversationId('conv-2');

      const metadata = await storage.getConversationMetadata();
      const meta1 = metadata.find(m => m.id === 'conv-1');
      const meta2 = metadata.find(m => m.id === 'conv-2');

      expect(meta1?.isActive).toBe(false);
      expect(meta2?.isActive).toBe(true);
    });

    it('should get active conversation', async () => {
      const conversation: ConversationItem = {
        id: 'active-conv',
        title: 'Active Conversation',
        lastMessage: 'Active message',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: true,
        messages: []
      };

      await storage.saveConversation(conversation);
      await storage.setActiveConversationId('active-conv');

      const active = await storage.getActiveConversation();
      expect(active?.id).toBe('active-conv');
      expect(active?.title).toBe('Active Conversation');
    });

    it('should return null when no active conversation', async () => {
      const active = await storage.getActiveConversation();
      expect(active).toBeNull();
    });
  });

  describe('Conversation Creation', () => {
    it('should create new conversation with auto-generated title', async () => {
      const firstMessage = 'Hello, I need help with TypeScript';
      const newConv = await storage.createNewConversation(firstMessage);

      expect(newConv.id).toMatch(/^conv-\d+-[a-z0-9]+$/);
      expect(newConv.title).toBe('Hello, I need help with TypeScript');
      expect(newConv.lastMessage).toBe(firstMessage);
      expect(newConv.messageCount).toBe(1);
      expect(newConv.isActive).toBe(true);
      expect(newConv.messages).toHaveLength(1);
      expect(newConv.messages[0].content).toBe(firstMessage);
      expect(newConv.messages[0].role).toBe('user');

      // Should be set as active
      const activeId = await storage.getActiveConversationId();
      expect(activeId).toBe(newConv.id);
    });

    it('should truncate long titles', async () => {
      const longMessage = 'This is a very long message that should be truncated because it exceeds the maximum length for conversation titles';
      const newConv = await storage.createNewConversation(longMessage);

      expect(newConv.title.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(newConv.title).toContain('...');
    });

    it('should create conversation with default title when no message', async () => {
      const newConv = await storage.createNewConversation();

      expect(newConv.title).toMatch(/^New Conversation - \d+\/\d+\/\d+$/);
      expect(newConv.lastMessage).toBe('');
      expect(newConv.messageCount).toBe(0);
      expect(newConv.messages).toHaveLength(0);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      const conversations: ConversationItem[] = [
        {
          id: 'conv-1',
          title: 'TypeScript Help',
          lastMessage: 'How to use interfaces',
          lastUpdated: new Date(),
          messageCount: 2,
          isActive: false,
          messages: []
        },
        {
          id: 'conv-2',
          title: 'React Components',
          lastMessage: 'useState hook examples',
          lastUpdated: new Date(),
          messageCount: 3,
          isActive: false,
          messages: []
        },
        {
          id: 'conv-3',
          title: 'Database Design',
          lastMessage: 'SQL joins explained',
          lastUpdated: new Date(),
          messageCount: 1,
          isActive: false,
          messages: []
        }
      ];

      for (const conv of conversations) {
        await storage.saveConversation(conv);
      }
    });

    it('should search conversations by title', async () => {
      const results = await storage.searchConversations('TypeScript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('TypeScript Help');
    });

    it('should search conversations by last message', async () => {
      const results = await storage.searchConversations('hook');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('React Components');
    });

    it('should be case insensitive', async () => {
      const results = await storage.searchConversations('database');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Database Design');
    });

    it('should return empty array for no matches', async () => {
      const results = await storage.searchConversations('Python');
      expect(results).toHaveLength(0);
    });
  });

  describe('Export and Import', () => {
    beforeEach(async () => {
      const conv1: ConversationItem = {
        id: 'export-conv-1',
        title: 'Export Test 1',
        lastMessage: 'Test message 1',
        lastUpdated: new Date('2025-01-01'),
        messageCount: 1,
        isActive: false,
        messages: [{
          id: 'msg-1',
          role: 'user',
          content: 'Test message 1',
          timestamp: Date.now()
        }]
      };

      const conv2: ConversationItem = {
        id: 'export-conv-2',
        title: 'Export Test 2',
        lastMessage: 'Test message 2',
        lastUpdated: new Date('2025-01-02'),
        messageCount: 1,
        isActive: true,
        messages: [{
          id: 'msg-2',
          role: 'user',
          content: 'Test message 2',
          timestamp: Date.now()
        }]
      };

      await storage.saveConversation(conv1);
      await storage.saveConversation(conv2);
      await storage.setActiveConversationId('export-conv-2');
    });

    it('should export conversations as JSON', async () => {
      const exportData = await storage.exportConversations();
      const parsed = JSON.parse(exportData);

      expect(parsed.version).toBe('1.0');
      expect(parsed.conversations).toHaveLength(2);
      expect(parsed.activeConversationId).toBe('export-conv-2');
      expect(parsed.exportDate).toBeTruthy();

      const conv1 = parsed.conversations.find((c: any) => c.id === 'export-conv-1');
      const conv2 = parsed.conversations.find((c: any) => c.id === 'export-conv-2');

      expect(conv1.title).toBe('Export Test 1');
      expect(conv2.title).toBe('Export Test 2');
    });

    it('should import conversations from JSON', async () => {
      // Clear existing data
      await storage.clearAllConversations();

      const importData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        conversations: [
          {
            id: 'import-conv-1',
            title: 'Imported Conversation',
            lastMessage: 'Imported message',
            lastUpdated: new Date().toISOString(),
            messageCount: 1,
            isActive: false,
            messages: [{
              id: 'import-msg-1',
              role: 'user',
              content: 'Imported message',
              timestamp: Date.now()
            }]
          }
        ],
        activeConversationId: null
      };

      const importedCount = await storage.importConversations(JSON.stringify(importData));
      expect(importedCount).toBe(1);

      const metadata = await storage.getConversationMetadata();
      expect(metadata).toHaveLength(1);
      expect(metadata[0].title).toBe('Imported Conversation');

      const loaded = await storage.loadConversation('import-conv-1');
      expect(loaded?.title).toBe('Imported Conversation');
      expect(loaded?.messages).toHaveLength(1);
    });

    it('should handle invalid import data gracefully', async () => {
      await expect(storage.importConversations('invalid json')).rejects.toThrow();
      await expect(storage.importConversations('{}')).rejects.toThrow('Invalid backup format');
    });
  });

  describe('Storage Limits and Cleanup', () => {
    it('should enforce conversation limit', async () => {
      // Create more conversations than the limit (50)
      const conversations: ConversationItem[] = [];
      for (let i = 0; i < 55; i++) {
        conversations.push({
          id: `conv-${i}`,
          title: `Conversation ${i}`,
          lastMessage: `Message ${i}`,
          lastUpdated: new Date(Date.now() - (55 - i) * 1000), // Older conversations first
          messageCount: 1,
          isActive: false,
          messages: []
        });
      }

      // Save all conversations
      for (const conv of conversations) {
        await storage.saveConversation(conv);
      }

      // Check that only 50 conversations remain (oldest should be deleted)
      const metadata = await storage.getConversationMetadata();
      expect(metadata.length).toBeLessThanOrEqual(50);

      // The newest conversations should still exist
      const newestConv = await storage.loadConversation('conv-54');
      expect(newestConv).toBeTruthy();

      // The oldest conversations should be deleted
      const oldestConv = await storage.loadConversation('conv-0');
      expect(oldestConv).toBeNull();
    });
  });

  describe('Clear All Conversations', () => {
    it('should clear all stored conversations and metadata', async () => {
      // Add some conversations
      const conv1: ConversationItem = {
        id: 'clear-test-1',
        title: 'Clear Test 1',
        lastMessage: 'Message 1',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: false,
        messages: []
      };

      await storage.saveConversation(conv1);
      await storage.setActiveConversationId('clear-test-1');

      // Verify they exist
      let metadata = await storage.getConversationMetadata();
      expect(metadata).toHaveLength(1);
      expect(await storage.getActiveConversationId()).toBe('clear-test-1');

      // Clear all
      await storage.clearAllConversations();

      // Verify everything is cleared
      metadata = await storage.getConversationMetadata();
      expect(metadata).toHaveLength(0);
      expect(await storage.getActiveConversationId()).toBeNull();
      expect(await storage.loadConversation('clear-test-1')).toBeNull();
    });
  });

  describe('Date Serialization', () => {
    it('should handle date serialization/deserialization correctly', async () => {
      const testDate = new Date('2025-01-15T10:30:00.000Z');
      const conversation: ConversationItem = {
        id: 'date-test',
        title: 'Date Test',
        lastMessage: 'Test message',
        lastUpdated: testDate,
        messageCount: 1,
        isActive: false,
        messages: [{
          id: 'msg-date',
          role: 'user',
          content: 'Test message',
          timestamp: testDate.getTime()
        }]
      };

      await storage.saveConversation(conversation);
      const loaded = await storage.loadConversation('date-test');

      expect(loaded?.lastUpdated).toBeInstanceOf(Date);
      expect(loaded?.lastUpdated.getTime()).toBe(testDate.getTime());
      expect(typeof loaded?.messages[0].timestamp).toBe('number');
      expect(loaded?.messages[0].timestamp).toBe(testDate.getTime());
    });
  });
});
