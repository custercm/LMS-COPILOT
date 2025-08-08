import React, { useState, useEffect, useRef } from "react";
import "../styles/InputArea.css";
import { CommandHistoryManager } from "../utils/commandHistory";
import { useOptimizedInput, useDebouncedCallback } from "../hooks/useDebounce";

export interface CommandSuggestion {
  command: string;
  description: string;
  syntax: string;
  category: "file" | "chat" | "code" | "workspace" | "debug";
}

interface InputAreaProps {
  onSendMessage: (content: string) => void;
  onCommandSelect?: (command: string, args?: string) => void;
  onShowCommandPalette?: () => void;
  ariaLabel?: string;
  enableDragAndDrop?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onCommandSelect,
  onShowCommandPalette,
  ariaLabel = "Chat input area",
  enableDragAndDrop = true,
}) => {
  // Use optimized input with debouncing for better performance
  const {
    value: inputValue,
    setValue: setInputValue,
    debouncedValue: debouncedInputValue,
    isDebouncing,
  } = useOptimizedInput("", 150);

  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced command search for better performance
  const debouncedCommandSearch = useDebouncedCallback((searchTerm: string) => {
    if (searchTerm.startsWith("/")) {
      const filtered = commandSuggestions.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, 200);

  // Enhanced command suggestions with descriptions and syntax
  const commandSuggestions: CommandSuggestion[] = [
    {
      command: "/help",
      description: "Show available commands and usage instructions",
      syntax: "/help [command]",
      category: "chat",
    },
    {
      command: "/clear",
      description: "Clear the chat history",
      syntax: "/clear",
      category: "chat",
    },
    {
      command: "/explain",
      description: "Explain selected code or file",
      syntax: "/explain [file|selection]",
      category: "code",
    },
    {
      command: "/workspace",
      description: "Show workspace information and structure",
      syntax: "/workspace [info|structure]",
      category: "workspace",
    },
    {
      command: "/install",
      description: "Install packages or dependencies",
      syntax: "/install <package_name>",
      category: "workspace",
    },
    {
      command: "/run",
      description: "Execute code or run tasks",
      syntax: "/run [task|file]",
      category: "code",
    },
    {
      command: "/debug",
      description: "Start debugging session or analyze errors",
      syntax: "/debug [start|analyze]",
      category: "debug",
    },
    {
      command: "/files",
      description: "Search and manipulate files in workspace",
      syntax: "/files [search|create|edit] <pattern>",
      category: "file",
    },
    {
      command: "/git",
      description: "Git operations and version control",
      syntax: "/git [status|commit|push] [message]",
      category: "workspace",
    },
    {
      command: "/search",
      description: "Search across codebase or documentation",
      syntax: "/search <query>",
      category: "code",
    },
  ];

  // Load command history on mount
  useEffect(() => {
    const history = CommandHistoryManager.getHistory();
    const commands = history.map((item) =>
      item.args ? `${item.command} ${item.args}` : item.command,
    );
    setCommandHistory(commands);
  }, []);

  // Handle input changes for command completion with optimized debounced search
  useEffect(() => {
    debouncedCommandSearch(debouncedInputValue);
  }, [debouncedInputValue, debouncedCommandSearch]);

  // Handle keyboard navigation for suggestions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1,
          );
          break;
        case "Tab":
        case "Enter":
          if (e.key === "Tab") {
            e.preventDefault();
            handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setShowHistory(false);
          break;
      }
    };

    // Handle command history navigation
    const handleHistoryKeyDown = (e: KeyboardEvent) => {
      if (!inputValue.startsWith("/") || commandHistory.length === 0) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[newIndex]);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[newIndex]);
          } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setInputValue("/");
          }
          break;
      }
    };

    if (isFocused) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keydown", handleHistoryKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keydown", handleHistoryKeyDown);
      };
    }
  }, [
    showSuggestions,
    suggestions,
    selectedSuggestionIndex,
    isFocused,
    historyIndex,
    commandHistory,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Add to command history if it's a command
      if (inputValue.startsWith("/")) {
        const [command, ...args] = inputValue.split(" ");
        CommandHistoryManager.addToHistory(
          command,
          args.join(" ") || undefined,
        );

        // Update local history state
        const history = CommandHistoryManager.getHistory();
        const commands = history.map((item) =>
          item.args ? `${item.command} ${item.args}` : item.command,
        );
        setCommandHistory(commands);

        onCommandSelect?.(command, args.join(" "));
      } else {
        onSendMessage(inputValue);
      }
      setInputValue("");
      setAttachedFiles([]);
      setShowSuggestions(false);
      setShowHistory(false);
      setHistoryIndex(-1);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: CommandSuggestion) => {
    setInputValue(suggestion.command + " ");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle drag and drop for file attachments
  const handleDragOver = (e: React.DragEvent) => {
    if (!enableDragAndDrop) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!enableDragAndDrop) return;
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!enableDragAndDrop) return;
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Show command palette on Ctrl+Shift+P or Cmd+Shift+P
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
      e.preventDefault();
      onShowCommandPalette?.();
    }
  };

  // Add micro-interactions for input focus
  return (
    <div
      className={`input-container ${isDragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Attached files display */}
      {attachedFiles.length > 0 && (
        <div className="attached-files">
          {attachedFiles.map((file, index) => (
            <div key={index} className="attached-file">
              <span className="file-icon">📎</span>
              <span className="file-name">{file.name}</span>
              <button
                type="button"
                className="remove-file"
                onClick={() => removeAttachedFile(index)}
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        className={`input-area ${isFocused ? "focused" : ""}`}
        onSubmit={handleSubmit}
      >
        <div className="input-controls">
          <button
            type="button"
            className="attach-button"
            onClick={handleFileAttachment}
            aria-label="Attach files"
            title="Attach files (drag & drop supported)"
          >
            📎
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot or type / for commands"
            className="message-input"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label={ariaLabel}
            autoComplete="off"
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          accept=".txt,.md,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.yaml,.yml"
        />

        {/* Tooltip for input area */}
        <div
          className="input-tooltip"
          style={{ visibility: inputValue ? "visible" : "hidden" }}
        >
          Press Enter to send{" "}
          {attachedFiles.length > 0 &&
            `(${attachedFiles.length} files attached)`}
        </div>

        <button
          type="submit"
          className={`send-button ${inputValue.trim() || attachedFiles.length > 0 ? "enabled" : "disabled"} ${
            isFocused ? "focused" : ""
          }`}
          disabled={!inputValue.trim() && attachedFiles.length === 0}
          aria-label="Send message"
        >
          Send
        </button>
      </form>

      {/* Enhanced command suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="command-suggestions">
          <div className="suggestions-header">
            <span className="suggestions-title">Commands</span>
            <span className="suggestions-shortcut">
              Tab to complete, ↑↓ to navigate
            </span>
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.command}-${index}`}
              className={`suggestion-item ${index === selectedSuggestionIndex ? "selected" : ""}`}
              onClick={() => handleSuggestionSelect(suggestion)}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              <div className="suggestion-main">
                <span className="suggestion-command">{suggestion.command}</span>
                <span className="suggestion-description">
                  {suggestion.description}
                </span>
              </div>
              <div className="suggestion-syntax">
                <code>{suggestion.syntax}</code>
              </div>
            </div>
          ))}
          {inputValue.length > 1 && suggestions.length === 0 && (
            <div className="suggestion-item no-match">
              <span className="suggestion-command">No matching commands</span>
              <span className="suggestion-description">
                Try /help to see all available commands
              </span>
            </div>
          )}
        </div>
      )}

      {/* Drag and drop overlay */}
      {isDragOver && (
        <div className="drag-overlay">
          <div className="drag-message">
            <span className="drag-icon">📁</span>
            <span className="drag-text">Drop files to attach</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputArea;
