import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import type { Toast as ToastType } from "../../hooks/useToast";

const config = {
  success: {
    icon: CheckCircle2,
    bar: "bg-emerald-500",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-white dark:bg-slate-900",
    border: "border-l-4 border-l-emerald-500",
  },
  error: {
    icon: AlertCircle,
    bar: "bg-red-500",
    iconColor: "text-red-500 dark:text-red-400",
    bg: "bg-white dark:bg-slate-900",
    border: "border-l-4 border-l-red-500",
  },
  info: {
    icon: Info,
    bar: "bg-blue-500",
    iconColor: "text-blue-500 dark:text-blue-400",
    bg: "bg-white dark:bg-slate-900",
    border: "border-l-4 border-l-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-amber-500",
    iconColor: "text-amber-500 dark:text-amber-400",
    bg: "bg-white dark:bg-slate-900",
    border: "border-l-4 border-l-amber-500",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastType;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const c = config[toast.type];
  const Icon = c.icon;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-lg ${c.bg} ${c.border} ring-1 ring-black/5 dark:ring-white/5 transition-all duration-200 ${
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug">
            {toast.message}
          </p>
          {toast.onUndo && (
            <button
              onClick={() => {
                toast.onUndo?.();
                handleDismiss();
              }}
              className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline underline-offset-2"
            >
              Undo
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-slate-800">
          <div
            className={`h-full ${c.bar} rounded-full`}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
