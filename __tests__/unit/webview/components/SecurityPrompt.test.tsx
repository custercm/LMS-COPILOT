/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecurityPrompt, { SecurityPromptProps } from '../../../../src/webview/components/SecurityPrompt';

describe('SecurityPrompt', () => {
  const defaultProps: SecurityPromptProps = {
    command: 'rm -rf /tmp/*',
    riskLevel: 'high',
    description: 'This command will delete files permanently',
    onApprove: jest.fn(),
    onDeny: jest.fn(),
    onAlwaysAllow: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders security prompt with command and description', () => {
      render(<SecurityPrompt {...defaultProps} />);
      
      expect(screen.getByText('High-risk command detected')).toBeInTheDocument();
      expect(screen.getByText('rm -rf /tmp/*')).toBeInTheDocument();
      expect(screen.getByText('This command will delete files permanently')).toBeInTheDocument();
    });

    it('renders all action buttons for non-high risk', () => {
      render(<SecurityPrompt {...defaultProps} riskLevel="medium" />);
      
      expect(screen.getByRole('button', { name: /deny this command/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /allow this command once/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /always allow this type/i })).toBeInTheDocument();
    });

    it('hides "Always Allow" button for high risk commands', () => {
      render(<SecurityPrompt {...defaultProps} riskLevel="high" />);
      
      expect(screen.getByRole('button', { name: /deny this command/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /allow this command once/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /always allow this type/i })).not.toBeInTheDocument();
    });

    it('can be hidden when isVisible is false', () => {
      const { container } = render(<SecurityPrompt {...defaultProps} isVisible={false} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Risk Level Styling', () => {
    it('displays correct styling for high risk', () => {
      render(<SecurityPrompt {...defaultProps} riskLevel="high" />);
      
      expect(screen.getByText('High-risk command detected')).toHaveStyle({
        color: '#f85149'
      });
      expect(screen.getByText('🔴')).toBeInTheDocument();
    });

    it('displays correct styling for medium risk', () => {
      render(<SecurityPrompt {...defaultProps} riskLevel="medium" />);
      
      expect(screen.getByText('Medium-risk command detected')).toHaveStyle({
        color: '#d1a60a'
      });
      expect(screen.getByText('🟡')).toBeInTheDocument();
    });

    it('displays correct styling for low risk', () => {
      render(<SecurityPrompt {...defaultProps} riskLevel="low" />);
      
      expect(screen.getByText('Low-risk command detected')).toHaveStyle({
        color: '#3fb950'
      });
      expect(screen.getByText('🟢')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onApprove when Allow Once button is clicked', () => {
      const onApprove = jest.fn();
      render(<SecurityPrompt {...defaultProps} onApprove={onApprove} />);
      
      fireEvent.click(screen.getByRole('button', { name: /allow this command once/i }));
      
      expect(onApprove).toHaveBeenCalledTimes(1);
    });

    it('calls onDeny when Deny button is clicked', () => {
      const onDeny = jest.fn();
      render(<SecurityPrompt {...defaultProps} onDeny={onDeny} />);
      
      fireEvent.click(screen.getByRole('button', { name: /deny this command/i }));
      
      expect(onDeny).toHaveBeenCalledTimes(1);
    });

    it('calls onAlwaysAllow when Always Allow button is clicked (non-high risk)', () => {
      const onAlwaysAllow = jest.fn();
      render(<SecurityPrompt {...defaultProps} riskLevel="medium" onAlwaysAllow={onAlwaysAllow} />);
      
      fireEvent.click(screen.getByRole('button', { name: /always allow this type/i }));
      
      expect(onAlwaysAllow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<SecurityPrompt {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'security-prompt-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'security-prompt-description');
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('id', 'security-prompt-title');
      expect(screen.getByText('This command will delete files permanently')).toHaveAttribute('id', 'security-prompt-description');
    });

    it('has proper button labels', () => {
      render(<SecurityPrompt {...defaultProps} riskLevel="medium" />);
      
      expect(screen.getByLabelText('Deny this command')).toBeInTheDocument();
      expect(screen.getByLabelText('Allow this command once')).toBeInTheDocument();
      expect(screen.getByLabelText('Always allow this type of command')).toBeInTheDocument();
    });
  });

  describe('Command Display', () => {
    it('displays long commands with proper word breaking', () => {
      const longCommand = 'npm install --save-dev very-long-package-name-that-should-break-properly';
      render(<SecurityPrompt {...defaultProps} command={longCommand} />);
      
      const commandElement = screen.getByText(longCommand);
      expect(commandElement).toHaveStyle({
        wordBreak: 'break-all'
      });
    });

    it('displays commands in monospace font', () => {
      render(<SecurityPrompt {...defaultProps} />);
      
      const commandElement = screen.getByText('rm -rf /tmp/*');
      expect(commandElement).toHaveStyle({
        fontFamily: 'var(--vscode-editor-font-family)'
      });
    });
  });

  describe('Visual Consistency', () => {
    it('uses VS Code CSS variables for theming', () => {
      const { container } = render(<SecurityPrompt {...defaultProps} />);
      const promptElement = container.querySelector('.security-prompt');
      
      expect(promptElement).toHaveStyle({
        backgroundColor: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)'
      });
    });

    it('applies hover effects to buttons', () => {
      render(<SecurityPrompt {...defaultProps} />);
      
      const approveButton = screen.getByRole('button', { name: /allow this command once/i });
      expect(approveButton).toHaveStyle({
        backgroundColor: 'var(--vscode-button-background)'
      });
    });
  });
});
