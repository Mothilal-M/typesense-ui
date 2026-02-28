import { X } from "lucide-react";
import { RobotIcon } from "../ui/RobotIcon";

interface AiChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function AiChatButton({ isOpen, onClick }: AiChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 via-pink-50 to-purple-200 dark:from-purple-900/80 dark:via-slate-800 dark:to-purple-900/60 text-white shadow-2xl shadow-purple-400/40 hover:shadow-purple-500/60 hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-float-slow border border-purple-200/50 dark:border-purple-700/40"
    >
      {isOpen ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center">
          <X className="w-5 h-5 text-white transition-transform duration-300 group-hover:rotate-90" />
        </div>
      ) : (
        <div className="relative">
          <RobotIcon className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" />
          {/* Pulse ring */}
          <span className="absolute inset-0 -m-2 rounded-full border-2 border-purple-400/40 animate-ping-slow" />
        </div>
      )}
    </button>
  );
}
