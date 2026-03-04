import { useState, useEffect, useCallback, useRef } from "react";
import { typesenseService } from "../services/typesense";
import { useApp } from "../context/AppContext";
import type { ParsedMetrics, MetricsSnapshot, ServerDebugInfo } from "../types";

const MAX_HISTORY = 60;

function parseMetricsResponse(raw: Record<string, string>): ParsedMetrics {
  const pf = (key: string) => parseFloat(raw[key] || "0");

  const cores: number[] = [];
  for (let i = 1; ; i++) {
    const key = `system_cpu${i}_active_percentage`;
    if (raw[key] === undefined) break;
    cores.push(pf(key));
  }

  const memTotal = pf("system_memory_total_bytes");
  const memUsed = pf("system_memory_used_bytes");
  const diskTotal = pf("system_disk_total_bytes");
  const diskUsed = pf("system_disk_used_bytes");

  return {
    cpu: { overall: pf("system_cpu_active_percentage"), cores },
    memory: {
      totalBytes: memTotal,
      usedBytes: memUsed,
      usedPercent: memTotal > 0 ? (memUsed / memTotal) * 100 : 0,
    },
    disk: {
      totalBytes: diskTotal,
      usedBytes: diskUsed,
      usedPercent: diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0,
    },
    network: {
      receivedBytes: pf("system_network_received_bytes"),
      sentBytes: pf("system_network_sent_bytes"),
    },
    typesenseMemory: {
      activeBytes: pf("typesense_memory_active_bytes"),
      allocatedBytes: pf("typesense_memory_allocated_bytes"),
      fragmentationRatio: pf("typesense_memory_fragmentation_ratio"),
      mappedBytes: pf("typesense_memory_mapped_bytes"),
      metadataBytes: pf("typesense_memory_metadata_bytes"),
      residentBytes: pf("typesense_memory_resident_bytes"),
      retainedBytes: pf("typesense_memory_retained_bytes"),
    },
  };
}

export interface UseServerMetricsResult {
  current: ParsedMetrics | null;
  history: MetricsSnapshot[];
  debugInfo: ServerDebugInfo | null;
  isLoading: boolean;
  error: string | null;
  clearCache: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useServerMetrics(
  intervalMs = 5_000,
  enabled = true
): UseServerMetricsResult {
  const { isConnected } = useApp();
  const [current, setCurrent] = useState<ParsedMetrics | null>(null);
  const [history, setHistory] = useState<MetricsSnapshot[]>([]);
  const [debugInfo, setDebugInfo] = useState<ServerDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchMetrics = useCallback(async () => {
    if (!isConnected || !typesenseService.isConnected() || !enabled) return;
    try {
      const raw = await typesenseService.getMetrics();
      if (!mounted.current) return;
      const parsed = parseMetricsResponse(raw);
      setCurrent(parsed);
      setHistory((prev) => {
        const next = [...prev, { timestamp: Date.now(), metrics: parsed }];
        return next.slice(-MAX_HISTORY);
      });
      setError(null);
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch metrics");
      }
    }
  }, [isConnected, enabled]);

  const fetchDebug = useCallback(async () => {
    if (!isConnected || !typesenseService.isConnected()) return;
    try {
      const info = await typesenseService.getDebugInfo();
      if (mounted.current) setDebugInfo(info);
    } catch {
      // non-critical
    }
  }, [isConnected]);

  const clearCacheFn = useCallback(async (): Promise<boolean> => {
    try {
      await typesenseService.clearCache();
      return true;
    } catch {
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchMetrics(), fetchDebug()]);
    if (mounted.current) setIsLoading(false);
  }, [fetchMetrics, fetchDebug]);

  useEffect(() => {
    mounted.current = true;
    if (!isConnected || !enabled) {
      setCurrent(null);
      setHistory([]);
      setDebugInfo(null);
      return;
    }

    setIsLoading(true);
    Promise.all([fetchMetrics(), fetchDebug()]).finally(() => {
      if (mounted.current) setIsLoading(false);
    });

    const id = setInterval(fetchMetrics, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [isConnected, enabled, fetchMetrics, fetchDebug, intervalMs]);

  return { current, history, debugInfo, isLoading, error, clearCache: clearCacheFn, refresh };
}
