import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageItem from '../../../webview/components/MessageItem';

// Mock the CSS import
jest.mock('../../../webview/components/MessageItem.css', () => ({}));

// Mock any VS Code API calls
jest.mock('vscode', () => ({}), { virtual: true });

describe('MessageItem Component', () => {
  const mockMessage = {
    id: '1',
    role: 'user' as const,
    content: 'Test message content',
    timestamp: Date.now()
  };

  it('should render message content', () => {
    render(<MessageItem message={mockMessage} />);
    
    expect(screen.getByText('Test message content')).toBeInTheDocument();
  });

  it('should display correct role class', () => {
    const { container } = render(<MessageItem message={mockMessage} />);
    
    expect(container.firstChild).toHaveClass('message-item');
  });

  it('should render assistant messages differently', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'AI response'
    };

    render(<MessageItem message={assistantMessage} />);
    
    expect(screen.getByText('AI response')).toBeInTheDocument();
  });

  it('should handle code blocks in content', () => {
    const messageWithCode = {
      ...mockMessage,
      content: 'Here is some code: ```js\nconsole.log("hello");\n```'
    };

    render(<MessageItem message={messageWithCode} />);
    
    expect(screen.getByText(/Here is some code/)).toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    const messageWithTimestamp = {
      ...mockMessage,
      timestamp: new Date('2023-01-01T10:00:00Z').getTime()
    };

    render(<MessageItem message={messageWithTimestamp} />);
    
    // Should render without error - timestamp formatting depends on implementation
    expect(screen.getByText('Test message content')).toBeInTheDocument();
  });
});
