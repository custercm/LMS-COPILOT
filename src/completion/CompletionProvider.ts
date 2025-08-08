import * as vscode from "vscode";
import { ContextAnalyzer } from "./ContextAnalyzer";
import { CompletionCache } from "./CompletionCache";
import { LMStudioClient } from "../lmstudio/LMStudioClient";

export class CompletionProvider implements vscode.InlineCompletionItemProvider {
  private contextAnalyzer: ContextAnalyzer = new ContextAnalyzer();
  private completionCache: CompletionCache = new CompletionCache();
  private lmStudioClient?: LMStudioClient;

  constructor(lmStudioClient?: LMStudioClient) {
    this.lmStudioClient = lmStudioClient;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[]> {
    // Check if completions are enabled
    const config = vscode.workspace.getConfiguration("lmsCopilot");
    const completionsEnabled = config.get<boolean>("enableCompletions", true);

    if (!completionsEnabled) {
      return [];
    }

    // Check if request was cancelled
    if (token.isCancellationRequested) {
      return [];
    }

    // Get context analysis
    const contextAnalysis =
      await this.contextAnalyzer.analyzeContextForCompletion(
        document,
        position,
      );

    // Check cache first
    const cachedCompletion = this.completionCache.getCachedCompletion(
      document,
      position,
      contextAnalysis,
    );
    if (cachedCompletion) {
      return [
        {
          insertText: cachedCompletion,
          range: new vscode.Range(position, position),
          command: {
            title: "Accept Cached Completion",
            command: "editor.action.inlineSuggest.commit",
          },
        },
      ];
    }

    // If we have an LM Studio client, try to get real completions
    if (this.lmStudioClient) {
      try {
        const currentLine = document.lineAt(position).text;
        const prefix = currentLine.substring(0, position.character);
        const suffix = currentLine.substring(position.character);

        // Get max completion length from configuration
        const maxLength = config.get<number>("completionMaxLength", 200);

        // Create a more sophisticated prompt for code completion
        const prompt = this.createCompletionPrompt(
          document,
          position,
          contextAnalysis,
          maxLength,
        );

        const response = await this.lmStudioClient.sendMessage(prompt);

        if (response && response.trim()) {
          // Clean and process the response
          const cleanedResponse = this.cleanCompletionResponse(
            response,
            maxLength,
          );

          // Cache the response
          this.completionCache.setCachedCompletion(
            document,
            position,
            contextAnalysis,
            cleanedResponse,
          );

          return [
            {
              insertText: cleanedResponse,
              range: new vscode.Range(position, position),
              command: {
                title: "Accept AI Completion",
                command: "editor.action.inlineSuggest.commit",
              },
            },
          ];
        }
      } catch (error) {
        console.error("LM Studio completion error:", error);
        // Fall back to smart completions if LM Studio fails
      }
    }

    // Smart fallback completions based on context
    return this.generateSmartFallbackCompletions(document, position);
  }

  /**
   * Create a sophisticated prompt for completion
   */
  private createCompletionPrompt(
    document: vscode.TextDocument,
    position: vscode.Position,
    contextAnalysis: string,
    maxLength: number,
  ): string {
    const currentLine = document.lineAt(position).text;
    const codeStructure = this.contextAnalyzer.detectCodeStructure(
      document,
      position,
    );

    return `Complete this ${document.languageId} code (max ${maxLength} characters):

${contextAnalysis}

Code structure context:
${codeStructure}

Provide a concise, syntactically correct completion that fits naturally at the cursor position. Only return the completion text, no explanations.`;
  }

  /**
   * Clean and process the completion response
   */
  private cleanCompletionResponse(response: string, maxLength: number): string {
    // Remove any explanation text or markdown formatting
    let cleaned = response.trim();

    // Remove common prefixes that might come from the AI
    const prefixesToRemove = [
      "Here is the completion:",
      "The completion is:",
      "Complete:",
      "```",
      "javascript",
      "typescript",
      "python",
      "java",
    ];

    for (const prefix of prefixesToRemove) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.substring(prefix.length).trim();
      }
    }

    // Remove trailing explanations
    const lines = cleaned.split("\n");
    let codeLines = [];

    for (const line of lines) {
      // Stop if we hit an explanation line
      if (line.trim().startsWith("//") && line.includes("explanation")) {
        break;
      }
      codeLines.push(line);
    }

    cleaned = codeLines.join("\n").trim();

    // Limit length
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
      // Try to end at a complete word or statement
      const lastSpace = cleaned.lastIndexOf(" ");
      const lastSemicolon = cleaned.lastIndexOf(";");
      const cutPoint = Math.max(lastSpace, lastSemicolon);
      if (cutPoint > maxLength * 0.8) {
        cleaned = cleaned.substring(0, cutPoint + 1);
      }
    }

    return cleaned;
  }

  /**
   * Generate smart fallback completions when LM Studio is not available
   */
  private generateSmartFallbackCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.InlineCompletionItem[] {
    const currentLine = document.lineAt(position).text;
    const prefix = currentLine.substring(0, position.character).trim();
    const language = document.languageId;

    const completions: vscode.InlineCompletionItem[] = [];

    // Language-specific smart completions
    switch (language) {
      case "javascript":
      case "typescript":
        if (prefix.endsWith("console.")) {
          completions.push(this.createCompletionItem("log('');", position, -2));
        } else if (prefix.endsWith("function ")) {
          completions.push(
            this.createCompletionItem("name() {\n  \n}", position, 0),
          );
        } else if (prefix.includes("if ")) {
          completions.push(
            this.createCompletionItem("(condition) {\n  \n}", position, 0),
          );
        }
        break;

      case "python":
        if (prefix.endsWith("def ")) {
          completions.push(
            this.createCompletionItem(
              "function_name():\n    pass",
              position,
              0,
            ),
          );
        } else if (prefix.endsWith("print(")) {
          completions.push(this.createCompletionItem("'')", position, -2));
        }
        break;

      case "java":
        if (prefix.endsWith("System.out.")) {
          completions.push(
            this.createCompletionItem('println("");', position, -3),
          );
        }
        break;
    }

    // Generic completions
    if (completions.length === 0) {
      completions.push(
        this.createCompletionItem("// TODO: Implement", position, 0),
        this.createCompletionItem("/* Comment */", position, 0),
      );
    }

    return completions;
  }

  /**
   * Helper to create completion items
   */
  private createCompletionItem(
    text: string,
    position: vscode.Position,
    cursorOffset: number = 0,
  ): vscode.InlineCompletionItem {
    const range = new vscode.Range(position, position);

    return {
      insertText: text,
      range: range,
      command: {
        title: "Accept Smart Completion",
        command: "editor.action.inlineSuggest.commit",
      },
    };
  }

  /**
   * Public method to clear completion cache
   */
  public clearCache(): void {
    this.completionCache.clearCache();
  }

  /**
   * Public method to get cache statistics
   */
  public getCacheStats(): { size: number; maxSize: number } {
    return this.completionCache.getCacheStats();
  }

  // Enhanced method to provide multi-line completions
  async provideMultiLineCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.InlineCompletionItem[]> {
    const contextAnalysis =
      await this.contextAnalyzer.analyzeContextForCompletion(
        document,
        position,
      );

    // In a real implementation, we would send the context analysis to LM Studio
    // and receive multi-line code completions
    return [
      {
        insertText: `// Based on your current context (${contextAnalysis}), here's a suggested multi-line completion:\n\nconst result = await fetch('/api/data');\nif (result.ok) {\n  const data = await result.json();\n  // Process the data\n}\n`,
        range: new vscode.Range(position, position),
        command: {
          title: "Accept Multi-line Completion",
          command: "editor.action.inlineSuggest.commit",
        },
      },
    ];
  }

  // Method to generate code from comments
  async provideCommentToCodeCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.InlineCompletionItem[]> {
    const line = document.lineAt(position);

    if (line.text.trim().startsWith("//")) {
      // Generate code based on comment content
      return [
        {
          insertText: `// This is the generated implementation for your comment\nfunction ${this.extractFunctionNameFromComment(line.text)}() {\n  // TODO: Implement functionality\n}\n`,
          range: new vscode.Range(position, position),
          command: {
            title: "Accept Generated Code",
            command: "editor.action.inlineSuggest.commit",
          },
        },
      ];
    }

    return [];
  }

  // Helper to extract function name from comment
  private extractFunctionNameFromComment(comment: string): string {
    const match = comment.match(/\/\/\s*(.*)/);
    if (match && match[1]) {
      // Convert comment to camelCase function name
      const functionName = match[1].replace(/\W+/g, " ").trim();
      return functionName
        .split(" ")
        .map((word, index) =>
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join("");
    }
    return "generatedFunction";
  }

  // Method to provide ghost text completions
  async provideGhostTextCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.InlineCompletionItem[]> {
    const contextAnalysis =
      await this.contextAnalyzer.analyzeContextForCompletion(
        document,
        position,
      );

    // Create ghost text suggestions that don't immediately commit
    return [
      {
        insertText:
          "// Ghost text suggestion based on context\nconsole.log('Suggested completion');",
        range: new vscode.Range(position, position),
        command: {
          title: "Accept Ghost Text",
          command: "editor.action.inlineSuggest.commit",
        },
      },
    ];
  }

  // Method to integrate with VS Code's completion API
  async provideCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.InlineCompletionItem[]> {
    const completions = [];

    // Add inline ghost text completions
    completions.push(
      ...(await this.provideGhostTextCompletions(document, position)),
    );

    // Add multi-line completions if needed
    completions.push(
      ...(await this.provideMultiLineCompletions(document, position)),
    );

    // Add comment-to-code completions
    completions.push(
      ...(await this.provideCommentToCodeCompletions(document, position)),
    );

    return completions;
  }
}
