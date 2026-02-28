import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
  onUndo?: () => void;
}

const MAX_TOASTS = 4;
let globalToasts: Toast[] = [];
let globalSetters: Set<React.Dispatch<React.SetStateAction<Toast[]>>> =
  new Set();

function broadcast(updater: (prev: Toast[]) => Toast[]) {
  globalToasts = updater(globalToasts);
  globalSetters.forEach((s) => s(globalToasts));
}

/** Standalone addToast — can be called outside of React components */
export function showToast(
  type: Toast["type"],
  message: string,
  duration = 4000,
  onUndo?: () => void
) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const toast: Toast = { id, type, message, duration, onUndo };
  broadcast((prev) => [...prev, toast].slice(-MAX_TOASTS));

  if (duration > 0) {
    setTimeout(() => {
      broadcast((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }
  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(globalToasts);

  // Register this component's setter
  globalSetters.add(setToasts);

  const addToast = useCallback(
    (type: Toast["type"], message: string, duration = 4000, onUndo?: () => void) => {
      return showToast(type, message, duration, onUndo);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    broadcast((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
