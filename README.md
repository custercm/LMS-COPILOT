# LMS Copilot

A VS Code extension that replicates GitHub Copilot's functionality using LM Studio as the backend AI engine.

## Features

- 🤖 **Chat Interface**: Modern React-based chat interface with GitHub Copilot-style UI
- 🔄 **Streaming Responses**: Real-time streaming responses with typing indicators
- 📝 **Code Management**: Apply, preview, and manage code changes with diff viewing
- 🎨 **VS Code Theme Integration**: Seamlessly integrates with VS Code's theming system
- ⚡ **Local AI**: Powered by LM Studio for complete privacy and control

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Extension**:
   ```bash
   npm run dev
   ```

3. **Start LM Studio**:
   - Download and install [LM Studio](https://lmstudio.ai/)
   - Load your preferred AI model
   - Start the local server (default: http://localhost:1234)

4. **Install Extension**:
   - Press `F5` in VS Code to launch a new Extension Development Host
   - Or package the extension: `npm run package`

## Architecture

The extension consists of:

- **Extension Backend** (`src/chat/ChatProvider.ts`): Handles VS Code integration and LM Studio communication
- **React Frontend** (`src/webview/`): Modern chat interface with component-based architecture
- **WebView Bridge**: Seamless communication between VS Code and React components

## Configuration

Configure the extension in VS Code settings:

```json
{
  "lmsCopilot.endpoint": "http://localhost:1234",
  "lmsCopilot.model": "llama3"
}
```

## Development

- `npm run dev` - Build extension and webview in development mode
- `npm run watch` - Watch mode for extension TypeScript
- `npm run watch:webview` - Watch mode for React webview
- `npm run package` - Build production version

## Components

### React Components
- `ChatInterface` - Main chat container
- `MessageList` - Message display and management
- `MessageItem` - Individual message rendering with markdown support
- `CodeBlock` - Code display with syntax highlighting and action buttons
- `DiffViewer` - Side-by-side diff visualization using Monaco Editor
- `ActionButtons` - Copy, Apply, Run, Edit, and Regenerate actions
- `StreamingIndicator` - Animated typing indicator

### Custom Hooks
- `useStreaming` - Manages streaming response state
- `useChangeManagement` - Handles file change tracking and management
- `useWebviewApi` - VS Code webview API integration

## License

MIT License
