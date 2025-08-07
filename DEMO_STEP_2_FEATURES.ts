/**
 * Demo: LMS Copilot Step 2 - Chat Commands System
 * 
 * This file demonstrates the key features implemented in Step 2
 */

// 1. COMMAND PALETTE FEATURES
// - Press Ctrl+Shift+P to open command palette
// - Type to search commands with fuzzy matching
// - Use arrow keys to navigate, Enter to select
// - Categories: file, chat, code, workspace, debug

// 2. INPUT AREA ENHANCEMENTS
// - Type "/" to see command suggestions
// - Use Tab for auto-completion
// - Drag and drop files for attachment
// - Press ↑↓ to navigate command history

// 3. AVAILABLE COMMANDS
const availableCommands = [
  '/help [command]',           // Show help for all commands or specific command
  '/clear',                    // Clear chat history
  '/explain [file|selection]', // Explain code or file
  '/workspace [info|structure]', // Show workspace information
  '/install <package_name>',   // Install packages
  '/run [task|file]',         // Execute code or tasks
  '/debug [start|analyze]',   // Debug operations
  '/files [search|create|edit] <pattern>', // File operations
  '/git [status|commit|push] [message]',   // Git operations  
  '/search <query>',          // Search codebase
  '/settings [setting=value]', // Configure settings
  '/model [model_name]'       // Switch AI model
];

// 4. COMMAND HISTORY FEATURES
// - Automatic command history saving
// - Smart suggestions based on frequency
// - Favorites management
// - Export/import capabilities

// 5. KEYBOARD SHORTCUTS
const keyboardShortcuts = {
  'Ctrl+Shift+P': 'Open command palette',
  'Ctrl+Shift+H': 'Show help',
  'Ctrl+Shift+L': 'Clear chat',
  'Ctrl+Shift+E': 'Explain selection',
  'Ctrl+Shift+W': 'Workspace info',
  'Ctrl+Shift+R': 'Run task',
  'Ctrl+Shift+F': 'Search codebase',
  'F5': 'Start debugging'
};

// 6. FILE ATTACHMENT DEMO
// - Drag files into the input area
// - Supported formats: .txt, .md, .js, .ts, .tsx, .jsx, .py, .java, .cpp, .c, .h, .css, .html, .json, .xml, .yaml, .yml
// - Multiple file selection supported
// - Files show with removal option

// 7. COMMAND EXAMPLES
const commandExamples = {
  basic: [
    '/help',
    '/clear',
    '/workspace info'
  ],
  
  withArguments: [
    '/help explain',
    '/install react',
    '/search "component props"',
    '/git commit "Add new feature"'
  ],
  
  fileOperations: [
    '/files search *.tsx',
    '/files create components/NewComponent.tsx',
    '/explain src/App.tsx'
  ]
};

// 8. INTEGRATION POINTS
// The command system integrates with:
// - VS Code extension API
// - LM Studio backend
// - File system operations
// - Git operations
// - Package managers
// - Debugging tools

export {
  availableCommands,
  keyboardShortcuts,
  commandExamples
};
