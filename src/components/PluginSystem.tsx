import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Puzzle, Plus, Trash2, ToggleLeft, ToggleRight, Code, Upload, Play, AlertTriangle, Info } from "lucide-react";
import { useToast } from "../hooks/useToast";
import type { PluginManifest } from "../types";

const PLUGINS_KEY = "typesense-plugins";

interface PluginSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const BUILTIN_PLUGINS: PluginManifest[] = [
  {
    id: "plugin-export-csv",
    name: "CSV Exporter",
    version: "1.0.0",
    description: "Adds CSV export capability to search results. Results are exported with all visible fields.",
    author: "Typesense UI",
    hooks: ["onSearchResult"],
    enabled: false,
    code: `// Hook: onSearchResult — receives { hits, query, collection }
return {
  action: "download",
  filename: data.collection + "-export.csv",
  content: (() => {
    if (!data.hits || data.hits.length === 0) return "";
    const headers = Object.keys(data.hits[0].document);
    const rows = data.hits.map(h => headers.map(k => JSON.stringify(h.document[k] ?? "")).join(","));
    return [headers.join(","), ...rows].join("\\n");
  })()
};`,
  },
  {
    id: "plugin-highlight-new",
    name: "New Document Highlighter",
    version: "1.0.0",
    description: "Highlights documents created in the last 24 hours with a colored badge in the results table.",
    author: "Typesense UI",
    hooks: ["onDocumentRender"],
    enabled: false,
    code: `// Hook: onDocumentRender — receives { document, element }
const ts = data.document.created_at || data.document.timestamp;
if (ts) {
  const age = Date.now() - new Date(ts).getTime();
  if (age < 86400000) return { badge: "NEW", badgeColor: "#22c55e" };
}
return null;`,
  },
  {
    id: "plugin-query-log",
    name: "Query Logger",
    version: "1.0.0",
    description: "Logs every search query to the browser console with timing and result count. Useful for debugging.",
    author: "Typesense UI",
    hooks: ["onSearch"],
    enabled: false,
    code: `// Hook: onSearch — receives { query, collection, params }
console.log("[QueryLogger]", new Date().toISOString(), "collection:", data.collection, "q:", data.query, "params:", JSON.stringify(data.params));
return null;`,
  },
];

export function PluginSystem({ isOpen, onClose }: PluginSystemProps) {
  const { addToast } = useToast();
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  // New plugin form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newHook, setNewHook] = useState("onSearch");
  const [newCode, setNewCode] = useState('// Available: data object passed by the hook\nconsole.log("Plugin running!", data);\nreturn null;');

  const load = useCallback(() => {
    const saved: PluginManifest[] = JSON.parse(localStorage.getItem(PLUGINS_KEY) || "null");
    if (saved) {
      // Merge with built-ins (don't duplicate)
      const ids = new Set(saved.map((p) => p.id));
      const merged = [...saved, ...BUILTIN_PLUGINS.filter((b) => !ids.has(b.id))];
      setPlugins(merged);
    } else {
      setPlugins([...BUILTIN_PLUGINS]);
    }
  }, []);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const save = (updated: PluginManifest[]) => {
    setPlugins(updated);
    localStorage.setItem(PLUGINS_KEY, JSON.stringify(updated));
  };

  const toggle = (id: string) => {
    save(plugins.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  };

  const remove = (id: string) => {
    if (BUILTIN_PLUGINS.some((b) => b.id === id)) {
      addToast("error", "Cannot delete built-in plugins");
      return;
    }
    save(plugins.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    addToast("success", "Plugin removed");
  };

  const addPlugin = () => {
    if (!newName.trim()) { addToast("error", "Plugin name is required"); return; }
    const plugin: PluginManifest = {
      id: `plugin-custom-${Date.now()}`,
      name: newName.trim(),
      version: "1.0.0",
      description: newDesc.trim() || "Custom plugin",
      author: "Custom",
      hooks: [newHook],
      enabled: true,
      code: newCode,
    };
    save([...plugins, plugin]);
    addToast("success", `Plugin "${plugin.name}" added`);
    setShowAdd(false);
    setNewName("");
    setNewDesc("");
    setNewCode('// Available: data object passed by the hook\nconsole.log("Plugin running!", data);\nreturn null;');
  };

  const testPlugin = (plugin: PluginManifest) => {
    try {
      const mockData: Record<string, unknown> = {
        onSearch: { query: "test query", collection: "products", params: { query_by: "name" } },
        onSearchResult: { hits: [{ document: { id: "1", name: "Test Product", price: 29.99 } }], query: "test", collection: "products" },
        onDocumentRender: { document: { id: "1", name: "Test", created_at: new Date().toISOString() }, element: null },
      };
      const data = mockData[plugin.hooks[0]] || {};
      // eslint-disable-next-line no-new-func
      const fn = new Function("data", plugin.code);
      const result = fn(data);
      setTestOutput(JSON.stringify(result, null, 2) || "null (no return value)");
      addToast("success", "Plugin executed successfully!");
    } catch (err) {
      setTestOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
      addToast("error", "Plugin execution failed");
    }
  };

  const selected = plugins.find((p) => p.id === selectedId);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                <Puzzle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plugin System</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Extend functionality with custom hooks & scripts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowAdd(!showAdd); setSelectedId(null); }} className="btn-primary text-sm flex items-center gap-1.5">
                {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAdd ? "Cancel" : "New Plugin"}
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Plugin list */}
          <div className="w-72 border-r border-gray-200 dark:border-slate-700 overflow-auto flex-shrink-0">
            <div className="p-3 space-y-1.5">
              {plugins.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No plugins installed</p>
              )}
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  onClick={() => { setSelectedId(plugin.id); setShowAdd(false); setTestOutput(null); }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedId === plugin.id ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${plugin.enabled ? "bg-green-500" : "bg-gray-400"}`} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{plugin.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">v{plugin.version}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{plugin.description}</p>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {plugin.hooks.map((h) => (
                      <span key={h} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500">{h}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail / Add form */}
          <div className="flex-1 overflow-auto p-4">
            {showAdd && (
              <div className="animate-fade-in space-y-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Create Plugin
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Name</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Custom Plugin" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Description</label>
                    <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What does this plugin do?" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Hook</label>
                    <select value={newHook} onChange={(e) => setNewHook(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50">
                      <option value="onSearch">onSearch — before search executes</option>
                      <option value="onSearchResult">onSearchResult — after results received</option>
                      <option value="onDocumentRender">onDocumentRender — when a document row renders</option>
                      <option value="onCollectionChange">onCollectionChange — when collection changes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Code</label>
                    <textarea value={newCode} onChange={(e) => setNewCode(e.target.value)} rows={10} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50 font-mono" spellCheck={false} />
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Plugin code runs in the browser. Only install plugins you trust. The <code className="font-mono px-1 bg-amber-100 dark:bg-amber-900/40 rounded">data</code> parameter contains hook-specific context.</span>
                  </div>
                  <button onClick={addPlugin} className="btn-primary text-sm">Add Plugin</button>
                </div>
              </div>
            )}

            {selected && !showAdd && (
              <div className="animate-fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selected.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{selected.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(selected.id)} className={`p-2 rounded-lg transition-colors ${selected.enabled ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"}`} title={selected.enabled ? "Disable" : "Enable"}>
                      {selected.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button onClick={() => testPlugin(selected)} className="btn-secondary text-sm flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5" /> Test
                    </button>
                    {!BUILTIN_PLUGINS.some((b) => b.id === selected.id) && (
                      <button onClick={() => remove(selected.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800">
                    <span className="text-gray-400">Version</span>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">{selected.version}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800">
                    <span className="text-gray-400">Author</span>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">{selected.author}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800">
                    <span className="text-gray-400">Status</span>
                    <p className={`font-semibold ${selected.enabled ? "text-green-600" : "text-gray-400"}`}>{selected.enabled ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Source Code</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500">{selected.hooks.join(", ")}</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-mono text-gray-700 dark:text-gray-200 overflow-auto max-h-48 leading-relaxed">
                    {selected.code}
                  </pre>
                </div>

                {testOutput !== null && (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Test Output</span>
                    </div>
                    <pre className={`p-4 rounded-xl border text-xs font-mono overflow-auto max-h-36 ${testOutput.startsWith("Error") ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" : "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"}`}>
                      {testOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {!selected && !showAdd && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-16">
                <Puzzle className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Select a plugin or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
