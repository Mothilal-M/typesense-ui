import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { TypesenseConfig, CollectionSchema, ThemeMode } from "../types";
import type { TableResult } from "../types/chat";
import { typesenseService } from "../services/typesense";
import { readSecure, writeSecure, removeSecure } from "../lib/crypto";

interface AppContextType {
  // Connection
  config: TypesenseConfig | null;
  isConnected: boolean;
  setConfig: (config: TypesenseConfig) => void;
  disconnect: () => void;

  // Collections
  collections: CollectionSchema[];
  selectedCollection: string | null;
  setSelectedCollection: (name: string | null) => void;
  refreshCollections: () => Promise<void>;

  // UI State
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;

  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;

  // Gemini AI
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string) => void;
  clearGeminiApiKey: () => void;

  // AI Results (displayed in main content area)
  aiTableData: TableResult | null;
  setAiTableData: (data: TableResult | null) => void;
  clearAiTableData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<TypesenseConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collections, setCollections] = useState<CollectionSchema[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as ThemeMode) || "light";
  });
  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(
    import.meta.env.VITE_GEMINI_API_KEY || null
  );
  const [aiTableData, setAiTableData] = useState<TableResult | null>(null);

  // Load encrypted credentials on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [savedConfig, savedKey] = await Promise.all([
        readSecure<TypesenseConfig>("typesense-config"),
        readSecure<string>("gemini-api-key"),
      ]);
      if (cancelled) return;
      if (savedConfig) {
        setConfigState(savedConfig);
      }
      if (savedKey) {
        setGeminiApiKeyState(savedKey);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Initialize connection from saved config (fires when async load completes)
  useEffect(() => {
    if (config && !isConnected) {
      connectToTypesense(config);
    }
  }, [config]);

  const connectToTypesense = async (newConfig: TypesenseConfig) => {
    setIsLoading(true);
    setError(null);
    try {
      typesenseService.initialize(newConfig);
      await typesenseService.testConnection();
      setConfigState(newConfig);
      await writeSecure("typesense-config", newConfig);
      setIsConnected(true);
      await refreshCollections();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to Typesense"
      );
      setIsConnected(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    typesenseService.disconnect();
    setConfigState(null);
    setIsConnected(false);
    setCollections([]);
    setSelectedCollection(null);
    removeSecure("typesense-config");
  };

  const refreshCollections = async () => {
    if (!typesenseService.isConnected()) return;

    setIsLoading(true);
    setError(null);
    try {
      const cols = await typesenseService.getCollections();
      setCollections(cols);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch collections"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    writeSecure("gemini-api-key", key);
  };

  const clearGeminiApiKey = () => {
    setGeminiApiKeyState(null);
    removeSecure("gemini-api-key");
  };

  const clearAiTableData = () => {
    setAiTableData(null);
  };

  return (
    <AppContext.Provider
      value={{
        config,
        isConnected,
        setConfig: connectToTypesense,
        disconnect,
        collections,
        selectedCollection,
        setSelectedCollection,
        refreshCollections,
        isLoading,
        error,
        setError,
        theme,
        toggleTheme,
        geminiApiKey,
        setGeminiApiKey,
        clearGeminiApiKey,
        aiTableData,
        setAiTableData,
        clearAiTableData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
