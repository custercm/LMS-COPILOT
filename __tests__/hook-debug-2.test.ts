import { renderHook } from '@testing-library/react';
import { useConversationManager } from '../src/webview/hooks/useConversationManager';
import { ConversationStorage } from '../src/storage/ConversationStorage';

describe('Hook Function Debug', () => {
  it('should log hook return values without storage', () => {
    const { result } = renderHook(() => useConversationManager());
    
    console.log('No storage - createNewConversation:', typeof result.current.createNewConversation, result.current.createNewConversation);
    console.log('No storage - switchToConversation:', typeof result.current.switchToConversation, result.current.switchToConversation);
    console.log('No storage - all functions:', Object.keys(result.current).map(key => `${key}: ${typeof (result.current as any)[key]}`));
  });

  it('should log hook return values with mock storage', () => {
    const mockStorage = {
      saveConversation: jest.fn(),
      loadConversation: jest.fn(),
      getConversationMetadata: jest.fn().mockResolvedValue([]),
      deleteConversation: jest.fn(),
      setActiveConversationId: jest.fn(),
      getActiveConversationId: jest.fn(),
      getActiveConversation: jest.fn(),
      createNewConversation: jest.fn(),
      searchConversations: jest.fn(),
      exportConversations: jest.fn(),
      importConversations: jest.fn(),
      clearAllConversations: jest.fn(),
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
      setFeatureEnabled: jest.fn(),
      getAllFeatureFlags: jest.fn().mockResolvedValue({})
    } as unknown as ConversationStorage;
    
    const { result } = renderHook(() => useConversationManager({ storage: mockStorage }));
    
    console.log('With storage - createNewConversation:', typeof result.current.createNewConversation, result.current.createNewConversation);
    console.log('With storage - switchToConversation:', typeof result.current.switchToConversation, result.current.switchToConversation);
    console.log('With storage - all functions:', Object.keys(result.current).map(key => `${key}: ${typeof (result.current as any)[key]}`));
  });
});
