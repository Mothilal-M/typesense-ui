import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Database,
  Plus,
  RefreshCw,
  Sparkles,
  LogOut,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: "collection" | "action" | "navigation";
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  extraCommands?: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, extraCommands = [] }: CommandPaletteProps) {
  const {
    collections,
    setSelectedCollection,
    refreshCollections,
    disconnect,
    theme,
    toggleTheme,
  } = useApp();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build the full command list
  const commands = useMemo<CommandItem[]>(() => {
    const collectionCommands: CommandItem[] = collections.map((col) => ({
      id: `col-${col.name}`,
      label: col.name,
      description: `${col.num_documents.toLocaleString()} docs · ${col.fields.length} fields`,
      icon: <Database className="w-4 h-4" />,
      category: "collection",
      action: () => {
        setSelectedCollection(col.name);
        onClose();
      },
      keywords: [col.name, "collection"],
    }));

    const actionCommands: CommandItem[] = [
      {
        id: "new-document",
        label: "New Document",
        description: "Create a new document in the selected collection",
        icon: <Plus className="w-4 h-4" />,
        category: "action",
        action: () => {
          window.dispatchEvent(new Event("new-document"));
          onClose();
        },
        keywords: ["create", "add", "new", "document"],
      },
      {
        id: "refresh",
        label: "Refresh Collections",
        description: "Reload all collections from server",
        icon: <RefreshCw className="w-4 h-4" />,
        category: "action",
        action: () => {
          refreshCollections();
          onClose();
        },
        keywords: ["refresh", "reload", "sync"],
      },
      {
        id: "toggle-ai",
        label: "Toggle AI Chat",
        description: "Open or close the AI assistant panel",
        icon: <Sparkles className="w-4 h-4" />,
        category: "action",
        action: () => {
          window.dispatchEvent(new Event("toggle-ai-chat"));
          onClose();
        },
        keywords: ["ai", "chat", "assistant", "gemini"],
      },
      {
        id: "toggle-theme",
        label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        description: "Toggle between light and dark themes",
        icon: theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        category: "action",
        action: () => {
          toggleTheme();
          onClose();
        },
        keywords: ["theme", "dark", "light", "mode"],
      },
      {
        id: "disconnect",
        label: "Disconnect",
        description: "Disconnect from the current Typesense server",
        icon: <LogOut className="w-4 h-4" />,
        category: "action",
        action: () => {
          disconnect();
          onClose();
        },
        keywords: ["disconnect", "logout", "exit"],
      },
      {
        id: "focus-search",
        label: "Focus Search",
        description: "Jump to the document search bar",
        icon: <Search className="w-4 h-4" />,
        category: "action",
        action: () => {
          window.dispatchEvent(new Event("focus-search"));
          onClose();
        },
        keywords: ["search", "find", "focus"],
      },
    ];

    return [...collectionCommands, ...actionCommands, ...extraCommands];
  }, [collections, theme, setSelectedCollection, refreshCollections, disconnect, toggleTheme, onClose, extraCommands]);

  // Fuzzy filter
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    const terms = lower.split(/\s+/);

    return commands
      .map((cmd) => {
        const searchableText = [
          cmd.label,
          cmd.description || "",
          ...(cmd.keywords || []),
          cmd.category,
        ]
          .join(" ")
          .toLowerCase();

        let score = 0;
        for (const term of terms) {
          if (searchableText.includes(term)) {
            score += 1;
            if (cmd.label.toLowerCase().startsWith(term)) score += 2;
            if (cmd.label.toLowerCase() === term) score += 3;
          }
        }
        return { cmd, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.cmd);
  }, [commands, query]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Keep selection in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length, query]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filtered, selectedIndex, onClose]
  );

  if (!isOpen) return null;

  // Group by category
  const grouped = new Map<string, CommandItem[]>();
  for (const cmd of filtered) {
    const group = grouped.get(cmd.category) || [];
    group.push(cmd);
    grouped.set(cmd.category, group);
  }

  const categoryLabels: Record<string, string> = {
    collection: "Collections",
    action: "Actions",
    navigation: "Navigation",
  };

  let flatIndex = -1;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden animate-slide-in-top"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200/50 dark:border-slate-700/50">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 select-none">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Zap className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                No results found
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {categoryLabels[category] || category}
                </div>
                {items.map((cmd) => {
                  flatIndex++;
                  const idx = flatIndex;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 ring-1 ring-blue-200 dark:ring-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <span
                        className={`shrink-0 p-1.5 rounded-lg ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-800/50 dark:to-purple-800/50 text-blue-600 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"
                        } transition-colors`}
                      >
                        {cmd.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium shrink-0">
                          ↵
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-px bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-px bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-px bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
