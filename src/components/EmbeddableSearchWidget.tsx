import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, Code, Eye, Settings } from "lucide-react";
import type { CollectionSchema } from "../types";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";

interface EmbeddableSearchWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionSchema;
}

interface WidgetConfig {
  placeholder: string;
  maxResults: number;
  queryBy: string;
  theme: "light" | "dark" | "auto";
  accentColor: string;
  showBadge: boolean;
  debounceMs: number;
  borderRadius: number;
}

export function EmbeddableSearchWidget({ isOpen, onClose, collection }: EmbeddableSearchWidgetProps) {
  const { config } = useApp();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"preview" | "code" | "config">("preview");
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    placeholder: `Search ${collection.name}...`,
    maxResults: 5,
    queryBy: collection.fields.filter((f) => f.type === "string" || f.type === "string[]").map((f) => f.name).slice(0, 3).join(","),
    theme: "auto",
    accentColor: "#6366f1",
    showBadge: true,
    debounceMs: 200,
    borderRadius: 12,
  });

  const displayFields = useMemo(
    () => collection.fields.filter((f) => f.type === "string" || f.type === "string[]").slice(0, 3).map((f) => f.name),
    [collection]
  );

  const generatedCode = useMemo(() => {
    const host = config ? `${config.protocol}://${config.host}:${config.port}` : "http://localhost:8108";
    return `<!-- Typesense Search Widget -->
<div id="typesense-search-widget"></div>
<script>
(function() {
  const CONFIG = {
    server: "${host}",
    apiKey: "YOUR_SEARCH_ONLY_API_KEY",
    collection: "${collection.name}",
    queryBy: "${widgetConfig.queryBy}",
    maxResults: ${widgetConfig.maxResults},
    placeholder: "${widgetConfig.placeholder}",
    theme: "${widgetConfig.theme}",
    accentColor: "${widgetConfig.accentColor}",
    debounceMs: ${widgetConfig.debounceMs},
    borderRadius: ${widgetConfig.borderRadius},
    showBadge: ${widgetConfig.showBadge},
    displayFields: ${JSON.stringify(displayFields)},
  };

  const container = document.getElementById("typesense-search-widget");
  if (!container) return;

  const isDark = CONFIG.theme === "dark" || (CONFIG.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const bg = isDark ? "#1e293b" : "#ffffff";
  const text = isDark ? "#f1f5f9" : "#1e293b";
  const border = isDark ? "#334155" : "#e2e8f0";
  const muted = isDark ? "#94a3b8" : "#64748b";

  container.innerHTML = \`
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="position: relative;">
        <input id="ts-search-input" type="text" placeholder="\${CONFIG.placeholder}"
          style="width: 100%; padding: 12px 16px 12px 44px; border: 2px solid \${border}; border-radius: \${CONFIG.borderRadius}px; background: \${bg}; color: \${text}; font-size: 16px; outline: none; transition: border-color 0.2s; box-sizing: border-box;" />
        <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; color: \${muted};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </div>
      <div id="ts-results" style="margin-top: 8px; border-radius: \${CONFIG.borderRadius}px; overflow: hidden; border: 1px solid \${border}; background: \${bg}; display: none;"></div>
      \${CONFIG.showBadge ? '<p style="text-align: right; margin-top: 4px; font-size: 11px; color: ' + muted + ';">Powered by Typesense</p>' : ''}
    </div>
  \`;

  const input = document.getElementById("ts-search-input");
  const results = document.getElementById("ts-results");
  let timer = null;

  input.addEventListener("focus", function() { this.style.borderColor = CONFIG.accentColor; });
  input.addEventListener("blur", function() { this.style.borderColor = "\${border}"; });

  input.addEventListener("input", function() {
    clearTimeout(timer);
    const q = this.value.trim();
    if (!q) { results.style.display = "none"; return; }
    timer = setTimeout(function() {
      fetch(CONFIG.server + "/collections/" + CONFIG.collection + "/documents/search?q=" + encodeURIComponent(q) + "&query_by=" + CONFIG.queryBy + "&per_page=" + CONFIG.maxResults, {
        headers: { "X-TYPESENSE-API-KEY": CONFIG.apiKey }
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.hits || data.hits.length === 0) {
          results.innerHTML = '<div style="padding: 16px; text-align: center; color: ' + muted + '; font-size: 14px;">No results found</div>';
        } else {
          results.innerHTML = data.hits.map(function(hit, i) {
            var doc = hit.document;
            var fields = CONFIG.displayFields;
            var title = doc[fields[0]] || doc.id;
            var subtitle = fields.slice(1).map(function(f) { return doc[f] || ""; }).filter(Boolean).join(" · ");
            return '<div style="padding: 10px 16px; border-bottom: 1px solid ' + border + '; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background=\\'' + (isDark ? '#334155' : '#f1f5f9') + '\\';" onmouseout="this.style.background=\\'transparent\\';"><div style="font-size: 14px; font-weight: 600; color: ' + text + ';">' + title + '</div>' + (subtitle ? '<div style="font-size: 12px; color: ' + muted + '; margin-top: 2px;">' + subtitle + '</div>' : '') + '</div>';
          }).join("");
        }
        results.style.display = "block";
      })
      .catch(function() { results.style.display = "none"; });
    }, CONFIG.debounceMs);
  });

  document.addEventListener("click", function(e) {
    if (!container.contains(e.target)) results.style.display = "none";
  });
})();
</script>`;
  }, [config, collection, widgetConfig, displayFields]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    addToast("success", "Widget code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Embeddable Search Widget</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Generate a drop-in search bar for any website</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-4">
          <TabBtn icon={<Eye className="w-3.5 h-3.5" />} label="Preview" active={tab === "preview"} onClick={() => setTab("preview")} />
          <TabBtn icon={<Code className="w-3.5 h-3.5" />} label="Code" active={tab === "code"} onClick={() => setTab("code")} />
          <TabBtn icon={<Settings className="w-3.5 h-3.5" />} label="Configure" active={tab === "config"} onClick={() => setTab("config")} />
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {tab === "preview" && (
            <div className="animate-fade-in">
              <div className="mx-auto max-w-lg p-8 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={widgetConfig.placeholder}
                    readOnly
                    className="w-full px-4 py-3 pl-11 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50 text-base outline-none"
                    style={{ borderRadius: `${widgetConfig.borderRadius}px`, borderColor: widgetConfig.accentColor }}
                  />
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                </div>
                {/* Mock results */}
                <div className="mt-2 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="h-3.5 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-2.5 w-32 bg-gray-100 dark:bg-slate-800 rounded mt-1.5 animate-pulse" />
                    </div>
                  ))}
                </div>
                {widgetConfig.showBadge && (
                  <p className="text-right mt-1 text-[11px] text-gray-400">Powered by Typesense</p>
                )}
              </div>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                This is a visual preview. The actual widget fetches live results from your Typesense server.
              </p>
            </div>
          )}

          {tab === "code" && (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Copy this HTML snippet and paste it into your website.
                </p>
                <button onClick={handleCopy} className="btn-secondary flex items-center gap-1.5 text-sm">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-[55vh] leading-relaxed">
                {generatedCode}
              </pre>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Replace <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">YOUR_SEARCH_ONLY_API_KEY</code> with a search-only API key. Never expose your admin API key on a public website.
              </div>
            </div>
          )}

          {tab === "config" && (
            <div className="animate-fade-in space-y-4 max-w-lg">
              <ConfigField label="Placeholder" value={widgetConfig.placeholder} onChange={(v) => setWidgetConfig({ ...widgetConfig, placeholder: v })} />
              <ConfigField label="query_by Fields" value={widgetConfig.queryBy} onChange={(v) => setWidgetConfig({ ...widgetConfig, queryBy: v })} mono />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Max Results</label>
                  <input type="number" min={1} max={20} value={widgetConfig.maxResults} onChange={(e) => setWidgetConfig({ ...widgetConfig, maxResults: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Debounce (ms)</label>
                  <input type="number" min={0} max={1000} step={50} value={widgetConfig.debounceMs} onChange={(e) => setWidgetConfig({ ...widgetConfig, debounceMs: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={widgetConfig.accentColor} onChange={(e) => setWidgetConfig({ ...widgetConfig, accentColor: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer" />
                    <input type="text" value={widgetConfig.accentColor} onChange={(e) => setWidgetConfig({ ...widgetConfig, accentColor: e.target.value })} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono text-gray-900 dark:text-gray-50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Border Radius</label>
                  <input type="range" min={0} max={24} value={widgetConfig.borderRadius} onChange={(e) => setWidgetConfig({ ...widgetConfig, borderRadius: Number(e.target.value) })} className="w-full" />
                  <span className="text-xs text-gray-500">{widgetConfig.borderRadius}px</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Theme</label>
                  <select value={widgetConfig.theme} onChange={(e) => setWidgetConfig({ ...widgetConfig, theme: e.target.value as "light" | "dark" | "auto" })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50">
                    <option value="auto">Auto (system)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={widgetConfig.showBadge} onChange={(e) => setWidgetConfig({ ...widgetConfig, showBadge: e.target.checked })} className="rounded text-indigo-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Show "Powered by" badge</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-all ${active ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
      {icon} {label}
    </button>
  );
}

function ConfigField({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={`w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50 ${mono ? "font-mono" : ""}`} />
    </div>
  );
}
