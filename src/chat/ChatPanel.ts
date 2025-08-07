import * as vscode from 'vscode';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class ChatPanel {
  private webview: vscode.Webview;
  private messages: Message[] = [];
  private onMessageCallback?: (message: string) => Promise<void>;

  constructor(webview: vscode.Webview) {
    this.webview = webview;
  }

  // Set callback for handling messages from the webview
  setMessageHandler(callback: (message: string) => Promise<void>): void {
    this.onMessageCallback = callback;
  }

  // Initialize chat panel with proper styling and layout
  init(): void {
    this.webview.html = this.getWebviewContent();
    this.setupMessageHandling();
  }

  // Add new message to chat display
  addMessage(role: 'user' | 'assistant', content: string): void {
    const message: Message = { role, content, timestamp: Date.now() };
    this.messages.push(message);
    
    // Update webview with new message
    this.webview.postMessage({
      command: 'addMessage',
      message: message
    });
  }

  // Clear all messages from panel
  clearMessages(): void {
    this.messages = [];
    this.webview.postMessage({
      command: 'clearMessages'
    });
  }

  // Get the HTML content for the webview
  private getWebviewContent(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMS Copilot Chat</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 16px;
            background-color: #1e1e1e;
            color: #cccccc;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding-bottom: 16px;
        }
        
        .message {
            margin-bottom: 16px;
            padding: 12px;
            border-radius: 8px;
            max-width: 80%;
        }
        
        .message.user {
            background-color: #0078d4;
            color: white;
            margin-left: auto;
        }
        
        .message.assistant {
            background-color: #2d2d30;
            border: 1px solid #3c3c3c;
        }
        
        .input-container {
            display: flex;
            gap: 8px;
            margin-top: 16px;
        }
        
        .message-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #3c3c3c;
            border-radius: 4px;
            background-color: #2d2d30;
            color: #cccccc;
            font-size: 14px;
        }
        
        .send-button {
            padding: 8px 16px;
            background-color: #0078d4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .send-button:hover {
            background-color: #106ebe;
        }
        
        .send-button:disabled {
            background-color: #3c3c3c;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="chat-container" id="chatContainer">
        <!-- Messages will be added here dynamically -->
    </div>
    
    <div class="input-container">
        <input type="text" id="messageInput" class="message-input" placeholder="Ask LMS Copilot anything..." />
        <button id="sendButton" class="send-button">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'addMessage':
                    addMessageToChat(message.message);
                    break;
                case 'clearMessages':
                    chatContainer.innerHTML = '';
                    break;
            }
        });

        // Add message to chat UI
        function addMessageToChat(message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${message.role}\`;
            messageDiv.textContent = message.content;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Send message to extension
        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                vscode.postMessage({
                    command: 'sendMessage',
                    text: text
                });
                messageInput.value = '';
                sendButton.disabled = true;
            }
        }

        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Enable/disable send button based on input
        messageInput.addEventListener('input', () => {
            sendButton.disabled = !messageInput.value.trim();
        });
        
        // Focus input on load
        messageInput.focus();
    </script>
</body>
</html>`;
  }

  // Setup message handling from webview
  private setupMessageHandling(): void {
    this.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'sendMessage':
          // Call the callback if it's set
          if (this.onMessageCallback) {
            await this.onMessageCallback(message.text);
          }
          break;
      }
    });
  }

  // Get all messages for context
  getMessages(): Message[] {
    return [...this.messages];
  }
}