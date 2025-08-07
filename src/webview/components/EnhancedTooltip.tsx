import React, { useState, useRef, useEffect } from 'react';
import '../styles/EnhancedTooltip.css';

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
  showOnFocus?: boolean;
  maxWidth?: number;
}

const EnhancedTooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 500,
  disabled = false,
  className = '',
  showOnFocus = true,
  maxWidth = 250
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled || !content) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Calculate optimal position based on viewport
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newPosition = position;

      // Check if tooltip would overflow viewport
      switch (position) {
        case 'top':
          if (triggerRect.top - tooltipRect.height < 10) {
            newPosition = 'bottom';
          }
          break;
        case 'bottom':
          if (triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
            newPosition = 'top';
          }
          break;
        case 'left':
          if (triggerRect.left - tooltipRect.width < 10) {
            newPosition = 'right';
          }
          break;
        case 'right':
          if (triggerRect.right + tooltipRect.width > viewport.width - 10) {
            newPosition = 'left';
          }
          break;
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className={`tooltip-trigger ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showOnFocus ? showTooltip : undefined}
      onBlur={showOnFocus ? hideTooltip : undefined}
      aria-describedby={isVisible ? 'tooltip' : undefined}
    >
      {children}
      
      {isVisible && content && (
        <div
          ref={tooltipRef}
          id="tooltip"
          className={`enhanced-tooltip ${actualPosition}`}
          role="tooltip"
          aria-live="polite"
          style={{ maxWidth: `${maxWidth}px` }}
        >
          <div className="tooltip-content">
            {content}
          </div>
          <div className={`tooltip-arrow ${actualPosition}`} />
        </div>
      )}
    </div>
  );
};

export default EnhancedTooltip;
