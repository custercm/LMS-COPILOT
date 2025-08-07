# LMS Copilot Coding Style Manifest

**CRITICAL: Both Claude Sonnet 4 and Qwen 3 MUST follow these exact patterns to prevent conflicts and ensure consistent code architecture.**

## Project Overview
This is a VS Code extension that replicates GitHub Copilot functionality using LM Studio as the backend AI engine.

## Architecture Principles

### 1. Module Structure (NEVER CHANGE THESE PATHS)
```
src/
├── extension.ts                 # Main entry point
├── agent/                      # AI agent management
├── chat/                       # Chat-related functionality  
├── completion/                 # Code completion features
├── lmstudio/                   # LM Studio API integration
├── tools/                      # Workspace tools
├── ui/                         # UI management
└── webview/                    # React webview components
    ├── components/             # React components
    ├── hooks/                  # Custom React hooks
    ├── styles/                 # CSS files
    ├── types/                  # TypeScript types
    └── utils/                  # Utility functions
```

### 2. File Naming Conventions
- **Classes**: PascalCase (e.g., `ChatProvider.ts`, `LMStudioClient.ts`)
- **Components**: PascalCase (e.g., `ChatInterface.tsx`, `MessageList.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useWebviewApi.ts`)
- **Utils**: camelCase (e.g., `messageParser.ts`, `vscodeApi.ts`)
- **Types**: camelCase (e.g., `api.ts`, `messages.ts`)
- **Styles**: kebab-case matching component (e.g., `ChatInterface.css`)

## Code Style Standards

### 3. TypeScript Patterns

#### Interface Definitions
```typescript
// Always export interfaces, use PascalCase
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

// Use union types for strict typing
export type WebviewCommand = 'addMessage' | 'showTypingIndicator' | 'hideTypingIndicator';
```

#### Class Structure
```typescript
export class LMStudioClient {
  private readonly apiUrl: string;
  private readonly model: string;
  
  constructor(apiUrl: string, model: string) {
    this.apiUrl = apiUrl;
    this.model = model;
  }
  
  public async sendRequest(message: string): Promise<ChatResponse> {
    // Implementation
  }
}
```

#### Function Components (React)
```typescript
import React, { useState, useEffect } from 'react';

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<Type>(initialValue);
  
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### 4. VS Code Extension Patterns

#### Extension Registration
```typescript
export function activate(context: vscode.ExtensionContext) {
  // Always use this pattern for registrations
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'lmsCopilotChat',
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}
```

#### Command Registration
```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('lms-copilot.commandName', () => {
    // Command implementation
  })
);
```

### 5. CSS/Styling Rules

#### CSS Variable Usage (MANDATORY)
```css
/* ALWAYS use VS Code CSS variables for theming */
background-color: var(--vscode-editor-background);
color: var(--vscode-foreground);
border: 1px solid var(--vscode-focusBorder);

/* Standard VS Code color palette */
--user-bubble: var(--vscode-button-background);
--ai-bubble: rgba(30, 30, 40, 0.5);
--text-color: var(--vscode-foreground);
```

#### CSS Class Naming
```css
/* Use kebab-case for CSS classes */
.chat-interface { }
.message-item { }
.typing-indicator { }
.input-area { }
```

#### Component-Specific Styles
- Each component gets its own CSS file
- Import CSS in the component: `import './ComponentName.css';`
- Use CSS modules pattern when possible

### 6. File Operation Rules

#### NEVER DELETE OR RENAME THESE CORE FILES:
- `src/extension.ts`
- `src/webview/index.html`
- `src/webview/App.tsx`
- `package.json`
- `tsconfig.json`
- `webpack.config.js`
- `webpack.webview.config.js`

#### When Adding New Files:
- Follow the established directory structure
- Use appropriate naming conventions
- Add proper TypeScript types
- Include proper exports/imports

### 7. Import/Export Standards

#### TypeScript Imports
```typescript
// External imports first
import * as vscode from 'vscode';
import React, { useState, useEffect } from 'react';

// Internal imports second, grouped by type
import { ChatProvider } from './chat/ChatProvider';
import { LMStudioClient } from './lmstudio/LMStudioClient';
import type { ChatMessage, WebviewCommand } from './types/api';

// CSS imports last
import './ComponentName.css';
```

#### Export Patterns
```typescript
// Default exports for main classes/components
export default ChatInterface;

// Named exports for utilities/types
export { useWebviewApi, messageParser };
export type { ChatMessage, WebviewCommand };
```

### 8. Error Handling Standards

#### Async Function Error Handling
```typescript
public async sendRequest(message: string): Promise<ChatResponse> {
  try {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('LMStudioClient error:', error);
    throw error;
  }
}
```

#### UI Error Handling
```typescript
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    try {
      // Handle message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };
}, []);
```

### 9. Configuration Management

#### VS Code Settings
```typescript
// Always use configuration API
const config = vscode.workspace.getConfiguration('lmsCopilot');
const endpoint = config.get('endpoint') || 'http://localhost:1234';
const model = config.get('model') || 'llama3';
```

### 10. Package.json Standards

#### Dependencies Management
- Keep devDependencies separate from dependencies
- Use exact versions for critical packages
- Group related packages together

#### Build Scripts
```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "webpack",
    "watch": "webpack --watch",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts,tsx"
  }
}
```

## Critical Rules for AI Collaboration

### DO NOT:
1. Delete or rename existing files without explicit permission
2. Change the directory structure
3. Modify webpack configurations without understanding impact
4. Change CSS variable patterns
5. Alter the VS Code extension manifest structure
6. Remove existing imports that other files depend on

### DO:
1. Follow existing naming conventions exactly
2. Use established patterns for new features
3. Add proper TypeScript types for all new code
4. Test imports/exports before finalizing changes
5. Maintain consistency with existing error handling
6. Use VS Code CSS variables for all styling
7. Follow the established React patterns for components

### CONFLICT RESOLUTION:
If you encounter code that doesn't match these patterns:
1. Check if it's intentionally different for a specific reason
2. If updating, follow these patterns exactly
3. Never mix different coding styles in the same file
4. When in doubt, maintain the existing pattern

## Version Control Guidelines

### Commit Message Format
```
type(scope): description

feat(chat): add streaming response support
fix(webview): resolve CSS variable inheritance
docs(readme): update installation instructions
```

This manifest ensures all AI models write consistent, maintainable code that follows the established patterns in the LMS Copilot extension.
