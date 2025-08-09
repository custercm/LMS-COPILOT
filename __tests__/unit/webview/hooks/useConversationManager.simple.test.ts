import { renderHook, act } from '@testing-library/react';
import { useConversationManager } from '../../../../src/webview/hooks/useConversationManager';

describe('useConversationManager Simple Tests', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useConversationManager());
    
    expect(result.current).toBeDefined();
    expect(result.current.conversations).toEqual([]);
    expect(result.current.activeConversation).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should have all expected methods', () => {
    const { result } = renderHook(() => useConversationManager());
    
    expect(typeof result.current.createNewConversation).toBe('function');
    expect(typeof result.current.switchToConversation).toBe('function');
    expect(typeof result.current.deleteConversation).toBe('function');
    expect(typeof result.current.updateConversationTitle).toBe('function');
    expect(typeof result.current.addMessage).toBe('function');
    expect(typeof result.current.updateLastMessage).toBe('function');
    expect(typeof result.current.searchConversations).toBe('function');
    expect(typeof result.current.filterConversations).toBe('function');
    expect(typeof result.current.exportConversations).toBe('function');
    expect(typeof result.current.importConversations).toBe('function');
    expect(typeof result.current.clearAllConversations).toBe('function');
    expect(typeof result.current.saveCurrentConversation).toBe('function');
    expect(typeof result.current.loadConversations).toBe('function');
    expect(typeof result.current.togglePersistence).toBe('function');
  });

  it('should create conversation in memory mode', async () => {
    const { result } = renderHook(() => useConversationManager({
      enablePersistence: false
    }));

    let conversation: any;
    await act(async () => {
      conversation = await result.current.createNewConversation('Test message');
    });

    expect(conversation).toBeDefined();
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.messages[0].content).toBe('Test message');
    expect(result.current.activeConversation).toBe(conversation);
  });
});
