import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileReference from '../../webview/components/FileReference';
import { FileReference as FileReferenceType } from '../../webview/types/api';

// Mock CSS imports
jest.mock('../../webview/components/FileReference.css', () => ({}));

describe('FileReference Component', () => {
  const mockOnOpenFile = jest.fn();
  const mockOnPreviewFile = jest.fn();

  const sampleReference: FileReferenceType = {
    path: 'src/components/Example.tsx',
    line: 42,
    column: 15
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnPreviewFile.mockResolvedValue('Sample file content\nLine 2\nLine 3');
  });

  describe('Basic Rendering', () => {
    it('renders file reference with correct icon and name', () => {
      render(
        <FileReference
          reference={sampleReference}
          onOpenFile={mockOnOpenFile}
          onPreviewFile={mockOnPreviewFile}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Example.tsx')).toBeInTheDocument();
      expect(screen.getByText(':42')).toBeInTheDocument();
    });

    it('renders file reference without line number', () => {
      const refWithoutLine = { path: 'package.json' };
      
      render(
        <FileReference
          reference={refWithoutLine}
          onOpenFile={mockOnOpenFile}
          onPreviewFile={mockOnPreviewFile}
        />
      );

      expect(screen.getByText('package.json')).toBeInTheDocument();
      expect(screen.queryByText(/:/)).not.toBeInTheDocument();
    });

    it('displays correct file type icon for different extensions', () => {
      const testCases = [
        { path: 'file.tsx', expectedIcon: '🔷' },
        { path: 'file.js', expectedIcon: '🟨' },
        { path: 'file.css', expectedIcon: '🎨' },
        { path: 'file.md', expectedIcon: '📝' },
        { path: 'package.json', expectedIcon: '📦' }
      ];

      testCases.forEach(({ path, expectedIcon }) => {
        const { unmount } = render(
          <FileReference
            reference={{ path }}
            onOpenFile={mockOnOpenFile}
            onPreviewFile={mockOnPreviewFile}
          />
        );

        expect(screen.getByText(expectedIcon)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Click Interactions', () => {
    it('calls onOpenFile when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <FileReference
          reference={sampleReference}
          onOpenFile={mockOnOpenFile}
          onPreviewFile={mockOnPreviewFile}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(mockOnOpenFile).toHaveBeenCalledWith('src/components/Example.tsx', 42);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <FileReference
          reference={sampleReference}
          onOpenFile={mockOnOpenFile}
          onPreviewFile={mockOnPreviewFile}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'File reference: src/components/Example.tsx at line 42');
      expect(button).toHaveAttribute('title', 'Open src/components/Example.tsx at line 42');
    });
  });
});
