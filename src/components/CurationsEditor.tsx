import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2, RefreshCw, Star, EyeOff, ArrowUpDown } from "lucide-react";
import type { OverrideSchema } from "../types";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";

interface CurationsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
}

export function CurationsEditor({ isOpen, onClose, collectionName }: CurationsEditorProps) {
  const { addToast } = useToast();
  const [overrides, setOverrides] = useState<OverrideSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formId, setFormId] = useState("");
  const [formQuery, setFormQuery] = useState("");
  const [formMatch, setFormMatch] = useState<"exact" | "contains">("exact");
  const [formIncludes, setFormIncludes] = useState<{ id: string; position: number }[]>([]);
  const [formExcludes, setFormExcludes] = useState<string[]>([]);
  const [formFilterBy, setFormFilterBy] = useState("");
  const [formSortBy, setFormSortBy] = useState("");
  const [formReplaceQuery, setFormReplaceQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadOverrides = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await typesenseService.getOverrides(collectionName);
      setOverrides(data);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load curations");
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, addToast]);

  useEffect(() => {
    if (isOpen) loadOverrides();
  }, [isOpen, loadOverrides]);

  const resetForm = () => {
    setFormId("");
    setFormQuery("");
    setFormMatch("exact");
    setFormIncludes([]);
    setFormExcludes([]);
    setFormFilterBy("");
    setFormSortBy("");
    setFormReplaceQuery("");
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formId.trim()) { addToast("error", "Override ID is required"); return; }
    if (!formQuery.trim()) { addToast("error", "Query is required"); return; }

    setIsSaving(true);
    try {
      const body: Omit<OverrideSchema, "id"> = {
        rule: { query: formQuery.trim(), match: formMatch },
        ...(formIncludes.length > 0 ? { includes: formIncludes } : {}),
        ...(formExcludes.length > 0 ? { excludes: formExcludes.map((id) => ({ id })) } : {}),
        ...(formFilterBy ? { filter_by: formFilterBy } : {}),
        ...(formSortBy ? { sort_by: formSortBy } : {}),
        ...(formReplaceQuery ? { replace_query: formReplaceQuery } : {}),
      };
      await typesenseService.upsertOverride(collectionName, formId.trim(), body);
      addToast("success", `Curation "${formId}" saved`);
      resetForm();
      await loadOverrides();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to save curation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await typesenseService.deleteOverride(collectionName, id);
      addToast("success", `Curation "${id}" deleted`);
      await loadOverrides();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to delete curation");
    }
  };

  const addInclude = () => {
    setFormIncludes([...formIncludes, { id: "", position: formIncludes.length + 1 }]);
  };

  const addExclude = () => {
    setFormExcludes([...formExcludes, ""]);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Curations Editor</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pin, hide, or boost results for "{collectionName}"</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadOverrides} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-4">
          {/* Add Override Form */}
          {showForm ? (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 space-y-3 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Override ID</label>
                  <input type="text" value={formId} onChange={(e) => setFormId(e.target.value)} placeholder="e.g. promo-iphone" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Trigger Query</label>
                  <input type="text" value={formQuery} onChange={(e) => setFormQuery(e.target.value)} placeholder="e.g. apple" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Match:</label>
                <button onClick={() => setFormMatch("exact")} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${formMatch === "exact" ? "bg-amber-500 text-white shadow" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"}`}>
                  Exact
                </button>
                <button onClick={() => setFormMatch("contains")} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${formMatch === "contains" ? "bg-amber-500 text-white shadow" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"}`}>
                  Contains
                </button>
              </div>

              {/* Pinned documents (includes) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" /> Pinned Documents
                  </label>
                  <button onClick={addInclude} className="text-xs text-amber-600 hover:underline">+ Add</button>
                </div>
                {formIncludes.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <input type="text" placeholder="Document ID" value={inc.id} onChange={(e) => { const arr = [...formIncludes]; arr[i] = { ...arr[i], id: e.target.value }; setFormIncludes(arr); }} className="flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                    <input type="number" placeholder="Pos" value={inc.position} onChange={(e) => { const arr = [...formIncludes]; arr[i] = { ...arr[i], position: Number(e.target.value) }; setFormIncludes(arr); }} className="w-20 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                    <button onClick={() => setFormIncludes(formIncludes.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>

              {/* Hidden documents (excludes) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <EyeOff className="w-3 h-3 text-red-500" /> Hidden Documents
                  </label>
                  <button onClick={addExclude} className="text-xs text-red-600 hover:underline">+ Add</button>
                </div>
                {formExcludes.map((id, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <input type="text" placeholder="Document ID to hide" value={id} onChange={(e) => { const arr = [...formExcludes]; arr[i] = e.target.value; setFormExcludes(arr); }} className="flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                    <button onClick={() => setFormExcludes(formExcludes.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>

              {/* Additional options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">filter_by</label>
                  <input type="text" value={formFilterBy} onChange={(e) => setFormFilterBy(e.target.value)} placeholder="e.g. brand:=Apple" className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono text-gray-900 dark:text-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">sort_by</label>
                  <input type="text" value={formSortBy} onChange={(e) => setFormSortBy(e.target.value)} placeholder="e.g. rating:desc" className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono text-gray-900 dark:text-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">replace_query</label>
                  <input type="text" value={formReplaceQuery} onChange={(e) => setFormReplaceQuery(e.target.value)} placeholder="Optional" className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save Override
                </button>
                <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-amber-400 hover:text-amber-500 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Curation Rule
            </button>
          )}

          {/* Overrides List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : overrides.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No curations configured</p>
              <p className="text-sm mt-1">Pin or hide specific results for targeted queries</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overrides.map((ov) => (
                <div key={ov.id} className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{ov.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ov.rule.match === "exact" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"}`}>
                          {ov.rule.match.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Query: <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">"{ov.rule.query}"</span>
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {ov.includes && ov.includes.length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            <Star className="w-3 h-3" /> {ov.includes.length} pinned
                          </span>
                        )}
                        {ov.excludes && ov.excludes.length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-[10px] font-bold text-red-700 dark:text-red-300">
                            <EyeOff className="w-3 h-3" /> {ov.excludes.length} hidden
                          </span>
                        )}
                        {ov.filter_by && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                            filter: {ov.filter_by}
                          </span>
                        )}
                        {ov.sort_by && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                            <ArrowUpDown className="w-3 h-3" /> {ov.sort_by}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(ov.id)} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
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
