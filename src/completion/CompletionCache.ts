import * as vscode from "vscode";

/**
 * CompletionCache manages caching of completion results to improve performance
 * and reduce API calls to LM Studio
 */
export class CompletionCache {
  private cache = new Map<string, { completion: string; timestamp: number }>();
  private maxCacheSize = 100;
  private cacheExpirationMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a cache key based on context
   */
  private generateCacheKey(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: string,
  ): string {
    const lineText = document.lineAt(position).text;
    const prefix = lineText.substring(0, position.character);

    return `${document.languageId}:${prefix}:${context.substring(0, 100)}`;
  }

  /**
   * Get cached completion if available and not expired
   */
  getCachedCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: string,
  ): string | null {
    const key = this.generateCacheKey(document, position, context);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.cacheExpirationMs) {
      this.cache.delete(key);
      return null;
    }

    return cached.completion;
  }

  /**
   * Store completion in cache
   */
  setCachedCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: string,
    completion: string,
  ): void {
    const key = this.generateCacheKey(document, position, context);

    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      if (entries.length > 0) {
        const oldestKey = entries[0][0];
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      completion,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached completions
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }
}
