import { MessageSquare, X } from "lucide-react";

interface AiChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function AiChatButton({ isOpen, onClick }: AiChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      title={isOpen ? "Close AI Chat" : "Open AI Chat"}
    >
      {isOpen ? (
        <X className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
      ) : (
        <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
      )}
    </button>
  );
}
