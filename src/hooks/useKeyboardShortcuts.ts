import { useEffect, useCallback } from "react";

export interface ShortcutMap {
  /** Ctrl/Cmd + K — focus search */
  onSearch?: () => void;
  /** Ctrl/Cmd + N — new document */
  onNewDoc?: () => void;
  /** Ctrl/Cmd + . — toggle AI panel */
  onToggleAI?: () => void;
  /** Ctrl/Cmd + Shift + R — refresh */
  onRefresh?: () => void;
  /** Escape — close modals / panels */
  onEscape?: () => void;
}

/**
 * Registers global keyboard shortcuts.
 * Shortcuts are ignored when the user is typing in an input/textarea/select.
 * Escape always fires (useful for closing modals even while focused in an input).
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

      // Escape always fires
      if (e.key === "Escape") {
        shortcuts.onEscape?.();
        return;
      }

      // All other shortcuts are suppressed while typing
      if (isInput) return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === "k") {
        e.preventDefault();
        shortcuts.onSearch?.();
      }
      if (mod && e.key === "n") {
        e.preventDefault();
        shortcuts.onNewDoc?.();
      }
      if (mod && e.key === ".") {
        e.preventDefault();
        shortcuts.onToggleAI?.();
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        shortcuts.onRefresh?.();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
