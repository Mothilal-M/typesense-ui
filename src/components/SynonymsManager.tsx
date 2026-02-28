import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2, ArrowRightLeft, ArrowRight, RefreshCw } from "lucide-react";
import type { SynonymSchema } from "../types";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";

interface SynonymsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
}

type SynonymType = "multi-way" | "one-way";

export function SynonymsManager({ isOpen, onClose, collectionName }: SynonymsManagerProps) {
  const { addToast } = useToast();
  const [synonyms, setSynonyms] = useState<SynonymSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [synType, setSynType] = useState<SynonymType>("multi-way");
  const [synId, setSynId] = useState("");
  const [synRoot, setSynRoot] = useState("");
  const [synWords, setSynWords] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadSynonyms = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await typesenseService.getSynonyms(collectionName);
      setSynonyms(data);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load synonyms");
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, addToast]);

  useEffect(() => {
    if (isOpen) loadSynonyms();
  }, [isOpen, loadSynonyms]);

  const resetForm = () => {
    setSynType("multi-way");
    setSynId("");
    setSynRoot("");
    setSynWords("");
    setShowForm(false);
  };

  const handleSave = async () => {
    const words = synWords.split(",").map((w) => w.trim()).filter(Boolean);
    if (!synId.trim()) { addToast("error", "Synonym ID is required"); return; }
    if (words.length < 2) { addToast("error", "At least 2 synonym words are required"); return; }
    if (synType === "one-way" && !synRoot.trim()) { addToast("error", "Root word is required for one-way synonyms"); return; }

    setIsSaving(true);
    try {
      const body: Omit<SynonymSchema, "id"> = {
        synonyms: words,
        ...(synType === "one-way" ? { root: synRoot.trim() } : {}),
      };
      await typesenseService.upsertSynonym(collectionName, synId.trim(), body);
      addToast("success", `Synonym "${synId}" saved`);
      resetForm();
      await loadSynonyms();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to save synonym");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await typesenseService.deleteSynonym(collectionName, id);
      addToast("success", `Synonym "${id}" deleted`);
      await loadSynonyms();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to delete synonym");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Synonyms Manager</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{collectionName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadSynonyms} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-4">
          {/* Add Synonym Form */}
          {showForm ? (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 space-y-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Type:</label>
                <button
                  onClick={() => setSynType("multi-way")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${synType === "multi-way" ? "bg-blue-500 text-white shadow" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"}`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 inline mr-1" /> Multi-way
                </button>
                <button
                  onClick={() => setSynType("one-way")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${synType === "one-way" ? "bg-blue-500 text-white shadow" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"}`}
                >
                  <ArrowRight className="w-3.5 h-3.5 inline mr-1" /> One-way
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Synonym ID</label>
                <input
                  type="text"
                  value={synId}
                  onChange={(e) => setSynId(e.target.value)}
                  placeholder="e.g. phone-synonyms"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50"
                />
              </div>

              {synType === "one-way" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Root word</label>
                  <input
                    type="text"
                    value={synRoot}
                    onChange={(e) => setSynRoot(e.target.value)}
                    placeholder="e.g. smartphone"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  {synType === "one-way" ? "Words that map to root (comma-separated)" : "Synonym words (comma-separated)"}
                </label>
                <input
                  type="text"
                  value={synWords}
                  onChange={(e) => setSynWords(e.target.value)}
                  placeholder="e.g. phone, mobile, cell phone, handset"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Synonym
                </button>
                <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Synonym
            </button>
          )}

          {/* Synonyms List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : synonyms.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No synonyms configured</p>
              <p className="text-sm mt-1">Add synonyms to improve search relevance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {synonyms.map((syn) => (
                <div
                  key={syn.id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{syn.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${syn.root ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"}`}>
                        {syn.root ? "ONE-WAY" : "MULTI-WAY"}
                      </span>
                    </div>
                    {syn.root && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        Root: <span className="font-semibold text-gray-700 dark:text-gray-200">{syn.root}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {syn.synonyms.map((word, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(syn.id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
