import * as vscode from 'vscode';
import { ContextAnalyzer } from './ContextAnalyzer';

export class CompletionProvider implements vscode.InlineCompletionItemProvider {
  private contextAnalyzer: ContextAnalyzer = new ContextAnalyzer();
  
  provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.InlineCompletionItem[]> {
    // Implementation for providing inline code completions
    const contextAnalysis = this.contextAnalyzer.analyzeContextForCompletion(document, position);
    
    // Mock completion items - in a real implementation these would come from the LM Studio client
    return [
      {
        insertText: "// This is a sample completion\nconsole.log('Hello world');",
        range: new vscode.Range(position, position),
        command: {
          title: 'Accept Completion',
          command: 'editor.action.inlineSuggest.commit'
        }
      },
      {
        insertText: "function example() {\n  return true;\n}",
        range: new vscode.Range(position, position),
        command: {
          title: 'Accept Completion',
          command: 'editor.action.inlineSuggest.commit'
        }
      }
    ];
  }

  // Enhanced method to provide multi-line completions
  async provideMultiLineCompletions(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.InlineCompletionItem[]> {
    const contextAnalysis = await this.contextAnalyzer.analyzeContextForCompletion(document, position);
    
    // In a real implementation, we would send the context analysis to LM Studio
    // and receive multi-line code completions
    return [
      {
        insertText: `// Based on your current context (${contextAnalysis}), here's a suggested multi-line completion:\n\nconst result = await fetch('/api/data');\nif (result.ok) {\n  const data = await result.json();\n  // Process the data\n}\n`,
        range: new vscode.Range(position, position),
        command: {
          title: 'Accept Multi-line Completion',
          command: 'editor.action.inlineSuggest.commit'
        }
      }
    ];
  }

  // Method to generate code from comments
  async provideCommentToCodeCompletions(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.InlineCompletionItem[]> {
    const line = document.lineAt(position);
    
    if (line.text.trim().startsWith('//')) {
      // Generate code based on comment content
      return [
        {
          insertText: `// This is the generated implementation for your comment\nfunction ${this.extractFunctionNameFromComment(line.text)}() {\n  // TODO: Implement functionality\n}\n`,
          range: new vscode.Range(position, position),
          command: {
            title: 'Accept Generated Code',
            command: 'editor.action.inlineSuggest.commit'
          }
        }
      ];
    }
    
    return [];
  }

  // Helper to extract function name from comment
  private extractFunctionNameFromComment(comment: string): string {
    const match = comment.match(/\/\/\s*(.*)/);
    if (match && match[1]) {
      // Convert comment to camelCase function name
      const functionName = match[1].replace(/\W+/g, ' ').trim();
      return functionName.split(' ')
        .map((word, index) => 
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
    }
    return "generatedFunction";
  }

  // Method to provide ghost text completions
  async provideGhostTextCompletions(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.InlineCompletionItem[]> {
    const contextAnalysis = await this.contextAnalyzer.analyzeContextForCompletion(document, position);
    
    // Create ghost text suggestions that don't immediately commit
    return [
      {
        insertText: "// Ghost text suggestion based on context\nconsole.log('Suggested completion');",
        range: new vscode.Range(position, position),
        command: {
          title: 'Accept Ghost Text',
          command: 'editor.action.inlineSuggest.commit'
        }
      }
    ];
  }

  // Method to integrate with VS Code's completion API
  async provideCompletions(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.InlineCompletionItem[]> {
    const completions = [];
    
    // Add inline ghost text completions
    completions.push(...await this.provideGhostTextCompletions(document, position));
    
    // Add multi-line completions if needed
    completions.push(...await this.provideMultiLineCompletions(document, position));
    
    // Add comment-to-code completions
    completions.push(...await this.provideCommentToCodeCompletions(document, position));
    
    return completions;
  }
}