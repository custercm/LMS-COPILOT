import React, { useState, useRef, useEffect } from "react";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import "../styles/ContextualMenu.css";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
  submenu?: ContextMenuItem[];
}

interface ContextualMenuProps {
  items: ContextMenuItem[];
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  ariaLabel?: string;
}

const ContextualMenu: React.FC<ContextualMenuProps> = ({
  items,
  visible,
  position,
  onClose,
  ariaLabel = "Context menu",
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submenuVisible, setSubmenuVisible] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const keyboardNavRef = useKeyboardNavigation({
    onArrowUp: () => {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    },
    onArrowDown: () => {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    },
    onEnter: () => {
      const item = items[selectedIndex];
      if (item && !item.disabled) {
        if (item.submenu) {
          setSubmenuVisible(submenuVisible === item.id ? null : item.id);
        } else {
          item.onClick();
          onClose();
        }
      }
    },
    onEscape: onClose,
    focusOnMount: true,
    trapFocus: true,
  }) as React.RefObject<HTMLDivElement>;

  // Position menu within viewport
  useEffect(() => {
    if (visible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let { x, y } = position;

      // Adjust horizontal position
      if (x + rect.width > viewport.width) {
        x = viewport.width - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewport.height) {
        y = viewport.height - rect.height - 10;
      }

      menu.style.left = `${Math.max(0, x)}px`;
      menu.style.top = `${Math.max(0, y)}px`;
    }
  }, [visible, position]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={keyboardNavRef}
      className="contextual-menu"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
      role="menu"
      aria-label={ariaLabel}
      tabIndex={-1}
    >
      <div ref={menuRef} className="contextual-menu-content">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`contextual-menu-item ${
              index === selectedIndex ? "selected" : ""
            } ${item.disabled ? "disabled" : ""}`}
            role="menuitem"
            aria-disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                if (item.submenu) {
                  setSubmenuVisible(
                    submenuVisible === item.id ? null : item.id,
                  );
                } else {
                  item.onClick();
                  onClose();
                }
              }
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="menu-item-content">
              {item.icon && (
                <span className="menu-item-icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="menu-item-label">{item.label}</span>
              {item.shortcut && (
                <span
                  className="menu-item-shortcut"
                  aria-label={`Shortcut: ${item.shortcut}`}
                >
                  {item.shortcut}
                </span>
              )}
              {item.submenu && (
                <span className="menu-item-arrow" aria-hidden="true">
                  ▶
                </span>
              )}
            </div>

            {/* Submenu */}
            {item.submenu && submenuVisible === item.id && (
              <div className="contextual-submenu" role="menu">
                {item.submenu.map((subItem) => (
                  <div
                    key={subItem.id}
                    className={`contextual-menu-item ${subItem.disabled ? "disabled" : ""}`}
                    role="menuitem"
                    aria-disabled={subItem.disabled}
                    onClick={() => {
                      if (!subItem.disabled) {
                        subItem.onClick();
                        onClose();
                      }
                    }}
                  >
                    <div className="menu-item-content">
                      {subItem.icon && (
                        <span className="menu-item-icon" aria-hidden="true">
                          {subItem.icon}
                        </span>
                      )}
                      <span className="menu-item-label">{subItem.label}</span>
                      {subItem.shortcut && (
                        <span className="menu-item-shortcut">
                          {subItem.shortcut}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContextualMenu;
