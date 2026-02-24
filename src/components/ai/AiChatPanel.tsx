import { useEffect, useRef, useState } from "react";
import { Sparkles, Trash2, Settings, Key } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { GeminiKeySetup } from "./GeminiKeySetup";
import { AiConfirmAction } from "./AiConfirmAction";
import { geminiService } from "../../services/gemini";
import { useChat } from "../../hooks/useChat";
import { useApp } from "../../context/AppContext";

interface AiChatPanelProps {
  isOpen: boolean;
}

export function AiChatPanel({ isOpen }: AiChatPanelProps) {
  const { geminiApiKey, clearGeminiApiKey } = useApp();
  const {
    messages,
    status,
    sendMessage,
    clearMessages,
    pendingAction,
    respondToConfirmation,
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingAction]);

  useEffect(() => {
    if (geminiApiKey) {
      geminiService.initialize(geminiApiKey);
    } else {
      geminiService.disconnect();
    }
  }, [geminiApiKey]);

  if (!isOpen) return null;

  const isReady = !!geminiApiKey && geminiService.isInitialized();

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[420px] h-[min(600px,calc(100vh-8rem))] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Assistant
          </h3>
          {status !== "idle" && status !== "awaiting-confirmation" && (
            <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
              {status === "sending"
                ? "Thinking..."
                : status === "calling-function"
                  ? "Querying Typesense..."
                  : "Generating..."}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {isReady && (
            <>
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={clearMessages}
                title="Clear chat"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Settings dropdown */}
      {showSettings && isReady && (
        <div className="p-3 border-b border-gray-200/50 dark:border-slate-700/50 bg-gray-50/80 dark:bg-slate-800/50 animate-fade-in">
          <button
            onClick={() => {
              clearGeminiApiKey();
              clearMessages();
              setShowSettings(false);
            }}
            className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Remove API Key</span>
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isReady ? (
          <GeminiKeySetup />
        ) : messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {pendingAction && (
          <AiConfirmAction
            action={pendingAction}
            onConfirm={() => respondToConfirmation(true)}
            onDeny={() => respondToConfirmation(false)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isReady && (
        <ChatInput onSend={sendMessage} isLoading={status !== "idle"} />
      )}
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div className="text-center py-8 animate-fade-in">
      <Sparkles className="w-10 h-10 text-purple-500/50 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Ask me anything about your data
      </p>
      <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
        <p>&quot;How many documents are in this collection?&quot;</p>
        <p>&quot;Show me users with email containing @gmail.com&quot;</p>
        <p>&quot;What fields does the products collection have?&quot;</p>
      </div>
    </div>
  );
}
