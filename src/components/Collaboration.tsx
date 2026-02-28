import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Share2, Link, Trash2, Clock, User, Activity, Copy, Check, Eye, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";
import type { AuditLogEntry, SharedLink } from "../types";

const AUDIT_KEY = "typesense-audit-log";
const SHARE_KEY = "typesense-shared-links";

interface CollaborationProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Public helpers for other components to call ─── */
export function auditLog(action: string, target: string, detail?: string) {
  const entries: AuditLogEntry[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
  entries.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), user: "Local User", action, target, detail });
  if (entries.length > 500) entries.length = 500;
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries));
}

export function Collaboration({ isOpen, onClose }: CollaborationProps) {
  const { collections } = useApp();
  const { addToast } = useToast();
  const [tab, setTab] = useState<"links" | "audit">("links");
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New link form
  const [newName, setNewName] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [newExpiry, setNewExpiry] = useState("24h");

  const load = useCallback(() => {
    setLinks(JSON.parse(localStorage.getItem(SHARE_KEY) || "[]"));
    setAuditEntries(JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"));
  }, []);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const createLink = () => {
    if (!newCollection) { addToast("error", "Select a collection"); return; }
    const expiryMap: Record<string, number> = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000, never: 0 };
    const ms = expiryMap[newExpiry] || 86400000;
    const link: SharedLink = {
      id: crypto.randomUUID(),
      name: newName || `${newCollection} link`,
      collection: newCollection,
      token: btoa(crypto.randomUUID()).slice(0, 24),
      permissions: ["search"],
      createdAt: new Date().toISOString(),
      expiresAt: ms ? new Date(Date.now() + ms).toISOString() : undefined,
    };
    const updated = [...links, link];
    setLinks(updated);
    localStorage.setItem(SHARE_KEY, JSON.stringify(updated));
    auditLog("create_share_link", newCollection, link.name);
    addToast("success", `Shared link created for ${newCollection}`);
    setNewName("");
    setNewCollection("");
  };

  const deleteLink = (id: string) => {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    localStorage.setItem(SHARE_KEY, JSON.stringify(updated));
    addToast("success", "Link deleted");
  };

  const copyLink = (link: SharedLink) => {
    const url = `${window.location.origin}/shared?token=${link.token}&collection=${encodeURIComponent(link.collection)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearAudit = () => {
    localStorage.setItem(AUDIT_KEY, "[]");
    setAuditEntries([]);
    addToast("success", "Audit log cleared");
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const isExpired = (link: SharedLink) => link.expiresAt ? new Date(link.expiresAt).getTime() < Date.now() : false;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Collaboration</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Share search access & track team activity</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-4">
          <TabBtn icon={<Link className="w-3.5 h-3.5" />} label="Shared Links" active={tab === "links"} onClick={() => setTab("links")} count={links.length} />
          <TabBtn icon={<Activity className="w-3.5 h-3.5" />} label="Audit Log" active={tab === "audit"} onClick={() => setTab("audit")} count={auditEntries.length} />
        </div>

        <div className="flex-1 overflow-auto p-4">
          {tab === "links" && (
            <div className="animate-fade-in space-y-4">
              {/* Create link */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Plus className="w-4 h-4" /> New Shared Link</h3>
                <div className="grid grid-cols-4 gap-3">
                  <input type="text" placeholder="Link name (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-50" />
                  <select value={newCollection} onChange={(e) => setNewCollection(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-50">
                    <option value="">Collection…</option>
                    {collections.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <select value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-50">
                    <option value="1h">1 hour</option>
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                <button onClick={createLink} className="btn-primary text-sm">Create Link</button>
              </div>

              {/* Links list */}
              {links.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No shared links yet. Create one above.</div>
              ) : (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className={`p-3 rounded-xl border transition-colors ${isExpired(link) ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 opacity-60" : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isExpired(link) ? "bg-red-100 dark:bg-red-900/30" : "bg-purple-100 dark:bg-purple-900/30"}`}>
                            <Link className={`w-4 h-4 ${isExpired(link) ? "text-red-600" : "text-purple-600 dark:text-purple-400"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{link.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{link.collection}</span>
                              <span>·</span>
                              <Eye className="w-3 h-3" /> {link.permissions.join(", ")}
                              <span>·</span>
                              <Clock className="w-3 h-3" /> {isExpired(link) ? "Expired" : link.expiresAt ? `Expires ${fmtTime(link.expiresAt)}` : "No expiry"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => copyLink(link)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            {copiedId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                          </button>
                          <button onClick={() => deleteLink(link.id)} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "audit" && (
            <div className="animate-fade-in space-y-3">
              {auditEntries.length > 0 && (
                <div className="flex justify-end">
                  <button onClick={clearAudit} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear Log
                  </button>
                </div>
              )}
              {auditEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No activity logged yet.</div>
              ) : (
                <div className="space-y-1">
                  {auditEntries.slice(0, 100).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 mt-0.5">
                        <User className="w-3 h-3 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          <span className="font-semibold">{entry.user}</span>{" "}
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${actionColor(entry.action)}`}>{entry.action}</span>{" "}
                          <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{entry.target}</span>
                          {entry.detail && <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">— {entry.detail}</span>}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{fmtTime(entry.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function TabBtn({ icon, label, active, onClick, count }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-all ${active ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
      {icon} {label}
      {count > 0 && <span className="text-[10px] bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
  );
}

function actionColor(action: string): string {
  if (action.startsWith("create") || action.startsWith("add")) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
  if (action.startsWith("delete") || action.startsWith("remove")) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  if (action.startsWith("update") || action.startsWith("edit")) return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
  return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
}
