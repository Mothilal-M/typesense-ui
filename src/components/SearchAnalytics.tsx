import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, BarChart3, Trash2, TrendingUp, AlertCircle, Clock } from "lucide-react";
import type { AnalyticsEntry } from "../types";
import { useToast } from "../hooks/useToast";

interface SearchAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "typesense-search-analytics";
const MAX_ENTRIES = 2000;

// ─── Public helper: call this from useCollectionDocuments after each search ──
export function trackSearch(query: string, collection: string, found: number, searchTimeMs: number) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const entries: AnalyticsEntry[] = raw ? JSON.parse(raw) : [];
    entries.push({ query, collection, found, searchTimeMs, timestamp: Date.now() });
    // Keep bounded
    const trimmed = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silently ignore storage errors
  }
}

function loadEntries(): AnalyticsEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function SearchAnalytics({ isOpen, onClose }: SearchAnalyticsProps) {
  const { addToast } = useToast();
  const [entries, setEntries] = useState<AnalyticsEntry[]>([]);
  const [tab, setTab] = useState<"top" | "zero" | "latency">("top");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "all">("24h");

  useEffect(() => {
    if (isOpen) setEntries(loadEntries());
  }, [isOpen]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };
    const cutoff = now - (ranges[timeRange] ?? Infinity);
    return entries.filter((e) => e.timestamp >= cutoff);
  }, [entries, timeRange]);

  // Top queries
  const topQueries = useMemo(() => {
    const map = new Map<string, { count: number; avgTime: number; totalTime: number; totalFound: number }>();
    for (const e of filtered) {
      const key = e.query || "*";
      const prev = map.get(key) || { count: 0, avgTime: 0, totalTime: 0, totalFound: 0 };
      map.set(key, {
        count: prev.count + 1,
        avgTime: 0,
        totalTime: prev.totalTime + e.searchTimeMs,
        totalFound: prev.totalFound + e.found,
      });
    }
    return [...map.entries()]
      .map(([query, data]) => ({
        query,
        count: data.count,
        avgTime: Math.round(data.totalTime / data.count),
        avgFound: Math.round(data.totalFound / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [filtered]);

  // Zero-result queries
  const zeroResultQueries = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered) {
      if (e.found === 0) {
        const key = e.query || "*";
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [filtered]);

  // Latency distribution
  const latencyBuckets = useMemo(() => {
    const buckets = [
      { label: "< 10ms", min: 0, max: 10, count: 0 },
      { label: "10-50ms", min: 10, max: 50, count: 0 },
      { label: "50-100ms", min: 50, max: 100, count: 0 },
      { label: "100-500ms", min: 100, max: 500, count: 0 },
      { label: "500ms+", min: 500, max: Infinity, count: 0 },
    ];
    for (const e of filtered) {
      for (const b of buckets) {
        if (e.searchTimeMs >= b.min && e.searchTimeMs < b.max) {
          b.count++;
          break;
        }
      }
    }
    return buckets;
  }, [filtered]);

  const avgLatency = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round(filtered.reduce((sum, e) => sum + e.searchTimeMs, 0) / filtered.length);
  }, [filtered]);

  const p99Latency = useMemo(() => {
    if (filtered.length === 0) return 0;
    const sorted = [...filtered].sort((a, b) => a.searchTimeMs - b.searchTimeMs);
    return sorted[Math.floor(sorted.length * 0.99)]?.searchTimeMs ?? 0;
  }, [filtered]);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEntries([]);
    addToast("info", "Analytics data cleared");
  }, [addToast]);

  if (!isOpen) return null;

  const maxCount = Math.max(...latencyBuckets.map((b) => b.count), 1);

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Search Analytics</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} searches tracked</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleClear} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-gray-400 hover:text-red-500" title="Clear all analytics">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-4">
          {/* Time range selector */}
          <div className="flex items-center gap-2">
            {(["1h", "24h", "7d", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${timeRange === r ? "bg-pink-500 text-white shadow" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"}`}
              >
                {r === "all" ? "All time" : r}
              </button>
            ))}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{filtered.length}</p>
              <p className="text-[10px] font-semibold text-gray-500">Total Searches</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-center">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{avgLatency}ms</p>
              <p className="text-[10px] font-semibold text-gray-500">Avg Latency</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-center">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{p99Latency}ms</p>
              <p className="text-[10px] font-semibold text-gray-500">P99 Latency</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-center">
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{zeroResultQueries.length}</p>
              <p className="text-[10px] font-semibold text-gray-500">Zero-Result Queries</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700">
            <TabButton icon={<TrendingUp className="w-3.5 h-3.5" />} label="Top Queries" active={tab === "top"} onClick={() => setTab("top")} />
            <TabButton icon={<AlertCircle className="w-3.5 h-3.5" />} label="Zero Results" active={tab === "zero"} onClick={() => setTab("zero")} />
            <TabButton icon={<Clock className="w-3.5 h-3.5" />} label="Latency" active={tab === "latency"} onClick={() => setTab("latency")} />
          </div>

          {/* Tab content */}
          {tab === "top" && (
            <div className="space-y-1.5 animate-fade-in">
              {topQueries.length === 0 ? (
                <Empty message="No search data yet" />
              ) : topQueries.map((q, i) => (
                <div key={q.query} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <span className="text-xs font-mono text-gray-400 w-5 text-right">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{q.query}</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{q.count}x</span>
                  <span className="text-xs text-green-600 dark:text-green-400">{q.avgTime}ms</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">~{q.avgFound} hits</span>
                </div>
              ))}
            </div>
          )}

          {tab === "zero" && (
            <div className="space-y-1.5 animate-fade-in">
              {zeroResultQueries.length === 0 ? (
                <Empty message="No zero-result queries — great!" />
              ) : zeroResultQueries.map((q, i) => (
                <div key={q.query} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <span className="text-xs font-mono text-gray-400 w-5 text-right">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-red-600 dark:text-red-400 truncate">{q.query}</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{q.count}x</span>
                </div>
              ))}
            </div>
          )}

          {tab === "latency" && (
            <div className="space-y-3 animate-fade-in">
              {latencyBuckets.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-20 text-right">{b.label}</span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${(b.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-12 text-right">{b.count}</span>
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

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-all ${
        active
          ? "border-pink-500 text-pink-600 dark:text-pink-400"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
      <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
