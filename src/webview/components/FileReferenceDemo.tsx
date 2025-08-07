import React, { useState } from 'react';
import FileReference from './FileReference';
import { FileReference as FileReferenceType } from '../types/api';
import './FileReferenceDemo.css';

const FileReferenceDemo: React.FC = () => {
  const [previewResults, setPreviewResults] = useState<{ [key: string]: string }>({});

  // Sample file references for demonstration
  const sampleReferences: FileReferenceType[] = [
    { path: 'src/components/FileReference.tsx', line: 42 },
    { path: 'src/utils/fileReferenceParser.ts', line: 128 },
    { path: 'package.json' },
    { path: 'src/webview/styles/components.css', line: 15 },
    { path: 'README.md' },
    { path: 'src/extension.ts', line: 1 },
    { path: 'tsconfig.json' },
    { path: 'webpack.config.js', line: 27 }
  ];

  const handleOpenFile = (filePath: string, lineNumber?: number) => {
    console.log(`Opening file: ${filePath}${lineNumber ? ` at line ${lineNumber}` : ''}`);
    // In a real implementation, this would send a command to VS Code
    alert(`Would open: ${filePath}${lineNumber ? ` at line ${lineNumber}` : ''}`);
  };

  const handlePreviewFile = async (filePath: string): Promise<string> => {
    // Check if we already have this preview cached
    if (previewResults[filePath]) {
      return previewResults[filePath];
    }

    // Simulate different file content based on extension
    const extension = filePath.split('.').pop()?.toLowerCase();
    let content = '';

    switch (extension) {
      case 'tsx':
      case 'ts':
        content = `import React from 'react';
import { ComponentProps } from './types';

const ExampleComponent: React.FC<ComponentProps> = ({ children }) => {
  const [state, setState] = useState<string>('');
  
  useEffect(() => {
    // Component logic here
  }, []);

  return (
    <div className="example-component">
      {children}
    </div>
  );
};

export default ExampleComponent;`;
        break;
      
      case 'css':
        content = `.example-component {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  border-radius: 6px;
}

.example-component:hover {
  background-color: var(--vscode-button-hoverBackground);
}`;
        break;
      
      case 'json':
        content = `{
  "name": "lms-copilot",
  "version": "1.0.0",
  "description": "GitHub Copilot replica using LM Studio",
  "main": "./out/extension.js",
  "scripts": {
    "compile": "webpack",
    "watch": "webpack --watch"
  },
  "dependencies": {
    "vscode": "^1.74.0"
  }
}`;
        break;
      
      case 'md':
        content = `# LMS Copilot

A VS Code extension that replicates GitHub Copilot functionality using LM Studio as the backend AI engine.

## Features

- 🤖 AI-powered code completion
- 💬 Interactive chat interface
- 📁 File reference system
- ⚡ Real-time streaming responses

## Installation

1. Clone the repository
2. Run \`npm install\`
3. Open in VS Code and press F5`;
        break;
      
      case 'js':
        content = `const webpack = require('webpack');
const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};`;
        break;
      
      default:
        content = `// File: ${filePath}
// This is a preview of the file content
// In a real implementation, this would be fetched from the VS Code API

console.log('File content preview');
export const sampleContent = 'Hello, world!';`;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Cache the result
    setPreviewResults(prev => ({ ...prev, [filePath]: content }));
    
    return content;
  };

  return (
    <div className="file-reference-demo">
      <h2>File Reference System Demo</h2>
      <p className="demo-description">
        This demonstrates the new file reference system that makes file paths clickable 
        with hover previews and quick actions. Try hovering over the file references below 
        and clicking them to see the functionality.
      </p>

      <div className="demo-section">
        <h3>Sample File References</h3>
        <div className="file-references-grid">
          {sampleReferences.map((ref, index) => (
            <div key={index} className="demo-file-item">
              <FileReference
                reference={ref}
                onOpenFile={handleOpenFile}
                onPreviewFile={handlePreviewFile}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="demo-section">
        <h3>File References in Text</h3>
        <div className="demo-text-content">
          <p>
            The main entry point is located in <FileReference 
              reference={{ path: 'src/extension.ts', line: 15 }}
              onOpenFile={handleOpenFile}
              onPreviewFile={handlePreviewFile}
            /> and the configuration is in <FileReference 
              reference={{ path: 'package.json' }}
              onOpenFile={handleOpenFile}
              onPreviewFile={handlePreviewFile}
            />.
          </p>
          <p>
            The React components are defined in <FileReference 
              reference={{ path: 'src/webview/components/ChatInterface.tsx', line: 42 }}
              onOpenFile={handleOpenFile}
              onPreviewFile={handlePreviewFile}
            /> with styles in <FileReference 
              reference={{ path: 'src/webview/styles/components.css', line: 128 }}
              onOpenFile={handleOpenFile}
              onPreviewFile={handlePreviewFile}
            />.
          </p>
        </div>
      </div>

      <div className="demo-section">
        <h3>Features Demonstrated</h3>
        <ul className="features-list">
          <li>✅ <strong>Clickable file paths</strong> - Click any file reference to open it</li>
          <li>✅ <strong>Hover previews</strong> - Hover to see file content (with 500ms delay)</li>
          <li>✅ <strong>File type icons</strong> - Icons match file extensions and VS Code theme</li>
          <li>✅ <strong>Breadcrumb navigation</strong> - Long paths show truncated breadcrumbs</li>
          <li>✅ <strong>Line number support</strong> - References can include specific line numbers</li>
          <li>✅ <strong>Quick actions</strong> - View and edit buttons appear on hover</li>
          <li>✅ <strong>VS Code theming</strong> - Fully integrated with VS Code's color scheme</li>
          <li>✅ <strong>Accessibility</strong> - Screen reader support and keyboard navigation</li>
        </ul>
      </div>

      <div className="demo-section">
        <h3>Preview Cache Status</h3>
        <div className="cache-status">
          {Object.keys(previewResults).length === 0 ? (
            <p className="no-cache">No files previewed yet. Hover over file references to populate cache.</p>
          ) : (
            <div className="cached-files">
              <p>Cached previews ({Object.keys(previewResults).length} files):</p>
              <ul>
                {Object.keys(previewResults).map(filePath => (
                  <li key={filePath} className="cached-file">
                    <span className="cache-icon">💾</span>
                    {filePath}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileReferenceDemo;
