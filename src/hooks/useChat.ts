import { useState, useCallback, useRef } from "react";
import { geminiService } from "../services/gemini";
import { useApp } from "../context/AppContext";
import type { Content } from "@google/generative-ai";
import type { ChatMessage, ChatStatus, PendingAction } from "../types/chat";

const MAX_HISTORY = 50;
const RATE_LIMIT_MS = 2000;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function messagesToGeminiHistory(messages: ChatMessage[]): Content[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));
}

export function useChat() {
  const { collections, selectedCollection, setAiTableData } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [pendingAction, setPendingAction] = useState<{
    action: PendingAction;
    resolve: (confirmed: boolean) => void;
  } | null>(null);

  const handleConfirm = useCallback(
    async (action: PendingAction): Promise<boolean> => {
      return new Promise((resolve) => {
        setPendingAction({ action, resolve });
        setStatus("awaiting-confirmation");
      });
    },
    []
  );

  const respondToConfirmation = useCallback(
    (confirmed: boolean) => {
      if (pendingAction) {
        pendingAction.resolve(confirmed);
        setPendingAction(null);
        setStatus("calling-function");
      }
    },
    [pendingAction]
  );

  const lastSentRef = useRef<number>(0);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || status !== "idle") return;
      if (!geminiService.isInitialized()) return;

      // Rate-limit: prevent rapid-fire requests
      const now = Date.now();
      if (now - lastSentRef.current < RATE_LIMIT_MS) return;
      lastSentRef.current = now;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      const placeholderId = generateId();
      const assistantPlaceholder: ChatMessage = {
        id: placeholderId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setStatus("sending");

      try {
        const pastHistory = messagesToGeminiHistory(messages);

        const result = await geminiService.sendMessage(
          text.trim(),
          pastHistory,
          collections,
          selectedCollection,
          (s) => setStatus(s as ChatStatus),
          handleConfirm
        );

        const assistantMsg: ChatMessage = {
          id: placeholderId,
          role: "assistant",
          content: result.text,
          timestamp: Date.now(),
          tableData: result.tableData,
          functionCalls: result.functionCalls,
          isLoading: false,
        };

        // Push table data to main content area
        if (result.tableData) {
          setAiTableData(result.tableData);
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === placeholderId ? assistantMsg : m)).slice(-MAX_HISTORY)
        );
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: placeholderId,
          role: "error",
          content:
            err instanceof Error
              ? err.message
              : "Failed to get response from Gemini",
          timestamp: Date.now(),
          isLoading: false,
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === placeholderId ? errorMsg : m))
        );
      } finally {
        setStatus("idle");
      }
    },
    [messages, status, collections, selectedCollection, handleConfirm]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setPendingAction(null);
  }, []);

  return {
    messages,
    status,
    sendMessage,
    clearMessages,
    pendingAction: pendingAction?.action ?? null,
    respondToConfirmation,
  };
}
