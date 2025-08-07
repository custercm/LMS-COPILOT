import React, { useState, useEffect } from 'react';

interface InputAreaProps {
  onSendMessage: (content: string) => void;
  ariaLabel?: string;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSendMessage, 
  ariaLabel = "Chat input area"
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Command suggestions for auto-completion
  const commandSuggestions = [
    '/help',
    '/clear',
    '/explain',
    '/workspace',
    '/install',
    '/run',
    '/debug'
  ];

  // Handle input changes for command completion
  useEffect(() => {
    if (inputValue.startsWith('/')) {
      const filtered = commandSuggestions.filter(cmd => 
        cmd.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
  };

  // Add micro-interactions for input focus
  return (
    <div className="input-container">
      <form 
        className={`input-area ${isFocused ? 'focused' : ''}`}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Copilot or type / for commands"
          className="message-input"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label={ariaLabel}
        />
        
        {/* Tooltip for input area */}
        <div 
          className="input-tooltip" 
          style={{ visibility: inputValue ? 'visible' : 'hidden' }}
        >
          Press Enter to send
        </div>
        
        <button
          type="submit"
          className={`send-button ${inputValue.trim() ? 'enabled' : 'disabled'} ${
            isFocused ? 'focused' : ''
          }`}
          disabled={!inputValue.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>

      {/* Command suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="command-suggestions">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InputArea;