import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import { useWebviewApi } from './hooks/useWebviewApi';

function App() {
  const webviewApi = useWebviewApi();

  return (
    <div className="app">
      <ChatInterface />
    </div>
  );
}

export default App;