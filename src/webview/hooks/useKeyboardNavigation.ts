import { useEffect, useRef, useCallback } from "react";

export interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  focusOnMount?: boolean;
  trapFocus?: boolean;
}

/**
 * Custom hook for keyboard navigation with accessibility features
 * Provides comprehensive keyboard support for chat interface
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          options.onArrowUp?.();
          break;
        case "ArrowDown":
          event.preventDefault();
          options.onArrowDown?.();
          break;
        case "Enter":
          if (!event.shiftKey) {
            event.preventDefault();
            options.onEnter?.();
          }
          break;
        case "Escape":
          event.preventDefault();
          options.onEscape?.();
          break;
        case "Tab":
          if (event.shiftKey) {
            options.onShiftTab?.();
          } else {
            options.onTab?.();
          }
          break;
      }
    },
    [options],
  );

  const trapFocus = useCallback(
    (event: KeyboardEvent) => {
      if (!options.trapFocus || !containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (event.key === "Tab") {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [options.trapFocus],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", handleKeyDown);

    if (options.trapFocus) {
      container.addEventListener("keydown", trapFocus);
    }

    if (options.focusOnMount) {
      container.focus();
    }

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (options.trapFocus) {
        container.removeEventListener("keydown", trapFocus);
      }
    };
  }, [handleKeyDown, trapFocus, options.focusOnMount, options.trapFocus]);

  return containerRef;
}

/**
 * Hook for managing focus announcements for screen readers
 */
export function useFocusAnnouncement() {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (announceRef.current) {
        announceRef.current.setAttribute("aria-live", priority);
        announceRef.current.textContent = message;

        // Clear after announcement
        setTimeout(() => {
          if (announceRef.current) {
            announceRef.current.textContent = "";
          }
        }, 1000);
      }
    },
    [],
  );

  return { announce, announceRef };
}
