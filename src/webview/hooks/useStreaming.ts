import { useState } from 'react';

interface StreamingState {
  isStreaming: boolean;
  currentMessage: string;
  messageId: string;
  streamingSpeed: number;
}

export function useStreaming() {
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null);
  const startStreaming = (messageId: string) => {
    setStreamingState({
      isStreaming: true,
      currentMessage: '',
      messageId,
      streamingSpeed: 50
    });
  };

  const appendToStream = (content: string) => {
    if (!streamingState?.isStreaming) return;
    
    // Simulate character-by-character streaming with delay
    setStreamingState(prev => ({
      ...prev!,
      currentMessage: prev!.currentMessage + content
    }));
  };

  const endStreaming = () => {
    if (streamingState) {
      setStreamingState(null);
    }
  };

  return {
    streamingState,
    startStreaming,
    appendToStream,
    endStreaming
  };
}