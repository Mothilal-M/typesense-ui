import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Plus,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Document } from "../types";
import { useCollectionDocuments } from "../hooks/useCollectionDocuments";
import { DocumentEditor } from "./DocumentEditor";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Tooltip } from "./ui/Tooltip";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";

export function CollectionViewer() {
  const { selectedCollection, aiTableData, clearAiTableData } = useApp();
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
    refresh,
  } = useCollectionDocuments(selectedCollection);

  const { addToast } = useToast();

  // UI state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // CRUD state
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setShowDocumentEditor(true);
  };

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setShowDocumentEditor(true);
  };

  const handleCloseEditor = () => {
    setShowDocumentEditor(false);
    setEditingDocument(null);
  };

  const handleDocumentSaved = () => {
    refresh();
  };

  const handleDeleteDocument = (docId: string) => {
    setDocumentToDelete(docId);
  };

  const confirmDelete = async () => {
    if (!documentToDelete || !collection) return;

    setIsDeleting(true);
    try {
      await typesenseService.deleteDocument(collection.name, documentToDelete);
      addToast("success", "Document deleted successfully");
      setDocumentToDelete(null);
      refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete document";
      addToast("error", message);
    } finally {
      setIsDeleting(false);
    }
  };

  // AI Results View - shown when AI returns table data
  if (aiTableData) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-purple-50/20 to-blue-50/20 dark:from-slate-950/30 dark:via-purple-900/10 dark:to-slate-950/30">
        {/* AI Results Header */}
        <div className="p-3 sm:p-5 border-b border-purple-200/50 dark:border-purple-700/50 bg-gradient-to-r from-purple-50/80 via-blue-50/80 to-pink-50/80 dark:from-purple-900/30 dark:via-blue-900/20 dark:to-pink-900/20 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="animate-fade-in min-w-0 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                  AI Results
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  <span className="font-semibold">{aiTableData.collectionName}</span>
                  {" \u2014 "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {aiTableData.rows.length}
                  </span>
                  {aiTableData.totalFound !== undefined && (
                    <span> of {aiTableData.totalFound.toLocaleString()}</span>
                  )}
                  {" documents"}
                </p>
              </div>
            </div>

            <button
              onClick={clearAiTableData}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-1.5"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* AI Results Table */}
        <div className="flex-1 overflow-auto">
          {aiTableData.rows.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center animate-fade-in">
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">
                  No documents returned
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-purple-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-tight w-20">
                    View
                  </th>
                  {aiTableData.columns.map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-tight"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {aiTableData.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-blue-50/50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedDocument(row as Document)}
                        className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all duration-300 group"
                        title="View JSON"
                      >
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      </button>
                    </td>
                    {aiTableData.columns.map((col) => (
                      <td
                        key={col}
                        className="px-5 py-4 text-sm text-gray-900 dark:text-gray-50 max-w-xs truncate font-semibold"
                        title={formatValue(row[col])}
                      >
                        {formatValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* JSON Viewer Modal for AI results */}
        {selectedDocument &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in"
              onClick={() => setSelectedDocument(null)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 sm:p-5 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-t-2xl">
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Document JSON
                  </h3>
                  <Tooltip content="Close" side="left">
                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/30 dark:hover:to-red-900/20 transition-all duration-300 group"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                    </button>
                  </Tooltip>
                </div>
                <div className="p-4 sm:p-6 overflow-auto max-h-[calc(90vh-70px)] sm:max-h-[calc(80vh-80px)]">
                  <pre className="text-xs sm:text-sm text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6 rounded-xl overflow-x-auto border border-gray-200/50 dark:border-slate-700/50 shadow-inner font-mono leading-relaxed">
                    {JSON.stringify(selectedDocument, null, 2)}
                  </pre>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }

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
      <div className="relative z-30 p-3 sm:p-5 border-b border-gray-200/50 dark:border-slate-700/50 space-y-3 sm:space-y-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="animate-fade-in min-w-0 flex-1 overflow-hidden">
            <Tooltip content={collection?.name} side="bottom">
              <h2
                className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate block"
              >
                {collection?.name}
              </h2>
            </Tooltip>
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

          <div className="flex items-center flex-shrink-0 gap-2">
            {/* New Document Button */}
            <Tooltip content="Create new document" side="bottom">
              <button
                onClick={handleCreateDocument}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Document</span>
              </button>
            </Tooltip>

            <Tooltip content={showFilters ? "Hide filters" : "Show filters"} side="bottom">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center space-x-1 sm:space-x-2 transition-all duration-300 ${
                  showFilters
                    ? "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 ring-2 ring-blue-400 dark:ring-purple-500"
                    : ""
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </Tooltip>

            <div className="relative">
              <Tooltip content={showColumnPicker ? "Hide column picker" : "Show column picker"} side="bottom">
                <button
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                  className="btn-secondary flex items-center space-x-1 sm:space-x-2"
                >
                  <Columns className="w-4 h-4" />
                  <span className="hidden sm:inline">Columns</span>
                </button>
              </Tooltip>

              {showColumnPicker && collection && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 z-50 max-h-96 overflow-y-auto">
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
                  field.index !== false &&
                  (field.facet ||
                    field.type.includes("int") ||
                    field.type.includes("float") ||
                    field.type === "bool")
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

      {/* Search Error Banner */}
      {error && collection && (
        <div className="mx-5 mt-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-sm animate-fade-in">
          <p className="font-semibold">Search Error</p>
          <p className="text-xs mt-1 opacity-80">{error}</p>
        </div>
      )}

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
            <thead className="bg-gray-50 dark:bg-slate-900 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-tight w-36 min-w-[144px] bg-gray-50 dark:bg-slate-900">
                  Actions
                </th>
                {collection?.fields
                  .filter((field) => visibleColumns.has(field.name))
                  .map((field) => (
                    <th
                      key={field.name}
                      className="px-5 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-tight cursor-pointer bg-gray-50 dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300"
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
                  <td className="px-5 py-4 w-36 min-w-[144px]">
                    <div className="flex items-center space-x-1 flex-nowrap">
                      <Tooltip content="View JSON" side="bottom">
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300 group"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Edit document" side="bottom">
                        <button
                          onClick={() => handleEditDocument(doc)}
                          className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-300 group"
                        >
                          <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete document" side="bottom">
                        <button
                          onClick={() =>
                            handleDeleteDocument(String(doc.id))
                          }
                          className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30 transition-all duration-300 group"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                        </button>
                      </Tooltip>
                    </div>
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
        <div className="p-3 sm:p-5 pr-20 sm:pr-24 border-t border-gray-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-semibold">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {(currentPage - 1) * perPage + 1}
              </span>
              –
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {Math.min(currentPage * perPage, searchResponse.found)}
              </span>
              {" of "}
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {searchResponse.found.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <Tooltip content="Previous page" side="top">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 sm:p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-200" />
                </button>
              </Tooltip>

              <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-2 sm:px-3 whitespace-nowrap">
                {currentPage} / {totalPages}
              </span>

              <Tooltip content="Next page" side="top">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="p-2 sm:p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-200" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {/* JSON Viewer Modal */}
      {selectedDocument &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in"
            onClick={() => setSelectedDocument(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-t-2xl">
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Document JSON
                </h3>
                <Tooltip content="Close" side="left">
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/30 dark:hover:to-red-900/20 transition-all duration-300 group"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                  </button>
                </Tooltip>
              </div>
              <div className="p-4 sm:p-6 overflow-auto max-h-[calc(90vh-70px)] sm:max-h-[calc(80vh-80px)]">
                <pre className="text-xs sm:text-sm text-gray-900 dark:text-gray-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6 rounded-xl overflow-x-auto border border-gray-200/50 dark:border-slate-700/50 shadow-inner font-mono leading-relaxed">
                  {JSON.stringify(selectedDocument, null, 2)}
                </pre>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Document Editor Modal */}
      {collection && (
        <DocumentEditor
          isOpen={showDocumentEditor}
          collectionName={collection.name}
          document={editingDocument}
          fields={collection.fields}
          onClose={handleCloseEditor}
          onSaved={handleDocumentSaved}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!documentToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setDocumentToDelete(null)}
        title="Delete Document"
        message={`Are you sure you want to delete document "${documentToDelete}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
