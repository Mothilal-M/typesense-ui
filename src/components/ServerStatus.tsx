import { useState, useId } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Activity,
  RefreshCw,
  Trash2,
  Loader2,
  Cpu,
  HardDrive,
  Wifi,
  MemoryStick,
} from "lucide-react";
import { useServerMetrics } from "../hooks/useServerMetrics";
import { useToast } from "../hooks/useToast";
import type { MetricsSnapshot } from "../types";

interface ServerStatusProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

function ringColor(pct: number): string {
  if (pct < 60) return "#10b981"; // emerald-500
  if (pct < 85) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function ringColorClass(pct: number): string {
  if (pct < 60) return "text-emerald-500";
  if (pct < 85) return "text-amber-500";
  return "text-red-500";
}

// ─── RingChart ───────────────────────────────────────────────────

function RingChart({
  value,
  size = 130,
  strokeWidth = 10,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(value, 100) / 100);
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-gray-200 dark:stroke-slate-700"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringColor(value)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${ringColorClass(value)}`}>
          {Math.round(value)}%
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        {sublabel && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

// ─── SparklineChart ──────────────────────────────────────────────

function SparklineChart({
  data,
  width = 320,
  height = 80,
  color = "#3b82f6",
  label,
  currentValue,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  currentValue?: string;
}) {
  const gradId = useId();
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400 dark:text-gray-500" style={{ width, height }}>
        Collecting data...
      </div>
    );
  }

  const padding = 4;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * w;
    const y = padding + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const linePoints = points.join(" ");
  const areaPath = `M ${points[0]} ${points.slice(1).map((p) => `L ${p}`).join(" ")} L ${padding + w},${padding + h} L ${padding},${padding + h} Z`;

  const lastPoint = points[points.length - 1].split(",");

  return (
    <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3">
      {(label || currentValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>}
          {currentValue && <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{currentValue}</span>}
        </div>
      )}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={parseFloat(lastPoint[0])} cy={parseFloat(lastPoint[1])} r="3" fill={color} />
      </svg>
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Tab button ──────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        active
          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700/50"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function ServerStatus({ isOpen, onClose }: ServerStatusProps) {
  const { current, history, debugInfo, isLoading, error, clearCache, refresh } = useServerMetrics(5000, isOpen);
  const { addToast } = useToast();
  const [tab, setTab] = useState<"overview" | "network" | "typesense">("overview");
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const success = await clearCache();
      addToast(success ? "success" : "error", success ? "Query cache cleared" : "Failed to clear cache");
    } finally {
      setIsClearing(false);
    }
  };

  // History extractors for sparklines
  const cpuHistory = history.map((s) => s.metrics.cpu.overall);
  const memHistory = history.map((s) => s.metrics.memory.usedPercent);
  const networkRecv = computeDeltas(history, (s) => s.metrics.network.receivedBytes);
  const networkSent = computeDeltas(history, (s) => s.metrics.network.sentBytes);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Server Status</h2>
                {debugInfo && (
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    Typesense v{debugInfo.version}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                title="Clear query cache"
              >
                {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Clear Cache
              </button>
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {!current && !error && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {current && (
            <>
              {/* Quick stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  icon={<Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  label="CPU"
                  value={`${Math.round(current.cpu.overall)}%`}
                  sub={`${current.cpu.cores.length} core${current.cpu.cores.length !== 1 ? "s" : ""}`}
                  color="bg-blue-100 dark:bg-blue-900/40"
                />
                <StatCard
                  icon={<MemoryStick className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                  label="Memory"
                  value={formatBytes(current.memory.usedBytes)}
                  sub={`of ${formatBytes(current.memory.totalBytes)}`}
                  color="bg-purple-100 dark:bg-purple-900/40"
                />
                <StatCard
                  icon={<HardDrive className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                  label="Disk"
                  value={formatBytes(current.disk.usedBytes)}
                  sub={`of ${formatBytes(current.disk.totalBytes)}`}
                  color="bg-teal-100 dark:bg-teal-900/40"
                />
                <StatCard
                  icon={<Wifi className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                  label="Network"
                  value={formatBytes(current.network.receivedBytes)}
                  sub={`sent ${formatBytes(current.network.sentBytes)}`}
                  color="bg-orange-100 dark:bg-orange-900/40"
                />
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/60 rounded-xl p-1">
                <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
                  Overview
                </TabBtn>
                <TabBtn active={tab === "network"} onClick={() => setTab("network")}>
                  Network
                </TabBtn>
                <TabBtn active={tab === "typesense"} onClick={() => setTab("typesense")}>
                  Typesense Memory
                </TabBtn>
              </div>

              {/* ── Overview Tab ────────────────────────────── */}
              {tab === "overview" && (
                <div className="space-y-5">
                  {/* Ring charts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                      <RingChart
                        value={current.cpu.overall}
                        label="CPU"
                        sublabel={`${current.cpu.cores.length} cores`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                      <RingChart
                        value={current.memory.usedPercent}
                        label="Memory"
                        sublabel={`${formatBytes(current.memory.usedBytes)} / ${formatBytes(current.memory.totalBytes)}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                      <RingChart
                        value={current.disk.usedPercent}
                        label="Disk"
                        sublabel={`${formatBytes(current.disk.usedBytes)} / ${formatBytes(current.disk.totalBytes)}`}
                      />
                    </div>
                  </div>

                  {/* Per-core CPU */}
                  {current.cpu.cores.length > 0 && (
                    <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Per-Core CPU Usage</h3>
                      <div className="space-y-2">
                        {current.cpu.cores.map((pct, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-16 text-right">
                              Core {i + 1}
                            </span>
                            <div className="flex-1 h-5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  background: `linear-gradient(to right, ${ringColor(pct)}, ${ringColor(pct)}dd)`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold w-12 text-right" style={{ color: ringColor(pct) }}>
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CPU History Sparkline */}
                  <SparklineChart
                    data={cpuHistory}
                    label="CPU History"
                    currentValue={`${Math.round(current.cpu.overall)}%`}
                    color="#3b82f6"
                  />

                  {/* Memory History Sparkline */}
                  <SparklineChart
                    data={memHistory}
                    label="Memory History"
                    currentValue={`${current.memory.usedPercent.toFixed(1)}%`}
                    color="#8b5cf6"
                  />
                </div>
              )}

              {/* ── Network Tab ─────────────────────────────── */}
              {tab === "network" && (
                <div className="space-y-4">
                  <SparklineChart
                    data={networkRecv}
                    label="Received (bytes/s)"
                    currentValue={networkRecv.length > 0 ? formatBytes(networkRecv[networkRecv.length - 1]) + "/s" : "—"}
                    color="#10b981"
                  />
                  <SparklineChart
                    data={networkSent}
                    label="Sent (bytes/s)"
                    currentValue={networkSent.length > 0 ? formatBytes(networkSent[networkSent.length - 1]) + "/s" : "—"}
                    color="#f59e0b"
                  />

                  {/* Network totals */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4 text-center">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Received</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(current.network.receivedBytes)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4 text-center">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Sent</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatBytes(current.network.sentBytes)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Typesense Memory Tab ────────────────────── */}
              {tab === "typesense" && (
                <div className="space-y-4">
                  {/* Fragmentation ratio */}
                  <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Fragmentation Ratio</h3>
                      <span className={`text-2xl font-bold ${current.typesenseMemory.fragmentationRatio > 1.5 ? "text-amber-500" : "text-emerald-500"}`}>
                        {current.typesenseMemory.fragmentationRatio.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Values close to 1.0 indicate low fragmentation. Values above 1.5 may indicate memory fragmentation issues.
                    </p>
                  </div>

                  {/* Memory breakdown */}
                  <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Memory Breakdown</h3>
                    <div className="space-y-3">
                      {([
                        { label: "Active", value: current.typesenseMemory.activeBytes, color: "#3b82f6" },
                        { label: "Allocated", value: current.typesenseMemory.allocatedBytes, color: "#8b5cf6" },
                        { label: "Resident", value: current.typesenseMemory.residentBytes, color: "#10b981" },
                        { label: "Mapped", value: current.typesenseMemory.mappedBytes, color: "#f59e0b" },
                        { label: "Retained", value: current.typesenseMemory.retainedBytes, color: "#ef4444" },
                        { label: "Metadata", value: current.typesenseMemory.metadataBytes, color: "#6366f1" },
                      ] as const).map((item) => {
                        const maxVal = Math.max(
                          current.typesenseMemory.activeBytes,
                          current.typesenseMemory.allocatedBytes,
                          current.typesenseMemory.residentBytes,
                          current.typesenseMemory.mappedBytes,
                          current.typesenseMemory.retainedBytes,
                          1
                        );
                        const pct = (item.value / maxVal) * 100;
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 text-right">
                              {item.label}
                            </span>
                            <div className="flex-1 h-5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-20 text-right">
                              {formatBytes(item.value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/30 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Auto-refreshing every 5s
          </div>
          {history.length > 0 && (
            <span>
              Last updated: {new Date(history[history.length - 1].timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Network delta computation ───────────────────────────────────

function computeDeltas(
  snapshots: MetricsSnapshot[],
  extract: (s: MetricsSnapshot) => number
): number[] {
  if (snapshots.length < 2) return [];
  const deltas: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const dt = (snapshots[i].timestamp - snapshots[i - 1].timestamp) / 1000;
    const dv = extract(snapshots[i]) - extract(snapshots[i - 1]);
    deltas.push(dt > 0 ? Math.max(0, dv / dt) : 0);
  }
  return deltas;
}
