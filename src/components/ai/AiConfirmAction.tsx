import { AlertTriangle, Check, X } from "lucide-react";
import type { PendingAction } from "../../types/chat";

interface AiConfirmActionProps {
  action: PendingAction;
  onConfirm: () => void;
  onDeny: () => void;
}

export function AiConfirmAction({
  action,
  onConfirm,
  onDeny,
}: AiConfirmActionProps) {
  return (
    <div className="mx-2 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/20 animate-fade-in">
      <div className="flex items-start space-x-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
            AI wants to perform an action
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
            {action.description}
          </p>
          {"document" in action.args && action.args.document != null && (
            <pre className="text-[10px] bg-white/60 dark:bg-slate-800/60 rounded-lg p-2 mb-2 overflow-x-auto max-h-24 text-gray-700 dark:text-gray-300">
              {typeof action.args.document === "string"
                ? String(action.args.document)
                : JSON.stringify(action.args.document, null, 2)}
            </pre>
          )}
          {"document_id" in action.args && action.args.document_id != null && (
            <p className="text-[10px] text-amber-600 dark:text-amber-500 mb-2 font-mono">
              ID: {String(action.args.document_id)}
            </p>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={onConfirm}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-sm transition-all duration-200"
            >
              <Check className="w-3 h-3" />
              <span>Allow</span>
            </button>
            <button
              onClick={onDeny}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200"
            >
              <X className="w-3 h-3" />
              <span>Deny</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
