import React, { useState } from "react";
import useWebviewApi from "../hooks/useWebviewApi";

interface FileOperationsDemoProps {
  onClose: () => void;
}

const FileOperationsDemo: React.FC<FileOperationsDemoProps> = ({ onClose }) => {
  const webviewApi = useWebviewApi();
  const [status, setStatus] = useState<string>("");

  const testFileUpload = () => {
    // Simulate file upload
    const testFile = {
      name: "test.txt",
      content: btoa("This is a test file created by the demo"),
      size: 100,
      type: "text/plain",
    };

    webviewApi.sendMessage({
      command: "fileUpload",
      files: [testFile],
      requestId: Date.now().toString(),
    });

    setStatus("Test file upload initiated...");
  };

  const testFileCreation = () => {
    const filePath = "demo-file.js";
    const content = `// Demo file created by LMS Copilot
console.log('Hello from LMS Copilot!');

function greet(name) {
  return \`Hello, \${name}! This file was created by AI.\`;
}

module.exports = { greet };
`;

    webviewApi.sendMessage({
      command: "createFile",
      filePath,
      content,
      requestId: Date.now().toString(),
    });

    setStatus("Test file creation initiated...");
  };

  const testWorkspaceAnalysis = () => {
    // This should trigger the natural language processing in ChatProvider
    webviewApi.sendMessage({
      command: "sendMessage",
      text: "analyze workspace and tell me about the project structure",
    });

    setStatus("Workspace analysis initiated...");
  };

  const testFileSearch = () => {
    webviewApi.sendMessage({
      command: "sendMessage",
      text: 'search for "ChatProvider" in the codebase',
    });

    setStatus("File search initiated...");
  };

  return (
    <div
      className="file-operations-demo"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "var(--vscode-panel-background)",
        border: "1px solid var(--vscode-panel-border)",
        borderRadius: "8px",
        padding: "16px",
        zIndex: 1000,
        maxWidth: "300px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "14px" }}>File Operations Demo</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--vscode-foreground)",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <p style={{ fontSize: "12px", margin: "0 0 8px 0" }}>
          Test the new file operations:
        </p>
        {status && (
          <div
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              background: "var(--vscode-textCodeBlock-background)",
              borderRadius: "4px",
              marginBottom: "8px",
            }}
          >
            {status}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          onClick={testFileUpload}
          style={{
            padding: "6px 12px",
            background: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          📎 Test File Upload
        </button>

        <button
          onClick={testFileCreation}
          style={{
            padding: "6px 12px",
            background: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          📄 Test File Creation
        </button>

        <button
          onClick={testWorkspaceAnalysis}
          style={{
            padding: "6px 12px",
            background: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          🔍 Test Workspace Analysis
        </button>

        <button
          onClick={testFileSearch}
          style={{
            padding: "6px 12px",
            background: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          🔎 Test File Search
        </button>
      </div>

      <div
        style={{
          marginTop: "12px",
          fontSize: "11px",
          color: "var(--vscode-descriptionForeground)",
        }}
      >
        <p style={{ margin: 0 }}>💡 You can also try natural language:</p>
        <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
          <li>"Create a new React component"</li>
          <li>"Edit package.json to add a dependency"</li>
          <li>"Analyze the TypeScript files"</li>
          <li>"Search for error handling"</li>
        </ul>
      </div>
    </div>
  );
};

export default FileOperationsDemo;
