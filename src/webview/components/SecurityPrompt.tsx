import React from 'react';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface SecurityPromptProps {
  command: string;
  riskLevel: RiskLevel;
  description: string;
  onApprove: () => void;
  onDeny: () => void;
  onAlwaysAllow: () => void;
  isVisible?: boolean;
}

export const SecurityPrompt: React.FC<SecurityPromptProps> = ({
  command,
  riskLevel,
  description,
  onApprove,
  onDeny,
  onAlwaysAllow,
  isVisible = true
}) => {
  if (!isVisible) {
    return null;
  }

  const getRiskColor = (level: RiskLevel): string => {
    switch (level) {
      case 'high':
        return '#f85149'; // GitHub red
      case 'medium':
        return '#d1a60a'; // GitHub yellow
      case 'low':
        return '#3fb950'; // GitHub green
      default:
        return '#d1a60a';
    }
  };

  const getRiskIcon = (level: RiskLevel): string => {
    switch (level) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚠️';
    }
  };

  const getRiskText = (level: RiskLevel): string => {
    switch (level) {
      case 'high':
        return 'High-risk command detected';
      case 'medium':
        return 'Medium-risk command detected';
      case 'low':
        return 'Low-risk command detected';
      default:
        return 'Command requires approval';
    }
  };

  return (
    <div 
      className="security-prompt"
      style={{
        border: `1px solid ${getRiskColor(riskLevel)}`,
        borderRadius: '8px',
        padding: '16px',
        margin: '8px 0',
        backgroundColor: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)',
      }}
      role="dialog"
      aria-labelledby="security-prompt-title"
      aria-describedby="security-prompt-description"
    >
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '16px' }} aria-hidden="true">
          {getRiskIcon(riskLevel)}
        </span>
        <h3 
          id="security-prompt-title"
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: getRiskColor(riskLevel)
          }}
        >
          {getRiskText(riskLevel)}
        </h3>
      </div>

      {/* Command display */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--vscode-descriptionForeground)',
          marginBottom: '4px' 
        }}>
          Command:
        </div>
        <code 
          style={{
            backgroundColor: 'var(--vscode-textCodeBlock-background)',
            border: '1px solid var(--vscode-widget-border)',
            borderRadius: '4px',
            padding: '8px',
            display: 'block',
            fontSize: '12px',
            fontFamily: 'var(--vscode-editor-font-family)',
            wordBreak: 'break-all'
          }}
        >
          {command}
        </code>
      </div>

      {/* Description */}
      <div 
        id="security-prompt-description"
        style={{ 
          marginBottom: '16px',
          fontSize: '12px',
          color: 'var(--vscode-descriptionForeground)',
          lineHeight: '1.4'
        }}
      >
        {description}
      </div>

      {/* Action buttons */}
      <div 
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}
      >
        <button
          onClick={onDeny}
          style={{
            backgroundColor: 'var(--vscode-button-secondaryBackground)',
            color: 'var(--vscode-button-secondaryForeground)',
            border: '1px solid var(--vscode-button-border)',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--vscode-font-family)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--vscode-button-secondaryHoverBackground)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--vscode-button-secondaryBackground)';
          }}
          aria-label="Deny this command"
        >
          🔴 Deny
        </button>
        
        <button
          onClick={onApprove}
          style={{
            backgroundColor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            border: '1px solid var(--vscode-button-border)',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--vscode-font-family)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--vscode-button-hoverBackground)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
          }}
          aria-label="Allow this command once"
        >
          🟡 Allow Once
        </button>

        {riskLevel !== 'high' && (
          <button
            onClick={onAlwaysAllow}
            style={{
              backgroundColor: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'var(--vscode-font-family)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--vscode-button-hoverBackground)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
            }}
            aria-label="Always allow this type of command"
          >
            🟢 Always Allow
          </button>
        )}
      </div>
    </div>
  );
};

export default SecurityPrompt;
