import React from 'react';
import MonacoEditor from '@monaco-editor/react';

interface DiffViewerProps {
  originalContent: string;
  proposedContent: string;
  fileName?: string;
}

function DiffViewer({ originalContent, proposedContent, fileName }: DiffViewerProps) {
  return (
    <div className="diff-viewer-container">
      <h4>Diff for {fileName || 'file'}</h4>
      
      {/* Using Monaco Editor for diff visualization */}
      <MonacoEditor
        height="300px"
        language="diff"
        value={originalContent}
        options={{
          readOnly: true,
          minimap: {
            enabled: false
          },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
      
      {/* For side-by-side diff, you would create two editors */}
    </div>
  );
}

export default DiffViewer;