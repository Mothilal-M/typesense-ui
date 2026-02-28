import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Copy, Check, Loader2, Wand2, FileJson } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";
import { typesenseService } from "../services/typesense";

interface AiSchemaGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface GeneratedField {
  name: string;
  type: string;
  facet: boolean;
  optional: boolean;
  index: boolean;
  sort: boolean;
}

interface GeneratedSchema {
  name: string;
  fields: GeneratedField[];
  default_sorting_field?: string;
  enable_nested_fields?: boolean;
}

const TYPESENSE_TYPES = [
  "string", "string[]", "int32", "int64", "float", "bool",
  "auto", "string*", "object", "object[]", "geopoint", "image",
];

function inferTypesenseType(value: unknown): string {
  if (value === null || value === undefined) return "string";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int32" : "float";
  if (Array.isArray(value)) {
    if (value.length === 0) return "string[]";
    if (typeof value[0] === "string") return "string[]";
    if (typeof value[0] === "number") return "float[]";
    if (typeof value[0] === "object") return "object[]";
    return "string[]";
  }
  if (typeof value === "object") return "object";
  return "string";
}

function inferSchema(json: unknown): GeneratedSchema {
  const sample = Array.isArray(json) ? json[0] : json;
  if (!sample || typeof sample !== "object") {
    return { name: "new_collection", fields: [] };
  }

  const fields: GeneratedField[] = Object.entries(sample as Record<string, unknown>).map(([key, val]) => {
    const type = inferTypesenseType(val);
    return {
      name: key,
      type,
      facet: type === "string" || type === "bool" || type === "int32",
      optional: true,
      index: true,
      sort: type === "int32" || type === "int64" || type === "float",
    };
  });

  // Try to detect a good default_sorting_field
  const sortField = fields.find(
    (f) => (f.type === "int32" || f.type === "int64" || f.type === "float") && f.sort
  );

  return {
    name: "new_collection",
    fields,
    default_sorting_field: sortField?.name,
    enable_nested_fields: fields.some((f) => f.type === "object" || f.type === "object[]"),
  };
}

async function aiSuggestSchema(
  jsonSample: string,
  apiKey: string
): Promise<GeneratedSchema> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Analyze this JSON sample data and suggest the optimal Typesense collection schema.

JSON Data:
\`\`\`json
${jsonSample.slice(0, 6000)}
\`\`\`

Rules:
- Use proper Typesense types: string, string[], int32, int64, float, bool, auto, object, object[], geopoint
- Set facet=true for fields good for filtering (categories, tags, booleans, enums)
- Set optional=true for fields that might not exist in all documents
- Set sort=true only for numeric/float fields useful for sorting
- Pick a good default_sorting_field (must be int32/int64/float, non-optional)
- Set enable_nested_fields=true if objects/arrays of objects exist
- Suggest a good collection name based on the data

Respond ONLY with valid JSON matching this TypeScript interface:
{ name: string, fields: Array<{ name: string, type: string, facet: boolean, optional: boolean, index: boolean, sort: boolean }>, default_sorting_field?: string, enable_nested_fields?: boolean }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");
  return JSON.parse(jsonMatch[0]) as GeneratedSchema;
}

export function AiSchemaGenerator({ isOpen, onClose, onCreated }: AiSchemaGeneratorProps) {
  const { geminiApiKey, refreshCollections } = useApp();
  const { addToast } = useToast();
  const [jsonInput, setJsonInput] = useState("");
  const [schema, setSchema] = useState<GeneratedSchema | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useAi, setUseAi] = useState(true);

  const handleGenerate = useCallback(async () => {
    if (!jsonInput.trim()) {
      addToast("error", "Please paste some sample JSON data");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      addToast("error", "Invalid JSON. Please check your input.");
      return;
    }

    setIsGenerating(true);
    try {
      if (useAi && geminiApiKey) {
        const result = await aiSuggestSchema(jsonInput, geminiApiKey);
        setSchema(result);
        addToast("success", "AI generated an optimized schema!");
      } else {
        const result = inferSchema(parsed);
        setSchema(result);
        addToast("success", "Schema inferred from JSON structure");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate schema";
      addToast("error", msg);
      // Fallback to local inference
      const result = inferSchema(parsed);
      setSchema(result);
    } finally {
      setIsGenerating(false);
    }
  }, [jsonInput, useAi, geminiApiKey, addToast]);

  const handleCreateCollection = async () => {
    if (!schema) return;
    if (!schema.name.trim()) {
      addToast("error", "Collection name is required");
      return;
    }
    setIsCreating(true);
    try {
      await typesenseService.createCollection({
        name: schema.name,
        fields: schema.fields.map((f) => ({
          name: f.name,
          type: f.type,
          facet: f.facet,
          optional: f.optional,
          index: f.index,
          sort: f.sort,
        })),
        default_sorting_field: schema.default_sorting_field,
        enable_nested_fields: schema.enable_nested_fields,
      });
      addToast("success", `Collection "${schema.name}" created!`);
      await refreshCollections();
      onCreated?.();
      onClose();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopySchema = () => {
    if (!schema) return;
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (index: number, key: keyof GeneratedField, value: unknown) => {
    if (!schema) return;
    setSchema({
      ...schema,
      fields: schema.fields.map((f, i) =>
        i === index ? { ...f, [key]: value } : f
      ),
    });
  };

  const removeField = (index: number) => {
    if (!schema) return;
    setSchema({ ...schema, fields: schema.fields.filter((_, i) => i !== index) });
  };

  const addField = () => {
    if (!schema) return;
    setSchema({
      ...schema,
      fields: [
        ...schema.fields,
        { name: "new_field", type: "string", facet: false, optional: true, index: true, sort: false },
      ],
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Schema Generator</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paste sample JSON → Get optimized Typesense schema</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-4">
          {/* JSON Input */}
          {!schema && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Sample JSON Data
                </label>
                {geminiApiKey && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAi}
                      onChange={(e) => setUseAi(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-300">Use AI optimization</span>
                  </label>
                )}
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={'Paste a JSON object or array of objects...\n\nExample:\n[\n  { "title": "iPhone 15", "price": 999, "category": "Electronics" },\n  { "title": "MacBook Pro", "price": 2499, "category": "Computers" }\n]'}
                className="w-full h-64 p-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm font-mono text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !jsonInput.trim()}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {useAi && geminiApiKey ? "AI is analyzing..." : "Inferring schema..."}
                  </>
                ) : (
                  <>
                    {useAi && geminiApiKey ? <Sparkles className="w-5 h-5" /> : <FileJson className="w-5 h-5" />}
                    {useAi && geminiApiKey ? "Generate with AI" : "Infer from Structure"}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Schema Editor */}
          {schema && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSchema(null)}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  ← Back to JSON input
                </button>
                <div className="flex-1" />
                <button onClick={handleCopySchema} className="btn-secondary flex items-center gap-1.5 text-sm">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Schema"}
                </button>
              </div>

              {/* Collection name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={schema.name}
                  onChange={(e) => setSchema({ ...schema, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 text-sm"
                />
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!schema.enable_nested_fields}
                    onChange={(e) => setSchema({ ...schema, enable_nested_fields: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span className="text-gray-600 dark:text-gray-300">Enable nested fields</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">Default sorting field:</label>
                  <select
                    value={schema.default_sorting_field || ""}
                    onChange={(e) => setSchema({ ...schema, default_sorting_field: e.target.value || undefined })}
                    className="px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50"
                  >
                    <option value="">None</option>
                    {schema.fields
                      .filter((f) => ["int32", "int64", "float"].includes(f.type) && !f.optional)
                      .map((f) => (
                        <option key={f.name} value={f.name}>{f.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Fields table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Type</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 dark:text-gray-300">Facet</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 dark:text-gray-300">Optional</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 dark:text-gray-300">Index</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 dark:text-gray-300">Sort</th>
                      <th className="px-3 py-2 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {schema.fields.map((field, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(i, "name", e.target.value)}
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={field.type}
                            onChange={(e) => updateField(i, "type", e.target.value)}
                            className="w-full px-2 py-1 rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 text-sm"
                          >
                            {TYPESENSE_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={field.facet} onChange={(e) => updateField(i, "facet", e.target.checked)} className="rounded" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={field.optional} onChange={(e) => updateField(i, "optional", e.target.checked)} className="rounded" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={field.index} onChange={(e) => updateField(i, "index", e.target.checked)} className="rounded" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={field.sort} onChange={(e) => updateField(i, "sort", e.target.checked)} className="rounded" />
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeField(i)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={addField} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                + Add field
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {schema && (
          <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button onClick={onClose} className="btn-secondary px-4 py-2">Cancel</button>
            <button
              onClick={handleCreateCollection}
              disabled={isCreating || !schema.name.trim() || schema.fields.length === 0}
              className="px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center gap-2"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Collection
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
