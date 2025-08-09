// Quick debug script to test hook return values
const { renderHook } = require('@testing-library/react');

// Mock the hook import
try {
  const { useConversationManager } = require('./src/webview/hooks/useConversationManager');
  
  console.log('Hook imported successfully');
  
  const { result } = renderHook(() => useConversationManager());
  
  console.log('Hook result.current keys:', Object.keys(result.current || {}));
  console.log('Hook result.current:', result.current);
  
  // Check specific functions
  console.log('createNewConversation type:', typeof result.current?.createNewConversation);
  console.log('switchToConversation type:', typeof result.current?.switchToConversation);
  console.log('conversations type:', typeof result.current?.conversations);
  console.log('isLoading type:', typeof result.current?.isLoading);
  
} catch (error) {
  console.error('Error testing hook:', error);
}
