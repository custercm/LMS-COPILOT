# LMS Copilot React UI Recovery Plan

## Overview
This document outlines the steps to recreate the missing React-based UI infrastructure for the LMS Copilot VS Code extension. The current implementation uses a basic webview, but we need to rebuild a sophisticated React-based chat interface with proper change management, diff viewing, and streaming capabilities.

---

## Step 1: Set up the React + TypeScript Build System

### 1.1 Update package.json Dependencies
Add the following dependencies to `package.json`:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@monaco-editor/react": "^4.6.0",
    "diff": "^5.1.0",
    "highlight.js": "^11.9.0",
    "marked": "^9.1.2",
    "prismjs": "^1.29.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "16.x",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/diff": "^5.0.0",
    "@types/marked": "^9.0.0",
    "typescript": "^5.0.0",
    "webpack": "^5.88.0",
    "ts-loader": "^9.4.0",
    "css-loader": "^6.8.1",
    "style-loader": "^3.3.3",
    "html-webpack-plugin": "^5.5.3"
  }
}
```

### 1.2 Create Webpack Configuration for React
Create `webpack.webview.config.js`:

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'development',
  entry: './src/webview/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist', 'webview'),
    filename: 'webview.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/webview/index.html'
    })
  ]
};
```

### 1.3 Update TypeScript Configuration
Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "src/**/*"
  ]
}
```

### 1.4 Update Build Scripts
Update `package.json` scripts:

```json
{
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "tsc -p ./",
    "watch": "tsc -w -p ./",
    "package": "webpack --mode production && webpack --config webpack.webview.config.js --mode production",
    "dev": "webpack --mode development && webpack --config webpack.webview.config.js --mode development",
    "watch:webview": "webpack --config webpack.webview.config.js --mode development --watch"
  }
}
```

---

## Step 2: Create the Missing React Components for the Chat Interface

### 2.1 Create Basic React Structure
Create the following directory structure:
```
src/webview/
├── index.tsx                 # Entry point
├── index.html               # HTML template
├── App.tsx                  # Main App component
├── components/
│   ├── ChatInterface.tsx    # Main chat container
│   ├── MessageList.tsx      # Message list component
│   ├── MessageItem.tsx      # Individual message component
│   ├── InputArea.tsx        # Chat input component
│   ├── CodeBlock.tsx        # Code block with actions
│   ├── DiffViewer.tsx       # Diff viewing component
│   ├── ActionButtons.tsx    # Keep/Undo/Apply buttons
│   └── StreamingIndicator.tsx # Typing indicator
├── hooks/
│   ├── useWebviewApi.ts     # VS Code webview API hook
│   ├── useStreaming.ts      # Streaming response hook
│   └── useChangeManagement.ts # Change tracking hook
├── types/
│   ├── messages.ts          # Message type definitions
│   ├── changes.ts           # Change management types
│   └── api.ts               # API type definitions
├── utils/
│   ├── messageParser.ts     # Parse markdown/code
│   ├── diffUtils.ts         # Diff calculation utilities
│   └── vscodeApi.ts         # VS Code API wrapper
└── styles/
    ├── globals.css          # Global styles
    ├── components.css       # Component styles
    └── themes.css           # VS Code theme integration
```

### 2.2 Key Component Specifications

#### ChatInterface.tsx
- Main container component
- Manages message state and streaming
- Handles change management state
- Integrates with VS Code webview API

#### MessageItem.tsx
- Renders individual messages (user/assistant)
- Supports markdown rendering
- Embeds CodeBlock components for code snippets
- Shows timestamps and status indicators

#### CodeBlock.tsx
- Syntax highlighting with Prism.js
- Action buttons: Copy, Apply, Run, Edit, Regenerate
- Integration with change management system
- Show/hide diff view toggle

#### DiffViewer.tsx
- Side-by-side or unified diff view
- Uses `diff` library for calculation
- Highlights additions/deletions
- Monaco Editor integration for syntax highlighting

#### ActionButtons.tsx
- Keep/Undo controls for change management
- Apply changes to workspace
- Batch operations for multiple changes
- Confirmation dialogs for destructive actions

---

## Step 3: Implement the Change Management System with Diff Viewing

### 3.1 Change Tracking Data Structure
Create `src/webview/types/changes.ts`:

```typescript
interface FileChange {
  id: string;
  filePath: string;
  originalContent: string;
  proposedContent: string;
  changeType: 'create' | 'modify' | 'delete';
  applied: boolean;
  timestamp: number;
}

interface ChangeSet {
  id: string;
  messageId: string;
  changes: FileChange[];
  status: 'pending' | 'applied' | 'reverted';
  description: string;
}
```

### 3.2 Change Management Hook
Create `src/webview/hooks/useChangeManagement.ts`:

```typescript
export function useChangeManagement() {
  const [changeSets, setChangeSets] = useState<ChangeSet[]>([]);
  const [pendingChanges, setPendingChanges] = useState<FileChange[]>([]);
  
  const applyChange = (changeId: string) => { /* Implementation */ };
  const revertChange = (changeId: string) => { /* Implementation */ };
  const previewChange = (changeId: string) => { /* Implementation */ };
  
  return {
    changeSets,
    pendingChanges,
    applyChange,
    revertChange,
    previewChange
  };
}
```

### 3.3 Diff Calculation Utilities
Create `src/webview/utils/diffUtils.ts`:

```typescript
import { diffLines, diffWordsWithSpace } from 'diff';

export function calculateFileDiff(original: string, proposed: string) {
  return diffLines(original, proposed);
}

export function formatDiffForDisplay(diff: any[]) {
  // Format diff for Monaco Editor or custom diff viewer
}
```

### 3.4 Integration with Backend
Update existing `ChatProvider.ts` to:
- Track proposed file changes
- Send change notifications to webview
- Handle apply/revert requests from webview
- Maintain change history

---

## Step 4: Add the Streaming Response System with Proper Animations

### 4.1 Streaming Hook Implementation
Create `src/webview/hooks/useStreaming.ts`:

```typescript
interface StreamingState {
  isStreaming: boolean;
  currentMessage: string;
  messageId: string;
  streamingSpeed: number;
}

export function useStreaming() {
  const [streamingState, setStreamingState] = useState<StreamingState>();
  
  const startStreaming = (messageId: string) => { /* Implementation */ };
  const appendToStream = (content: string) => { /* Implementation */ };
  const endStreaming = () => { /* Implementation */ };
  
  return {
    streamingState,
    startStreaming,
    appendToStream,
    endStreaming
  };
}
```

### 4.2 Streaming Indicator Component
Create `src/webview/components/StreamingIndicator.tsx`:
- Animated typing dots
- Progress indicator for long responses
- Cancel streaming button
- Token/word count display

### 4.3 Real-time Message Updates
- WebSocket-like communication with extension
- Smooth text animation as content streams in
- Handle code block streaming with syntax highlighting
- Progressive diff calculation as changes are proposed

### 4.4 Animation Specifications
- Typing indicator: 3-dot animation with 1.5s cycle
- Text streaming: Character-by-character with 50ms delay
- Code block reveal: Fade-in with syntax highlighting
- Diff animations: Color transitions for added/removed lines
- Button state changes: Smooth transitions for enabled/disabled states

---

## Implementation Priority Order

### Phase 1 (Core Infrastructure)
1. Set up React build system
2. Create basic chat interface without streaming
3. Implement message rendering with static content

### Phase 2 (Streaming)
1. Add streaming message support
2. Implement typing indicators
3. Add smooth text animations

### Phase 3 (Change Management)
1. Create diff viewing components
2. Implement change tracking
3. Add Keep/Undo controls

### Phase 4 (Polish)
1. Add advanced animations
2. Implement theme integration
3. Add keyboard shortcuts and accessibility

---

## Testing Strategy

### Unit Tests
- Component rendering tests
- Hook functionality tests
- Utility function tests

### Integration Tests
- Webview ↔ Extension communication
- Change management workflow
- Streaming message handling

### Manual Testing Scenarios
1. Send message and verify streaming animation
2. Receive code suggestion and test diff viewer
3. Apply changes and verify file updates
4. Revert changes and verify state restoration
5. Multiple concurrent change sets

---

## File Templates

### Basic HTML Template (`src/webview/index.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMS Copilot Chat</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
```

### Entry Point (`src/webview/index.tsx`)
```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
```

---

## Notes for Implementation

1. **VS Code Theme Integration**: Use CSS custom properties to match VS Code themes
2. **Performance**: Implement virtual scrolling for long message lists
3. **Accessibility**: Ensure keyboard navigation and screen reader support
4. **Error Handling**: Robust error boundaries and fallback UI
5. **Security**: Sanitize all user input and code content
6. **Mobile Support**: Responsive design for different panel sizes

This plan provides a comprehensive roadmap to recreate the missing React-based UI infrastructure. Each step builds upon the previous one, ensuring a solid foundation for the LMS Copilot extension.
