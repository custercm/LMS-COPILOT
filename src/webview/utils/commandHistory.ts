interface CommandHistoryItem {
  command: string;
  args?: string;
  timestamp: number;
  executionCount: number;
}

interface CommandFavorite {
  command: string;
  args?: string;
  displayName: string;
  addedAt: number;
}

export class CommandHistoryManager {
  private static readonly STORAGE_KEY_HISTORY = "lms-copilot-command-history";
  private static readonly STORAGE_KEY_FAVORITES =
    "lms-copilot-command-favorites";
  private static readonly MAX_HISTORY_SIZE = 100;
  private static readonly MAX_FAVORITES_SIZE = 20;

  // Load command history from storage
  static getHistory(): CommandHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load command history:", error);
      return [];
    }
  }

  // Save command to history
  static addToHistory(command: string, args?: string): void {
    try {
      const history = this.getHistory();
      const existingIndex = history.findIndex(
        (item) => item.command === command && item.args === args,
      );

      if (existingIndex >= 0) {
        // Update existing entry
        history[existingIndex].timestamp = Date.now();
        history[existingIndex].executionCount++;
      } else {
        // Add new entry
        history.unshift({
          command,
          args,
          timestamp: Date.now(),
          executionCount: 1,
        });
      }

      // Trim history to max size
      if (history.length > this.MAX_HISTORY_SIZE) {
        history.splice(this.MAX_HISTORY_SIZE);
      }

      localStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save command to history:", error);
    }
  }

  // Get recent commands (sorted by recency and frequency)
  static getRecentCommands(limit: number = 10): CommandHistoryItem[] {
    const history = this.getHistory();

    // Sort by a combination of recency and frequency
    return history
      .sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a);
        const scoreB = this.calculateRelevanceScore(b);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Calculate relevance score based on recency and frequency
  private static calculateRelevanceScore(item: CommandHistoryItem): number {
    const now = Date.now();
    const ageInDays = (now - item.timestamp) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 10 - ageInDays); // Score decreases with age
    const frequencyScore = Math.min(item.executionCount, 10); // Cap at 10

    return recencyScore * 0.7 + frequencyScore * 0.3;
  }

  // Load favorites from storage
  static getFavorites(): CommandFavorite[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_FAVORITES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load command favorites:", error);
      return [];
    }
  }

  // Add command to favorites
  static addToFavorites(
    command: string,
    args?: string,
    displayName?: string,
  ): boolean {
    try {
      const favorites = this.getFavorites();
      const fullCommand = args ? `${command} ${args}` : command;

      // Check if already in favorites
      const exists = favorites.some(
        (fav) => fav.command === command && fav.args === args,
      );

      if (exists) {
        return false; // Already in favorites
      }

      favorites.push({
        command,
        args,
        displayName: displayName || fullCommand,
        addedAt: Date.now(),
      });

      // Trim to max size
      if (favorites.length > this.MAX_FAVORITES_SIZE) {
        favorites.shift(); // Remove oldest
      }

      localStorage.setItem(
        this.STORAGE_KEY_FAVORITES,
        JSON.stringify(favorites),
      );
      return true;
    } catch (error) {
      console.error("Failed to add command to favorites:", error);
      return false;
    }
  }

  // Remove command from favorites
  static removeFromFavorites(command: string, args?: string): boolean {
    try {
      const favorites = this.getFavorites();
      const filtered = favorites.filter(
        (fav) => !(fav.command === command && fav.args === args),
      );

      if (filtered.length !== favorites.length) {
        localStorage.setItem(
          this.STORAGE_KEY_FAVORITES,
          JSON.stringify(filtered),
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to remove command from favorites:", error);
      return false;
    }
  }

  // Check if command is in favorites
  static isFavorite(command: string, args?: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some(
      (fav) => fav.command === command && fav.args === args,
    );
  }

  // Search command history
  static searchHistory(query: string): CommandHistoryItem[] {
    const history = this.getHistory();
    const queryLower = query.toLowerCase();

    return history.filter((item) => {
      const commandMatch = item.command.toLowerCase().includes(queryLower);
      const argsMatch = item.args?.toLowerCase().includes(queryLower) || false;
      return commandMatch || argsMatch;
    });
  }

  // Get command suggestions based on current input
  static getCommandSuggestions(
    input: string,
  ): (CommandHistoryItem | CommandFavorite)[] {
    const suggestions: (CommandHistoryItem | CommandFavorite)[] = [];

    // Add favorites first
    const favorites = this.getFavorites();
    const matchingFavorites = favorites.filter((fav) => {
      const fullCommand = fav.args ? `${fav.command} ${fav.args}` : fav.command;
      return fullCommand.toLowerCase().includes(input.toLowerCase());
    });
    suggestions.push(...matchingFavorites);

    // Add recent commands
    const recent = this.getRecentCommands(10);
    const matchingRecent = recent.filter((item) => {
      const fullCommand = item.args
        ? `${item.command} ${item.args}`
        : item.command;
      const alreadyAdded = suggestions.some((s) => {
        if ("displayName" in s) {
          return s.command === item.command && s.args === item.args;
        }
        return false;
      });
      return (
        !alreadyAdded && fullCommand.toLowerCase().includes(input.toLowerCase())
      );
    });
    suggestions.push(...matchingRecent);

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }

  // Clear history
  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY_HISTORY);
    } catch (error) {
      console.error("Failed to clear command history:", error);
    }
  }

  // Clear favorites
  static clearFavorites(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY_FAVORITES);
    } catch (error) {
      console.error("Failed to clear command favorites:", error);
    }
  }

  // Export history and favorites for backup
  static exportData(): string {
    const data = {
      history: this.getHistory(),
      favorites: this.getFavorites(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  // Import history and favorites from backup
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.history && Array.isArray(data.history)) {
        localStorage.setItem(
          this.STORAGE_KEY_HISTORY,
          JSON.stringify(data.history),
        );
      }

      if (data.favorites && Array.isArray(data.favorites)) {
        localStorage.setItem(
          this.STORAGE_KEY_FAVORITES,
          JSON.stringify(data.favorites),
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to import command data:", error);
      return false;
    }
  }

  // Get statistics
  static getStatistics(): {
    totalCommands: number;
    favoriteCommands: number;
    mostUsedCommand: string | null;
    totalExecutions: number;
  } {
    const history = this.getHistory();
    const favorites = this.getFavorites();

    const totalExecutions = history.reduce(
      (sum, item) => sum + item.executionCount,
      0,
    );
    const mostUsed = history.reduce(
      (max, item) =>
        item.executionCount > (max?.executionCount || 0) ? item : max,
      null as CommandHistoryItem | null,
    );

    return {
      totalCommands: history.length,
      favoriteCommands: favorites.length,
      mostUsedCommand: mostUsed
        ? mostUsed.args
          ? `${mostUsed.command} ${mostUsed.args}`
          : mostUsed.command
        : null,
      totalExecutions,
    };
  }
}
