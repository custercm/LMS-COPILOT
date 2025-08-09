import React from 'react';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskIndicatorProps {
  riskLevel: RiskLevel;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  riskLevel,
  size = 'medium',
  showText = false,
  className = ''
}) => {
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
        return 'High Risk';
      case 'medium':
        return 'Medium Risk';
      case 'low':
        return 'Low Risk';
      default:
        return 'Unknown Risk';
    }
  };

  const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return {
          fontSize: '10px',
          padding: '2px 4px',
          borderRadius: '3px'
        };
      case 'large':
        return {
          fontSize: '14px',
          padding: '6px 8px',
          borderRadius: '6px'
        };
      case 'medium':
      default:
        return {
          fontSize: '12px',
          padding: '4px 6px',
          borderRadius: '4px'
        };
    }
  };

  const sizeStyles = getSizeStyles(size);
  const riskColor = getRiskColor(riskLevel);

  return (
    <span
      className={`risk-indicator ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: `${riskColor}20`, // 20% opacity
        border: `1px solid ${riskColor}`,
        color: riskColor,
        fontWeight: 500,
        fontFamily: 'var(--vscode-font-family)',
        ...sizeStyles
      }}
      role="status"
      aria-label={`Risk level: ${getRiskText(riskLevel)}`}
      title={getRiskText(riskLevel)}
    >
      <span aria-hidden="true">
        {getRiskIcon(riskLevel)}
      </span>
      {showText && (
        <span style={{ fontSize: 'inherit' }}>
          {getRiskText(riskLevel)}
        </span>
      )}
    </span>
  );
};

export default RiskIndicator;
