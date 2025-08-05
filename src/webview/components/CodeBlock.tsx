import React, { useState } from 'react';
import ActionButtons from './ActionButtons';
import DiffViewer from './DiffViewer';
import { extractCodeBlocks } from '../utils/messageParser';
import './CodeBlock.css';

interface CodeBlockProps {
  content: string;
  isStreaming?: boolean;
}

function CodeBlock({ content, isStreaming }: CodeBlockProps) {
  const [showDiff, setShowDiff] = useState(false);
  
  // Extract code blocks using the proper parser
  const codeBlocks = extractCodeBlocks(content);

  return (
    <div className="code-block">
      {codeBlocks.map((block, index) => (
        <React.Fragment key={index}>
          <pre className={`language-${block.language}`}>
            <code>{block.code}</code>
          </pre>

          {!isStreaming && (
            <div className="code-actions">
              <ActionButtons 
                codeBlock={block.code} 
                changeId={`code-${index}`}
              />
            </div>
          )}

          {!isStreaming && showDiff && (
            <div className="diff-viewer">
              <DiffViewer
                originalContent={block.code}
                proposedContent={block.code + "\n// Modified content"}
                fileName={`code-block-${index}.${block.language}`}
              />
            </div>
          )}
        </React.Fragment>
      ))}

      {codeBlocks.length > 0 && !isStreaming && (
        <button
          onClick={() => setShowDiff(!showDiff)}
          className="diff-toggle"
        >
          {showDiff ? 'Hide Diff' : 'Show Diff'}
        </button>
      )}
    </div>
  );
}

export default CodeBlock;