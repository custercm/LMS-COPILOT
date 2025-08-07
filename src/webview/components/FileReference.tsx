import React, { useState, useRef, useEffect } from 'react';
import { FileReference as FileReferenceType } from '../types/api';
import { getFileIcon, categorizeFile } from '../types/media';
import './FileReference.css';

interface FileReferenceProps {
  reference: FileReferenceType;
  onOpenFile?: (filePath: string, lineNumber?: number) => void;
  onPreviewFile?: (filePath: string) => Promise<string>;
  onMediaOperation?: (filePath: string, operation: 'preview' | 'convert' | 'metadata' | 'analyze') => void;
  showPreview?: boolean;
  className?: string;
}

const FileReference: React.FC<FileReferenceProps> = ({
  reference,
  onOpenFile,
  onPreviewFile,
  onMediaOperation,
  showPreview = true,
  className = ''
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Get file extension for icon determination
  const getFileExtension = (filePath: string): string => {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  // Determine if this is a media file
  const getMimeType = (filePath: string): string => {
    const ext = getFileExtension(filePath);
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
      'pdf': 'application/pdf', 'csv': 'text/csv', 'json': 'application/json',
      'txt': 'text/plain', 'md': 'text/markdown', 'html': 'text/html'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };
  
  const fileCategory = categorizeFile(getMimeType(reference.path));
  const isMediaFile = ['image', 'document', 'data'].includes(fileCategory);

  // Get VS Code-style file icon based on extension
  const getFileIcon = (filePath: string): string => {
    const extension = getFileExtension(filePath);
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';
    
    // Exact file name matches
    if (fileName === 'package.json') return '📦';
    if (fileName === 'tsconfig.json') return '⚙️';
    if (fileName === 'webpack.config.js') return '📦';
    if (fileName === 'readme.md') return '📖';
    if (fileName === '.gitignore') return '🙈';
    
    // Extension-based icons
    switch (extension) {
      case 'ts':
      case 'tsx': return '🔷';
      case 'js':
      case 'jsx': return '🟨';
      case 'json': return '⚙️';
      case 'css': return '🎨';
      case 'scss':
      case 'sass': return '💅';
      case 'html': return '🌐';
      case 'md': return '📝';
      case 'py': return '🐍';
      case 'java': return '☕';
      case 'cpp':
      case 'c': return '⚡';
      case 'rs': return '🦀';
      case 'go': return '🐹';
      case 'php': return '🐘';
      case 'rb': return '💎';
      case 'vue': return '💚';
      case 'xml': return '📄';
      case 'yml':
      case 'yaml': return '📋';
      case 'toml': return '⚙️';
      case 'lock': return '🔒';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg': return '🖼️';
      case 'pdf': return '📄';
      case 'zip':
      case 'tar':
      case 'gz': return '📦';
      default: return '📄';
    }
  };

  // Generate breadcrumb navigation
  const generateBreadcrumbs = (filePath: string): string[] => {
    const parts = filePath.split('/').filter(part => part !== '');
    return parts;
  };

  // Handle mouse enter with delay for preview
  const handleMouseEnter = () => {
    if (!showPreview || !onPreviewFile) return;
    
    hoverTimeoutRef.current = setTimeout(async () => {
      setIsHovering(true);
      if (!previewContent && !isLoading) {
        setIsLoading(true);
        setError(null);
        
        try {
          const content = await onPreviewFile(reference.path);
          setPreviewContent(content);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load preview');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsHovering(true);
      }
    }, 500); // 500ms delay before showing preview
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovering(false);
  };

  // Handle file click
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onOpenFile) {
      onOpenFile(reference.path, reference.line);
    }
  };

  // Handle quick action buttons
  const handleQuickAction = (action: 'open' | 'edit', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onOpenFile) {
      onOpenFile(reference.path, action === 'edit' ? reference.line : undefined);
    }
  };

  // Format preview content for tooltip
  const formatPreviewContent = (content: string): string => {
    const lines = content.split('\n');
    const maxLines = 10;
    const maxCharsPerLine = 80;
    
    const truncatedLines = lines.slice(0, maxLines).map(line => 
      line.length > maxCharsPerLine ? line.substring(0, maxCharsPerLine) + '...' : line
    );
    
    let result = truncatedLines.join('\n');
    if (lines.length > maxLines) {
      result += `\n... (${lines.length - maxLines} more lines)`;
    }
    
    return result;
  };

  // Handle media operations
  const handleMediaOperation = (operation: 'preview' | 'convert' | 'metadata' | 'analyze', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onMediaOperation) {
      onMediaOperation(reference.path, operation);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const breadcrumbs = generateBreadcrumbs(reference.path);
  const fileName = breadcrumbs[breadcrumbs.length - 1] || reference.path;
  const fileIcon = getFileIcon(reference.path);

  return (
    <span 
      className={`file-reference ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="file-reference-button"
        onClick={handleClick}
        title={`Open ${reference.path}${reference.line ? ` at line ${reference.line}` : ''}`}
        aria-label={`File reference: ${reference.path}${reference.line ? ` at line ${reference.line}` : ''}`}
      >
        <span className="file-icon" role="img" aria-hidden="true">
          {fileIcon}
        </span>
        
        {breadcrumbs.length > 1 ? (
          <span className="file-breadcrumbs">
            {breadcrumbs.slice(0, -1).map((part, index) => (
              <span key={index} className="breadcrumb-part">
                <span className="breadcrumb-text">{part}</span>
                <span className="breadcrumb-separator" aria-hidden="true">/</span>
              </span>
            ))}
            <span className="file-name">{fileName}</span>
          </span>
        ) : (
          <span className="file-name">{fileName}</span>
        )}
        
        {reference.line && (
          <span className="line-number" aria-label={`line ${reference.line}`}>
            :{reference.line}
          </span>
        )}
      </button>

      {/* Quick Action Buttons */}
      <div className="quick-actions">
        <button
          className="quick-action-button"
          onClick={(e) => handleQuickAction('open', e)}
          title="Open file"
          aria-label="Open file"
        >
          <span role="img" aria-hidden="true">👁️</span>
        </button>
        <button
          className="quick-action-button"
          onClick={(e) => handleQuickAction('edit', e)}
          title="Edit file"
          aria-label="Edit file"
        >
          <span role="img" aria-hidden="true">✏️</span>
        </button>
        
        {/* Media operation buttons for supported files */}
        {isMediaFile && onMediaOperation && (
          <>
            <button
              className="quick-action-button media-button"
              onClick={(e) => handleMediaOperation('preview', e)}
              title="Preview in media viewer"
              aria-label="Preview in media viewer"
            >
              <span role="img" aria-hidden="true">🖼️</span>
            </button>
            <button
              className="quick-action-button media-button"
              onClick={(e) => handleMediaOperation('analyze', e)}
              title="Analyze file content"
              aria-label="Analyze file content"
            >
              <span role="img" aria-hidden="true">🔍</span>
            </button>
            {fileCategory === 'image' && (
              <button
                className="quick-action-button media-button"
                onClick={(e) => handleMediaOperation('convert', e)}
                title="Convert image format"
                aria-label="Convert image format"
              >
                <span role="img" aria-hidden="true">🔄</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Hover Preview Tooltip */}
      {isHovering && showPreview && (
        <div 
          ref={tooltipRef}
          className="file-preview-tooltip"
          role="tooltip"
          aria-live="polite"
        >
          <div className="tooltip-header">
            <span className="tooltip-icon" role="img" aria-hidden="true">
              {fileIcon}
            </span>
            <span className="tooltip-path">{reference.path}</span>
            {reference.line && (
              <span className="tooltip-line">Line {reference.line}</span>
            )}
          </div>
          
          <div className="tooltip-content">
            {isLoading && (
              <div className="loading-indicator">
                <span className="spinner" aria-hidden="true">⏳</span>
                Loading preview...
              </div>
            )}
            
            {error && (
              <div className="error-message" role="alert">
                <span role="img" aria-hidden="true">⚠️</span>
                {error}
              </div>
            )}
            
            {previewContent && !isLoading && !error && (
              <pre className="preview-code">
                <code>{formatPreviewContent(previewContent)}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </span>
  );
};

export default FileReference;
