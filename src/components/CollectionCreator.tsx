import { useState, useEffect } from "react";
import { Plus, X, Database } from "lucide-react";
import { Modal } from "./ui/Modal";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";
import { fireConfetti } from "../lib/confetti";

const FIELD_TYPES = [
  "string",
  "string[]",
  "int32",
  "int32[]",
  "int64",
  "int64[]",
  "float",
  "float[]",
  "bool",
  "bool[]",
  "geopoint",
  "geopoint[]",
  "object",
  "object[]",
  "auto",
  "string*",
  "image",
] as const;

const NUMERIC_TYPES = ["int32", "int64", "float", "int32[]", "int64[]", "float[]"];

interface FieldRow {
  id: string;
  name: string;
  type: string;
  optional: boolean;
  facet: boolean;
  sort: boolean;
  index: boolean;
}

function createEmptyField(): FieldRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    type: "string",
    optional: true,
    facet: false,
    sort: false,
    index: true,
  };
}

interface CollectionCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CollectionCreator({
  isOpen,
  onClose,
  onCreated,
}: CollectionCreatorProps) {
  const { addToast } = useToast();
  const [collectionName, setCollectionName] = useState("");
  const [fields, setFields] = useState<FieldRow[]>([createEmptyField()]);
  const [defaultSortingField, setDefaultSortingField] = useState("");
  const [enableNestedFields, setEnableNestedFields] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCollectionName("");
      setFields([createEmptyField()]);
      setDefaultSortingField("");
      setEnableNestedFields(false);
      setSaveError(null);
    }
  }, [isOpen]);

  const addField = () => {
    setFields((prev) => [...prev, createEmptyField()]);
  };

  const removeField = (id: string) => {
    setFields((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((f) => f.id !== id);
    });
  };

  const updateField = (id: string, updates: Partial<FieldRow>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const numericFields = fields.filter(
    (f) => f.name.trim() && NUMERIC_TYPES.includes(f.type)
  );

  const hasObjectFields = fields.some(
    (f) => f.type === "object" || f.type === "object[]"
  );

  const validate = (): string | null => {
    if (!collectionName.trim()) {
      return "Collection name is required.";
    }
    if (/\s/.test(collectionName.trim())) {
      return "Collection name cannot contain spaces.";
    }
    const validFields = fields.filter((f) => f.name.trim());
    if (validFields.length === 0) {
      return "At least one field with a name is required.";
    }
    const names = validFields.map((f) => f.name.trim());
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicates.length > 0) {
      return `Duplicate field name: "${duplicates[0]}"`;
    }
    return null;
  };

  const handleCreate = async () => {
    setSaveError(null);

    const validationError = validate();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    const validFields = fields.filter((f) => f.name.trim());
    const schema: any = {
      name: collectionName.trim(),
      fields: validFields.map((f) => {
        const field: any = {
          name: f.name.trim(),
          type: f.type,
        };
        if (f.optional) field.optional = true;
        if (f.facet) field.facet = true;
        if (!f.index) field.index = false;
        if (f.sort) field.sort = true;
        return field;
      }),
    };

    if (defaultSortingField) {
      schema.default_sorting_field = defaultSortingField;
    }
    if (enableNestedFields) {
      schema.enable_nested_fields = true;
    }

    setIsSaving(true);
    try {
      await typesenseService.createCollection(schema);
      addToast("success", `Collection "${collectionName.trim()}" created successfully`);
      fireConfetti();
      onCreated();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create collection";
      setSaveError(message);
      addToast("error", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Collection"
      maxWidth="max-w-2xl"
    >
      <div className="p-4 sm:p-6 space-y-5">
        {/* Collection Name */}
        <div>
          <label className="label">Collection Name</label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder="e.g. products, users, articles"
            className="input"
            autoFocus
          />
        </div>

        {/* Fields Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">
              Fields ({fields.filter((f) => f.name.trim()).length})
            </label>
            <button
              onClick={addField}
              className="btn-secondary flex items-center space-x-1 text-xs py-1.5 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field</span>
            </button>
          </div>

          {/* Field Rows */}
          <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200/50 dark:border-slate-700/50 animate-fade-in space-y-2"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Row 1: Name + Type + Remove */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) =>
                      updateField(field.id, { name: e.target.value })
                    }
                    placeholder="field_name"
                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, { type: e.target.value })
                    }
                    className="w-28 sm:w-36 px-2 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeField(field.id)}
                    disabled={fields.length <= 1}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 group disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                    title="Remove field"
                  >
                    <X className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>

                {/* Row 2: Checkbox options */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.optional}
                      onChange={(e) =>
                        updateField(field.id, { optional: e.target.checked })
                      }
                      className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Optional</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.facet}
                      onChange={(e) =>
                        updateField(field.id, { facet: e.target.checked })
                      }
                      className="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Facet</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.sort}
                      onChange={(e) =>
                        updateField(field.id, { sort: e.target.checked })
                      }
                      className="rounded border-gray-300 dark:border-slate-600 text-green-600 focus:ring-green-500 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Sort</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.index}
                      onChange={(e) =>
                        updateField(field.id, { index: e.target.checked })
                      }
                      className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Index</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl border border-gray-200/50 dark:border-slate-700/50 space-y-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
            Advanced Options
          </p>

          {/* Default Sorting Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Sorting Field
            </label>
            <select
              value={defaultSortingField}
              onChange={(e) => setDefaultSortingField(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              {numericFields.map((f) => (
                <option key={f.id} value={f.name.trim()}>
                  {f.name.trim()} ({f.type})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Must be a numeric field (int32, int64, float).
            </p>
          </div>

          {/* Enable Nested Fields */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableNestedFields}
              onChange={(e) => setEnableNestedFields(e.target.checked)}
              className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Nested Fields
              </span>
              {hasObjectFields && (
                <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  Recommended
                </span>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Required when using object or object[] field types.
              </p>
            </div>
          </label>
        </div>

        {/* Error */}
        {saveError && (
          <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {saveError}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary" disabled={isSaving}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Create Collection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
