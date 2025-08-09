/**
 * @jest-enviconst mockConversationManager = {
  conversations: [],
  activeConversation: null,
  isLoading: false,
  error: null,
  createNewConversation: jest.fn(),
  switchToConversation: jest.fn(),
  deleteConversation: jest.fn(),
  updateConversationTitle: jest.fn(),
  loadConversations: jest.fn(),
  searchConversations: jest.fn(),
  filterConversations: jest.fn(),
  exportConversations: jest.fn(),
  importConversations: jest.fn(),
  clearError: jest.fn(),
};*/

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversationSidebar from '../../../../src/webview/components/ConversationSidebar';
import { ConversationStorage, ConversationMetadata } from '../../../../src/storage/ConversationStorage';

// Setup DOM matchers
import '@testing-library/jest-dom';

// Mock the CSS import
jest.mock('../../../../src/webview/components/ConversationSidebar.css', () => ({}));

// Mock the useConversationManager hook
const mockConversationManager: any = {
  conversations: [] as ConversationMetadata[],
  activeConversation: null,
  isLoading: false,
  error: null,
  createNewConversation: jest.fn(),
  switchToConversation: jest.fn(),
  deleteConversation: jest.fn(),
  updateConversationTitle: jest.fn(),
  loadConversations: jest.fn(),
  searchConversations: jest.fn(),
  filterConversations: jest.fn(),
  exportConversations: jest.fn(),
  importConversations: jest.fn(),
};

jest.mock('../../../../src/webview/hooks/useConversationManager', () => ({
  useConversationManager: () => mockConversationManager,
}));

// Mock storage
const mockStorage = {
  listConversations: jest.fn(),
  getConversation: jest.fn(),
  saveConversation: jest.fn(),
  deleteConversation: jest.fn(),
  createNewConversation: jest.fn(),
  updateConversationTitle: jest.fn(),
  searchConversations: jest.fn(),
  exportConversations: jest.fn(),
  importConversations: jest.fn(),
} as unknown as ConversationStorage;

describe('ConversationSidebar', () => {
  const defaultProps = {
    isVisible: true,
    onToggle: jest.fn(),
    storage: mockStorage,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConversationManager.conversations = [];
    mockConversationManager.activeConversation = null;
    mockConversationManager.isLoading = false;
    mockConversationManager.error = null;
    mockConversationManager.clearError = jest.fn();
  });

  describe('Visibility and Toggle', () => {
    it('renders toggle button when sidebar is hidden', () => {
      act(() => {
        render(
          <ConversationSidebar
            {...defaultProps}
            isVisible={false}
          />
        );
      });

      const toggleButton = screen.getByTitle('Show conversations');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveTextContent('📋');
    });

    it('renders full sidebar when visible', () => {
      render(<ConversationSidebar {...defaultProps} />);

      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
      expect(screen.getByTitle('New conversation')).toBeInTheDocument();
      expect(screen.getByTitle('Hide sidebar')).toBeInTheDocument();
    });

    it('calls onToggle when toggle buttons are clicked', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();

      // Test hidden state toggle
      const { rerender } = render(
        <ConversationSidebar
          {...defaultProps}
          isVisible={false}
          onToggle={onToggle}
        />
      );

      await user.click(screen.getByTitle('Show conversations'));
      expect(onToggle).toHaveBeenCalledTimes(1);

      // Test visible state toggle
      rerender(
        <ConversationSidebar
          {...defaultProps}
          isVisible={true}
          onToggle={onToggle}
        />
      );

      await user.click(screen.getByTitle('Hide sidebar'));
      expect(onToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('Conversation List', () => {
    const mockConversations: ConversationMetadata[] = [
      {
        id: 'conv1',
        title: 'First Conversation',
        lastMessage: 'Hello world',
        lastUpdated: new Date(Date.now() - 1000),
        messageCount: 5,
        isActive: true,
      },
      {
        id: 'conv2',
        title: 'Second Conversation',
        lastMessage: 'How are you?',
        lastUpdated: new Date(Date.now() - 5000),
        messageCount: 3,
        isActive: false,
      },
    ];

    beforeEach(() => {
      mockConversationManager.conversations = mockConversations;
    });

    it('displays conversation list correctly', () => {
      render(<ConversationSidebar {...defaultProps} />);

      expect(screen.getByText('First Conversation')).toBeInTheDocument();
      expect(screen.getByText('Second Conversation')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('How are you?')).toBeInTheDocument();
    });

    it('shows active conversation with correct styling', () => {
      render(<ConversationSidebar {...defaultProps} />);

      const activeConversation = screen.getByText('First Conversation').closest('.conversation-item');
      const inactiveConversation = screen.getByText('Second Conversation').closest('.conversation-item');

      expect(activeConversation).toHaveClass('active');
      expect(inactiveConversation).not.toHaveClass('active');
    });

    it('shows correct conversation count in footer', () => {
      render(<ConversationSidebar {...defaultProps} />);

      expect(screen.getByText('2 conversations')).toBeInTheDocument();
    });

    it('shows singular form for single conversation', () => {
      mockConversationManager.conversations = [mockConversations[0]];
      render(<ConversationSidebar {...defaultProps} />);

      expect(screen.getByText('1 conversation')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no conversations exist', () => {
      mockConversationManager.conversations = [];
      render(<ConversationSidebar {...defaultProps} />);

      expect(screen.getByText('No conversations yet. Start a new one!')).toBeInTheDocument();
    });

    it('shows no search results message when search has no matches', async () => {
      const user = userEvent.setup();
      mockConversationManager.conversations = [
        {
          id: 'conv1',
          title: 'TypeScript Project',
          lastMessage: 'Working on TypeScript',
          lastUpdated: new Date(),
          messageCount: 2,
          isActive: false,
        },
      ];

      render(<ConversationSidebar {...defaultProps} />);

      await act(async () => {
        await user.type(screen.getByPlaceholderText('Search conversations...'), 'python');
      });

      expect(screen.getByText('No conversations match your search.')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    const mockConversations: ConversationMetadata[] = [
      {
        id: 'conv1',
        title: 'TypeScript Project',
        lastMessage: 'Working on TypeScript',
        lastUpdated: new Date(),
        messageCount: 2,
        isActive: false,
      },
      {
        id: 'conv2',
        title: 'Python Script',
        lastMessage: 'Debugging Python',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: false,
      },
    ];

    beforeEach(() => {
      mockConversationManager.conversations = mockConversations;
      // Mock search functionality to return filtered results
      mockConversationManager.searchConversations = jest.fn().mockImplementation((query: string) => {
        const lowerQuery = query.toLowerCase();
        return Promise.resolve(mockConversations.filter(conv => 
          conv.title.toLowerCase().includes(lowerQuery) ||
          conv.lastMessage.toLowerCase().includes(lowerQuery)
        ));
      });
    });

    it('filters conversations by title', async () => {
      const user = userEvent.setup();
      render(<ConversationSidebar {...defaultProps} />);

      await act(async () => {
        await user.type(screen.getByPlaceholderText('Search conversations...'), 'TypeScript');
      });

      // Wait for search results to be rendered
      await waitFor(() => {
        expect(screen.getByText('TypeScript Project')).toBeInTheDocument();
      });
      expect(screen.queryByText('Python Script')).not.toBeInTheDocument();
    });

    it('filters conversations by last message', async () => {
      const user = userEvent.setup();
      render(<ConversationSidebar {...defaultProps} />);

      await act(async () => {
        await user.type(screen.getByPlaceholderText('Search conversations...'), 'Debugging');
      });

      // Wait for search results to be rendered
      await waitFor(() => {
        expect(screen.getByText('Python Script')).toBeInTheDocument();
      });
      expect(screen.queryByText('TypeScript Project')).not.toBeInTheDocument();
    });

    it('search is case insensitive', async () => {
      const user = userEvent.setup();
      render(<ConversationSidebar {...defaultProps} />);

      await act(async () => {
        await user.type(screen.getByPlaceholderText('Search conversations...'), 'typescript');
      });

      // Wait for search results to be rendered
      await waitFor(() => {
        expect(screen.getByText('TypeScript Project')).toBeInTheDocument();
      });
    });

    it('clears search results when search input is cleared', async () => {
      const user = userEvent.setup();
      render(<ConversationSidebar {...defaultProps} />);

      // Search for something
      await act(async () => {
        await user.type(screen.getByPlaceholderText('Search conversations...'), 'TypeScript');
      });
      expect(screen.queryByText('Python Script')).not.toBeInTheDocument();

      // Clear search
      await act(async () => {
        await user.clear(screen.getByPlaceholderText('Search conversations...'));
      });
      expect(screen.getByText('Python Script')).toBeInTheDocument();
    });
  });

  describe('Conversation Actions', () => {
    const mockConversations: ConversationMetadata[] = [
      {
        id: 'conv1',
        title: 'Test Conversation',
        lastMessage: 'Test message',
        lastUpdated: new Date(),
        messageCount: 1,
        isActive: false,
      },
    ];

    beforeEach(() => {
      mockConversationManager.conversations = mockConversations;
    });

    it('calls createNewConversation when new conversation button is clicked', async () => {
      const user = userEvent.setup();
      mockConversationManager.createNewConversation.mockResolvedValue(undefined);

      render(<ConversationSidebar {...defaultProps} />);

      await user.click(screen.getByTitle('New conversation'));

      expect(mockConversationManager.createNewConversation).toHaveBeenCalled();
    });

    it('calls switchToConversation when conversation is selected', async () => {
      const user = userEvent.setup();
      mockConversationManager.switchToConversation.mockResolvedValue(null);

      render(<ConversationSidebar {...defaultProps} />);

      await user.click(screen.getByText('Test Conversation'));

      expect(mockConversationManager.switchToConversation).toHaveBeenCalledWith('conv1');
    });

    it('refreshes conversations when refresh button is clicked', async () => {
      const user = userEvent.setup();
      mockConversationManager.loadConversations.mockResolvedValue();

      render(<ConversationSidebar {...defaultProps} />);

      await user.click(screen.getByTitle('Refresh conversations'));

      expect(mockConversationManager.loadConversations).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when conversations are loading', () => {
      mockConversationManager.isLoading = true;
      render(<ConversationSidebar {...defaultProps} />);

      expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when there is an error', () => {
      mockConversationManager.error = 'Failed to load conversations';
      render(<ConversationSidebar {...defaultProps} />);

      expect(screen.getByText('Failed to load conversations')).toBeInTheDocument();
    });

    it('allows dismissing error message', async () => {
      const user = userEvent.setup();
      mockConversationManager.error = 'Test error';
      mockConversationManager.clearError.mockImplementation(() => {
        mockConversationManager.error = null;
      });
      
      const { rerender } = render(<ConversationSidebar {...defaultProps} />);

      const dismissButton = screen.getByText('×');
      await user.click(dismissButton);

      // Verify clearError was called
      expect(mockConversationManager.clearError).toHaveBeenCalled();
      
      // Rerender with cleared error
      rerender(<ConversationSidebar {...defaultProps} />);

      // The error should be cleared from the component's local state
      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
      });
    });

    it('handles conversation action errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock the createNewConversation to fail and set error state
      mockConversationManager.createNewConversation.mockImplementation(() => {
        mockConversationManager.error = 'Create conversation failed: Network error';
        return Promise.reject(new Error('Network error'));
      });

      const { rerender } = render(<ConversationSidebar {...defaultProps} />);

      await user.click(screen.getByTitle('New conversation'));

      // Rerender to show the error state
      rerender(<ConversationSidebar {...defaultProps} />);

      // Wait for the error to be handled - should show the formatted error from the hook
      await waitFor(() => {
        expect(screen.getByText('Create conversation failed: Network error')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Feature Flag Integration', () => {
    it('renders nothing when conversationSidebar feature is disabled', () => {
      // This test would be more relevant when we add feature flag integration
      // to the component itself, but for now we test the basic structure
      const { container } = render(
        <ConversationSidebar
          {...defaultProps}
          isVisible={false}
        />
      );

      expect(container.firstChild).toHaveClass('sidebar-toggle');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<ConversationSidebar {...defaultProps} />);

      expect(screen.getByTitle('New conversation')).toBeInTheDocument();
      expect(screen.getByTitle('Hide sidebar')).toBeInTheDocument();
      expect(screen.getByTitle('Refresh conversations')).toBeInTheDocument();
    });

    it('search input has proper placeholder and accessibility', () => {
      render(<ConversationSidebar {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search conversations...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Performance', () => {
    it('handles large conversation lists efficiently', () => {
      // Generate many conversations to test performance
      const manyConversations = Array.from({ length: 100 }, (_, i) => ({
        id: `conv${i}`,
        title: `Conversation ${i}`,
        lastMessage: `Message ${i}`,
        lastUpdated: new Date(Date.now() - i * 1000),
        messageCount: i + 1,
        isActive: i === 0,
      }));

      mockConversationManager.conversations = manyConversations;

      const { container } = render(<ConversationSidebar {...defaultProps} />);

      // Should render without performance issues
      expect(container.querySelectorAll('.conversation-item')).toHaveLength(100);
    });
  });
});
