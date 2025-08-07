import * as vscode from 'vscode';

export class ContextAnalyzer {
  analyzeContext(document: vscode.TextDocument, position: vscode.Position): any {
    // Analyze current document context for better suggestions
    const line = document.lineAt(position);
    const linesBefore = Math.min(5, position.line); // Get up to 5 lines before
    const linesAfter = Math.min(5, document.lineCount - position.line - 1); // Get up to 5 lines after
    
    let contextBefore = '';
    let contextAfter = '';
    
    // Get context before cursor
    for (let i = position.line - linesBefore; i < position.line; i++) {
      if (i >= 0) {
        contextBefore += document.lineAt(i).text + '\n';
      }
    }
    
    // Get context after cursor
    for (let i = position.line + 1; i <= position.line + linesAfter; i++) {
      if (i < document.lineCount) {
        contextAfter += document.lineAt(i).text + '\n';
      }
    }
    
    // Implementation to extract relevant context information
    return { 
      lineContent: line.text,
      cursorPosition: position.character,
      language: document.languageId,
      contextBefore: contextBefore.trim(),
      contextAfter: contextAfter.trim(),
      fileName: document.fileName,
      lineNumber: position.line + 1
    };
  }

  getCurrentFile(): string {
    // Get current active file content for processing
    const editor = vscode.window.activeTextEditor;
    
    if (editor) {
      return editor.document.getText();
    }
    return "";
  }
  
  async analyzeContextForCompletion(document: vscode.TextDocument, position: vscode.Position): Promise<string> {
    const context = this.analyzeContext(document, position);
    
    // Implementation for analyzing context to provide better completions
    return `File: ${context.fileName}
Language: ${context.language}
Line ${context.lineNumber}: "${context.lineContent}"
Cursor at position: ${context.cursorPosition}

Context before:
${context.contextBefore}

Context after:
${context.contextAfter}`;
  }

  // Helper method to detect if we're inside a function, class, or other code structure
  detectCodeStructure(document: vscode.TextDocument, position: vscode.Position): string {
    const text = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
    
    // Simple pattern matching for common code structures
    const patterns = [
      { name: 'function', regex: /function\s+(\w+)/g },
      { name: 'class', regex: /class\s+(\w+)/g },
      { name: 'method', regex: /(\w+)\s*\(/g },
      { name: 'if_statement', regex: /if\s*\(/g },
      { name: 'for_loop', regex: /for\s*\(/g },
      { name: 'while_loop', regex: /while\s*\(/g }
    ];
    
    let detectedStructures: string[] = [];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches) {
        detectedStructures.push(`${pattern.name}: ${matches.length} occurrences`);
      }
    }
    
    return detectedStructures.length > 0 ? 
      `Detected structures: ${detectedStructures.join(', ')}` : 
      'No specific code structures detected';
  }
}