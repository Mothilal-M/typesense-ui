import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  Download,
  Settings,
  FlaskConical,
  BookOpen,
  Star,
  GitCompare,
  MessageSquare,
  Code,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Document, CollectionSchema } from "../types";
import { useCollectionDocuments } from "../hooks/useCollectionDocuments";
import { DocumentEditor } from "./DocumentEditor";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Tooltip } from "./ui/Tooltip";
import { JsonTreePanel } from "./ui/JsonTreeViewer";
import { BulkImportExport } from "./BulkImportExport";
import { SchemaEditor } from "./SchemaEditor";
import { SearchPlayground } from "./SearchPlayground";
import { SynonymsManager } from "./SynonymsManager";
import { CurationsEditor } from "./CurationsEditor";
import { QueryDiffTool } from "./QueryDiffTool";
import { NaturalLanguageRules } from "./NaturalLanguageRules";
import { EmbeddableSearchWidget } from "./EmbeddableSearchWidget";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";
import { fireSparkle } from "../lib/confetti";
import { TableSkeleton } from "./ui/Skeleton";

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for global "focus-search" event (fired by keyboard shortcuts)
  useEffect(() => {
    const handler = () => searchInputRef.current?.focus();
    window.addEventListener("focus-search", handler);
    return () => window.removeEventListener("focus-search", handler);
  }, []);

  // Listen for global "new-document" event (fired by keyboard shortcuts)
  useEffect(() => {
    const handler = () => {
      if (collection) {
        setEditingDocument(null);
        setShowDocumentEditor(true);
      }
    };
    window.addEventListener("new-document", handler);
    return () => window.removeEventListener("new-document", handler);
  }, [collection]);

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

  // Feature modals
  const [showImportExport, setShowImportExport] = useState(false);
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);
  const [showSearchPlayground, setShowSearchPlayground] = useState(false);
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showCurations, setShowCurations] = useState(false);
  const [showQueryDiff, setShowQueryDiff] = useState(false);
  const [showNLRules, setShowNLRules] = useState(false);
  const [showEmbeddableWidget, setShowEmbeddableWidget] = useState(false);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingCol = useRef<string | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(0);

  // Virtual scrolling ref
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, colName: string) => {
      e.preventDefault();
      e.stopPropagation();
      resizingCol.current = colName;
      resizeStartX.current = e.clientX;
      resizeStartW.current = columnWidths[colName] || 180;

      const onMouseMove = (ev: MouseEvent) => {
        if (!resizingCol.current) return;
        const delta = ev.clientX - resizeStartX.current;
        const newWidth = Math.max(60, resizeStartW.current + delta);
        setColumnWidths((prev) => ({ ...prev, [resizingCol.current!]: newWidth }));
      };
      const onMouseUp = () => {
        resizingCol.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [columnWidths]
  );

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

    // Cache the document before deleting (for undo)
    const cachedDoc = documents.find(
      (d) => String(d.id) === documentToDelete
    );

    setIsDeleting(true);
    try {
      await typesenseService.deleteDocument(collection.name, documentToDelete);

      const undoRestore = cachedDoc
        ? () => {
            typesenseService
              .createDocument(collection.name, cachedDoc)
              .then(() => {
                addToast("success", "Document restored");
                refresh();
              })
              .catch(() => addToast("error", "Failed to restore document"));
          }
        : undefined;

      addToast("success", "Document deleted", 5000, undoRestore);
      fireSparkle();
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
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
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
                <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800/80 rounded-t-2xl">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
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
                  <JsonTreePanel data={selectedDocument} title="Document" />
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
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
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
                className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white truncate block"
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
            <Tooltip content="Create new document (Ctrl+N)" side="bottom">
              <button
                onClick={handleCreateDocument}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Document</span>
              </button>
            </Tooltip>

            {/* Import/Export */}
            <Tooltip content="Import / Export documents" side="bottom">
              <button
                onClick={() => setShowImportExport(true)}
                className="btn-secondary flex items-center space-x-1 sm:space-x-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden lg:inline">Import/Export</span>
              </button>
            </Tooltip>

            {/* Search Playground */}
            <Tooltip content="Visual search playground" side="bottom">
              <button
                onClick={() => setShowSearchPlayground(true)}
                className="btn-secondary flex items-center space-x-1 sm:space-x-2"
              >
                <FlaskConical className="w-4 h-4" />
                <span className="hidden lg:inline">Playground</span>
              </button>
            </Tooltip>

            {/* Schema Editor */}
            <Tooltip content="Edit collection schema" side="bottom">
              <button
                onClick={() => setShowSchemaEditor(true)}
                className="btn-secondary flex items-center space-x-1 sm:space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline">Schema</span>
              </button>
            </Tooltip>

            {/* Synonyms Manager */}
            <Tooltip content="Manage synonyms" side="bottom">
              <button
                onClick={() => setShowSynonyms(true)}
                className="btn-secondary flex items-center space-x-1 sm:space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden xl:inline">Synonyms</span>
              </button>
            </Tooltip>

            {/* Curations Editor */}
            <Tooltip content="Curate search results" side="bottom">
              <button
                onClick={() => setShowCurations(true)}
                className="btn-secondary flex items-center space-x-1 sm:space-x-2"
              >
                <Star className="w-4 h-4" />
                <span className="hidden xl:inline">Curations</span>
              </button>
            </Tooltip>

            {/* Query Diff Tool */}
            <Tooltip content="Compare two search queries" side="bottom">
              <button
                onClick={() => setShowQueryDiff(true)}
                className="btn-secondary flex items-center space-x-1 sm:space-x-2"
              >
                <GitCompare className="w-4 h-4" />
                <span className="hidden xl:inline">Diff</span>
              </button>
            </Tooltip>

            {/* NL Rules */}
            <Tooltip content="AI natural language rules" side="bottom">
              <button
                onClick={() => setShowNLRules(true)}
                className="btn-secondary flex items-center space-x-1 sm:space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden xl:inline">NL Rules</span>
              </button>
            </Tooltip>

            {/* Embeddable Widget */}
            <Tooltip content="Generate search widget" side="bottom">
              <button
                onClick={() => setShowEmbeddableWidget(true)}
                className="btn-secondary flex items-center space-x-1 sm:space-x-2"
              >
                <Code className="w-4 h-4" />
                <span className="hidden xl:inline">Widget</span>
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
            ref={searchInputRef}
            type="text"
            placeholder="Search documents... (use * for all)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-24 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-md focus:shadow-xl"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 select-none pointer-events-none">
            Ctrl K
          </kbd>
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
      <div ref={tableContainerRef} className="flex-1 overflow-auto">
        {isLoading && documents.length === 0 ? (
          <TableSkeleton rows={10} cols={Math.min(visibleColumns.size || 5, 8)} />
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in max-w-sm">
              <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-900 dark:to-slate-800 mb-4 shadow-xl">
                <Search className="w-16 h-16 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">
                {searchQuery && searchQuery !== "*" ? "No matching documents" : "No documents yet"}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5">
                {searchQuery && searchQuery !== "*"
                  ? "Try a different search query or clear your filters."
                  : "Create your first document to get started."}
              </p>
              {(!searchQuery || searchQuery === "*") && (
                <button
                  onClick={handleCreateDocument}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Document
                </button>
              )}
            </div>
          </div>
        ) : (
          <VirtualTable
            documents={documents}
            collection={collection}
            visibleColumns={visibleColumns}
            columnWidths={columnWidths}
            sortBy={sortBy}
            sortOrder={sortOrder}
            toggleSort={toggleSort}
            onResizeStart={handleResizeStart}
            onView={setSelectedDocument}
            onEdit={handleEditDocument}
            onDelete={(doc) => handleDeleteDocument(String(doc.id))}
            containerRef={tableContainerRef}
          />
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

              <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 px-2 sm:px-3 whitespace-nowrap">
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
              <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800/80 rounded-t-2xl">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
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
                <JsonTreePanel data={selectedDocument} title="Document" />
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

      {/* Bulk Import/Export Modal */}
      {collection && (
        <BulkImportExport
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          collectionName={collection.name}
          onImported={refresh}
        />
      )}

      {/* Schema Editor Modal */}
      {collection && (
        <SchemaEditor
          isOpen={showSchemaEditor}
          onClose={() => setShowSchemaEditor(false)}
          collection={collection}
          onUpdated={refresh}
        />
      )}

      {/* Search Playground Modal */}
      {collection && (
        <SearchPlayground
          isOpen={showSearchPlayground}
          onClose={() => setShowSearchPlayground(false)}
          collection={collection}
        />
      )}

      {/* Synonyms Manager Modal */}
      {collection && (
        <SynonymsManager
          isOpen={showSynonyms}
          onClose={() => setShowSynonyms(false)}
          collectionName={collection.name}
        />
      )}

      {/* Curations Editor Modal */}
      {collection && (
        <CurationsEditor
          isOpen={showCurations}
          onClose={() => setShowCurations(false)}
          collectionName={collection.name}
        />
      )}

      {/* Query Diff Tool Modal */}
      {collection && (
        <QueryDiffTool
          isOpen={showQueryDiff}
          onClose={() => setShowQueryDiff(false)}
          collection={collection}
        />
      )}

      {/* Natural Language Rules Modal */}
      {collection && (
        <NaturalLanguageRules
          isOpen={showNLRules}
          onClose={() => setShowNLRules(false)}
          collection={collection}
        />
      )}

      {/* Embeddable Search Widget Modal */}
      {collection && (
        <EmbeddableSearchWidget
          isOpen={showEmbeddableWidget}
          onClose={() => setShowEmbeddableWidget(false)}
          collection={collection}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VirtualTable – virtualized rows + resizable column headers          */
/* ------------------------------------------------------------------ */
const ROW_HEIGHT = 52; // px – matches py-4 + content

interface VirtualTableProps {
  documents: Document[];
  collection: CollectionSchema | null;
  visibleColumns: Set<string>;
  columnWidths: Record<string, number>;
  sortBy: string;
  sortOrder: string;
  toggleSort: (field: string) => void;
  onResizeStart: (e: React.MouseEvent, colName: string) => void;
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function VirtualTable({
  documents,
  collection,
  visibleColumns,
  columnWidths,
  sortBy,
  sortOrder,
  toggleSort,
  onResizeStart,
  onView,
  onEdit,
  onDelete,
  containerRef,
}: VirtualTableProps) {
  const rowVirtualizer = useVirtualizer({
    count: documents.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const fields = collection?.fields.filter((f) => visibleColumns.has(f.name)) ?? [];

  return (
    <table className="w-full" style={{ tableLayout: "fixed" }}>
      <colgroup>
        <col style={{ width: 144 }} />
        {fields.map((f) => (
          <col key={f.name} style={{ width: columnWidths[f.name] || 180 }} />
        ))}
      </colgroup>
      <thead className="bg-gray-50 dark:bg-slate-900 sticky top-0 z-20 shadow-sm">
        <tr>
          <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-tight bg-gray-50 dark:bg-slate-900">
            Actions
          </th>
          {fields.map((field) => (
            <th
              key={field.name}
              className="relative px-5 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-tight cursor-pointer bg-gray-50 dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 select-none"
              style={{ width: columnWidths[field.name] || 180 }}
              onClick={() => toggleSort(field.name)}
            >
              <div className="flex items-center space-x-1 overflow-hidden">
                <span className="truncate">{field.name}</span>
                {sortBy === field.name &&
                  (sortOrder === "asc" ? (
                    <SortAsc className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <SortDesc className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                  ))}
              </div>
              {/* Resize handle */}
              <div
                onMouseDown={(e) => onResizeStart(e, field.name)}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/40 transition-colors z-10"
              />
            </th>
          ))}
        </tr>
      </thead>
      <tbody
        className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
        style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const doc = documents[virtualRow.index];
          return (
            <tr
              key={doc.id || virtualRow.index}
              className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border-b border-gray-200/50 dark:border-gray-700/50"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <td className="px-5 py-3" style={{ width: 144 }}>
                <div className="flex items-center space-x-1 flex-nowrap">
                  <Tooltip content="View JSON" side="bottom">
                    <button
                      onClick={() => onView(doc)}
                      className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300 group"
                    >
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Edit document" side="bottom">
                    <button
                      onClick={() => onEdit(doc)}
                      className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-300 group"
                    >
                      <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete document" side="bottom">
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30 transition-all duration-300 group"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                    </button>
                  </Tooltip>
                </div>
              </td>
              {fields.map((field) => (
                <td
                  key={field.name}
                  className="px-5 py-3 text-sm text-gray-900 dark:text-gray-50 truncate font-semibold"
                  style={{ width: columnWidths[field.name] || 180 }}
                  title={String(doc[field.name])}
                >
                  {formatValue(doc[field.name])}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
