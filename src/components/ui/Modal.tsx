import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-3xl",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-gray-200/50 dark:border-slate-700/50`}
      >
        <div className="p-4 sm:p-5 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate mr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/30 dark:hover:to-red-900/20 transition-all duration-300 group flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
          </button>
        </div>
        <div className="overflow-auto max-h-[calc(90vh-70px)] sm:max-h-[calc(85vh-80px)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
