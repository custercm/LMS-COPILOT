import { useState, useEffect } from 'react';
import { WebviewCommand } from '../types/api';

// This would normally use VS Code's webview API
function useWebviewApi() {
  const [vscode, setVscode] = useState<any>(null);
  
  useEffect(() => {
    // @ts-ignore - This is provided by VS Code's webview environment
    if (window.acquireVsCodeApi) {
      // @ts-ignore
      setVscode(window.acquireVsCodeApi());
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const sendMessage = (message: WebviewCommand) => {
    vscode?.postMessage(message);
  };

  return { 
    vscode, 
    sendMessage 
  };
}

export default useWebviewApi;