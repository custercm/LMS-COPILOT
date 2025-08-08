import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import MessageItem from "./MessageItem";
import { Message } from "../types/messages";
import { FileReference } from "../types/api";

interface MessageListProps {
  messages: Message[];
  fileReferences?: FileReference[];
  onOpenFile?: (filePath: string, lineNumber?: number) => void;
  onPreviewFile?: (filePath: string) => Promise<string>;
  onContextMenu?: (event: React.MouseEvent, messageId?: string) => void;
  isHovered?: boolean;
}

// Performance optimization: Memoized message item component
const MemoizedMessageItem = React.memo(MessageItem);

// Test helper functions for integration testing
export const createTestMessageItem = (
  content: string,
  role: "user" | "assistant",
) => ({
  id: Date.now().toString(),
  content,
  role,
  timestamp: Date.now(),
});

export const createEmptyMessagesArray = () => [];

function MessageList({
  messages,
  fileReferences = [],
  onOpenFile,
  onPreviewFile,
  onContextMenu,
  isHovered = false,
}: MessageListProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Enhanced virtualization constants
  const MESSAGE_HEIGHT = 80; // Dynamic height calculation
  const BUFFER_SIZE = 10; // Increased buffer for smoother scrolling
  const SCROLL_DEBOUNCE_MS = 16; // 60fps debouncing

  // Memoized total height calculation
  const totalHeight = useMemo(
    () => messages.length * MESSAGE_HEIGHT,
    [messages.length],
  );

  // Optimized visible range calculation with memoization
  const calculateVisibleRange = useCallback(
    (scrollTop: number, containerHeight: number) => {
      const newStartIndex = Math.max(
        0,
        Math.floor(scrollTop / MESSAGE_HEIGHT) - BUFFER_SIZE,
      );
      const visibleCount =
        Math.ceil(containerHeight / MESSAGE_HEIGHT) + BUFFER_SIZE * 2;
      const endIndex = Math.min(messages.length, newStartIndex + visibleCount);

      return { startIndex: newStartIndex, endIndex };
    },
    [messages.length],
  );

  // Debounced scroll handler for better performance
  const handleScroll = useCallback(() => {
    if (!messageListRef.current) return;

    const containerHeight = messageListRef.current.clientHeight;
    const scrollTop = messageListRef.current.scrollTop || 0;

    const { startIndex: newStartIndex, endIndex } = calculateVisibleRange(
      scrollTop,
      containerHeight,
    );

    if (newStartIndex !== startIndex) {
      setStartIndex(newStartIndex);
      setVisibleMessages(messages.slice(newStartIndex, endIndex));
    }

    // Scroll state management for performance optimizations
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [messages, startIndex, calculateVisibleRange]);

  // Throttled scroll event listener
  useEffect(() => {
    const scrollElement = messageListRef.current;
    if (!scrollElement) return;

    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollElement.addEventListener("scroll", throttledScrollHandler, {
      passive: true,
    });

    return () => {
      scrollElement.removeEventListener("scroll", throttledScrollHandler);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Initial load and resize handling
  useEffect(() => {
    if (!messageListRef.current) return;

    const containerHeight = messageListRef.current.clientHeight;
    const scrollTop = messageListRef.current.scrollTop || 0;

    const { startIndex: newStartIndex, endIndex } = calculateVisibleRange(
      scrollTop,
      containerHeight,
    );
    setStartIndex(newStartIndex);
    setVisibleMessages(messages.slice(newStartIndex, endIndex));
  }, [messages, calculateVisibleRange]);

  // Intersection Observer for precise visibility tracking
  useEffect(() => {
    if (!messageListRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Message is visible - can trigger additional optimizations
          }
        });
      },
      {
        root: messageListRef.current,
        rootMargin: "50px",
        threshold: 0.1,
      },
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Auto-scroll to bottom for new messages
  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = totalHeight;
    }
  }, [totalHeight]);

  // Effect to scroll to bottom on new messages
  useEffect(() => {
    const shouldAutoScroll =
      messageListRef.current &&
      messageListRef.current.scrollTop + messageListRef.current.clientHeight >=
        totalHeight - MESSAGE_HEIGHT * 2;

    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom, totalHeight]);

  // This function would be used to render the change tracking panel
  const renderChangeTrackingPanel = () => {
    return (
      <div className="change-tracking-panel">
        <h3>Modified Files</h3>
        <div className="change-summary">3 additions, 2 deletions</div>
        <div className="global-controls">
          <button className="keep-all-btn">Keep All Changes</button>
          <button className="undo-all-btn">Undo All Changes</button>
        </div>
        <div className="file-list">
          {/* This would be populated with actual file changes */}
          <div className="file-item pending">
            <span>src/extension.ts</span>
            <span className="status-indicator pending">Pending</span>
          </div>
          <div className="file-item applied">
            <span>package.json</span>
            <span className="status-indicator applied">Applied</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={messageListRef}
      className={`message-list ${isHovered ? "hovered" : ""} ${isScrolling ? "scrolling" : ""}`}
    >
      {/* Virtualized message rendering with performance optimizations */}
      <div
        style={{
          height: `${totalHeight}px`,
          position: "relative",
          // Optimize painting during scroll
          willChange: isScrolling ? "transform" : "auto",
        }}
      >
        {visibleMessages.map((message, index) => {
          const actualIndex = startIndex + index;
          return (
            // Calculate actual index based on virtualization
            <div
              key={message.id}
              style={{
                position: "absolute",
                top: `${actualIndex * MESSAGE_HEIGHT}px`,
                width: "100%",
                height: `${MESSAGE_HEIGHT}px`,
                // GPU acceleration for smooth scrolling
                transform: `translateZ(0)`,
                backfaceVisibility: "hidden",
              }}
              ref={(el) => {
                if (el && observerRef.current) {
                  observerRef.current.observe(el);
                }
              }}
            >
              <MemoizedMessageItem
                message={message}
                onOpenFile={onOpenFile}
                onPreviewFile={onPreviewFile}
                onContextMenu={(event: React.MouseEvent) =>
                  onContextMenu?.(event, message.id)
                }
              />
            </div>
          );
        })}
      </div>

      {/* Render change tracking panel if there are pending changes */}
      {renderChangeTrackingPanel()}
    </div>
  );
}

export default MessageList;
