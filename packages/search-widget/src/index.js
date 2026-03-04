/**
 * @mothilal-hire10x/typesense-search-widget
 * Lightweight embeddable search widget for Typesense collections.
 * Zero dependencies, works as a <script> tag or npm module.
 */

const DEFAULT_CONFIG = {
  server: "",
  apiKey: "",
  collection: "",
  queryBy: "title",
  maxResults: 5,
  placeholder: "Search...",
  theme: "auto",          // "light" | "dark" | "auto"
  accentColor: "#6366f1",
  debounceMs: 200,
  borderRadius: 12,
  showBadge: true,
  displayFields: [],      // [titleField, ...subtitleFields]
};

class TypesenseSearchWidget {
  /**
   * @param {HTMLElement|string} container – DOM element or CSS selector
   * @param {Partial<typeof DEFAULT_CONFIG>} config
   */
  constructor(container, config) {
    if (typeof container === "string") {
      container = document.querySelector(container);
    }
    if (!container) throw new Error("[TypesenseSearchWidget] container not found");

    this._container = container;
    this._cfg = Object.assign({}, DEFAULT_CONFIG, config);
    this._timer = null;
    this._listeners = [];

    this._resolveTheme();
    this._render();
    this._bind();
  }

  // ─── private ──────────────────────────────────────────────────────────────

  _resolveTheme() {
    const cfg = this._cfg;
    const isDark =
      cfg.theme === "dark" ||
      (cfg.theme === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    this._colors = {
      bg:     isDark ? "#1e293b" : "#ffffff",
      text:   isDark ? "#f1f5f9" : "#1e293b",
      border: isDark ? "#334155" : "#e2e8f0",
      muted:  isDark ? "#94a3b8" : "#64748b",
      hover:  isDark ? "#334155" : "#f1f5f9",
    };
  }

  _render() {
    const { bg, text, border, muted } = this._colors;
    const { placeholder, borderRadius, accentColor, showBadge } = this._cfg;
    const uid = Math.random().toString(36).slice(2);

    this._container.innerHTML = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
        <div style="position:relative;">
          <input id="ts-input-${uid}" type="text" autocomplete="off" placeholder="${placeholder}"
            style="width:100%;padding:12px 16px 12px 44px;border:2px solid ${border};border-radius:${borderRadius}px;background:${bg};color:${text};font-size:16px;outline:none;transition:border-color 0.2s;box-sizing:border-box;" />
          <svg style="position:absolute;left:14px;top:50%;transform:translateY(-50%);width:20px;height:20px;color:${muted};pointer-events:none;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <div id="ts-results-${uid}" style="margin-top:8px;border-radius:${borderRadius}px;overflow:hidden;border:1px solid ${border};background:${bg};display:none;"></div>
        ${showBadge ? `<p style="text-align:right;margin-top:4px;font-size:11px;color:${muted};">Powered by <a href="https://typesense.org" target="_blank" rel="noopener" style="color:${muted};text-decoration:none;font-weight:600;">Typesense</a></p>` : ""}
      </div>
    `;

    this._input   = document.getElementById(`ts-input-${uid}`);
    this._results = document.getElementById(`ts-results-${uid}`);
    this._accentColor = accentColor;
    this._border  = border;
  }

  _bind() {
    const on = (el, ev, fn) => { el.addEventListener(ev, fn); this._listeners.push([el, ev, fn]); };

    on(this._input, "focus", () => { this._input.style.borderColor = this._accentColor; });
    on(this._input, "blur",  () => { this._input.style.borderColor = this._border; });
    on(this._input, "input", () => this._onInput());

    const outsideClick = (e) => {
      if (!this._container.contains(e.target)) this._results.style.display = "none";
    };
    on(document, "click", outsideClick);
  }

  _onInput() {
    clearTimeout(this._timer);
    const q = this._input.value.trim();
    if (!q) { this._results.style.display = "none"; return; }
    this._timer = setTimeout(() => this._search(q), this._cfg.debounceMs);
  }

  async _search(q) {
    const { server, apiKey, collection, queryBy, maxResults } = this._cfg;
    const url =
      `${server}/collections/${encodeURIComponent(collection)}/documents/search` +
      `?q=${encodeURIComponent(q)}&query_by=${encodeURIComponent(queryBy)}&per_page=${maxResults}`;

    try {
      const res  = await fetch(url, { headers: { "X-TYPESENSE-API-KEY": apiKey } });
      const data = await res.json();
      this._renderResults(data);
    } catch (_) {
      this._results.style.display = "none";
    }
  }

  _renderResults(data) {
    const { border, muted, text, hover } = this._colors;
    const fields = this._cfg.displayFields.length
      ? this._cfg.displayFields
      : Object.keys((data.hits?.[0]?.document) ?? {}).slice(0, 3);

    if (!data.hits || data.hits.length === 0) {
      this._results.innerHTML = `<div style="padding:16px;text-align:center;color:${muted};font-size:14px;">No results found</div>`;
    } else {
      this._results.innerHTML = data.hits.map((hit) => {
        const doc      = hit.document;
        const title    = doc[fields[0]] ?? doc.id ?? "";
        const subtitle = fields
          .slice(1)
          .map((f) => doc[f] ?? "")
          .filter(Boolean)
          .join(" · ");

        return (
          `<div style="padding:10px 16px;border-bottom:1px solid ${border};cursor:pointer;transition:background 0.15s;"` +
          ` onmouseover="this.style.background='${hover}'" onmouseout="this.style.background='transparent'">` +
          `<div style="font-size:14px;font-weight:600;color:${text};">${_esc(String(title))}</div>` +
          (subtitle ? `<div style="font-size:12px;color:${muted};margin-top:2px;">${_esc(subtitle)}</div>` : "") +
          `</div>`
        );
      }).join("");
    }

    this._results.style.display = "block";
  }

  // ─── public ───────────────────────────────────────────────────────────────

  /** Remove the widget and all its event listeners. */
  destroy() {
    clearTimeout(this._timer);
    this._listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this._listeners = [];
    this._container.innerHTML = "";
  }
}

// HTML-escape helper
function _esc(str) {
  return str.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// ─── Auto-init (script-tag usage) ───────────────────────────────────────────
// Usage:  <div data-typesense-widget data-config='{"server":"...","apiKey":"...","collection":"...","queryBy":"title"}'></div>

if (typeof document !== "undefined") {
  const init = () => {
    document.querySelectorAll("[data-typesense-widget]").forEach((el) => {
      if (el.__tsWidget) return; // already initialised
      try {
        const config = JSON.parse(el.dataset.config || el.dataset.typesenseConfig || "{}");
        el.__tsWidget = new TypesenseSearchWidget(el, config);
      } catch (e) {
        console.error("[TypesenseSearchWidget] bad config on element", el, e);
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

export { TypesenseSearchWidget };
export default TypesenseSearchWidget;
