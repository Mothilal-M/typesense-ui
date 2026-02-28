import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Download,
  FileJson,
  FileSpreadsheet,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";
import { fireConfetti } from "../lib/confetti";

interface BulkImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
  onImported: () => void;
}

type ImportAction = "create" | "upsert" | "update";

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export function BulkImportExport({
  isOpen,
  onClose,
  collectionName,
  onImported,
}: BulkImportExportProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"import" | "export">("import");

  // Import state
  const [isDragging, setIsDragging] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importAction, setImportAction] = useState<ImportAction>("upsert");
  const [parsedDocuments, setParsedDocuments] = useState<any[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  const resetImport = () => {
    setImportFile(null);
    setParsedDocuments(null);
    setParseError(null);
    setImportResult(null);
  };

  // Parse file contents
  const parseFile = useCallback(async (file: File) => {
    resetImport();
    setImportFile(file);

    const text = await file.text();
    const name = file.name.toLowerCase();

    try {
      let docs: any[];

      if (name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          docs = parsed;
        } else if (typeof parsed === "object" && parsed !== null) {
          docs = [parsed];
        } else {
          throw new Error("JSON must be an array of objects or a single object.");
        }
      } else if (name.endsWith(".jsonl") || name.endsWith(".ndjson")) {
        docs = text
          .split("\n")
          .filter((line) => line.trim())
          .map((line, i) => {
            try {
              return JSON.parse(line);
            } catch {
              throw new Error(`Invalid JSON on line ${i + 1}`);
            }
          });
      } else if (name.endsWith(".csv")) {
        docs = parseCsv(text);
      } else {
        throw new Error("Unsupported file format. Use .json, .jsonl, or .csv");
      }

      if (docs.length === 0) {
        throw new Error("File contains no documents.");
      }

      setParsedDocuments(docs);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse file");
    }
  }, []);

  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Import documents
  const handleImport = async () => {
    if (!parsedDocuments || parsedDocuments.length === 0) return;

    setImporting(true);
    setImportResult(null);
    try {
      const results = await typesenseService.importDocuments(
        collectionName,
        parsedDocuments,
        importAction
      );

      const success = results.filter((r: any) => r.success).length;
      const failed = results.filter((r: any) => !r.success).length;
      const errors = results
        .filter((r: any) => !r.success)
        .slice(0, 10)
        .map((r: any, i: number) => `Row ${r.index ?? i}: ${r.error || "Unknown error"}`);

      setImportResult({ total: results.length, success, failed, errors });

      if (failed === 0) {
        addToast("success", `Imported ${success} documents successfully`);
        fireConfetti();
        onImported();
      } else {
        addToast("warning", `Imported ${success}/${results.length} — ${failed} failed`);
        onImported();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Import failed";
      addToast("error", message);
      setImportResult({
        total: parsedDocuments.length,
        success: 0,
        failed: parsedDocuments.length,
        errors: [message],
      });
    } finally {
      setImporting(false);
    }
  };

  // Export as JSON
  const handleExportJson = async () => {
    setExporting(true);
    try {
      const raw = await typesenseService.exportDocuments(collectionName);
      const lines = raw.split("\n").filter((l) => l.trim());
      const docs = lines.map((l) => JSON.parse(l));
      const blob = new Blob([JSON.stringify(docs, null, 2)], {
        type: "application/json",
      });
      downloadBlob(blob, `${collectionName}.json`);
      addToast("success", `Exported ${docs.length} documents as JSON`);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Export as CSV
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const raw = await typesenseService.exportDocuments(collectionName);
      const lines = raw.split("\n").filter((l) => l.trim());
      const docs = lines.map((l) => JSON.parse(l));

      if (docs.length === 0) {
        addToast("info", "No documents to export");
        return;
      }

      // Gather all unique keys
      const keys = Array.from(
        new Set(docs.flatMap((d: any) => Object.keys(d)))
      );

      const csvLines = [
        keys.map(escapeCsvValue).join(","),
        ...docs.map((doc: any) =>
          keys
            .map((key) => {
              const val = doc[key];
              if (val === null || val === undefined) return "";
              if (typeof val === "object") return escapeCsvValue(JSON.stringify(val));
              return escapeCsvValue(String(val));
            })
            .join(",")
        ),
      ];

      const blob = new Blob([csvLines.join("\n")], {
        type: "text/csv;charset=utf-8",
      });
      downloadBlob(blob, `${collectionName}.csv`);
      addToast("success", `Exported ${docs.length} documents as CSV`);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Export as JSONL
  const handleExportJsonl = async () => {
    setExporting(true);
    try {
      const raw = await typesenseService.exportDocuments(collectionName);
      const blob = new Blob([raw], { type: "application/x-ndjson" });
      downloadBlob(blob, `${collectionName}.jsonl`);
      const count = raw.split("\n").filter((l) => l.trim()).length;
      addToast("success", `Exported ${count} documents as JSONL`);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Import / Export — ${collectionName}`}>
      <div className="min-w-[500px]">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 mb-4">
          <button
            onClick={() => { setTab("import"); resetImport(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
              tab === "import"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => setTab("export")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
              tab === "export"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Import Tab */}
        {tab === "import" && (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]"
                  : importFile
                  ? "border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10"
                  : "border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.jsonl,.ndjson,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {importFile ? (
                <div className="space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {importFile.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(importFile.size / 1024).toFixed(1)} KB
                    {parsedDocuments && (
                      <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                        · {parsedDocuments.length} documents parsed
                      </span>
                    )}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetImport();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 mt-1"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto" />
                  <p className="font-semibold text-gray-700 dark:text-gray-200">
                    Drag & drop a file here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or click to browse — supports{" "}
                    <span className="font-medium text-blue-600 dark:text-blue-400">.json</span>,{" "}
                    <span className="font-medium text-blue-600 dark:text-blue-400">.jsonl</span>,{" "}
                    <span className="font-medium text-blue-600 dark:text-blue-400">.csv</span>
                  </p>
                </div>
              )}
            </div>

            {/* Parse Error */}
            {parseError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{parseError}</p>
              </div>
            )}

            {/* Import Action selector */}
            {parsedDocuments && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Import Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "create", label: "Create", desc: "Only new" },
                      { value: "upsert", label: "Upsert", desc: "Create or update" },
                      { value: "update", label: "Update", desc: "Existing only" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setImportAction(opt.value)}
                      className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                        importAction === opt.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                          : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div
                className={`p-4 rounded-xl border ${
                  importResult.failed === 0
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/15"
                    : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/15"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {importResult.failed === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {importResult.success} of {importResult.total} imported
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-24 overflow-y-auto text-xs text-red-600 dark:text-red-400 space-y-1 font-mono">
                    {importResult.errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Import Button */}
            {parsedDocuments && !importResult && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing {parsedDocuments.length} documents...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {parsedDocuments.length} Documents ({importAction})
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Export Tab */}
        {tab === "export" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Export all documents from{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {collectionName}
              </span>{" "}
              in your preferred format.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <ExportButton
                icon={<FileJson className="w-5 h-5" />}
                label="Export as JSON"
                description="Array of objects — ideal for programmatic use"
                onClick={handleExportJson}
                loading={exporting}
              />
              <ExportButton
                icon={<FileJson className="w-5 h-5" />}
                label="Export as JSONL"
                description="One JSON object per line — best for streaming & import"
                onClick={handleExportJsonl}
                loading={exporting}
              />
              <ExportButton
                icon={<FileSpreadsheet className="w-5 h-5" />}
                label="Export as CSV"
                description="Spreadsheet-compatible — open in Excel or Google Sheets"
                onClick={handleExportCsv}
                loading={exporting}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ExportButton({
  icon,
  label,
  description,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 text-left disabled:opacity-50 group"
    >
      <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      </span>
      <div>
        <span className="block text-sm font-semibold text-gray-900 dark:text-white">
          {label}
        </span>
        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </span>
      </div>
    </button>
  );
}

// --- Utility functions ---

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsv(text: string): any[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const docs: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const doc: any = {};
    headers.forEach((header, idx) => {
      let val: any = values[idx] ?? "";
      // Try to parse numbers and booleans
      if (val === "true") val = true;
      else if (val === "false") val = false;
      else if (val !== "" && !isNaN(Number(val))) val = Number(val);
      else {
        // Try to parse JSON arrays/objects
        try {
          if ((val.startsWith("[") && val.endsWith("]")) || (val.startsWith("{") && val.endsWith("}"))) {
            val = JSON.parse(val);
          }
        } catch {
          /* keep as string */
        }
      }
      doc[header] = val;
    });
    docs.push(doc);
  }

  return docs;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  values.push(current.trim());
  return values;
}
