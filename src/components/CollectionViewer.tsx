import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  SortAsc,
  SortDesc,
  Columns,
  Filter,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Document } from "../types";
import { useCollectionDocuments } from "../hooks/useCollectionDocuments";

export function CollectionViewer() {
  const { selectedCollection } = useApp();
  const {
    collection,
    documents,
    searchResponse,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,
    clearFilter,
    currentPage,
    setCurrentPage,
    perPage,
    sortBy,
    toggleSort,
    sortOrder,
  } = useCollectionDocuments(selectedCollection);

  // UI state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    if (collection) {
      const defaultColumns = new Set(
        collection.fields.slice(0, 6).map((f) => f.name)
      );
      setVisibleColumns(defaultColumns);
    }
  }, [collection]);

  const toggleColumn = (columnName: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  if (!selectedCollection) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8 bg-gradient-to-br from-gray-50/50 to-blue-50/50 dark:from-slate-950/50 dark:to-slate-900/50">
        <div className="animate-fade-in">
          <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-6 shadow-xl">
            <Search className="w-16 h-16 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            No Collection Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Select a collection from the sidebar to view its documents
          </p>
        </div>
      </div>
    );
  }

  if (error && !collection) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-900/20 dark:to-orange-900/20">
        <div className="animate-fade-in">
          <div className="p-6 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-2xl shadow-xl">
            <p className="font-bold text-red-600 dark:text-red-400 text-xl mb-2">
              Error loading collection
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = searchResponse
    ? Math.ceil(searchResponse.found / perPage)
    : 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-blue-50/20 to-purple-50/20 dark:from-slate-950/30 dark:via-gray-800/20 dark:to-slate-950/30">
      {/* Header */}
      <div className="p-5 border-b border-gray-200/50 dark:border-slate-700/50 space-y-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {collection?.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {searchResponse ? (
                <span className="flex items-center space-x-2">
                  <span className="font-semibold">
                    Found {searchResponse.found.toLocaleString()} documents
                  </span>
                  {searchResponse.search_time_ms && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold border border-green-200/50 dark:border-green-700/50">
                      {searchResponse.search_time_ms}ms
                    </span>
                  )}
                </span>
              ) : (
                <span className="animate-pulse">Loading...</span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center space-x-2 transition-all duration-300 ${
                showFilters
                  ? "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 ring-2 ring-blue-400 dark:ring-purple-500"
                  : ""
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Columns className="w-4 h-4" />
                <span>Columns</span>
              </button>

              {showColumnPicker && collection && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 z-10 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {collection.fields.map((field) => (
                      <label
                        key={field.name}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(field.name)}
                          onChange={() => toggleColumn(field.name)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-50">
                          {field.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({field.type})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search documents... (use * for all)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-md focus:shadow-xl"
          />
        </div>

        {/* Filters */}
        {showFilters && collection && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
            {collection.fields
              .filter(
                (field) =>
                  field.facet ||
                  field.type.includes("int") ||
                  field.type.includes("float") ||
                  field.type === "bool"
              )
              .map((field) => (
                <div key={field.name} className="relative">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    {field.name} ({field.type})
                  </label>

                  {field.type === "bool" ? (
                    <select
                      value={filters[field.name] || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          field.name,
                          e.target.value === ""
                            ? null
                            : e.target.value === "true"
                        )
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50"
                    >
                      <option value="">All</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : field.type.includes("int") ||
                    field.type.includes("float") ? (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters[field.name]?.min || ""}
                        onChange={(e) =>
                          handleFilterChange(field.name, {
                            ...filters[field.name],
                            min: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters[field.name]?.max || ""}
                        onChange={(e) =>
                          handleFilterChange(field.name, {
                            ...filters[field.name],
                            max: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={`Filter by ${field.name}`}
                        value={filters[field.name] || ""}
                        onChange={(e) =>
                          handleFilterChange(field.name, e.target.value)
                        }
                        className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50"
                      />
                      {filters[field.name] && (
                        <button
                          onClick={() => clearFilter(field.name)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading && documents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-slate-700 border-t-transparent mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
                Loading documents...
              </p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-900 dark:to-slate-800 mb-4 shadow-xl">
                <Search className="w-16 h-16 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">
                No documents found
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 sticky top-0 shadow-sm backdrop-blur-sm">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-tight w-20">
                  Actions
                </th>
                {collection?.fields
                  .filter((field) => visibleColumns.has(field.name))
                  .map((field) => (
                    <th
                      key={field.name}
                      className="px-5 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-tight cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300"
                      onClick={() => toggleSort(field.name)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{field.name}</span>
                        {sortBy === field.name &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <SortDesc className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          ))}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {documents.map((doc, idx) => (
                <tr
                  key={doc.id || idx}
                  className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300 group"
                      title="View JSON"
                    >
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </button>
                  </td>
                  {collection?.fields
                    .filter((field) => visibleColumns.has(field.name))
                    .map((field) => (
                      <td
                        key={field.name}
                        className="px-5 py-4 text-sm text-gray-900 dark:text-gray-50 max-w-xs truncate font-semibold"
                        title={String(doc[field.name])}
                      >
                        {formatValue(doc[field.name])}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {searchResponse && totalPages > 0 && (
        <div className="p-5 border-t border-gray-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-200 font-semibold">
              Showing{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {(currentPage - 1) * perPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {Math.min(currentPage * perPage, searchResponse.found)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {searchResponse.found.toLocaleString()}
              </span>{" "}
              results
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>

              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-3">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Viewer Modal */}
      {selectedDocument && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-t-2xl">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Document JSON
              </h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/30 dark:hover:to-red-900/20 transition-all duration-300 group"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(80vh-80px)]">
              <pre className="text-sm text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 p-6 rounded-xl overflow-x-auto border border-gray-200/50 dark:border-slate-700/50 shadow-inner font-mono leading-relaxed">
                {JSON.stringify(selectedDocument, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
