import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2, Key, Copy, Check, RefreshCw, Shield, Eye, EyeOff } from "lucide-react";
import type { ApiKeySchema } from "../types";
import { typesenseService } from "../services/typesense";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";

interface ApiKeysManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_ACTIONS = [
  "documents:search",
  "documents:get",
  "documents:create",
  "documents:upsert",
  "documents:update",
  "documents:delete",
  "documents:import",
  "documents:export",
  "collections:list",
  "collections:get",
  "collections:create",
  "collections:delete",
  "synonyms:list",
  "synonyms:get",
  "synonyms:create",
  "synonyms:delete",
  "overrides:list",
  "overrides:get",
  "overrides:create",
  "overrides:delete",
  "keys:list",
  "keys:get",
  "keys:create",
  "keys:delete",
  "*",
];

const ACTION_PRESETS: Record<string, string[]> = {
  "Search Only": ["documents:search", "collections:list", "collections:get"],
  "Read Only": ["documents:search", "documents:get", "documents:export", "collections:list", "collections:get", "synonyms:list", "overrides:list"],
  "Read/Write": ["documents:search", "documents:get", "documents:create", "documents:upsert", "documents:update", "documents:delete", "documents:import", "documents:export", "collections:list", "collections:get"],
  "Admin": ["*"],
};

export function ApiKeysManager({ isOpen, onClose }: ApiKeysManagerProps) {
  const { collections } = useApp();
  const { addToast } = useToast();
  const [keys, setKeys] = useState<ApiKeySchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showKeyValues, setShowKeyValues] = useState<Set<number>>(new Set());

  // Form state
  const [formDescription, setFormDescription] = useState("");
  const [formActions, setFormActions] = useState<string[]>(["documents:search"]);
  const [formCollections, setFormCollections] = useState<string[]>(["*"]);
  const [formExpires, setFormExpires] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await typesenseService.getApiKeys();
      setKeys(data);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isOpen) { loadKeys(); setNewKeyValue(null); }
  }, [isOpen, loadKeys]);

  const resetForm = () => {
    setFormDescription("");
    setFormActions(["documents:search"]);
    setFormCollections(["*"]);
    setFormExpires("");
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!formDescription.trim()) { addToast("error", "Description is required"); return; }

    setIsSaving(true);
    try {
      const body: Omit<ApiKeySchema, "id" | "value"> = {
        description: formDescription.trim(),
        actions: formActions,
        collections: formCollections,
        ...(formExpires ? { expires_at: Math.floor(new Date(formExpires).getTime() / 1000) } : {}),
      };
      const result = await typesenseService.createApiKey(body);
      setNewKeyValue(result.value || null);
      addToast("success", "API key created — copy it now, it won't be shown again!");
      resetForm();
      await loadKeys();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await typesenseService.deleteApiKey(id);
      addToast("success", "API key deleted");
      await loadKeys();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to delete API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleAction = (action: string) => {
    setFormActions((prev) =>
      prev.includes(action)
        ? prev.filter((a) => a !== action)
        : [...prev, action]
    );
  };

  const applyPreset = (preset: string) => {
    setFormActions(ACTION_PRESETS[preset] || []);
  };

  const toggleCollectionSelection = (name: string) => {
    setFormCollections((prev) => {
      if (name === "*") return ["*"];
      const without = prev.filter((c) => c !== "*" && c !== name);
      if (prev.includes(name)) return without.length === 0 ? ["*"] : without;
      return [...without, name];
    });
  };

  const toggleShowKey = (id: number) => {
    setShowKeyValues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">API Keys Manager</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create & manage scoped API keys</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadKeys} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-4">
          {/* New key value banner */}
          {newKeyValue && (
            <div className="p-4 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 animate-fade-in">
              <p className="text-sm font-bold text-green-800 dark:text-green-200 mb-2">
                ⚠️ Copy this key now — it won't be shown again!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 text-sm font-mono text-gray-900 dark:text-gray-50 break-all">
                  {newKeyValue}
                </code>
                <button onClick={() => copyToClipboard(newKeyValue)} className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors">
                  {copiedKey === newKeyValue ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Create Key Form */}
          {showForm ? (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 space-y-3 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Description</label>
                <input type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="e.g. Frontend search key" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
              </div>

              {/* Permission Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Quick Presets</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ACTION_PRESETS).map((preset) => (
                    <button key={preset} onClick={() => applyPreset(preset)} className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 transition-colors">
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Permissions</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto">
                  {ALL_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => toggleAction(action)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                        formActions.includes(action)
                          ? "bg-emerald-500 text-white shadow"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collections scope */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Collection Scope</label>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => toggleCollectionSelection("*")} className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${formCollections.includes("*") ? "bg-emerald-500 text-white shadow" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"}`}>
                    All (*)
                  </button>
                  {collections.map((col) => (
                    <button key={col.name} onClick={() => toggleCollectionSelection(col.name)} className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${formCollections.includes(col.name) ? "bg-emerald-500 text-white shadow" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"}`}>
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Expires At (optional)</label>
                <input type="datetime-local" value={formExpires} onChange={(e) => setFormExpires(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleCreate} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Create Key
                </button>
                <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Create API Key
            </button>
          )}

          {/* Keys List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No API keys found</p>
              <p className="text-sm mt-1">Create scoped keys for different use cases</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div key={key.id} className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{key.description}</span>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">ID: {key.id}</span>
                      </div>

                      {/* Key preview */}
                      {key.value && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <code className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                            {showKeyValues.has(key.id!) ? key.value : `${key.value.slice(0, 8)}${"•".repeat(20)}`}
                          </code>
                          <button onClick={() => toggleShowKey(key.id!)} className="p-0.5 text-gray-400 hover:text-gray-600">
                            {showKeyValues.has(key.id!) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button onClick={() => copyToClipboard(key.value!)} className="p-0.5 text-gray-400 hover:text-emerald-500">
                            {copiedKey === key.value ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {key.actions.map((action) => (
                          <span key={action} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            {action}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        Collections: {key.collections.join(", ")}
                        {key.expires_at ? ` · Expires: ${new Date(key.expires_at * 1000).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(key.id!)} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
