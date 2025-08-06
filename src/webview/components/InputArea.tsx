import React, { useState } from 'react';

interface InputAreaProps {
  onSendMessage: (content: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
            onSendMessage(inputValue);
            setInputValue('');
  };

  return (
    <form className="input-area" onSubmit={handleSubmit}>
      <input
        type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        placeholder="Ask Copilot or type / for commands"
        className="message-input"
        />
        <button
          type="submit"
          className="send-button"
        disabled={!inputValue.trim()}
        >
          Send
        </button>
    </form>
  );
};

export default InputArea;
