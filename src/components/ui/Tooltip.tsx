import { useState, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
}

export function Tooltip({
  content,
  children,
  side = "top",
  delayMs = 200,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      let x: number, y: number;

      switch (side) {
        case "bottom":
          x = rect.left + rect.width / 2;
          y = rect.bottom + 6;
          break;
        case "left":
          x = rect.left - 6;
          y = rect.top + rect.height / 2;
          break;
        case "right":
          x = rect.right + 6;
          y = rect.top + rect.height / 2;
          break;
        default: // top
          x = rect.left + rect.width / 2;
          y = rect.top - 6;
          break;
      }

      setCoords({ x, y });
      setVisible(true);
    }, delayMs);
  }, [side, delayMs]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const transformOrigin = {
    top: "bottom center",
    bottom: "top center",
    left: "center right",
    right: "center left",
  }[side];

  const translate = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0%)",
    left: "translate(-100%, -50%)",
    right: "translate(0%, -50%)",
  }[side];

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </div>
      {visible &&
        content &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none animate-tooltip-in"
            style={{
              left: coords.x,
              top: coords.y,
              transform: translate,
              transformOrigin,
            }}
          >
            <div className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-lg shadow-black/20 dark:shadow-black/40 border border-white/10 dark:border-gray-300/30 backdrop-blur-sm max-w-xs whitespace-nowrap">
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
