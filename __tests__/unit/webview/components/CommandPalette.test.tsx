import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandPalette, { Command } from '../../../../src/webview/components/CommandPalette';

// Mock CSS imports
jest.mock('../../../../src/webview/components/CommandPalette.css', () => ({}));

describe('CommandPalette Component', () => {
  const mockOnCommandSelect = jest.fn();
  const mockOnClose = jest.fn();

  const sampleCommands: Command[] = [
    {
      name: 'Help',
      description: 'Show help information',
      category: 'chat',
      handler: () => {}
    },
    {
      name: 'Analyze Code',
      description: 'Analyze the current code',
      category: 'code',
      handler: () => {}
    },
    {
      name: 'Explain',
      description: 'Explain the selected code',
      category: 'code',
      handler: () => {}
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders command palette when visible', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('Analyze Code')).toBeInTheDocument();
    });

    it('does not render when not visible', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={false}
          />
        );
      });

      expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
    });

    it('displays all commands initially', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('Analyze Code')).toBeInTheDocument();
      expect(screen.getByText('Explain')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters commands based on input', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      await act(async () => {
        await user.type(input, 'help');
      });

      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.queryByText('Analyze Code')).not.toBeInTheDocument();
      expect(screen.queryByText('Explain')).not.toBeInTheDocument();
    });

    it('shows fuzzy search results', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      await act(async () => {
        await user.type(input, 'anl');
      });

      expect(screen.getByText('Analyze Code')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles arrow key navigation', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      await act(async () => {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
      });

      // The first command should be selected by default, second after arrow down
      expect(screen.getByText('Analyze Code').closest('.command-palette-item')).toHaveClass('selected');
    });

    it('handles Enter key to select command', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(mockOnCommandSelect).toHaveBeenCalledWith(sampleCommands[0], undefined);
    });

    it('handles Escape key to close', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Escape' });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Command Selection', () => {
    it('calls onCommandSelect when command is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      await act(async () => {
        await user.click(screen.getByText('Help'));
      });

      expect(mockOnCommandSelect).toHaveBeenCalledWith(sampleCommands[0], undefined);
    });
  });

  describe('Initial Filter', () => {
    it('applies initial filter on mount', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
            initialFilter="analyze"
          />
        );
      });

      expect(screen.getByDisplayValue('analyze')).toBeInTheDocument();
      expect(screen.getByText('Analyze Code')).toBeInTheDocument();
      expect(screen.queryByText('Help')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper input attributes', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      const input = screen.getByPlaceholderText('Type a command or search...');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveClass('command-palette-input');
    });

    it('focuses input when visible', async () => {
      await act(async () => {
        render(
          <CommandPalette
            commands={sampleCommands}
            onCommandSelect={mockOnCommandSelect}
            onClose={mockOnClose}
            isVisible={true}
          />
        );
      });

      const input = screen.getByPlaceholderText('Type a command or search...');
      expect(input).toHaveFocus();
    });
  });
});
