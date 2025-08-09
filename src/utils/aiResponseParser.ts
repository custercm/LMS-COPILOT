// AI Response Parser for detecting actionable patterns in AI responses
// This module parses AI responses to automatically detect and extract file operations,
// terminal commands, and other actions that should be executed automatically.

export interface ParsedAction {
  type: 'createFile' | 'modifyFile' | 'deleteFile' | 'runCommand' | 'openFile' | 'analyzeFile';
  filePath?: string;
  content?: string;
  command?: string;
  confidence: number; // 0.0 to 1.0 confidence score
  description?: string;
  lineRange?: { start: number; end: number };
}

export interface ParseResult {
  actions: ParsedAction[];
  hasActionableContent: boolean;
  summary: string;
}

export class AIResponseParser {
  private readonly minConfidence: number = 0.7;

  /**
   * Parse AI response and extract actionable patterns
   */
  parseForActions(response: string): ParseResult {
    const actions: ParsedAction[] = [];
    
    // Parse different types of actions
    actions.push(...this.parseFileCreation(response));
    actions.push(...this.parseFileModification(response));
    actions.push(...this.parseCommandExecution(response));
    actions.push(...this.parseFileOperations(response));

    // Remove duplicates by creating a map of unique actions
    const uniqueActions = this.deduplicateActions(actions);

    // Filter by confidence threshold
    const highConfidenceActions = uniqueActions.filter(
      (action: ParsedAction) => action.confidence >= this.minConfidence
    );

    return {
      actions: highConfidenceActions,
      hasActionableContent: highConfidenceActions.length > 0,
      summary: this.generateSummary(highConfidenceActions)
    };
  }

  /**
   * Remove duplicate actions based on type, filePath, and command
   */
  private deduplicateActions(actions: ParsedAction[]): ParsedAction[] {
    const seen = new Set<string>();
    const unique: ParsedAction[] = [];

    for (const action of actions) {
      const key = `${action.type}:${action.filePath || ''}:${action.command || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(action);
      }
    }

    return unique;
  }

  /**
   * Detect file creation patterns
   */
  private parseFileCreation(response: string): ParsedAction[] {
    const actions: ParsedAction[] = [];
    
    // Pattern 1: "I'll create <file>" or "Let me create <file>" and natural language variants
    const creationPatterns = [
      /(?:I'll|I will)\s+create\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?[`'"]*([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+with|\s+containing)?/gi,
      /(?:Let me|I'll go ahead and|I'm going to)\s+create\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?[`'"]*([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+with|\s+containing)?/gi,
      /(?:Creating|I'm creating|Let's create)\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?[`'"]*([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+with|\s+containing)?/gi,
      // Simple create patterns - match at beginning of line or sentence
      /(?:^|\.\s*|!\s*|\?\s*)(?:Create|create)\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?[`'"]*([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s*:|\s+with)?/gim,
      // Natural language: "Make a file called test.md with ..."
      /(?:Make|make|Create|create)\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?(?:named|called)?\s*[`'"]?([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]?(?:\s+with|\s+containing)?\s*(?:the\s+content\s+)?([\s\S]*?)(?:\.|$)/gim,
      // "Add a file test.md with ..."
      /Add\s+(?:a\s+)?file\s+[`'"]?([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]?\s+with\s+(?:the\s+content\s+)?([\s\S]*?)(?:\.|$)/gim
    ];

    for (const pattern of creationPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const filePath = match[1];
        let content = '';
        // For patterns with direct content capture
        if (match[2]) {
          content = match[2].trim();
        } else {
          // Try to extract content from following code blocks
          content = this.extractContentForFile(response, match.index) ?? '';
        }
        if (this.isValidFilePath(filePath)) {
          actions.push({
            type: 'createFile',
            filePath: filePath,
            content: content,
            confidence: 0.9,
            description: `Create ${filePath}${content ? ' with extracted content' : ''}`
          });
        }
      }
    }
    for (const pattern of creationPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const filePath = match[1];
        if (this.isValidFilePath(filePath)) {
          // Try to extract content from following code blocks
          const content = this.extractContentForFile(response, match.index);
          
          actions.push({
            type: 'createFile',
            filePath: filePath,
            content: content,
            confidence: 0.85,
            description: `Create ${filePath}${content ? ' with extracted content' : ''}`
          });
        }
      }
    }

    // Pattern 2: Code blocks with file path hints
    const codeBlockWithPathRegex = /```(?:\w+)?\s*\/\/\s*([^\n]+\.[a-zA-Z0-9]+)\s*\n([\s\S]*?)```/g;
    let match;
    while ((match = codeBlockWithPathRegex.exec(response)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].trim();
      
      if (this.isValidFilePath(filePath)) {
        actions.push({
          type: 'createFile',
          filePath: filePath,
          content: content,
          confidence: 0.8,
          description: `Create ${filePath} from code block`
        });
      }
    }

    return actions;
  }

  /**
   * Detect file modification patterns
   */
  private parseFileModification(response: string): ParsedAction[] {
    const actions: ParsedAction[] = [];
    
    const modificationPatterns = [
      /(?:I'll|I will|Let me|Let's)\s+(?:modify|update|edit|change|add to)\s+[`'"]*([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+by|\s+to)?/gi,
      /(?:Modifying|Updating|Editing)\s+[`'"]*([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+to|\s+by)?/gi,
      /(?:Add|Insert|Replace)\s+(?:this|the following)\s+(?:function|code|content)?\s*(?:to|in)\s+[`'"]*([^\s`'"<>]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s*:)?/gi
    ];

    for (const pattern of modificationPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const filePath = match[1];
        if (this.isValidFilePath(filePath)) {
          const content = this.extractContentForFile(response, match.index);
          
          actions.push({
            type: 'modifyFile',
            filePath: filePath,
            content: content,
            confidence: 0.8,
            description: `Modify ${filePath}${content ? ' with extracted content' : ''}`
          });
        }
      }
    }

    return actions;
  }

  /**
   * Detect command execution patterns
   */
  private parseCommandExecution(response: string): ParsedAction[] {
    const actions: ParsedAction[] = [];
    
    // Pattern 1: "I'll run/execute <command>"
    const commandPatterns = [
      /(?:I'll|I will|Let me|Let's)\s+(?:run|execute)\s+[`'"]*([^`'">\n]+)[`'"]*(?:\s+to|\s+for)?/gi,
      /(?:Running|Executing)\s+[`'"]*([^`'">\n]+)[`'"]*(?:\s+to|\s+for)?/gi,
      /(?:First|Next|Then)\s+(?:run|execute)\s+[`'"]*([^`'">\n]+)[`'"]*(?:\s+to|\s+for)?/gi
    ];

    for (const pattern of commandPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const command = match[1].trim();
        if (this.isValidCommand(command)) {
          actions.push({
            type: 'runCommand',
            command: command,
            confidence: 0.85,
            description: `Execute: ${command}`
          });
        }
      }
    }

    // Pattern 2: Code blocks that look like shell commands
    const shellCommandRegex = /```(?:bash|sh|shell|zsh|cmd)?\s*\n([^`]+)```/g;
    let match;
    while ((match = shellCommandRegex.exec(response)) !== null) {
      const commands = match[1].trim().split('\n').filter(line => 
        line.trim() && !line.trim().startsWith('#')
      );
      
      for (const command of commands) {
        const cleanCommand = command.trim().replace(/^\$\s*/, '');
        if (this.isValidCommand(cleanCommand)) {
          actions.push({
            type: 'runCommand',
            command: cleanCommand,
            confidence: 0.75,
            description: `Execute shell command: ${cleanCommand}`
          });
        }
      }
    }

    return actions;
  }

  /**
   * Detect other file operations (open, analyze, delete)
   */
  private parseFileOperations(response: string): ParsedAction[] {
    const actions: ParsedAction[] = [];
    
    // Open file patterns
    const openPatterns = [
      /(?:I'll|Let me|Let's)\s+(?:open|look at|examine|check)\s+[`'"]*([^`'">\s]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+to|\s+for)?/gi,
      /(?:Opening|Looking at|Examining)\s+[`'"]*([^`'">\s]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+to|\s+for)?/gi
    ];

    for (const pattern of openPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const filePath = match[1];
        if (this.isValidFilePath(filePath)) {
          actions.push({
            type: 'openFile',
            filePath: filePath,
            confidence: 0.75,
            description: `Open ${filePath}`
          });
        }
      }
    }

    // Analyze file patterns
    const analyzePatterns = [
      /(?:I'll|Let me|Let's)\s+(?:analyze|debug|investigate|review)\s+[`'"]*([^`'">\s]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+to|\s+for)?/gi,
      /(?:Analyzing|Debugging|Investigating|Reviewing)\s+[`'"]*([^`'">\s]+(?:\.[a-zA-Z0-9]+)?)[`'"]*(?:\s+to|\s+for)?/gi
    ];

    for (const pattern of analyzePatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const filePath = match[1];
        if (this.isValidFilePath(filePath)) {
          actions.push({
            type: 'analyzeFile',
            filePath: filePath,
            confidence: 0.8,
            description: `Analyze ${filePath}`
          });
        }
      }
    }

    return actions;
  }

  /**
   * Extract content that follows a file mention (usually code blocks)
   */
  private extractContentForFile(response: string, mentionIndex: number): string | undefined {
    // Look for code blocks within 500 characters after the file mention
    const searchText = response.substring(mentionIndex, mentionIndex + 500);
    const codeBlockMatch = searchText.match(/```[\w]*\s*\n([\s\S]*?)```/);
    
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Look for content in colon-prefixed blocks
    const colonBlockMatch = searchText.match(/:\s*\n((?:\s{2,}.*\n?)+)/);
    if (colonBlockMatch) {
      return colonBlockMatch[1].trim();
    }

    return undefined;
  }

  /**
   * Validate if a string looks like a valid file path
   */
  private isValidFilePath(path: string): boolean {
    if (!path || path.length === 0) return false;
    
    // Basic file path validation
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(path)) return false;
    
    // Should have a reasonable length
    if (path.length > 260) return false;
    
    // Should not start with special characters (except for valid path prefixes)
    if (/^[~]/.test(path)) return false;
    
    // Common file extensions or path patterns
    const hasValidExtension = /\.[a-zA-Z0-9]+$/.test(path);
    const hasPathSeparator = /[\/\\]/.test(path);
    
    // Allow simple filenames with extensions (like "test.js")
    // Or paths with separators
    return hasValidExtension || hasPathSeparator;
  }

  /**
   * Validate if a string looks like a valid command
   */
  private isValidCommand(command: string): boolean {
    if (!command || command.length === 0) return false;
    
    // Should not be too long
    if (command.length > 200) return false;
    
    // Should not contain dangerous patterns for basic safety
    const dangerousPatterns = /\b(rm\s+-rf\s+\/|format|del\s+\/)|sudo\s+rm|>\/dev\/null/i;
    if (dangerousPatterns.test(command)) return false;
    
    // Common command prefixes
    const commonCommands = /^(npm|yarn|git|node|python|pip|cd|ls|mkdir|touch|cat|grep|find|curl|wget|code|docker)/i;
    if (commonCommands.test(command)) return true;
    
    // Generic validation - should look command-like
    return /^[a-zA-Z][a-zA-Z0-9\s\-_.\/]*$/.test(command);
  }

  /**
   * Generate a summary of detected actions
   */
  private generateSummary(actions: ParsedAction[]): string {
    if (actions.length === 0) return 'No actionable content detected';
    
    const actionCounts = actions.reduce((counts, action) => {
      counts[action.type] = (counts[action.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const summaryParts: string[] = [];
    
    if (actionCounts.createFile) {
      summaryParts.push(`${actionCounts.createFile} file creation${actionCounts.createFile > 1 ? 's' : ''}`);
    }
    if (actionCounts.modifyFile) {
      summaryParts.push(`${actionCounts.modifyFile} file modification${actionCounts.modifyFile > 1 ? 's' : ''}`);
    }
    if (actionCounts.runCommand) {
      summaryParts.push(`${actionCounts.runCommand} command${actionCounts.runCommand > 1 ? 's' : ''}`);
    }
    if (actionCounts.openFile) {
      summaryParts.push(`${actionCounts.openFile} file open${actionCounts.openFile > 1 ? 's' : ''}`);
    }
    if (actionCounts.analyzeFile) {
      summaryParts.push(`${actionCounts.analyzeFile} file analysis action${actionCounts.analyzeFile > 1 ? 's' : ''}`);
    }

    return `Detected ${summaryParts.join(', ')}`;
  }

  /**
   * Set minimum confidence threshold for actions
   */
  setMinConfidence(confidence: number): void {
    if (confidence >= 0 && confidence <= 1) {
      (this as any).minConfidence = confidence;
    }
  }

  /**
   * Get current minimum confidence threshold
   */
  getMinConfidence(): number {
    return this.minConfidence;
  }
}

// Convenience function for simple parsing
export function parseAIResponse(response: string): ParseResult {
  const parser = new AIResponseParser();
  return parser.parseForActions(response);
}
