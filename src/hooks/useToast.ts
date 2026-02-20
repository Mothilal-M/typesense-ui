import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

let globalToasts: Toast[] = [];
let globalSetToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null =
  null;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(globalToasts);

  // Register the global setter on first mount
  globalSetToasts = setToasts;

  const addToast = useCallback(
    (type: Toast["type"], message: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => {
        const updated = [...prev, toast];
        globalToasts = updated;
        return updated;
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    const setter = globalSetToasts;
    if (setter) {
      setter((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        globalToasts = updated;
        return updated;
      });
    }
  }, []);

  return { toasts, addToast, removeToast };
}
