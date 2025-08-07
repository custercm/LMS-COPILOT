import React, { useState, useEffect, useRef } from 'react';
import './CommandPalette.css';

export interface Command {
  name: string;
  description: string;
  shortcut?: string;
  category: 'file' | 'chat' | 'code' | 'workspace' | 'debug';
  handler: (args?: string) => void;
}

interface CommandPaletteProps {
  commands: Command[];
  onCommandSelect: (command: Command, args?: string) => void;
  onClose: () => void;
  isVisible: boolean;
  initialFilter?: string;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  onCommandSelect,
  onClose,
  isVisible,
  initialFilter = ''
}) => {
  const [filter, setFilter] = useState(initialFilter);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fuzzy search implementation
  const fuzzySearch = (searchTerm: string, commands: Command[]): Command[] => {
    if (!searchTerm) return commands;
    
    const searchLower = searchTerm.toLowerCase();
    
    return commands
      .map(command => {
        const nameScore = fuzzyMatch(searchLower, command.name.toLowerCase());
        const descScore = fuzzyMatch(searchLower, command.description.toLowerCase());
        const score = Math.max(nameScore, descScore * 0.8);
        
        return { command, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ command }) => command);
  };

  // Simple fuzzy matching algorithm
  const fuzzyMatch = (pattern: string, text: string): number => {
    let score = 0;
    let patternIndex = 0;
    
    for (let textIndex = 0; textIndex < text.length && patternIndex < pattern.length; textIndex++) {
      if (text[textIndex] === pattern[patternIndex]) {
        score += 1;
        patternIndex++;
      }
    }
    
    return patternIndex === pattern.length ? score / pattern.length : 0;
  };

  // Update filtered commands when filter changes
  useEffect(() => {
    const filtered = fuzzySearch(filter, commands);
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [filter, commands]);

  // Focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
      setFilter(initialFilter);
    }
  }, [isVisible, initialFilter]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, filteredCommands, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const handleCommandSelect = (command: Command) => {
    const args = filter.includes(' ') ? filter.split(' ').slice(1).join(' ') : undefined;
    onCommandSelect(command, args);
    onClose();
  };

  const getCategoryIcon = (category: Command['category']): string => {
    switch (category) {
      case 'file': return '📁';
      case 'chat': return '💬';
      case 'code': return '⚡';
      case 'workspace': return '🏗️';
      case 'debug': return '🐛';
      default: return '⚙️';
    }
  };

  const getCategoryColor = (category: Command['category']): string => {
    switch (category) {
      case 'file': return 'var(--vscode-charts-blue)';
      case 'chat': return 'var(--vscode-charts-green)';
      case 'code': return 'var(--vscode-charts-purple)';
      case 'workspace': return 'var(--vscode-charts-orange)';
      case 'debug': return 'var(--vscode-charts-red)';
      default: return 'var(--vscode-foreground)';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-palette-header">
          <input
            ref={inputRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Type a command or search..."
            className="command-palette-input"
          />
          <div className="command-palette-shortcut">
            Press <kbd>Esc</kbd> to close
          </div>
        </div>
        
        <div ref={listRef} className="command-palette-list">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              No commands found matching "{filter}"
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                key={`${command.name}-${index}`}
                className={`command-palette-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleCommandSelect(command)}
              >
                <div className="command-item-main">
                  <span 
                    className="command-item-icon"
                    style={{ color: getCategoryColor(command.category) }}
                  >
                    {getCategoryIcon(command.category)}
                  </span>
                  <div className="command-item-content">
                    <span className="command-item-name">{command.name}</span>
                    <span className="command-item-description">{command.description}</span>
                  </div>
                </div>
                {command.shortcut && (
                  <span className="command-item-shortcut">
                    <kbd>{command.shortcut}</kbd>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="command-palette-footer">
          <div className="command-palette-stats">
            {filteredCommands.length} of {commands.length} commands
          </div>
          <div className="command-palette-help">
            Use ↑↓ to navigate, Enter to select
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
