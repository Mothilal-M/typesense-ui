import { useState } from "react";
import { User, Sparkles, AlertCircle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "../../types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showFunctionCalls, setShowFunctionCalls] = useState(false);
  const isUser = message.role === "user";
  const isError = message.role === "error";

  if (message.isLoading) {
    return (
      <div className="flex items-start space-x-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3">
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
    >
      <div
        className={`flex items-start space-x-2 max-w-[85%] ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isUser
              ? "bg-gradient-to-br from-blue-500 to-cyan-500"
              : isError
                ? "bg-gradient-to-br from-red-500 to-orange-500"
                : "bg-gradient-to-br from-purple-500 to-pink-500"
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>

        <div className="space-y-2 min-w-0">
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-tr-md"
                : isError
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-tl-md"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-50 rounded-tl-md"
            }`}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-pre:my-1 prose-code:text-xs prose-code:bg-black/10 prose-code:dark:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </Markdown>
              </div>
            )}
          </div>

          {message.tableData && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/50 dark:border-purple-700/50 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3 h-3" />
              <span>Results shown in main view</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          )}

          {message.functionCalls && message.functionCalls.length > 0 && (
            <button
              onClick={() => setShowFunctionCalls(!showFunctionCalls)}
              className="flex items-center space-x-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showFunctionCalls ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              <span>
                {message.functionCalls.length} function call
                {message.functionCalls.length > 1 ? "s" : ""}
              </span>
            </button>
          )}
          {showFunctionCalls && message.functionCalls && (
            <div className="text-xs bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2 font-mono text-gray-500 dark:text-gray-400 max-h-32 overflow-auto">
              {message.functionCalls.map((fc, i) => (
                <div key={i} className="mb-1">
                  <span className="text-purple-500 dark:text-purple-400">
                    {fc.name}
                  </span>
                  ({JSON.stringify(fc.args)})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
