import { useState, useEffect } from 'react';

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

  const sendMessage = (message: any) => {
    vscode?.postMessage(message);
  };

  return { 
    vscode, 
    sendMessage 
  };
}

export default useWebviewApi;
