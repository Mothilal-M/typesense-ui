import { useState, useEffect, useCallback, useRef } from "react";
import { typesenseService } from "../services/typesense";
import { useApp } from "../context/AppContext";

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

interface HealthState {
  status: HealthStatus;
  latencyMs: number | null;
}

/**
 * Periodically pings Typesense to check connection health.
 * Returns current status + latency.
 */
export function useConnectionHealth(intervalMs = 30_000) {
  const { isConnected } = useApp();
  const [health, setHealth] = useState<HealthState>({
    status: "unknown",
    latencyMs: null,
  });
  const mounted = useRef(true);

  const check = useCallback(async () => {
    if (!isConnected || !typesenseService.isConnected()) {
      setHealth({ status: "unknown", latencyMs: null });
      return;
    }
    const start = performance.now();
    try {
      await typesenseService.testConnection();
      const ms = Math.round(performance.now() - start);
      if (mounted.current) {
        setHealth({ status: ms > 2000 ? "degraded" : "healthy", latencyMs: ms });
      }
    } catch {
      if (mounted.current) {
        setHealth({ status: "down", latencyMs: null });
      }
    }
  }, [isConnected]);

  useEffect(() => {
    mounted.current = true;
    if (!isConnected) {
      setHealth({ status: "unknown", latencyMs: null });
      return;
    }
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [isConnected, check, intervalMs]);

  return health;
}
