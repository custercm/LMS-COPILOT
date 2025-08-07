import { Command } from '../components/CommandPalette';

export interface CommandContext {
  sendMessage: (message: string) => void;
  sendCommand: (command: string, args?: string) => void;
  clearChat: () => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export class CommandHandler {
  private context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  // Get all available commands
  getCommands(): Command[] {
    return [
      {
        name: '/help',
        description: 'Show available commands and usage instructions',
        shortcut: 'Ctrl+Shift+H',
        category: 'chat',
        handler: (args) => this.handleHelp(args)
      },
      {
        name: '/clear',
        description: 'Clear the chat history',
        shortcut: 'Ctrl+Shift+L',
        category: 'chat',
        handler: () => this.handleClear()
      },
      {
        name: '/explain',
        description: 'Explain selected code or file',
        shortcut: 'Ctrl+Shift+E',
        category: 'code',
        handler: (args) => this.handleExplain(args)
      },
      {
        name: '/workspace',
        description: 'Show workspace information and structure',
        shortcut: 'Ctrl+Shift+W',
        category: 'workspace',
        handler: (args) => this.handleWorkspace(args)
      },
      {
        name: '/install',
        description: 'Install packages or dependencies',
        category: 'workspace',
        handler: (args) => this.handleInstall(args)
      },
      {
        name: '/run',
        description: 'Execute code or run tasks',
        shortcut: 'Ctrl+Shift+R',
        category: 'code',
        handler: (args) => this.handleRun(args)
      },
      {
        name: '/debug',
        description: 'Start debugging session or analyze errors',
        shortcut: 'F5',
        category: 'debug',
        handler: (args) => this.handleDebug(args)
      },
      {
        name: '/files',
        description: 'Search and manipulate files in workspace',
        category: 'file',
        handler: (args) => this.handleFiles(args)
      },
      {
        name: '/git',
        description: 'Git operations and version control',
        category: 'workspace',
        handler: (args) => this.handleGit(args)
      },
      {
        name: '/search',
        description: 'Search across codebase or documentation',
        shortcut: 'Ctrl+Shift+F',
        category: 'code',
        handler: (args) => this.handleSearch(args)
      },
      {
        name: '/settings',
        description: 'Configure LMS Copilot settings',
        category: 'workspace',
        handler: (args) => this.handleSettings(args)
      },
      {
        name: '/model',
        description: 'Switch or configure AI model',
        category: 'workspace',
        handler: (args) => this.handleModel(args)
      }
    ];
  }

  // Execute a command by name
  executeCommand(commandName: string, args?: string): boolean {
    const command = this.getCommands().find(cmd => cmd.name === commandName);
    if (command) {
      try {
        command.handler(args);
        return true;
      } catch (error) {
        this.context.showError(`Error executing command ${commandName}: ${error}`);
        return false;
      }
    }
    
    this.context.showError(`Unknown command: ${commandName}`);
    return false;
  }

  // Command implementations
  private handleHelp(args?: string): void {
    if (args) {
      // Show help for specific command
      const command = this.getCommands().find(cmd => cmd.name === args || cmd.name === `/${args}`);
      if (command) {
        const helpMessage = `## ${command.name}

**Description:** ${command.description}

**Category:** ${command.category}

${command.shortcut ? `**Shortcut:** ${command.shortcut}` : ''}

**Usage Examples:**
- Basic: \`${command.name}\`
- With arguments: \`${command.name} [arguments]\`
`;
        this.context.sendMessage(helpMessage);
      } else {
        this.context.showError(`No help available for command: ${args}`);
      }
    } else {
      // Show general help
      const commands = this.getCommands();
      const categories = Array.from(new Set(commands.map(cmd => cmd.category)));
      
      let helpMessage = `# Available Commands

Type any command to get started, or use \`/help <command>\` for detailed information.

`;

      categories.forEach(category => {
        const categoryCommands = commands.filter(cmd => cmd.category === category);
        helpMessage += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Commands\n\n`;
        
        categoryCommands.forEach(cmd => {
          helpMessage += `- **${cmd.name}** - ${cmd.description}\n`;
        });
        helpMessage += '\n';
      });

      helpMessage += `## Tips
- Press **Ctrl+Shift+P** to open the command palette
- Use **Tab** to auto-complete commands
- Drag and drop files to attach them to your messages
- Use arrow keys to navigate command suggestions
`;

      this.context.sendMessage(helpMessage);
    }
  }

  private handleClear(): void {
    this.context.clearChat();
    this.context.showSuccess('Chat history cleared');
  }

  private handleExplain(args?: string): void {
    if (args) {
      this.context.sendCommand('explainCode', args);
    } else {
      this.context.sendCommand('explainSelection');
    }
  }

  private handleWorkspace(args?: string): void {
    const action = args || 'info';
    switch (action.toLowerCase()) {
      case 'info':
        this.context.sendCommand('getWorkspaceInfo');
        break;
      case 'structure':
        this.context.sendCommand('getWorkspaceStructure');
        break;
      case 'files':
        this.context.sendCommand('listWorkspaceFiles');
        break;
      default:
        this.context.sendCommand('getWorkspaceInfo');
    }
  }

  private handleInstall(args?: string): void {
    if (!args) {
      this.context.showError('Please specify a package to install. Usage: /install <package_name>');
      return;
    }
    this.context.sendCommand('installPackage', args);
  }

  private handleRun(args?: string): void {
    if (args) {
      this.context.sendCommand('runTask', args);
    } else {
      this.context.sendCommand('runCurrentFile');
    }
  }

  private handleDebug(args?: string): void {
    const action = args || 'start';
    switch (action.toLowerCase()) {
      case 'start':
        this.context.sendCommand('startDebugging');
        break;
      case 'analyze':
        this.context.sendCommand('analyzeErrors');
        break;
      case 'stop':
        this.context.sendCommand('stopDebugging');
        break;
      default:
        this.context.sendCommand('startDebugging');
    }
  }

  private handleFiles(args?: string): void {
    if (!args) {
      this.context.sendCommand('showFileExplorer');
      return;
    }

    const [action, ...params] = args.split(' ');
    const query = params.join(' ');

    switch (action.toLowerCase()) {
      case 'search':
        this.context.sendCommand('searchFiles', query);
        break;
      case 'create':
        this.context.sendCommand('createFile', query);
        break;
      case 'edit':
        this.context.sendCommand('editFile', query);
        break;
      case 'delete':
        this.context.sendCommand('deleteFile', query);
        break;
      default:
        this.context.sendCommand('searchFiles', args);
    }
  }

  private handleGit(args?: string): void {
    if (!args) {
      this.context.sendCommand('getGitStatus');
      return;
    }

    const [action, ...params] = args.split(' ');
    const message = params.join(' ');

    switch (action.toLowerCase()) {
      case 'status':
        this.context.sendCommand('getGitStatus');
        break;
      case 'commit':
        this.context.sendCommand('gitCommit', message);
        break;
      case 'push':
        this.context.sendCommand('gitPush');
        break;
      case 'pull':
        this.context.sendCommand('gitPull');
        break;
      case 'diff':
        this.context.sendCommand('gitDiff', message);
        break;
      default:
        this.context.sendCommand('getGitStatus');
    }
  }

  private handleSearch(args?: string): void {
    if (!args) {
      this.context.showError('Please specify a search query. Usage: /search <query>');
      return;
    }
    this.context.sendCommand('searchCodebase', args);
  }

  private handleSettings(args?: string): void {
    if (args) {
      const [setting, value] = args.split('=');
      if (value) {
        this.context.sendCommand('updateSetting', JSON.stringify({ setting: setting.trim(), value: value.trim() }));
      } else {
        this.context.sendCommand('getSetting', setting.trim());
      }
    } else {
      this.context.sendCommand('openSettings');
    }
  }

  private handleModel(args?: string): void {
    if (args) {
      this.context.sendCommand('switchModel', args);
    } else {
      this.context.sendCommand('listModels');
    }
  }

  // Parse command from input string
  static parseCommand(input: string): { command: string; args?: string } | null {
    if (!input.startsWith('/')) {
      return null;
    }

    const parts = input.split(' ');
    const command = parts[0];
    const args = parts.slice(1).join(' ').trim();

    return {
      command,
      args: args.length > 0 ? args : undefined
    };
  }

  // Get command suggestions based on input
  getCommandSuggestions(input: string): Command[] {
    const commands = this.getCommands();
    
    if (!input.startsWith('/')) {
      return [];
    }

    const searchTerm = input.toLowerCase();
    
    return commands.filter(cmd => 
      cmd.name.toLowerCase().includes(searchTerm) ||
      cmd.description.toLowerCase().includes(searchTerm)
    ).sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.name.toLowerCase().startsWith(searchTerm);
      const bExact = b.name.toLowerCase().startsWith(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.name.localeCompare(b.name);
    });
  }
}
