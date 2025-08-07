import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../../../webview/components/ChatInterface';

// Mock the hooks and components
jest.mock('../../../webview/hooks/useWebviewApi', () => {
  return jest.fn(() => ({
    sendMessage: jest.fn(),
    sendCommand: jest.fn(),
  }));
});

jest.mock('../../../webview/components/MessageList', () => {
  return function MockMessageList({ messages, onOpenFile }: any) {
    return (
      <div data-testid="message-list">
        {messages.map((msg: any) => (
          <div key={msg.id} data-testid={`message-${msg.id}`}>
            {msg.content}
          </div>
        ))}
        <button onClick={() => onOpenFile('test.js')}>Open File</button>
      </div>
    );
  };
});

jest.mock('../../../webview/components/InputArea', () => {
  return function MockInputArea({ onSendMessage }: any) {
    return (
      <div data-testid="input-area">
        <input
          data-testid="message-input"
          onChange={(e) => {
            // Mock input change
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSendMessage(e.currentTarget.value);
            }
          }}
        />
        <button
          data-testid="send-button"
          onClick={() => onSendMessage('test message')}
        >
          Send
        </button>
      </div>
    );
  };
});

jest.mock('../../../webview/components/StreamingIndicator', () => {
  return function MockStreamingIndicator({ isStreaming, progress }: any) {
    return (
      <div data-testid="streaming-indicator">
        {isStreaming ? `Loading: ${progress}%` : 'Idle'}
      </div>
    );
  };
});

const useWebviewApi = require('../../../webview/hooks/useWebviewApi');

describe('ChatInterface', () => {
  let mockWebviewApi: any;

  beforeEach(() => {
    mockWebviewApi = {
      sendMessage: jest.fn(),
      sendCommand: jest.fn(),
    };
    useWebviewApi.mockReturnValue(mockWebviewApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface components', () => {
    render(<ChatInterface />);
    
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('input-area')).toBeInTheDocument();
    expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    expect(screen.getByText('Attach Files')).toBeInTheDocument();
  });

  it('handles sending regular messages', async () => {
    render(<ChatInterface />);
    
    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);

    expect(mockWebviewApi.sendMessage).toHaveBeenCalledWith({
      command: 'sendMessage',
      text: 'test message'
    });
  });

  it('handles command messages starting with /', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);
    
    const input = screen.getByTestId('message-input');
    await user.type(input, '/help explain commands');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    expect(mockWebviewApi.sendCommand).toHaveBeenCalledWith('/help', 'explain commands');
  });

  it('shows loading state when streaming', () => {
    render(<ChatInterface />);
    
    // Simulate receiving a showTypingIndicator message
    fireEvent(window, new MessageEvent('message', {
      data: { command: 'showTypingIndicator' }
    }));

    expect(screen.getByText('Loading: 75%')).toBeInTheDocument();
    expect(screen.getByTestId('streaming-indicator')).toHaveTextContent('Loading: 75%');
  });

  it('hides loading state when streaming stops', () => {
    render(<ChatInterface />);
    
    // First show loading
    fireEvent(window, new MessageEvent('message', {
      data: { command: 'showTypingIndicator' }
    }));

    // Then hide it
    fireEvent(window, new MessageEvent('message', {
      data: { command: 'hideTypingIndicator' }
    }));

    expect(screen.getByTestId('streaming-indicator')).toHaveTextContent('Idle');
  });

  it('adds new messages from extension', () => {
    render(<ChatInterface />);
    
    const testMessage = {
      id: '123',
      role: 'assistant',
      content: 'Test response',
      timestamp: Date.now()
    };

    fireEvent(window, new MessageEvent('message', {
      data: {
        command: 'addMessage',
        message: testMessage
      }
    }));

    expect(screen.getByTestId('message-123')).toBeInTheDocument();
    expect(screen.getByText('Test response')).toBeInTheDocument();
  });

  it('handles file attachment', () => {
    render(<ChatInterface />);
    
    const attachButton = screen.getByText('Attach Files');
    fireEvent.click(attachButton);

    // Check that hidden file input exists
    const fileInput = document.querySelector('input[type=\"file\"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveStyle('display: none');
  });

  it('handles file input change', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<ChatInterface />);
    
    const fileInput = document.querySelector('input[type=\"file\"]') as HTMLInputElement;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(consoleSpy).toHaveBeenCalledWith('Files attached:', [file]);
    consoleSpy.mockRestore();
  });

  it('handles opening files', () => {
    render(<ChatInterface />);
    
    const openFileButton = screen.getByText('Open File');
    fireEvent.click(openFileButton);

    expect(mockWebviewApi.sendMessage).toHaveBeenCalledWith({
      command: 'openFile',
      filePath: 'test.js',
      lineNumber: undefined
    });
  });

  it('handles error messages', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<ChatInterface />);
    
    const errorMessage = 'Test error message';
    fireEvent(window, new MessageEvent('message', {
      data: {
        command: 'handleError',
        message: errorMessage
      }
    }));

    expect(consoleSpy).toHaveBeenCalledWith(errorMessage);
    consoleSpy.mockRestore();
  });

  it('does not send empty messages', () => {
    render(<ChatInterface />);
    
    // Mock the input to return empty string
    const MockInputArea = require('../../../webview/components/InputArea');
    MockInputArea.mockImplementation(({ onSendMessage }: any) => (
      <button data-testid="send-empty" onClick={() => onSendMessage('')}>
        Send Empty
      </button>
    ));

    render(<ChatInterface />);
    const sendButton = screen.getByTestId('send-empty');
    fireEvent.click(sendButton);

    expect(mockWebviewApi.sendMessage).not.toHaveBeenCalled();
    expect(mockWebviewApi.sendCommand).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ChatInterface />);
    
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
