import { useState, useEffect } from "react";
import {
  Search,
  Play,
  X,
  Filter,
  ArrowUpDown,
  Zap,
  Clock,
  Eye,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { JsonTreePanel } from "./ui/JsonTreeViewer";
import { typesenseService } from "../services/typesense";
import type { CollectionSchema, Field, SearchResponse, SearchHit } from "../types";

interface SearchPlaygroundProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionSchema;
}

interface FilterRow {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const FILTER_OPS = [
  { value: ":", label: "equals" },
  { value: ":!=", label: "not equals" },
  { value: ":>", label: "greater than" },
  { value: ":<", label: "less than" },
  { value: ":>=", label: "greater or equal" },
  { value: ":<=", label: "less or equal" },
  { value: ":[", label: "between" },
];

export function SearchPlayground({
  isOpen,
  onClose,
  collection,
}: SearchPlaygroundProps) {
  // Query state
  const [query, setQuery] = useState("*");
  const [queryBy, setQueryBy] = useState<string[]>([]);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Filter rows
  const [filters, setFilters] = useState<FilterRow[]>([]);

  // Facets
  const [facetBy, setFacetBy] = useState<string[]>([]);

  // Additional params
  const [highlightFields, setHighlightFields] = useState<string[]>([]);
  const [prefix, setPrefix] = useState(false);
  const [exhaustiveSearch, setExhaustiveSearch] = useState(false);

  // Results state
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedHit, setSelectedHit] = useState<any>(null);

  // Tab: results vs raw
  const [resultTab, setResultTab] = useState<"hits" | "raw" | "facets">("hits");

  // Init defaults
  useEffect(() => {
    if (isOpen && collection) {
      const stringFields = collection.fields.filter(
        (f) =>
          f.type === "string" ||
          f.type === "string[]" ||
          f.type === "string*" ||
          f.type === "auto"
      );
      setQueryBy(stringFields.slice(0, 3).map((f) => f.name));
      setHighlightFields([]);
      setFilters([]);
      setFacetBy([]);
      setResults(null);
      setRawResponse(null);
      setSearchError(null);
      setPage(1);
      setQuery("*");
      setSortField("");
      setSelectedHit(null);
    }
  }, [isOpen, collection]);

  const stringFields = collection?.fields.filter(
    (f) =>
      f.type === "string" ||
      f.type === "string[]" ||
      f.type === "string*" ||
      f.type === "auto"
  ) || [];

  const sortableFields = collection?.fields.filter(
    (f) =>
      f.sort ||
      f.type.startsWith("int") ||
      f.type.startsWith("float") ||
      f.type === "string"
  ) || [];

  const facetableFields = collection?.fields.filter((f) => f.facet) || [];

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        field: collection?.fields[0]?.name || "",
        operator: ":",
        value: "",
      },
    ]);
  };

  const updateFilter = (id: string, updates: Partial<FilterRow>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const buildFilterString = (): string | undefined => {
    const parts = filters
      .filter((f) => f.field && f.value)
      .map((f) => {
        if (f.operator === ":[") {
          // between syntax: field:[min..max]
          return `${f.field}:[${f.value}]`;
        }
        return `${f.field}${f.operator}${f.value}`;
      });
    return parts.length > 0 ? parts.join(" && ") : undefined;
  };

  const handleSearch = async () => {
    if (queryBy.length === 0) {
      setSearchError("Select at least one query_by field");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSelectedHit(null);

    try {
      const searchParams: Record<string, any> = {
        q: query || "*",
        query_by: queryBy.join(","),
        page,
        per_page: perPage,
      };

      const filterBy = buildFilterString();
      if (filterBy) searchParams.filter_by = filterBy;

      if (sortField) {
        searchParams.sort_by = `${sortField}:${sortOrder}`;
      }

      if (facetBy.length > 0) {
        searchParams.facet_by = facetBy.join(",");
      }

      if (highlightFields.length > 0) {
        searchParams.highlight_fields = highlightFields.join(",");
      }

      if (prefix) searchParams.prefix = true;
      if (exhaustiveSearch) searchParams.exhaustive_search = true;

      // Use the raw client for full params support
      const client = typesenseService["client"];
      if (!client) throw new Error("Not connected");

      const response = await client
        .collections(collection.name)
        .documents()
        .search(searchParams);

      setResults(response as unknown as SearchResponse);
      setRawResponse(response);
      setResultTab("hits");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setSearchError(msg);
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setQuery("*");
    setQueryBy(stringFields.slice(0, 3).map((f) => f.name));
    setFilters([]);
    setFacetBy([]);
    setSortField("");
    setSortOrder("desc");
    setPerPage(10);
    setPage(1);
    setPrefix(false);
    setExhaustiveSearch(false);
    setHighlightFields([]);
    setResults(null);
    setRawResponse(null);
    setSearchError(null);
    setSelectedHit(null);
  };

  const [copied, setCopied] = useState(false);
  const copyApiCall = () => {
    const params: Record<string, any> = {
      q: query || "*",
      query_by: queryBy.join(","),
    };
    const filterBy = buildFilterString();
    if (filterBy) params.filter_by = filterBy;
    if (sortField) params.sort_by = `${sortField}:${sortOrder}`;
    if (facetBy.length > 0) params.facet_by = facetBy.join(",");

    const text = `GET /collections/${collection?.name}/documents/search?${new URLSearchParams(params).toString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Search Playground — ${collection?.name}`}>
      <div className="min-w-[700px] max-w-[900px] flex gap-4" style={{ minHeight: "60vh" }}>
        {/* Left: Query Builder */}
        <div className="w-[300px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-2 max-h-[65vh]">
          {/* Query */}
          <Section label="Query" icon={<Search className="w-3.5 h-3.5" />}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search query (* for all)"
              className="input-field"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </Section>

          {/* Query By */}
          <Section label="Query By" icon={<Sparkles className="w-3.5 h-3.5" />}>
            <div className="flex flex-wrap gap-1.5">
              {stringFields.map((f) => (
                <FieldTag
                  key={f.name}
                  name={f.name}
                  active={queryBy.includes(f.name)}
                  onClick={() => {
                    setQueryBy((prev) =>
                      prev.includes(f.name)
                        ? prev.filter((n) => n !== f.name)
                        : [...prev, f.name]
                    );
                  }}
                />
              ))}
              {stringFields.length === 0 && (
                <p className="text-[10px] text-gray-400">No string fields available</p>
              )}
            </div>
          </Section>

          {/* Filters */}
          <Section label="Filters" icon={<Filter className="w-3.5 h-3.5" />}>
            <div className="space-y-2">
              {filters.map((f) => (
                <div key={f.id} className="flex gap-1.5 items-center">
                  <select
                    value={f.field}
                    onChange={(e) => updateFilter(f.id, { field: e.target.value })}
                    className="input-field text-[11px] flex-1"
                  >
                    {collection?.fields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={f.operator}
                    onChange={(e) => updateFilter(f.id, { operator: e.target.value })}
                    className="input-field text-[11px] w-20"
                  >
                    {FILTER_OPS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                    placeholder="value"
                    className="input-field text-[11px] flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                  <button
                    onClick={() => removeFilter(f.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addFilter}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                + Add filter
              </button>
            </div>
          </Section>

          {/* Sort */}
          <Section label="Sort" icon={<ArrowUpDown className="w-3.5 h-3.5" />}>
            <div className="flex gap-1.5">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="input-field text-[11px] flex-1"
              >
                <option value="">Default (relevance)</option>
                {sortableFields.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.type})
                  </option>
                ))}
              </select>
              {sortField && (
                <button
                  onClick={() => setSortOrder((v) => (v === "asc" ? "desc" : "asc"))}
                  className="px-2 py-1 text-[11px] font-bold rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {sortOrder.toUpperCase()}
                </button>
              )}
            </div>
          </Section>

          {/* Facets */}
          {facetableFields.length > 0 && (
            <Section label="Facets" icon={<Zap className="w-3.5 h-3.5" />}>
              <div className="flex flex-wrap gap-1.5">
                {facetableFields.map((f) => (
                  <FieldTag
                    key={f.name}
                    name={f.name}
                    active={facetBy.includes(f.name)}
                    onClick={() =>
                      setFacetBy((prev) =>
                        prev.includes(f.name)
                          ? prev.filter((n) => n !== f.name)
                          : [...prev, f.name]
                      )
                    }
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Options */}
          <Section label="Options" icon={<Zap className="w-3.5 h-3.5" />}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-gray-600 dark:text-gray-400 w-16">Per page</label>
                <input
                  type="number"
                  value={perPage}
                  min={1}
                  max={250}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="input-field text-[11px] w-16"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefix}
                  onChange={(e) => setPrefix(e.target.checked)}
                  className="rounded w-3.5 h-3.5"
                />
                <span className="text-[11px] text-gray-600 dark:text-gray-400">
                  Prefix search
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exhaustiveSearch}
                  onChange={(e) => setExhaustiveSearch(e.target.checked)}
                  className="rounded w-3.5 h-3.5"
                />
                <span className="text-[11px] text-gray-600 dark:text-gray-400">
                  Exhaustive search
                </span>
              </label>
            </div>
          </Section>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-200/50 dark:border-slate-700/50 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {searching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex-1 flex flex-col min-w-0 border-l border-gray-200/50 dark:border-slate-700/50 pl-4">
          {/* Results header */}
          {results && (
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold">
                  <span className="text-blue-600 dark:text-blue-400">{results.found.toLocaleString()}</span>{" "}
                  found
                </span>
                {results.search_time_ms !== undefined && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Clock className="w-3 h-3" />
                    {results.search_time_ms}ms
                  </span>
                )}
              </div>
              <button
                onClick={copyApiCall}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-500 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy API
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tabs */}
          {results && (
            <div className="flex gap-1 mb-3">
              {(["hits", "facets", "raw"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setResultTab(t)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    resultTab === t
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {t === "hits" ? `Hits (${results.hits.length})` : t === "facets" ? "Facets" : "Raw JSON"}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {searchError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs mb-3">
              {searchError}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[55vh]">
            {!results && !searching && (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Search className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Build your query and hit Search
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Or press Enter in the query field
                  </p>
                </div>
              </div>
            )}

            {searching && (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}

            {results && resultTab === "hits" && (
              <div className="space-y-2">
                {results.hits.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No documents match your query
                  </p>
                ) : (
                  results.hits.map((hit: SearchHit, idx: number) => (
                    <HitCard
                      key={hit.document?.id || idx}
                      hit={hit}
                      index={idx}
                      fields={collection.fields}
                      onViewJson={() => setSelectedHit(hit.document)}
                    />
                  ))
                )}

                {/* Pagination */}
                {results.found > perPage && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-slate-700/50">
                    <button
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        handleSearch();
                      }}
                      disabled={page === 1}
                      className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500">
                      Page {page} / {Math.ceil(results.found / perPage)}
                    </span>
                    <button
                      onClick={() => {
                        setPage((p) => p + 1);
                        handleSearch();
                      }}
                      disabled={page >= Math.ceil(results.found / perPage)}
                      className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {results && resultTab === "facets" && (
              <div>
                {rawResponse?.facet_counts && rawResponse.facet_counts.length > 0 ? (
                  <div className="space-y-4">
                    {rawResponse.facet_counts.map((facet: any) => (
                      <div key={facet.field_name}>
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">
                          {facet.field_name}
                        </h4>
                        <div className="space-y-1">
                          {facet.counts.map((c: any) => (
                            <div
                              key={c.value}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="flex-1 text-gray-700 dark:text-gray-300 truncate font-medium">
                                {c.value}
                              </span>
                              <span className="font-mono text-gray-500 dark:text-gray-400">
                                {c.count}
                              </span>
                              <div className="w-20 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                  style={{
                                    width: `${(c.count / facet.counts[0].count) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No facets returned. Select facet fields in the query builder.
                  </p>
                )}
              </div>
            )}

            {results && resultTab === "raw" && rawResponse && (
              <JsonTreePanel data={rawResponse} title="Raw Response" />
            )}
          </div>

          {/* JSON Viewer for selected hit */}
          {selectedHit && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center animate-fade-in p-4">
              <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Document JSON
                  </h3>
                  <button
                    onClick={() => setSelectedHit(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="p-4 overflow-auto max-h-[calc(80vh-60px)]">
                  <JsonTreePanel data={selectedHit} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 6px 10px;
          font-size: 12px;
          border: 1px solid;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s;
        }
        .input-field {
          border-color: rgb(209 213 219);
          background: white;
          color: rgb(17 24 39);
        }
        .dark .input-field {
          border-color: rgb(71 85 105);
          background: rgb(30 41 59);
          color: rgb(249 250 251);
        }
        .input-field:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </Modal>
  );
}

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200/50 dark:border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        {icon}
        {label}
        <span className="ml-auto">
          {open ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function FieldTag({
  name,
  active,
  onClick,
}: {
  name: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all ${
        active
          ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600"
      }`}
    >
      {name}
    </button>
  );
}

function HitCard({
  hit,
  index,
  fields,
  onViewJson,
}: {
  hit: SearchHit;
  index: number;
  fields: Field[];
  onViewJson: () => void;
}) {
  const doc = hit.document;
  const highlights = hit.highlights || [];

  // Display first few meaningful fields
  const displayFields = fields.slice(0, 6);

  return (
    <div className="p-3 rounded-xl border border-gray-200/50 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 shrink-0 w-5 text-right">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-1">
          {/* ID and score */}
          <div className="flex items-center gap-2">
            {doc.id && (
              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                id: {doc.id}
              </span>
            )}
            {hit.text_match !== undefined && (
              <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded-full">
                score: {hit.text_match}
              </span>
            )}
          </div>

          {/* Highlighted snippets */}
          {highlights.length > 0 && (
            <div className="space-y-0.5">
              {highlights.slice(0, 3).map((h: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium mr-1">
                    {h.field}:
                  </span>
                  <span
                    className="text-gray-700 dark:text-gray-200"
                    dangerouslySetInnerHTML={{
                      __html: (h.snippet || h.value || "").replace(
                        /<mark>/g,
                        '<mark class="bg-yellow-200 dark:bg-yellow-700/50 text-yellow-900 dark:text-yellow-200 px-0.5 rounded font-semibold">'
                      ),
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Fields preview */}
          {highlights.length === 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {displayFields.map((field) => {
                const val = doc[field.name];
                if (val === undefined || val === null) return null;
                return (
                  <div key={field.name} className="text-xs truncate">
                    <span className="text-gray-400 dark:text-gray-500 font-medium">
                      {field.name}:
                    </span>{" "}
                    <span className="text-gray-700 dark:text-gray-200">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={onViewJson}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          title="View JSON"
        >
          <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
        </button>
      </div>
    </div>
  );
}
