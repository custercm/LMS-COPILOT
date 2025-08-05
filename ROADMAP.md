
## 🎯 Overview

This roadmap outlines the comprehensive implementation plan for creating a **pixel-perfect GitHub Copilot replica** powered by LM Studio models. The goal is to build a VS Code extension that provides **identical agent-like capabilities** with chat interface, code completion, and multi-step task execution.

### 🔥 Core Features Matching GitHub Copilot
- ✅ **Chat Interface** - Identical UI/UX to GitHub Copilot Chat
- ✅ **Code Completions** - Inline suggestions and multi-line completions
- ✅ **Agent Mode** - Multi-step task execution with tool usage
- ✅ **Workspace Integration** - File operations and project understanding
- ✅ **Command Palette** - Quick actions and shortcuts
- ✅ **Context Awareness** - Understanding of current workspace and files
- ✅ **Streaming Responses** - Real-time AI response generation

### 🎨 UI/UX Design Requirements (Pixel-Perfect Match)

#### Chat Interface Visual Design
- **Exact GitHub Copilot Theme Colors**:
  - Background: `#1e1e1e` (dark theme) / `#ffffff` (light theme)
  - Chat bubbles: User `#0078d4`, AI `#2d2d30`
  - Text: `#cccccc` (dark) / `#333333` (light)
  - Borders: `#3c3c3c` (dark) / `#e5e5e5` (light)

- **Typography & Spacing**:
  - Font: VS Code default (`Consolas`, `Monaco`, `Courier New`)
  - Message padding: `12px 16px`
  - Line height: `1.4`
  - Border radius: `8px` for chat bubbles

- **Interactive Elements**:
  - Input field with placeholder: "Ask Copilot or type / for commands"
  - Send button with Copilot icon
  - Typing indicators with animated dots
  - Message timestamps (relative time)
  - Copy/edit/regenerate buttons on hover

#### Code Block Rendering
- **Syntax Highlighting**: Match VS Code's theme colors exactly
- **Copy Button**: Top-right corner with fade-in animation
- **Language Labels**: Top-left with proper language detection
- **Line Numbers**: Optional, matching editor style
- **Diff Highlighting**: Green/red for additions/deletions

#### Streaming Response Animation
- **Typing Effect**: Character-by-character reveal
- **Cursor Animation**: Blinking cursor at end of stream
- **Progress Indicators**: Spinner for tool execution
- **Smooth Transitions**: 200ms ease-in-out animations
- **Auto-scroll During Streaming**: Follow AI response as it types
- **Scroll Persistence**: Maintain scroll position when user manually scrolls up
- **Smart Scroll Resume**: Auto-resume scrolling when new content appears

## Project Structure & Core Architecture

```
lms-copilot-agent/
├── package.json                 # Main extension manifest
├── tsconfig.json               # TypeScript configuration
├── webpack.config.js           # Bundling configuration
├── .vscodeignore              # VS Code packaging ignore
├── src/
│   ├── extension.ts           # Main extension entry point
│   ├── agent/
│   │   ├── AgentManager.ts    # Core agent orchestration
│   │   ├── ConversationHistory.ts
│   │   └── TaskExecutor.ts    # Multi-step task handling
│   ├── chat/
│   │   ├── ChatProvider.ts    # Webview chat interface
│   │   ├── ChatPanel.ts       # Chat UI management
│   │   └── MessageHandler.ts  # Chat message processing
│   ├── lmstudio/
│   │   ├── LMStudioClient.ts  # API client for LM Studio
│   │   ├── ModelManager.ts    # Model selection/switching
│   │   └── StreamHandler.ts   # Streaming response handling
│   ├── tools/
│   │   ├── ToolRegistry.ts    # Available tools catalog
│   │   ├── FileOperations.ts  # File read/write/edit tools
│   │   ├── TerminalTools.ts   # Terminal command execution
│   │   ├── WorkspaceTools.ts  # VS Code workspace manipulation
│   │   └── CodeAnalysis.ts    # Code understanding tools
│   ├── completion/
│   │   ├── CompletionProvider.ts # Inline code completions
│   │   └── ContextAnalyzer.ts    # Code context analysis
│   └── ui/
│       ├── webview/           # React-based chat UI
│       │   ├── index.html
│       │   ├── main.tsx
│       │   ├── ChatInterface.tsx
│       │   └── MessageComponent.tsx
│       ├── commands/          # VS Code commands
│       └── PanelManager.ts    # Panel positioning and management
├── media/                     # Icons and assets
└── .github/
    └── copilot-instructions.md
```

## Core Components Implementation Details

### Extension Entry Point (`src/extension.ts`)
**Responsibilities:**
- Register chat provider and completion provider
- Initialize LM Studio connection
- Set up command palette commands
- Configure status bar integration
- Handle activation/deactivation lifecycle
- **Panel Management**: Register webview in bottom panel or right sidebar
- **Layout Control**: Allow users to switch between panel positions

### Panel Integration (`src/ui/PanelManager.ts`)
```typescript
interface PanelConfiguration {
  position: 'panel' | 'sidebar';
  defaultSize: number;
  resizable: boolean;
  collapsible: boolean;
}

class PanelManager {
  // Manage webview panel creation and positioning
  // Handle panel resize and collapse events
  // Switch between bottom panel and right sidebar
  // Preserve panel state across sessions
}
```

### LM Studio Integration (`src/lmstudio/`)

**LMStudioClient.ts:**
```typescript
interface LMStudioConfig {
  endpoint: string;        // Default: http://localhost:1234
  apiKey?: string;
  timeout: number;
  maxTokens: number;
}

class LMStudioClient {
  // HTTP client for /v1/chat/completions endpoint
  // Streaming support for real-time responses
  // Model enumeration and selection
  // Error handling and retry logic
}
```

**Key Features:**
- Auto-detect running LM Studio instance
- Support for multiple model switching with dropdown selector
- Streaming responses with abort capability
- Context window management
- Temperature and parameter control
- **Model Selection UI**: Dropdown matching GitHub Copilot's design
- **Real-time Model Status**: Show active model and performance metrics

### Chat Interface (`src/chat/`)

**ChatProvider.ts:**
- Implements VS Code WebviewViewProvider
- Manages chat session state
- Handles user input and AI responses
- Integrates with tool execution results

**UI Components to Match GitHub Copilot:**

#### 🎨 ChatInterface.tsx Visual Specifications
```typescript
interface ChatUITheme {
  // Exact GitHub Copilot colors
  colors: {
    background: '#1e1e1e',
    userBubble: '#0078d4',
    aiBubble: '#2d2d30',
    text: '#cccccc',
    accent: '#007acc',
    border: '#3c3c3c',
    hover: '#2a2d2e'
  },
  // Typography matching VS Code
  typography: {
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.4'
  },
  // Spacing and layout
  layout: {
    messagePadding: '12px 16px',
    borderRadius: '8px',
    maxWidth: '100%',
    avatarSize: '24px'
  },
  // Scroll behavior
  scrollBehavior: {
    autoScroll: true,
    scrollDuration: 300,
    scrollEasing: 'ease-out',
    scrollThreshold: 100 // pixels from bottom to trigger auto-scroll
  }
}
```

**Chat Layout Structure**:
```typescript
interface ChatLayoutProps {
  messages: Message[];
  isStreaming: boolean;
  autoScroll: boolean;
  showScrollButton: boolean;
  onScrollToBottom: () => void;
  onScrollStateChange: (isAtBottom: boolean) => void;
}

// Layout: Header + ScrollableMessages + FixedInput
<ChatContainer>
  <ChatHeader /> // Model selector, controls
  <ScrollContainer> // Scrollable message area
    <MessageList messages={messages} />
    <StreamingIndicator />
  </ScrollContainer>
  <ScrollToBottomButton /> // Shows when scrolled up
  <FixedInputArea /> // Always visible at bottom
</ChatContainer>
```

#### 📱 Chat Components Breakdown
1. **Message Container**
   - User messages: Right-aligned, blue bubble
   - AI messages: Left-aligned, dark bubble with Copilot avatar
   - System messages: Centered, muted style
   - **Auto-scroll**: Automatically scroll to bottom on new messages
   - **Smooth scrolling**: Animated scroll transitions
   - **Scroll-to-bottom button**: Appears when user scrolls up

2. **Input Area**
   - Multi-line text input with auto-resize
   - Placeholder: "Ask Copilot or type / for commands"
   - Send button with Copilot logo
   - Command suggestions dropdown
   - **Fixed positioning**: Stays anchored at bottom
   - **Always visible**: Input remains accessible during scroll
   - **File Drop Zone**: Visual indicators for drag & drop
   - **Paste Support**: Handle clipboard images and text
   - **Attachment Preview**: Show attached files before sending
   - **Voice Input**: Speech-to-text capability (optional)

3. **Media & File Handling**
   - **Image Preview**: Inline image display with zoom
   - **File Icons**: Type-specific icons for all file formats
   - **Content Analysis**: AI-powered file content understanding
   - **Batch Operations**: Handle multiple files simultaneously
   - **Progress Indicators**: Upload/analysis progress bars

4. **Code Blocks**
   - Language-aware syntax highlighting
   - Copy button with toast notification
   - Expand/collapse for long code
   - Apply/insert buttons for code suggestions
   - **Interactive Execution**: Run code directly in chat
   - **Diff View**: Show before/after changes with line-by-line highlighting
   - **Line-by-line Comments**: Annotate code sections
   - **Preview Changes**: Show what will be modified before applying
   - **Keep/Undo Controls**: Individual change approval with visual feedback

5. **File Change Management**
   - **Diff Preview Panel**: Side-by-side comparison of original vs modified
   - **Change Indicators**: Visual markers for additions (+), deletions (-), modifications (~)
   - **Keep/Undo Buttons**: Per-change approval system
   - **Batch Operations**: Apply/reject multiple changes at once
   - **Change History**: Track all modifications with rollback capability
   - **Live Preview**: Real-time preview of changes as they're generated

5. **File References**
   - Clickable file paths that open in editor
   - File icons matching VS Code's file explorer
   - Line number indicators for specific references
   - **Hover Previews**: Quick file content preview
   - **Thumbnail Generation**: Visual previews for images/diagrams

6. **Tool Execution Indicators**
   - Progress bars for long-running operations
   - Success/error status with appropriate icons
   - Expandable details for command outputs

**Features to Implement:**
- GitHub Copilot-style chat UI with exact visual matching
- Code block rendering with syntax highlighting
- File references and quick actions
- Tool execution progress indicators
- Conversation history persistence
- Dark/light theme support matching VS Code
- Smooth animations and transitions
- Context menus for messages (copy, edit, delete)
- Message reactions and feedback buttons

### Agent System (`src/agent/`)

**AgentManager.ts:**
```typescript
interface AgentCapabilities {
  fileOperations: boolean;
  terminalAccess: boolean;
  workspaceModification: boolean;
  webSearch: boolean;
  codeGeneration: boolean;
}

class AgentManager {
  // Orchestrate multi-step tasks
  // Tool selection and execution
  // Context management across steps
  // Error recovery and retry logic
}
```

### Tool System (`src/tools/`)

**Essential Tools to Implement:**

1. **File Operations:**
   - `readFile(path)` - Read file contents with encoding detection
   - `writeFile(path, content)` - Create/overwrite files
   - `editFile(path, changes)` - Apply specific edits with diff preview
   - `searchFiles(pattern)` - Find files by pattern with fuzzy matching
   - `listDirectory(path)` - List directory contents with metadata
   - `analyzeFileContent(file)` - Extract and analyze file content
   - `generateThumbnail(imagePath)` - Create image thumbnails

2. **Media Processing Tools:**
   - `analyzeImage(imageData)` - Describe and analyze images
   - `extractText(pdfPath)` - Extract text from PDFs
   - `parseCSV(csvPath)` - Parse and analyze CSV data
   - `readMetadata(filePath)` - Extract file metadata
   - `convertImageFormat(source, target)` - Convert image formats

3. **Terminal Tools:**
   - `executeCommand(command)` - Run shell commands with user approval prompt
   - `runInBackground(command)` - Long-running processes with confirmation
   - `getTerminalOutput(id)` - Retrieve command output
   - `killProcess(id)` - Terminate running processes
   - `requestTerminalPermission(command)` - Show approval dialog before execution
   - `validateCommand(command)` - Security check for dangerous commands
   - `suggestSaferAlternative(command)` - Propose safer command alternatives

4. **Workspace Tools:**
   - `openFile(path)` - Open file in editor at specific line
   - `showDocument(uri)` - Display document with highlighting
   - `getWorkspaceFiles()` - List all workspace files with git status
   - `searchInFiles(query)` - Text search across files with context
   - `getSelectedText()` - Get currently selected text in editor
   - `insertCode(code, position)` - Insert code at cursor position
   - `previewChanges(filePath, changes)` - Show diff preview before applying
   - `applyChanges(filePath, changes)` - Apply approved changes to file
   - `revertChanges(filePath, changeId)` - Undo specific changes

5. **Change Management Tools:**
   - `generateDiff(original, modified)` - Create detailed diff with line numbers
   - `parseChanges(diff)` - Break down changes into individual units
   - `trackChange(changeId, metadata)` - Record change for history tracking
   - `validateChanges(changes)` - Check for conflicts or issues
   - `batchApplyChanges(changesList)` - Apply multiple changes atomically

6. **File Change Management Tools:**
   - `trackFileChanges(filePath)` - Monitor file modifications
   - `getModifiedFiles()` - List all files with pending changes
   - `compareFileVersions(filePath, version1, version2)` - Compare file versions
   - `createFileSnapshot(filePath)` - Save current file state
   - `restoreFileSnapshot(filePath, snapshotId)` - Restore previous state
   - `getChangeHistory(filePath)` - Get chronological change history

7. **Code Analysis:**
   - `analyzeCode(content)` - AST parsing and analysis
   - `getDefinitions(symbol)` - Find symbol definitions
   - `getReferences(symbol)` - Find symbol usage
   - `formatCode(content)` - Code formatting

## Key Extension Features

### 🎯 GitHub Copilot Feature Parity

#### 🔄 Change Management System (Key Feature)

**Interactive Diff Preview**:
```typescript
interface ChangePreviewProps {
  originalContent: string;
  modifiedContent: string;
  fileName: string;
  changes: ChangeItem[];
  onKeepChange: (changeId: string) => void;
  onUndoChange: (changeId: string) => void;
  onApplyAll: () => void;
  onRejectAll: () => void;
}

interface ChangeItem {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  lineNumber: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
}
```

**Visual Design**:
- **Side-by-side diff view** with syntax highlighting
- **Green (+) indicators** for additions
- **Red (-) indicators** for deletions  
- **Yellow (~) indicators** for modifications
- **Keep/Undo buttons** for each change with hover effects
- **Batch controls** at top: "Apply All" / "Reject All"
- **Change counter**: "3 additions, 2 deletions, 1 modification"
- **Live preview** shows result as changes are approved/rejected

**Interaction Flow**:
1. AI suggests code changes in chat
2. User sees diff preview with highlighted changes
3. Each change has individual Keep/Undo buttons
4. User can approve/reject changes line by line
5. "Apply Changes" button becomes active when changes are approved
6. Changes are applied to actual file with animation feedback

#### 📁 File Change Tracking System

**Modified Files Panel**:
```typescript
interface FileChangeTracker {
  changedFiles: ModifiedFile[];
  showChangesPanel: boolean;
  onKeepFile: (fileId: string) => void;
  onUndoFile: (fileId: string) => void;
  onViewDiff: (fileId: string) => void;
}

interface ModifiedFile {
  id: string;
  path: string;
  fileName: string;
  changeType: 'modified' | 'created' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  status: 'pending' | 'kept' | 'undone';
  timestamp: Date;
}
```

**Visual Design**:
- **Collapsible panel** showing "1 file changed" or "X files changed"
- **File list** with icons, names, and change indicators
- **Change summary**: "+32 -7" style indicators
- **Keep/Undo buttons** for each file (matching screenshot)
- **View changes** button to open diff view
- **Batch actions**: "Keep All" / "Undo All" at panel level

**File Status Indicators**:
- **Blue dot**: File has pending changes
- **Green checkmark**: Changes have been kept/applied
- **Gray X**: Changes have been undone
- **File icons**: Match VS Code's file type icons
- **Hover previews**: Quick diff summary on hover

#### 🔐 Terminal Command Approval System (Safety First)

**Command Execution Flow**:
```typescript
interface TerminalCommandApproval {
  command: string;
  description: string;
  riskLevel: 'safe' | 'moderate' | 'dangerous';
  workingDirectory: string;
  estimatedDuration: string;
  sideEffects: string[];
  saferAlternatives?: string[];
}

class TerminalApprovalDialog {
  // Show approval dialog before any terminal command
  // Display command details and potential risks
  // Allow user to approve, modify, or reject
  // Track command history and patterns
}
```

**Visual Design (Matching GitHub Copilot)**:
- **Modal Dialog**: Appears when AI wants to run terminal command
- **Command Preview**: Shows exact command that will be executed
- **Risk Assessment**: Color-coded safety indicators
  - 🟢 **Safe**: `ls`, `pwd`, `cat`, `grep` (auto-approved)
  - 🟡 **Moderate**: `npm install`, `git commit`, `mkdir` (requires approval)
  - 🔴 **Dangerous**: `rm -rf`, `sudo`, `chmod 777` (warning + confirmation)
- **Working Directory**: Shows where command will execute
- **Side Effects**: Lists what files/folders might be affected
- **Approval Buttons**:
  - ✅ **"Allow"** - Execute command as shown
  - ✏️ **"Edit & Allow"** - Modify command before execution
  - ❌ **"Deny"** - Reject command and ask for alternative
  - 📝 **"Suggest Alternative"** - Ask AI for safer option

**Security Features**:
- **Command Validation**: Scan for dangerous patterns
- **Whitelist System**: Pre-approved safe commands (ls, cat, pwd)
- **Blacklist System**: Never allow certain commands (rm -rf /, format)
- **Directory Restrictions**: Limit execution to workspace folders
- **Permission Levels**: User can set approval preferences
- **Audit Trail**: Log all executed commands with timestamps
- **Undo Protection**: Track reversible vs irreversible operations

**User Experience**:
- **Smart Defaults**: Common safe commands auto-approved
- **Learning System**: Remember user preferences for command types
- **Batch Approval**: Allow multiple related commands at once
- **Context Awareness**: Show why command is needed
- **Progress Feedback**: Show command execution status
- **Output Preview**: Show command results in chat

#### Chat Commands (Exact Match)
- `/help` - Show available commands with interactive help
- `/clear` - Clear conversation history with confirmation
- `/explain` - Explain selected code or current file
- `/fix` - Suggest fixes for problems in current file
- `/tests` - Generate unit tests for selected code
- `/doc` - Generate documentation for functions/classes
- `/commit` - Generate commit messages from git changes
- `/workspace` - Analyze and explain workspace structure
- `/search <query>` - Search through workspace files
- `/analyze <file>` - Deep analysis of specific file
- `/compare <file1> <file2>` - Compare two files side by side
- `/translate <language>` - Translate code between languages
- `/optimize` - Suggest performance optimizations
- `/security` - Check for security vulnerabilities
- `/terminal` - Execute terminal commands with approval prompts

#### Advanced Chat Features
- **Slash Commands**: Auto-complete and suggestions with fuzzy search
- **File Attachments**: 
  - Drag & drop files directly into chat (supports all file types)
  - Image paste/drop with inline preview (PNG, JPG, SVG, etc.)
  - Multiple file selection and bulk upload
  - File content analysis and summarization
  - Clickable file references with quick preview
- **Media Support**:
  - Image analysis and description generation
  - Screenshot paste from clipboard
  - SVG and diagram interpretation
  - PDF content extraction and analysis
- **Code Selection**: 
  - Auto-reference selected code in editor
  - Multi-selection support across different files
  - Highlight referenced code sections in chat
- **Quick Actions**: 
  - One-click buttons for common tasks
  - Context-aware action suggestions
  - Custom action creation and shortcuts
- **History Navigation**: 
  - Up/down arrows for previous messages
  - Search through conversation history
  - Bookmark important conversations
- **Message Editing**: 
  - Edit previous messages inline
  - Regenerate AI responses
  - Branch conversations from any message
- **Context Switching**: 
  - Switch between different project contexts
  - Maintain separate conversation threads
  - Context-aware suggestions based on current workspace

#### Code Completion Features
- **Inline Completions**: Ghost text suggestions while typing
- **Multi-line Completions**: Complete functions/classes
- **Comment-to-Code**: Generate code from comments
- **Docstring Generation**: Auto-generate documentation
- **Variable/Function Naming**: Suggest meaningful names
- **Import Statements**: Auto-suggest and add imports
- **Error Fixing**: Suggest fixes for syntax/type errors

#### Agent Behaviors (Specialized Assistants)
- **🔍 Code Review Agent**: 
  - Analyze code quality and suggest improvements
  - Check for security vulnerabilities
  - Suggest performance optimizations
  - Review pull requests

- **🐛 Debug Agent**: 
  - Help troubleshoot runtime errors
  - Suggest debugging strategies
  - Analyze stack traces
  - Set up debugging configurations

- **♻️ Refactor Agent**: 
  - Suggest code refactoring opportunities
  - Extract methods/classes
  - Rename variables for clarity
  - Optimize imports and dependencies

- **📚 Documentation Agent**: 
  - Generate comprehensive documentation
  - Create README files
  - Write API documentation
  - Generate code comments

- **🧪 Test Agent**: 
  - Create unit tests with multiple test cases
  - Generate integration tests
  - Set up test frameworks
  - Mock external dependencies

#### Visual Elements & Animations
- **Loading States**: Skeleton loaders for chat messages
- **Progress Indicators**: Step-by-step task progress
- **Status Icons**: Success, error, warning, info states
- **Hover Effects**: Subtle animations on interactive elements
- **Smooth Scrolling**: Auto-scroll to new messages with easing
- **Fade Transitions**: Smooth appearance/disappearance
- **Typing Indicators**: Show when AI is "thinking"
- **Scroll Behavior**:
  - Auto-scroll to bottom on new messages
  - Smooth animated scrolling (300ms ease-out)
  - "Scroll to bottom" button when user scrolls up
  - Maintain scroll position during manual navigation
  - Resume auto-scroll when at bottom

## Configuration & Settings

### package.json Extensions
```json
{
  "contributes": {
    "views": {
      "panel": [
        {
          "type": "webview",
          "id": "lmsCopilotChat",
          "name": "LMS Copilot",
          "when": "lmsCopilot.enabled"
        }
      ]
    },
    "viewsContainers": {
      "panel": [
        {
          "id": "lmsCopilotContainer",
          "title": "LMS Copilot",
          "icon": "$(robot)"
        }
      ]
    },
    "commands": [
      {
        "command": "lmsCopilot.startChat",
        "title": "Start Chat",
        "category": "LMS Copilot"
      },
      {
        "command": "lmsCopilot.togglePanel",
        "title": "Toggle LMS Copilot Panel",
        "category": "LMS Copilot"
      }
    ],
    "configuration": {
      "title": "LMS Copilot",
      "properties": {
        "lmsCopilot.endpoint": {
          "type": "string",
          "default": "http://localhost:1234",
          "description": "LM Studio API endpoint"
        },
        "lmsCopilot.panelPosition": {
          "type": "string",
          "enum": ["panel", "sidebar"],
          "default": "panel",
          "description": "Where to show LMS Copilot: bottom panel or right sidebar"
        }
      }
    }
  }
}
```

## Dependencies & Tech Stack

### Core Dependencies:
```json
{
  "dependencies": {
    "axios": "^1.6.0",                    // HTTP client for LM Studio API
    "react": "^18.2.0",                   // Chat UI framework
    "react-dom": "^18.2.0",               // React DOM rendering
    "@types/vscode": "^1.80.0",           // VS Code API types
    "marked": "^5.0.0",                   // Markdown parsing
    "prismjs": "^1.29.0",                 // Syntax highlighting
    "monaco-editor": "^0.41.0",           // Code editor component
    "lucide-react": "^0.263.1",           // Beautiful icons
    "framer-motion": "^10.12.0",          // Smooth animations
    "react-syntax-highlighter": "^15.5.0", // Code block highlighting
    "react-markdown": "^8.0.7",           // Markdown rendering
    "tailwindcss": "^3.3.0",              // Utility-first CSS
    "clsx": "^2.0.0",                     // Conditional CSS classes
    "zustand": "^4.3.9",                  // State management
    "react-dropzone": "^14.2.3",          // File drag & drop
    "react-image-gallery": "^1.2.12",     // Image gallery component
    "pdf-parse": "^1.1.1",                // PDF text extraction
    "sharp": "^0.32.1",                   // Image processing
    "file-type": "^18.5.0",               // File type detection
    "mammoth": "^1.5.1",                  // DOCX to HTML conversion
    "xlsx": "^0.18.5",                    // Excel file processing
    "papaparse": "^5.4.1",                // CSV parsing
    "diff": "^5.1.0",                     // Text diffing algorithm
    "react-diff-viewer": "^3.1.1",        // Beautiful diff UI component
    "monaco-diff-editor": "^0.41.0"       // Advanced diff editor
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "webpack": "^5.88.0",
    "@types/react": "^18.2.0",
    "@types/prismjs": "^1.26.0",
    "esbuild": "^0.18.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}
```

### UI Component Library
```typescript
// Custom components matching GitHub Copilot exactly
interface CopilotUIComponents {
  // Layout Components
  ChatContainer: React.FC<ChatContainerProps>;
  MessageList: React.FC<MessageListProps>;
  InputArea: React.FC<InputAreaProps>;
  ScrollContainer: React.FC<ScrollContainerProps>;
  ScrollToBottomButton: React.FC<ScrollButtonProps>;
  
  // Message Components
  UserMessage: React.FC<MessageProps>;
  AIMessage: React.FC<MessageProps>;
  SystemMessage: React.FC<MessageProps>;
  
  // Interactive Components
  CodeBlock: React.FC<CodeBlockProps>;
  FileReference: React.FC<FileReferenceProps>;
  QuickAction: React.FC<QuickActionProps>;
  ProgressIndicator: React.FC<ProgressProps>;
  
  // Media Components
  ImagePreview: React.FC<ImagePreviewProps>;
  FileDropzone: React.FC<DropzoneProps>;
  AttachmentList: React.FC<AttachmentListProps>;
  MediaViewer: React.FC<MediaViewerProps>;
  
  // Change Management Components
  DiffViewer: React.FC<DiffViewerProps>;
  ChangePreview: React.FC<ChangePreviewProps>;
  KeepUndoControls: React.FC<KeepUndoProps>;
  ChangeIndicator: React.FC<ChangeIndicatorProps>;
  BatchChangeControls: React.FC<BatchControlsProps>;
  FileChangeTracker: React.FC<FileTrackerProps>;
  ModifiedFilesList: React.FC<ModifiedFilesProps>;
  FileStatusBadge: React.FC<FileStatusProps>;
  
  // Terminal Components
  TerminalApprovalDialog: React.FC<TerminalApprovalProps>;
  CommandPreview: React.FC<CommandPreviewProps>;
  RiskIndicator: React.FC<RiskIndicatorProps>;
  TerminalOutput: React.FC<TerminalOutputProps>;
  CommandHistory: React.FC<CommandHistoryProps>;
  SafetyBadge: React.FC<SafetyBadgeProps>;
  ApprovalButtons: React.FC<ApprovalButtonsProps>;
  
  // Utility Components
  Avatar: React.FC<AvatarProps>;
  Timestamp: React.FC<TimestampProps>;
  StatusIcon: React.FC<StatusIconProps>;
  LoadingSpinner: React.FC<LoadingProps>;
  ContextualMenu: React.FC<MenuProps>;
}
```

## Implementation Phases

### Phase 1: Core Foundation
**Priority: High | Timeline: Week 1**

1. **Basic Extension Scaffold**
   - Set up VS Code extension boilerplate
   - Configure TypeScript and build system
   - Create basic project structure

2. **LM Studio API Integration**
   - Implement LMStudioClient class
   - Add connection management
   - Test basic chat completions

3. **Simple Chat Interface**
   - Create basic webview chat UI
   - Implement message handling
   - Add basic styling

4. **Basic File Operations**
   - Implement core file tools
   - Add workspace file listing
   - Create simple file read/write functionality

### Phase 2: Agent Features
**Priority: High | Timeline: Week 2**

1. **Tool System Framework**
   - Design tool registry architecture
   - Implement tool execution pipeline
   - Add tool result handling

2. **Multi-step Task Execution**
   - Create TaskExecutor class
   - Implement task planning logic
   - Add progress tracking

3. **Context Management**
   - Build conversation history system
   - Implement context window management
   - Add memory persistence

4. **Code Completion Provider**
   - Integrate with VS Code completion API
   - Implement context analysis
   - Add inline completion suggestions

### Phase 3: Advanced Features
**Priority: Medium | Timeline: Week 3-4**

1. **Specialized Agent Behaviors**
   - Implement code review agent with visual diff highlighting
   - Add debugging assistance with interactive breakpoint suggestions
   - Create documentation generator with live preview
   - Build test generation with coverage visualization

2. **Advanced UI Components**
   - **Beautiful Chat Interface**: 
     - Smooth message animations with spring physics
     - Hover effects and micro-interactions
     - Loading skeletons for better perceived performance
     - Message reactions and feedback system
   
   - **Code Block Enhancements**:
     - Interactive code blocks with run/edit buttons
     - Diff view for code changes with Keep/Undo controls
     - Collapsible sections for long code
     - Copy-to-clipboard with success animation
     - **Change Approval System**:
       - Individual line change approval/rejection
       - Visual indicators for additions, deletions, modifications
       - Batch change management interface
       - Change history with rollback capabilities
       - **File-level tracking**: Panel showing all modified files
       - **Global Keep/Undo**: Manage changes across multiple files
   
   - **File Reference System**:
     - Clickable file paths with hover previews
     - Breadcrumb navigation for deep file paths
     - File type icons matching VS Code
     - Quick open and edit actions

3. **Configuration Management**
   - Beautiful settings UI with categories and search
   - Model switching with performance indicators
   - Theme customization options
   - Keyboard shortcut configuration
   - **Panel positioning**: Toggle between bottom panel and right sidebar
   - **Layout preferences**: Remember user's preferred panel position

4. **Error Handling and Recovery**
   - Graceful error states with helpful messaging
   - Retry mechanisms with exponential backoff
   - Offline mode detection and handling
   - Connection status indicators

## Critical Implementation Notes

### LM Studio API Integration
- Use OpenAI-compatible `/v1/chat/completions` endpoint
- Implement proper streaming with Server-Sent Events
- Handle model switching dynamically
- Manage context window limits effectively

### VS Code Integration
- Register as both chat and completion provider
- Use proper VS Code API patterns for UI components
- Implement proper disposal patterns for resources
- Handle extension lifecycle correctly

### Security Considerations
- Validate all tool inputs before execution
- Sandbox terminal command execution
- Implement file access permissions
- Add rate limiting for API calls
- Secure handling of user data and conversation history

## Success Metrics

### Functionality Goals
- [ ] Successful LM Studio connection and model switching
- [ ] Functional chat interface with streaming responses
- [ ] Working file operations and workspace manipulation
- [ ] Code completion with context awareness
- [ ] Multi-step task execution capabilities

### Performance Goals
- Response time < 500ms for simple queries
- Smooth streaming for long responses
- Efficient memory usage for conversation history
- Fast extension activation time

### User Experience Goals
- **Pixel-Perfect Interface**: Indistinguishable from GitHub Copilot's UI
- **Smooth Animations**: 60fps animations with spring physics
- **Instant Responsiveness**: Sub-100ms response to user interactions
- **Beautiful Typography**: Crisp text rendering with proper spacing
- **Consistent Theming**: Perfect dark/light theme transitions
- **Intuitive Interactions**: Hover states, focus indicators, and micro-feedback
- **Accessible Design**: Proper ARIA labels and keyboard navigation
- **Seamless Integration**: Feels native to VS Code environment

## Future Enhancements

### Advanced Agent Capabilities
- Web search integration
- Git operations and version control
- Advanced code refactoring
- Automated testing generation
- Documentation synchronization

### AI Model Features
- Multiple model support (different providers)
- Fine-tuning capabilities
- Custom prompt templates
- Model performance optimization

### Collaboration Features
- Team chat sharing
- Code review workflows
- Shared agent configurations
- Usage analytics and insights

---

*This roadmap is a living document and will be updated as development progresses and requirements evolve.*


# Features and Roadmap (condensed)

1. **Core Chat Interface**
   - Message display with different styling for user/agent
   - Multi-line text input field with auto-resize
   - Send button with keyboard shortcut support

2. **File Operations & Workspace Management**
   - File tree view with collapsible sections
   - Drag-and-drop file uploading
   - File content preview before modifications
   - Context-aware file paths for code references
   - File operation history tracking

3. **Media & File Handling**
   - Image preview inline with zoom capability
   - File icons matching VS Code's explorer
   - Content analysis using AI models
   - Batch operations support
   - Progress indicators during upload/analysis

4. **Code Blocks**
   - Language-aware syntax highlighting
   - Copy button with toast notification
   - Expand/collapse for long code blocks
   - Apply/insert buttons for code suggestions
   - Interactive execution capability
   - Diff view showing before/after changes
   - Line-by-line commenting support
   - Preview of changes before applying
   - Keep/undo controls for individual modifications

5. **File Change Management**
   - Diff preview panel with side-by-side comparison
   - Visual markers for additions (+), deletions (-), modifications (~)
   - Per-change approval system (keep/reject buttons)
   - Batch operations for multiple changes
   - Change history tracking with rollback capability
   - Live preview showing real-time changes

6. **File References**
   - Clickable file paths opening in editor
   - File icons matching VS Code's file explorer