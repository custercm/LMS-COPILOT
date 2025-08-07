# CRITICAL WIRING ORDER FIX - DETAILED ROADMAP

## 🚨 CRITICAL IMPORTANCE
This document outlines the EXACT steps to fix wiring order issues while preserving ALL existing functionality. **FOLLOW THESE STEPS PRECISELY** to avoid regression of important features.

---

## 📋 CURRENT STATE ANALYSIS

### ✅ FEATURES TO PRESERVE (DO NOT DELETE OR BREAK):
1. **Chat Interface** - React-based UI with VS Code theme matching
2. **LM Studio Integration** - OpenAI-compatible API client with streaming
3. **File Operations** - Workspace file handling and references
4. **Code Completion** - AI-powered inline completions
5. **Agent System** - Task execution and code changes
6. **Security Framework** - Adaptive security with multiple levels
7. **Command Palette** - VS Code-style command interface
8. **Message Streaming** - Real-time response streaming
9. **Error Handling** - Comprehensive error management
10. **Extension Integration** - Webview and command registration
11. **Tool Registry** - File operations and terminal tools
12. **Conversation History** - Message history management
13. **Model Management** - Dynamic model switching
14. **Permission System** - File access permissions
15. **Rate Limiting** - API call throttling
16. **Webview Communication** - Bidirectional messaging

### ❌ CRITICAL WIRING ISSUES IDENTIFIED:
1. **Circular Dependencies** - ChatProvider creates dependencies then sets itself on them
2. **Duplicate Instances** - Multiple AgentManager and MessageHandler instances
3. **Race Conditions** - Webview communication setup before React app ready
4. **Null Reference Risks** - Components used before full initialization
5. **Order Dependencies** - Wrong initialization sequence

---

## 🔧 STEP-BY-STEP FIX PLAN

### **PHASE 1: PREPARATION AND BACKUP**

#### **Step 1.1: Create Backup of Critical Files**
```bash
# Create backup directory
mkdir -p ./backup-before-wiring-fix

# Backup critical files
cp src/extension.ts ./backup-before-wiring-fix/
cp src/chat/ChatProvider.ts ./backup-before-wiring-fix/
cp src/chat/MessageHandler.ts ./backup-before-wiring-fix/
cp src/ui/PanelManager.ts ./backup-before-wiring-fix/
cp src/agent/AgentManager.ts ./backup-before-wiring-fix/
```

#### **Step 1.2: Document Current Interface Contracts**
**CRITICAL**: These interfaces MUST be preserved exactly:

```typescript
// ChatProvider interface - PRESERVE EXACTLY
export class ChatProvider implements vscode.WebviewViewProvider {
    public async resolveWebviewView(webviewView, context, token) // KEEP
    // All handleXXX methods MUST remain - they're called by webview
    private async handleSendMessage(message: string) // KEEP
    private async handleGetModels() // KEEP
    private async handleSetModel(model: string) // KEEP
    private async handleAnalyzeWorkspace(structure: string) // KEEP
    private async handleGetWorkspaceStructure() // KEEP
    private async handleApplyChange(changeId: string, content: string) // KEEP
    private async handleRunCode(code: string, changeId?: string) // KEEP
    private async handleEditInEditor(content: string, changeId?: string) // KEEP
    private async handleRegenerateResponse(changeId?: string) // KEEP
    private async handleFileUpload(files: any[], requestId: string) // KEEP
    private async handleCreateFile(filePath: string, content: string, requestId: string) // KEEP
}

// MessageHandler interface - PRESERVE EXACTLY
export class MessageHandler {
    async handleMessage(message: string, source: 'provider' | 'panel') // KEEP
    setChatProvider(chatProvider: ChatProvider) // KEEP
    setChatPanel(chatPanel: ChatPanel) // KEEP
}

// AgentManager interface - PRESERVE EXACTLY
export class AgentManager {
    async processMessage(message: string) // KEEP
    getConversationHistory() // KEEP
    getTaskExecutor() // KEEP
    getToolRegistry() // KEEP
    async analyzeFileContent(filePath: string) // KEEP
    async executeTerminalCommand(command: string) // KEEP
    async saveFileChanges(changes: any[]) // KEEP
    async processTask(taskDescription: string) // KEEP
}
```

---

### **PHASE 2: DEPENDENCY INJECTION REFACTOR**

#### **Step 2.1: Modify ChatProvider Constructor (CRITICAL)**

**BEFORE** (Current - Creates own dependencies):
```typescript
constructor(client: LMStudioClient, extensionUri: vscode.Uri) { 
    this.client = client;
    this.extensionUri = extensionUri;
    
    // Initialize LM Studio components
    this.modelManager = new ModelManager();
    
    // Initialize agent manager - CREATES OWN INSTANCE
    this.agentManager = new AgentManager(client);
    
    // Initialize message handler - CREATES OWN INSTANCE
    this.messageHandler = new MessageHandler(this.agentManager);
    this.messageHandler.setChatProvider(this); // CIRCULAR DEPENDENCY
    
    // Initialize security components...
}
```

**AFTER** (Fixed - Accepts dependencies):
```typescript
constructor(
    client: LMStudioClient, 
    extensionUri: vscode.Uri,
    messageHandler?: MessageHandler,
    agentManager?: AgentManager
) { 
    this.client = client;
    this.extensionUri = extensionUri;
    
    // Initialize LM Studio components
    this.modelManager = new ModelManager();
    
    // Use provided dependencies OR create new ones (backward compatibility)
    this.agentManager = agentManager || new AgentManager(client);
    this.messageHandler = messageHandler || new MessageHandler(this.agentManager);
    
    // Initialize security components (PRESERVE ALL EXISTING LOGIC)
    this.securityManager = SecurityManager.getInstance();
    this.permissionsManager = PermissionsManager.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
    this.adaptiveSecurity = new AdaptiveSecurityManager();
    
    // Update security from VS Code settings (PRESERVE)
    this.updateSecurityFromSettings();
    
    // Listen for settings changes (PRESERVE)
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('lmsCopilot.securityLevel')) {
            this.updateSecurityFromSettings();
        }
    });
}

// ADD new method for post-construction wiring
public wireMessageHandler(): void {
    if (this.messageHandler) {
        this.messageHandler.setChatProvider(this);
    }
}
```

#### **Step 2.2: Fix Extension.ts Initialization Order**

**BEFORE** (Current - Duplicate instances):
```typescript
export function activate(context: vscode.ExtensionContext) {
    // Create LM Studio client
    const lmStudioClient = new LMStudioClient();
    
    // Create panel manager
    const panelManager = new PanelManager(config, lmStudioClient);
    
    // Create agent manager - INSTANCE 1
    const agentManager = new AgentManager(lmStudioClient);
    
    // Create message handler - INSTANCE 1
    const messageHandler = new MessageHandler(agentManager);
    
    // Wire panel manager
    panelManager.setAgentManager(agentManager);
    panelManager.setMessageHandler(messageHandler);
    
    // Create ChatProvider - CREATES INSTANCES 2 & 3 INTERNALLY!
    const chatProvider = new ChatProvider(lmStudioClient, context.extensionUri);
}
```

**AFTER** (Fixed - Single instances):
```typescript
export function activate(context: vscode.ExtensionContext) {
    console.log('LMS Copilot extension is now active!');
    
    // PHASE 1: Create Core Services (No Dependencies)
    const lmStudioClient = new LMStudioClient();
    
    // PHASE 2: Create Services with Dependencies
    const agentManager = new AgentManager(lmStudioClient);
    const messageHandler = new MessageHandler(agentManager);
    
    // PHASE 3: Create UI Components with Dependency Injection
    const chatProvider = new ChatProvider(
        lmStudioClient, 
        context.extensionUri,
        messageHandler,
        agentManager
    );
    
    // PHASE 4: Wire Bidirectional References (After All Objects Exist)
    chatProvider.wireMessageHandler();
    
    // PHASE 5: Create Panel Manager and Wire Dependencies
    const panelManager = new PanelManager(
        {
            title: 'LMS Copilot Chat',
            viewType: 'lmsCopilotChat'
        },
        lmStudioClient
    );
    
    panelManager.setAgentManager(agentManager);
    panelManager.setMessageHandler(messageHandler);
    
    // PHASE 6: Register VS Code Providers (PRESERVE ALL EXISTING LOGIC)
    const chatProviderDisposable = vscode.window.registerWebviewViewProvider(
        'lmsCopilotChat',
        chatProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );

    // PRESERVE ALL EXISTING COMPLETION PROVIDER LOGIC
    const completionProvider = new CompletionProvider(lmStudioClient);
    const completionProviderDisposable = vscode.languages.registerInlineCompletionItemProvider(
        { scheme: 'file' },
        completionProvider
    );
    
    // PRESERVE ALL EXISTING COMMAND REGISTRATIONS
    // ... (all existing commands remain exactly the same)
    
    // PRESERVE ALL EXISTING DISPOSABLES
    context.subscriptions.push(
        // ... (all existing disposables)
    );
}
```

---

### **PHASE 3: WEBVIEW COMMUNICATION FIXES**

#### **Step 3.1: Add Webview Ready State Management**

**Add to ChatProvider.ts** (PRESERVE all existing methods):
```typescript
private webviewReady: boolean = false;
private pendingMessages: any[] = [];

public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
) { 
    // Store the webview reference for later use
    this._webviewView = webviewView;
    
    // PRESERVE ALL EXISTING WEBVIEW OPTIONS
    webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.joinPath(this.extensionUri, 'dist')
        ],
        portMapping: [
            {
                webviewPort: 3000,
                extensionHostPort: 3000
            }
        ]
    };
    
    // Set the HTML content for the webview
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // WAIT for webview to be ready before setting up message handler
    this.setupWebviewReadyDetection(webviewView);
}

private setupWebviewReadyDetection(webviewView: vscode.WebviewView): void {
    // Set up message handler immediately but queue messages until ready
    webviewView.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'webviewReady') {
            this.webviewReady = true;
            // Process any pending messages
            for (const pendingMessage of this.pendingMessages) {
                await this.processWebviewMessage(pendingMessage);
            }
            this.pendingMessages = [];
            return;
        }
        
        if (!this.webviewReady) {
            this.pendingMessages.push(message);
            return;
        }
        
        await this.processWebviewMessage(message);
    });
}

private async processWebviewMessage(message: any): Promise<void> {
    // MOVE ALL EXISTING MESSAGE PROCESSING LOGIC HERE
    // This preserves all existing functionality while adding proper sequencing
    
    try {
        // PRESERVE ALL EXISTING RATE LIMITING LOGIC
        if (this.adaptiveSecurity.shouldRateLimit('chat_messages')) {
            const rateLimitResult: RateLimitResult = this.rateLimiter.checkLimit('chat_messages');
            if (!rateLimitResult.allowed) {
                this._webviewView?.webview.postMessage({
                    command: 'error',
                    message: `Rate limit exceeded: ${rateLimitResult.reason}. Try again in ${rateLimitResult.retryAfter} seconds.`
                });
                return;
            }
        }

        // PRESERVE ALL EXISTING SANITIZATION LOGIC
        const sanitizedMessage = {
            ...message,
            text: message.text ? this.adaptiveSecurity.sanitizeInput(message.text) : message.text,
            content: message.content ? this.adaptiveSecurity.sanitizeInput(message.content) : message.content,
            code: message.code ? this.adaptiveSecurity.sanitizeInput(message.code) : message.code
        };

        // PRESERVE ALL EXISTING SWITCH CASE LOGIC EXACTLY
        switch (sanitizedMessage.command) {
            case 'sendMessage':
                await this.handleSendMessage(sanitizedMessage.text);
                return;
            case 'getModels':
                await this.handleGetModels();
                return;
            // ... ALL OTHER CASES REMAIN EXACTLY THE SAME
        }
    } catch (error) {
        // PRESERVE ALL EXISTING ERROR HANDLING
        console.error('Error processing webview message:', error);
        
        if (this.adaptiveSecurity.shouldLogAudit()) {
            this.securityManager.logAuditEvent({
                type: 'message_processing_error',
                timestamp: new Date(),
                approved: false,
                details: { 
                    command: message.command, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                }
            });
        }
        
        this._webviewView?.webview.postMessage({
            command: 'error',
            message: 'An error occurred while processing your request. Please try again.'
        });
    }
}
```

#### **Step 3.2: Update React App to Signal Ready State**

**Add to src/webview/App.tsx**:
```typescript
useEffect(() => {
    // Signal to VS Code that webview is ready
    if (webviewApi) {
        webviewApi.sendMessage({ command: 'webviewReady' });
    }
}, [webviewApi]);
```

---

### **PHASE 4: NULL SAFETY AND ERROR HANDLING**

#### **Step 4.1: Add Null Guards to PanelManager**

**Fix PanelManager.ts**:
```typescript
createPanel(): void {
    if (this.currentPanel) {
        this.currentPanel.reveal();
        return;
    }

    // PRESERVE ALL EXISTING PANEL CREATION LOGIC
    this.currentPanel = vscode.window.createWebviewPanel(
        this.configuration.viewType,
        this.configuration.title,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    this.chatPanel = new ChatPanel(this.currentPanel.webview);

    // ADD NULL SAFETY
    if (this.messageHandler) {
        this.chatPanel.setMessageHandler(async (text: string) => {
            try {
                await this.messageHandler!.handleMessage(text, 'panel');
            } catch (error) {
                this.chatPanel!.addMessage('assistant', `Error: ${(error as Error).message}`);
            }
        });

        // Wire AFTER setting up the callback
        this.messageHandler.setChatPanel(this.chatPanel);
    } else {
        console.warn('PanelManager: MessageHandler not set, chat functionality will be limited');
    }

    this.chatPanel.init();

    // PRESERVE ALL EXISTING MESSAGE HANDLING
    this.currentPanel.webview.onDidReceiveMessage(async message => {
        await this.handleWebviewMessage(message);
    });

    // PRESERVE ALL EXISTING DISPOSAL LOGIC
    this.currentPanel.onDidDispose(() => {
        this.currentPanel = null;
        this.chatPanel = null;
    });
}
```

---

### **PHASE 5: VALIDATION AND TESTING**

#### **Step 5.1: Create Validation Script**

**Create validate-wiring.js**:
```javascript
const fs = require('fs');

// Validation checks to ensure no functionality was lost
const validationChecks = [
    {
        name: 'ChatProvider has all required methods',
        check: () => {
            const chatProviderContent = fs.readFileSync('src/chat/ChatProvider.ts', 'utf8');
            const requiredMethods = [
                'handleSendMessage',
                'handleGetModels',
                'handleSetModel',
                'handleAnalyzeWorkspace',
                'handleGetWorkspaceStructure',
                'handleApplyChange',
                'handleRunCode',
                'handleEditInEditor',
                'handleRegenerateResponse',
                'handleFileUpload',
                'handleCreateFile'
            ];
            
            return requiredMethods.every(method => 
                chatProviderContent.includes(`private async ${method}(`) ||
                chatProviderContent.includes(`async ${method}(`)
            );
        }
    },
    {
        name: 'Security components preserved',
        check: () => {
            const chatProviderContent = fs.readFileSync('src/chat/ChatProvider.ts', 'utf8');
            return [
                'SecurityManager',
                'PermissionsManager', 
                'RateLimiter',
                'AdaptiveSecurityManager'
            ].every(component => chatProviderContent.includes(component));
        }
    },
    {
        name: 'Extension commands preserved',
        check: () => {
            const extensionContent = fs.readFileSync('src/extension.ts', 'utf8');
            return [
                'lms-copilot.startChat',
                'lms-copilot.togglePanel',
                'lms-copilot.enableCompletions',
                'lms-copilot.disableCompletions'
            ].every(command => extensionContent.includes(command));
        }
    },
    {
        name: 'MessageHandler interface preserved',
        check: () => {
            const messageHandlerContent = fs.readFileSync('src/chat/MessageHandler.ts', 'utf8');
            return [
                'handleMessage',
                'setChatProvider',
                'setChatPanel'
            ].every(method => messageHandlerContent.includes(method));
        }
    }
];

// Run validation
console.log('🔍 Validating wiring fixes...\n');

let allPassed = true;
validationChecks.forEach(check => {
    try {
        const passed = check.check();
        console.log(`${passed ? '✅' : '❌'} ${check.name}`);
        if (!passed) allPassed = false;
    } catch (error) {
        console.log(`❌ ${check.name} - Error: ${error.message}`);
        allPassed = false;
    }
});

console.log(`\n${allPassed ? '🎉 All validation checks passed!' : '⚠️  Some validation checks failed!'}`);
process.exit(allPassed ? 0 : 1);
```

#### **Step 5.2: Testing Checklist**

After each phase, run these tests:

1. **Compilation Test**: `npm run compile`
2. **Unit Tests**: `npm run test:unit`
3. **Validation Script**: `node validate-wiring.js`
4. **Manual Testing**:
   - Load extension in VS Code dev mode
   - Open chat panel
   - Send a message
   - Try file operations
   - Test command palette
   - Verify security features work

---

## 🚨 CRITICAL SUCCESS CRITERIA

### ✅ MUST WORK AFTER FIX:
1. **Chat Interface** - Messages send and receive properly
2. **Streaming Responses** - Real-time message updates
3. **File Operations** - Open, create, edit files
4. **Code Completion** - Inline AI completions
5. **Command Palette** - All commands accessible
6. **Security Features** - Rate limiting, permissions, sanitization
7. **Model Management** - Switch between AI models
8. **Error Handling** - Graceful error messages
9. **Extension Commands** - All VS Code commands work
10. **Webview Communication** - Bidirectional messaging

### ❌ BREAKING CHANGES NOT ALLOWED:
1. Removing any public methods
2. Changing method signatures
3. Removing security features
4. Breaking webview communication
5. Losing configuration settings
6. Removing error handling
7. Breaking tool registry
8. Losing conversation history

---

## 📝 EXECUTION PLAN

### **Phase 1 Completion Criteria:**
- [ ] Backup files created
- [ ] Interface contracts documented
- [ ] All current functionality catalogued

### **Phase 2 Completion Criteria:**
- [ ] ChatProvider constructor accepts dependencies
- [ ] Extension.ts uses single instances
- [ ] Compilation successful
- [ ] No circular dependencies

### **Phase 3 Completion Criteria:**
- [ ] Webview ready state implemented
- [ ] Message queuing works
- [ ] No race conditions
- [ ] React app signals ready

### **Phase 4 Completion Criteria:**
- [ ] All null checks added
- [ ] Error handling preserved
- [ ] No runtime exceptions
- [ ] Graceful degradation

### **Phase 5 Completion Criteria:**
- [ ] All validation checks pass
- [ ] Unit tests pass
- [ ] Manual testing successful
- [ ] No regression in functionality

---

## 🛡️ ROLLBACK PLAN

If any step fails:

1. **Stop immediately**
2. **Restore from backup**:
   ```bash
   cp ./backup-before-wiring-fix/* src/
   ```
3. **Run validation**:
   ```bash
   npm run compile
   npm test
   ```
4. **Identify specific issue**
5. **Fix incrementally**
6. **Retest before continuing**

---

## 📞 SUPPORT CHECKLIST

When asking for help with each step:

1. **Specify exact step number**
2. **Include error messages**
3. **Mention what was working before**
4. **Confirm backup was created**
5. **Run validation script**

This roadmap ensures we fix the wiring issues while preserving every single feature you've built!
