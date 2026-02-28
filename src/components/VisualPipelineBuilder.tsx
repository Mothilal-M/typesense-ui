import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Plus, Trash2, Play, Loader2, Download, Upload, Wand2, Search,
  ChevronUp, ChevronDown, GripVertical, CheckCircle, XCircle
} from "lucide-react";
import type { CollectionSchema, PipelineStep, PipelineStepType } from "../types";
import { typesenseService } from "../services/typesense";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";

interface VisualPipelineBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_TEMPLATES: Record<PipelineStepType, { icon: React.ReactNode; label: string; defaultConfig: Record<string, unknown> }> = {
  import: {
    icon: <Upload className="w-4 h-4" />,
    label: "Import Data",
    defaultConfig: { source: "json", data: "" },
  },
  transform: {
    icon: <Wand2 className="w-4 h-4" />,
    label: "Transform",
    defaultConfig: { script: "// Transform each doc\nreturn doc;" },
  },
  index: {
    icon: <Download className="w-4 h-4" />,
    label: "Index to Collection",
    defaultConfig: { collection: "", action: "upsert" },
  },
  search: {
    icon: <Search className="w-4 h-4" />,
    label: "Test Search",
    defaultConfig: { q: "*", query_by: "", per_page: 5 },
  },
};

const STEP_COLORS: Record<PipelineStepType, string> = {
  import: "from-blue-500 to-cyan-500",
  transform: "from-purple-500 to-pink-500",
  index: "from-green-500 to-emerald-500",
  search: "from-amber-500 to-orange-500",
};

let stepCounter = 1;

export function VisualPipelineBuilder({ isOpen, onClose }: VisualPipelineBuilderProps) {
  const { collections, refreshCollections } = useApp();
  const { addToast } = useToast();
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Map<string, { status: "success" | "error"; message: string; data?: unknown }>>(new Map());
  const [pipelineName, setPipelineName] = useState("My Pipeline");
  const dataRef = useRef<unknown[]>([]);

  const addStep = (type: PipelineStepType) => {
    const template = STEP_TEMPLATES[type];
    setSteps((prev) => [
      ...prev,
      {
        id: `step-${stepCounter++}`,
        type,
        label: template.label,
        config: { ...template.defaultConfig },
      },
    ]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setResults((prev) => { const m = new Map(prev); m.delete(id); return m; });
  };

  const moveStep = (id: string, direction: "up" | "down") => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const updateConfig = (id: string, key: string, value: unknown) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s))
    );
  };

  const runPipeline = useCallback(async () => {
    if (steps.length === 0) { addToast("error", "Add at least one step"); return; }

    setIsRunning(true);
    setResults(new Map());
    dataRef.current = [];

    for (const step of steps) {
      try {
        let message = "";
        if (step.type === "import") {
          const raw = step.config.data as string;
          if (!raw.trim()) throw new Error("No data provided");
          const parsed = JSON.parse(raw);
          dataRef.current = Array.isArray(parsed) ? parsed : [parsed];
          message = `Loaded ${dataRef.current.length} documents`;
        }

        if (step.type === "transform") {
          const script = step.config.script as string;
          // Very basic sandboxed transform approach
          const fn = new Function("doc", script);
          dataRef.current = dataRef.current.map((doc) => fn(doc)).filter(Boolean);
          message = `Transformed ${dataRef.current.length} documents`;
        }

        if (step.type === "index") {
          const collection = step.config.collection as string;
          const action = (step.config.action as string) || "upsert";
          if (!collection) throw new Error("No collection selected");
          if (dataRef.current.length === 0) throw new Error("No data to index (run Import/Transform first)");
          const result = await typesenseService.importDocuments(collection, dataRef.current as any[], action as any);
          const successCount = result.filter((r) => r.success).length;
          message = `Indexed ${successCount}/${dataRef.current.length} documents to "${collection}"`;
          await refreshCollections();
        }

        if (step.type === "search") {
          const collection = step.config.collection as string || (collections[0]?.name ?? "");
          const q = (step.config.q as string) || "*";
          const queryBy = step.config.query_by as string;
          if (!queryBy) throw new Error("query_by is required");
          const res = await typesenseService.searchDocuments(collection, {
            q,
            query_by: queryBy,
            per_page: Number(step.config.per_page) || 5,
          });
          message = `Found ${res.found} results in ${res.search_time_ms}ms`;
          setResults((prev) => new Map(prev).set(step.id, { status: "success", message, data: res.hits.slice(0, 5) }));
          continue;
        }

        setResults((prev) => new Map(prev).set(step.id, { status: "success", message }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Step failed";
        setResults((prev) => new Map(prev).set(step.id, { status: "error", message: msg }));
        addToast("error", `Pipeline stopped at "${step.label}": ${msg}`);
        break;
      }
    }

    setIsRunning(false);
    addToast("success", "Pipeline execution complete");
  }, [steps, collections, refreshCollections, addToast]);

  const savePipeline = () => {
    const pipelines = JSON.parse(localStorage.getItem("typesense-pipelines") || "[]");
    pipelines.push({ id: `pipe-${Date.now()}`, name: pipelineName, steps, createdAt: Date.now() });
    localStorage.setItem("typesense-pipelines", JSON.stringify(pipelines));
    addToast("success", `Pipeline "${pipelineName}" saved`);
  };

  const loadPipeline = () => {
    const pipelines = JSON.parse(localStorage.getItem("typesense-pipelines") || "[]");
    if (pipelines.length === 0) { addToast("info", "No saved pipelines"); return; }
    const latest = pipelines[pipelines.length - 1];
    setSteps(latest.steps);
    setPipelineName(latest.name);
    addToast("success", `Loaded pipeline "${latest.name}"`);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  className="text-lg font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">Import → Transform → Index → Search</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadPipeline} className="btn-secondary text-xs px-3 py-1.5">Load</button>
              <button onClick={savePipeline} className="btn-secondary text-xs px-3 py-1.5">Save</button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Add step buttons */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STEP_TEMPLATES) as PipelineStepType[]).map((type) => (
              <button
                key={type}
                onClick={() => addStep(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${STEP_COLORS[type]} shadow-md hover:shadow-lg transition-all flex items-center gap-1.5`}
              >
                {STEP_TEMPLATES[type].icon}
                <Plus className="w-3 h-3" />
                {STEP_TEMPLATES[type].label}
              </button>
            ))}
          </div>

          {/* Pipeline steps */}
          {steps.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No steps yet</p>
              <p className="text-sm mt-1">Add steps above to build your pipeline</p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, i) => {
                const result = results.get(step.id);
                return (
                  <div key={step.id}>
                    {/* Connector line */}
                    {i > 0 && (
                      <div className="flex justify-center -my-1">
                        <div className="w-0.5 h-4 bg-gray-300 dark:bg-slate-600" />
                      </div>
                    )}

                    <div className={`p-4 rounded-xl border ${result?.status === "success" ? "border-green-300 dark:border-green-700" : result?.status === "error" ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-slate-700"} bg-white dark:bg-slate-800/50 transition-all`}>
                      <div className="flex items-center gap-2 mb-3">
                        <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${STEP_COLORS[step.type]} text-white`}>
                          {STEP_TEMPLATES[step.type].icon}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-50">{step.label}</span>
                        <span className="text-[10px] font-mono text-gray-400">Step {i + 1}</span>
                        <div className="flex-1" />

                        {/* Result indicator */}
                        {result && (
                          <div className={`flex items-center gap-1 text-xs font-medium ${result.status === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {result.status === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span className="max-w-[200px] truncate">{result.message}</span>
                          </div>
                        )}

                        <button onClick={() => moveStep(step.id, "up")} disabled={i === 0} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveStep(step.id, "down")} disabled={i === steps.length - 1} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeStep(step.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>

                      {/* Step config */}
                      <StepConfig step={step} onChange={updateConfig} collections={collections} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {steps.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button onClick={onClose} className="btn-secondary px-4 py-2">Close</button>
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 shadow-lg transition-all flex items-center gap-2"
            >
              {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Run Pipeline
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function StepConfig({ step, onChange, collections }: {
  step: PipelineStep;
  onChange: (id: string, key: string, value: unknown) => void;
  collections: CollectionSchema[];
}) {
  if (step.type === "import") {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">JSON Data (array)</label>
        <textarea
          value={(step.config.data as string) || ""}
          onChange={(e) => onChange(step.id, "data", e.target.value)}
          placeholder='[{"title": "Example", "price": 100}]'
          className="w-full h-28 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-xs font-mono text-gray-900 dark:text-gray-50 resize-none"
        />
      </div>
    );
  }

  if (step.type === "transform") {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Transform Script (JavaScript)</label>
        <textarea
          value={(step.config.script as string) || ""}
          onChange={(e) => onChange(step.id, "script", e.target.value)}
          placeholder="// doc is the current document. Return transformed doc.\nreturn { ...doc, processed: true };"
          className="w-full h-28 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-xs font-mono text-gray-900 dark:text-gray-50 resize-none"
        />
      </div>
    );
  }

  if (step.type === "index") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Collection</label>
          <select
            value={(step.config.collection as string) || ""}
            onChange={(e) => onChange(step.id, "collection", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50"
          >
            <option value="">Select collection...</option>
            {collections.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Action</label>
          <select
            value={(step.config.action as string) || "upsert"}
            onChange={(e) => onChange(step.id, "action", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50"
          >
            <option value="create">Create</option>
            <option value="upsert">Upsert</option>
            <option value="update">Update</option>
          </select>
        </div>
      </div>
    );
  }

  if (step.type === "search") {
    return (
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Collection</label>
          <select
            value={(step.config.collection as string) || ""}
            onChange={(e) => onChange(step.id, "collection", e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50"
          >
            <option value="">Select...</option>
            {collections.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">q</label>
          <input type="text" value={(step.config.q as string) || "*"} onChange={(e) => onChange(step.id, "q", e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">query_by</label>
          <input type="text" value={(step.config.query_by as string) || ""} onChange={(e) => onChange(step.id, "query_by", e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono text-gray-900 dark:text-gray-50" />
        </div>
      </div>
    );
  }

  return null;
}
