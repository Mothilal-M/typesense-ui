import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, ArrowLeftRight, Copy, Check, Server, RefreshCw } from "lucide-react";
import Typesense from "typesense";
import type { CollectionSchema, Field } from "../types";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";

interface SchemaMigrationToolProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FieldDiff {
  name: string;
  status: "added" | "removed" | "changed" | "unchanged";
  sourceType?: string;
  targetType?: string;
  details?: string;
}

interface CollectionDiff {
  name: string;
  status: "local-only" | "remote-only" | "both";
  fieldDiffs: FieldDiff[];
}

function diffSchemas(local: CollectionSchema[], remote: CollectionSchema[]): CollectionDiff[] {
  const localMap = new Map(local.map((c) => [c.name, c]));
  const remoteMap = new Map(remote.map((c) => [c.name, c]));
  const allNames = new Set([...localMap.keys(), ...remoteMap.keys()]);

  const diffs: CollectionDiff[] = [];
  for (const name of allNames) {
    const l = localMap.get(name);
    const r = remoteMap.get(name);

    if (l && !r) {
      diffs.push({ name, status: "local-only", fieldDiffs: l.fields.map((f) => ({ name: f.name, status: "added", sourceType: f.type })) });
    } else if (!l && r) {
      diffs.push({ name, status: "remote-only", fieldDiffs: r.fields.map((f) => ({ name: f.name, status: "removed", targetType: f.type })) });
    } else if (l && r) {
      const fieldDiffs = diffFields(l.fields, r.fields);
      diffs.push({ name, status: "both", fieldDiffs });
    }
  }
  return diffs;
}

function diffFields(source: Field[], target: Field[]): FieldDiff[] {
  const sourceMap = new Map(source.map((f) => [f.name, f]));
  const targetMap = new Map(target.map((f) => [f.name, f]));
  const allNames = new Set([...sourceMap.keys(), ...targetMap.keys()]);

  const diffs: FieldDiff[] = [];
  for (const name of allNames) {
    const s = sourceMap.get(name);
    const t = targetMap.get(name);

    if (s && !t) {
      diffs.push({ name, status: "added", sourceType: s.type });
    } else if (!s && t) {
      diffs.push({ name, status: "removed", targetType: t.type });
    } else if (s && t) {
      const changes: string[] = [];
      if (s.type !== t.type) changes.push(`type: ${s.type} → ${t.type}`);
      if (s.facet !== t.facet) changes.push(`facet: ${s.facet} → ${t.facet}`);
      if (s.optional !== t.optional) changes.push(`optional: ${s.optional} → ${t.optional}`);
      if (s.sort !== t.sort) changes.push(`sort: ${s.sort} → ${t.sort}`);

      diffs.push({
        name,
        status: changes.length > 0 ? "changed" : "unchanged",
        sourceType: s.type,
        targetType: t.type,
        details: changes.join("; "),
      });
    }
  }
  return diffs;
}

function generateMigrationScript(diffs: CollectionDiff[], direction: "local-to-remote" | "remote-to-local"): string {
  const lines: string[] = [
    `// Migration Script — ${direction === "local-to-remote" ? "Push Local → Remote" : "Pull Remote → Local"}`,
    `// Generated at ${new Date().toISOString()}`,
    "",
  ];

  for (const diff of diffs) {
    if (diff.status === "local-only" && direction === "local-to-remote") {
      lines.push(`// Create collection "${diff.name}" on remote`);
      lines.push(`await client.collections().create({`);
      lines.push(`  name: "${diff.name}",`);
      lines.push(`  fields: [`);
      for (const f of diff.fieldDiffs) {
        lines.push(`    { name: "${f.name}", type: "${f.sourceType}", facet: false, optional: true },`);
      }
      lines.push(`  ]`);
      lines.push(`});`);
      lines.push("");
    }

    if (diff.status === "remote-only" && direction === "remote-to-local") {
      lines.push(`// Create collection "${diff.name}" locally`);
      lines.push(`await client.collections().create({`);
      lines.push(`  name: "${diff.name}",`);
      lines.push(`  fields: [`);
      for (const f of diff.fieldDiffs) {
        lines.push(`    { name: "${f.name}", type: "${f.targetType}", facet: false, optional: true },`);
      }
      lines.push(`  ]`);
      lines.push(`});`);
      lines.push("");
    }

    if (diff.status === "both") {
      const changed = diff.fieldDiffs.filter((f) => f.status !== "unchanged");
      if (changed.length > 0) {
        lines.push(`// Update collection "${diff.name}"`);
        for (const f of changed) {
          if (f.status === "added") {
            lines.push(`// Add field "${f.name}" (${f.sourceType})`);
            lines.push(`await client.collections("${diff.name}").update({ fields: [{ name: "${f.name}", type: "${f.sourceType}" }] });`);
          }
          if (f.status === "removed") {
            lines.push(`// Drop field "${f.name}"`);
            lines.push(`await client.collections("${diff.name}").update({ fields: [{ name: "${f.name}", drop: true }] });`);
          }
          if (f.status === "changed") {
            lines.push(`// Field "${f.name}" changed: ${f.details}`);
            lines.push(`// NOTE: Type changes may require re-creating the collection`);
          }
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

export function SchemaMigrationTool({ isOpen, onClose }: SchemaMigrationToolProps) {
  const { collections: localCollections, config: localConfig } = useApp();
  const { addToast } = useToast();

  // Remote server config
  const [remoteHost, setRemoteHost] = useState("");
  const [remotePort, setRemotePort] = useState("8108");
  const [remoteProtocol, setRemoteProtocol] = useState<"http" | "https">("http");
  const [remoteApiKey, setRemoteApiKey] = useState("");

  const [isConnecting, setIsConnecting] = useState(false);
  const [remoteCollections, setRemoteCollections] = useState<CollectionSchema[] | null>(null);
  const [diffs, setDiffs] = useState<CollectionDiff[]>([]);
  const [migrationScript, setMigrationScript] = useState("");
  const [copied, setCopied] = useState(false);

  const connectToRemote = useCallback(async () => {
    if (!remoteHost.trim() || !remoteApiKey.trim()) {
      addToast("error", "Host and API key are required");
      return;
    }

    setIsConnecting(true);
    try {
      const client = new Typesense.Client({
        nodes: [{ host: remoteHost, port: Number(remotePort), protocol: remoteProtocol }],
        apiKey: remoteApiKey,
        connectionTimeoutSeconds: 5,
      });
      const collections = await client.collections().retrieve();
      setRemoteCollections(collections as unknown as CollectionSchema[]);

      // Compute diffs
      const d = diffSchemas(localCollections, collections as unknown as CollectionSchema[]);
      setDiffs(d);
      addToast("success", `Connected! Found ${collections.length} remote collections`);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  }, [remoteHost, remotePort, remoteProtocol, remoteApiKey, localCollections, addToast]);

  const handleGenerateScript = (direction: "local-to-remote" | "remote-to-local") => {
    const script = generateMigrationScript(diffs, direction);
    setMigrationScript(script);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(migrationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const statusColors = {
    "local-only": "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    "remote-only": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    both: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  };

  const fieldStatusColors = {
    added: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    removed: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    changed: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    unchanged: "text-gray-400 dark:text-gray-500",
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
                <ArrowLeftRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Schema Migration Tool</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Compare schemas across servers & generate migration scripts</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Server comparison header */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-green-700 dark:text-green-300">Local Server</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                {localConfig ? `${localConfig.protocol}://${localConfig.host}:${localConfig.port}` : "Not connected"}
              </p>
              <p className="text-xs text-green-500 mt-1">{localCollections.length} collections</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Remote Server</span>
              </div>
              {remoteCollections ? (
                <>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">{remoteProtocol}://{remoteHost}:{remotePort}</p>
                  <p className="text-xs text-blue-500 mt-1">{remoteCollections.length} collections</p>
                </>
              ) : (
                <p className="text-xs text-blue-500">Not connected yet</p>
              )}
            </div>
          </div>

          {/* Remote connection form */}
          {!remoteCollections && (
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Connect to Remote Server</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Host</label>
                  <input type="text" value={remoteHost} onChange={(e) => setRemoteHost(e.target.value)} placeholder="e.g. prod.example.com" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Port</label>
                  <input type="text" value={remotePort} onChange={(e) => setRemotePort(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Protocol</label>
                  <select value={remoteProtocol} onChange={(e) => setRemoteProtocol(e.target.value as "http" | "https")} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50">
                    <option value="http">http</option>
                    <option value="https">https</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">API Key</label>
                <input type="password" value={remoteApiKey} onChange={(e) => setRemoteApiKey(e.target.value)} placeholder="Remote server API key" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
              </div>
              <button
                onClick={connectToRemote}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 shadow transition-all flex items-center gap-1.5"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Connect & Compare
              </button>
            </div>
          )}

          {/* Schema Diff */}
          {remoteCollections && diffs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Schema Differences</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleGenerateScript("local-to-remote")} className="text-xs font-medium px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 transition-colors">
                    Push Local → Remote
                  </button>
                  <button onClick={() => handleGenerateScript("remote-to-local")} className="text-xs font-medium px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors">
                    Pull Remote → Local
                  </button>
                  <button onClick={() => { setRemoteCollections(null); setDiffs([]); setMigrationScript(""); }} className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                    Disconnect
                  </button>
                </div>
              </div>

              {diffs.map((diff) => (
                <div key={diff.name} className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-50">{diff.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[diff.status]}`}>
                      {diff.status === "local-only" ? "LOCAL ONLY" : diff.status === "remote-only" ? "REMOTE ONLY" : "BOTH"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {diff.fieldDiffs.filter((f) => f.status !== "unchanged").map((f) => (
                      <div key={f.name} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${fieldStatusColors[f.status]}`}>
                        <span className="font-bold">{f.status === "added" ? "+" : f.status === "removed" ? "−" : "~"}</span>
                        <span className="font-medium">{f.name}</span>
                        {f.sourceType && <span className="opacity-70">({f.sourceType})</span>}
                        {f.details && <span className="opacity-60 ml-1">— {f.details}</span>}
                      </div>
                    ))}
                    {diff.fieldDiffs.filter((f) => f.status !== "unchanged").length === 0 && (
                      <p className="text-xs text-gray-400 px-2">Schemas are identical</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Migration Script Output */}
          {migrationScript && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Migration Script</h3>
                <button onClick={handleCopy} className="btn-secondary text-xs flex items-center gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-64">
                {migrationScript}
              </pre>
            </div>
          )}

          {remoteCollections && diffs.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No differences found</p>
              <p className="text-sm mt-1">Both servers have identical schemas</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
