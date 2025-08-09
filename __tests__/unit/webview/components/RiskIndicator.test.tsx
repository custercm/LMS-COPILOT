/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RiskIndicator, { RiskIndicatorProps } from '../../../../src/webview/components/RiskIndicator';

describe('RiskIndicator', () => {
  const defaultProps: RiskIndicatorProps = {
    riskLevel: 'medium'
  };

  describe('Basic Rendering', () => {
    it('renders risk indicator with default props', () => {
      render(<RiskIndicator {...defaultProps} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('🟡')).toBeInTheDocument();
    });

    it('renders with text when showText is true', () => {
      render(<RiskIndicator {...defaultProps} showText={true} />);
      
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });

    it('does not render text when showText is false', () => {
      render(<RiskIndicator {...defaultProps} showText={false} />);
      
      expect(screen.queryByText('Medium Risk')).not.toBeInTheDocument();
    });
  });

  describe('Risk Level Styling', () => {
    it('displays high risk with correct color and icon', () => {
      render(<RiskIndicator riskLevel="high" showText={true} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        color: '#f85149',
        border: '1px solid #f85149'
      });
      expect(screen.getByText('🔴')).toBeInTheDocument();
      expect(screen.getByText('High Risk')).toBeInTheDocument();
    });

    it('displays medium risk with correct color and icon', () => {
      render(<RiskIndicator riskLevel="medium" showText={true} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        color: '#d1a60a',
        border: '1px solid #d1a60a'
      });
      expect(screen.getByText('🟡')).toBeInTheDocument();
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });

    it('displays low risk with correct color and icon', () => {
      render(<RiskIndicator riskLevel="low" showText={true} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        color: '#3fb950',
        border: '1px solid #3fb950'
      });
      expect(screen.getByText('🟢')).toBeInTheDocument();
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size styling', () => {
      render(<RiskIndicator {...defaultProps} size="small" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        fontSize: '10px',
        padding: '2px 4px',
        borderRadius: '3px'
      });
    });

    it('applies medium size styling (default)', () => {
      render(<RiskIndicator {...defaultProps} size="medium" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        fontSize: '12px',
        padding: '4px 6px',
        borderRadius: '4px'
      });
    });

    it('applies large size styling', () => {
      render(<RiskIndicator {...defaultProps} size="large" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        fontSize: '14px',
        padding: '6px 8px',
        borderRadius: '6px'
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<RiskIndicator riskLevel="high" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Risk level: High Risk');
      expect(indicator).toHaveAttribute('title', 'High Risk');
    });

    it('has aria-hidden on the icon', () => {
      render(<RiskIndicator riskLevel="high" />);
      
      const icon = screen.getByText('🔴');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('provides proper labels for all risk levels', () => {
      const riskLevels: Array<{ level: 'low' | 'medium' | 'high', label: string }> = [
        { level: 'low', label: 'Risk level: Low Risk' },
        { level: 'medium', label: 'Risk level: Medium Risk' },
        { level: 'high', label: 'Risk level: High Risk' }
      ];

      riskLevels.forEach(({ level, label }) => {
        const { unmount } = render(<RiskIndicator riskLevel={level} />);
        expect(screen.getByLabelText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<RiskIndicator {...defaultProps} className="custom-class" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('risk-indicator', 'custom-class');
    });

    it('uses VS Code CSS variables for font family', () => {
      render(<RiskIndicator {...defaultProps} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        fontFamily: 'var(--vscode-font-family)'
      });
    });
  });

  describe('Visual States', () => {
    it('has semi-transparent background color', () => {
      render(<RiskIndicator riskLevel="high" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        backgroundColor: '#f8514920' // 20% opacity
      });
    });

    it('displays as inline-flex with proper alignment', () => {
      render(<RiskIndicator {...defaultProps} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({
        display: 'inline-flex',
        alignItems: 'center'
      });
    });
  });
});
