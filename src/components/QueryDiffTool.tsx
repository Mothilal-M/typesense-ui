import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Play, Loader2, GitCompare, ArrowRight } from "lucide-react";
import type { CollectionSchema, SearchResponse } from "../types";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";

interface QueryDiffToolProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionSchema;
}

interface QueryConfig {
  q: string;
  query_by: string;
  filter_by: string;
  sort_by: string;
  per_page: number;
}

interface DiffResult {
  query: QueryConfig;
  response: SearchResponse;
  time: number;
}

function defaultQuery(collection: CollectionSchema): QueryConfig {
  const stringFields = collection.fields
    .filter((f) => f.type === "string" || f.type === "string[]")
    .map((f) => f.name);
  return {
    q: "*",
    query_by: stringFields.slice(0, 3).join(",") || "",
    filter_by: "",
    sort_by: "",
    per_page: 10,
  };
}

export function QueryDiffTool({ isOpen, onClose, collection }: QueryDiffToolProps) {
  const { addToast } = useToast();
  const [queryA, setQueryA] = useState<QueryConfig>(() => defaultQuery(collection));
  const [queryB, setQueryB] = useState<QueryConfig>(() => defaultQuery(collection));
  const [resultA, setResultA] = useState<DiffResult | null>(null);
  const [resultB, setResultB] = useState<DiffResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiff = useCallback(async () => {
    setIsRunning(true);
    try {
      const [resA, resB] = await Promise.all([
        typesenseService.searchDocuments(collection.name, {
          q: queryA.q || "*",
          query_by: queryA.query_by,
          filter_by: queryA.filter_by || undefined,
          sort_by: queryA.sort_by || undefined,
          per_page: queryA.per_page,
          page: 1,
        }),
        typesenseService.searchDocuments(collection.name, {
          q: queryB.q || "*",
          query_by: queryB.query_by,
          filter_by: queryB.filter_by || undefined,
          sort_by: queryB.sort_by || undefined,
          per_page: queryB.per_page,
          page: 1,
        }),
      ]);
      setResultA({ query: queryA, response: resA, time: resA.search_time_ms });
      setResultB({ query: queryB, response: resB, time: resB.search_time_ms });
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Query comparison failed");
    } finally {
      setIsRunning(false);
    }
  }, [collection.name, queryA, queryB, addToast]);

  const getDocIds = (res: DiffResult | null): Set<string> => {
    if (!res) return new Set();
    return new Set(res.response.hits.map((h) => String(h.document.id)));
  };

  const idsA = getDocIds(resultA);
  const idsB = getDocIds(resultB);
  const onlyInA = [...idsA].filter((id) => !idsB.has(id));
  const onlyInB = [...idsB].filter((id) => !idsA.has(id));
  const inBoth = [...idsA].filter((id) => idsB.has(id));

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg">
                <GitCompare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Query Diff Tool</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Compare two search queries side-by-side</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Query inputs — side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QueryInput label="Query A" config={queryA} onChange={setQueryA} color="blue" />
            <QueryInput label="Query B" config={queryB} onChange={setQueryB} color="purple" />
          </div>

          {/* Run button */}
          <div className="flex items-center justify-center">
            <button
              onClick={runDiff}
              disabled={isRunning}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 shadow-lg transition-all flex items-center gap-2"
            >
              {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Compare Results
            </button>
          </div>

          {/* Summary stats */}
          {resultA && resultB && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in">
              <StatCard label="Query A Found" value={resultA.response.found.toLocaleString()} color="blue" />
              <StatCard label="Query B Found" value={resultB.response.found.toLocaleString()} color="purple" />
              <StatCard label="Only in A" value={onlyInA.length.toString()} color="amber" />
              <StatCard label="Only in B" value={onlyInB.length.toString()} color="amber" />
              <StatCard label="In Both" value={inBoth.length.toString()} color="green" />
            </div>
          )}

          {/* Performance comparison */}
          {resultA && resultB && (
            <div className="flex items-center gap-3 text-sm animate-fade-in">
              <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 font-semibold text-blue-700 dark:text-blue-300">
                A: {resultA.time}ms
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 font-semibold text-purple-700 dark:text-purple-300">
                B: {resultB.time}ms
              </span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {resultA.time < resultB.time
                  ? `A is ${resultB.time - resultA.time}ms faster`
                  : resultB.time < resultA.time
                    ? `B is ${resultA.time - resultB.time}ms faster`
                    : "Same speed"}
              </span>
            </div>
          )}

          {/* Results side by side */}
          {resultA && resultB && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <ResultPanel label="Query A Results" result={resultA} otherIds={idsB} color="blue" collection={collection} />
              <ResultPanel label="Query B Results" result={resultB} otherIds={idsA} color="purple" collection={collection} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function QueryInput({ label, config, onChange, color }: {
  label: string;
  config: QueryConfig;
  onChange: (c: QueryConfig) => void;
  color: "blue" | "purple";
}) {
  const borderColor = color === "blue" ? "border-blue-200 dark:border-blue-800" : "border-purple-200 dark:border-purple-800";
  return (
    <div className={`p-3 rounded-xl border ${borderColor} space-y-2`}>
      <h3 className={`text-sm font-bold ${color === "blue" ? "text-blue-700 dark:text-blue-300" : "text-purple-700 dark:text-purple-300"}`}>{label}</h3>
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">q</label>
        <input type="text" value={config.q} onChange={(e) => onChange({ ...config, q: e.target.value })} className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">query_by</label>
        <input type="text" value={config.query_by} onChange={(e) => onChange({ ...config, query_by: e.target.value })} className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono text-gray-900 dark:text-gray-50" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">filter_by</label>
          <input type="text" value={config.filter_by} onChange={(e) => onChange({ ...config, filter_by: e.target.value })} placeholder="Optional" className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono text-gray-900 dark:text-gray-50" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">sort_by</label>
          <input type="text" value={config.sort_by} onChange={(e) => onChange({ ...config, sort_by: e.target.value })} placeholder="Optional" className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono text-gray-900 dark:text-gray-50" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const bg =
    color === "blue" ? "bg-blue-50 dark:bg-blue-900/20" :
    color === "purple" ? "bg-purple-50 dark:bg-purple-900/20" :
    color === "amber" ? "bg-amber-50 dark:bg-amber-900/20" :
    "bg-green-50 dark:bg-green-900/20";
  const text =
    color === "blue" ? "text-blue-700 dark:text-blue-300" :
    color === "purple" ? "text-purple-700 dark:text-purple-300" :
    color === "amber" ? "text-amber-700 dark:text-amber-300" :
    "text-green-700 dark:text-green-300";
  return (
    <div className={`p-3 rounded-xl ${bg} text-center`}>
      <p className="text-2xl font-bold ${text}">{value}</p>
      <p className={`text-[10px] font-semibold ${text} mt-0.5`}>{label}</p>
    </div>
  );
}

function ResultPanel({ label, result, otherIds, color, collection }: {
  label: string;
  result: DiffResult;
  otherIds: Set<string>;
  color: "blue" | "purple";
  collection: CollectionSchema;
}) {
  const displayFields = collection.fields.slice(0, 4).map((f) => f.name);
  const headerBg = color === "blue" ? "bg-blue-50 dark:bg-blue-900/20" : "bg-purple-50 dark:bg-purple-900/20";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className={`px-3 py-2 ${headerBg}`}>
        <span className={`text-sm font-bold ${color === "blue" ? "text-blue-700 dark:text-blue-300" : "text-purple-700 dark:text-purple-300"}`}>{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          {result.response.found.toLocaleString()} found · {result.time}ms
        </span>
      </div>
      <div className="overflow-auto max-h-80">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left font-semibold text-gray-600 dark:text-gray-300">#</th>
              {displayFields.map((f) => (
                <th key={f} className="px-2 py-1.5 text-left font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{f}</th>
              ))}
              <th className="px-2 py-1.5 text-right font-semibold text-gray-600 dark:text-gray-300">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {result.response.hits.map((hit, i) => {
              const docId = String(hit.document.id);
              const inOther = otherIds.has(docId);
              return (
                <tr key={docId} className={`${inOther ? "" : color === "blue" ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-purple-50/50 dark:bg-purple-900/10"}`}>
                  <td className="px-2 py-1.5 font-mono text-gray-400">{i + 1}</td>
                  {displayFields.map((f) => (
                    <td key={f} className="px-2 py-1.5 text-gray-900 dark:text-gray-50 truncate max-w-[120px]" title={formatVal(hit.document[f])}>
                      {formatVal(hit.document[f])}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right font-mono text-gray-500">
                    {hit.text_match ? hit.text_match.toLocaleString() : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (Array.isArray(v)) return v.slice(0, 3).join(", ");
  if (typeof v === "object") return JSON.stringify(v).slice(0, 60);
  return String(v).slice(0, 80);
}
