import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Filter,
  ArrowUpDown,
  Search as SearchIcon,
  ToggleLeft,
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";
import { fireSparkle } from "../lib/confetti";
import type { CollectionSchema, Field } from "../types";

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

const TYPE_COLORS: Record<string, string> = {
  string: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "string[]": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  int32: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "int32[]": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  int64: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "int64[]": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  float: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "float[]": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  bool: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "bool[]": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  geopoint: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "geopoint[]": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  object: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "object[]": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  auto: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  "string*": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  image: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

interface SchemaEditorProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionSchema;
  onUpdated: () => void;
}

interface FieldRowData {
  id: string;
  name: string;
  type: string;
  facet: boolean;
  optional: boolean;
  index: boolean;
  sort: boolean;
  infix: boolean;
  isExisting: boolean;
  expanded: boolean;
}

function fieldToRow(field: Field): FieldRowData {
  return {
    id: `existing-${field.name}`,
    name: field.name,
    type: field.type,
    facet: !!field.facet,
    optional: !!field.optional,
    index: field.index !== false,
    sort: !!field.sort,
    infix: !!field.infix,
    isExisting: true,
    expanded: false,
  };
}

function createEmptyRow(): FieldRowData {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    type: "string",
    facet: false,
    optional: true,
    index: true,
    sort: false,
    infix: false,
    isExisting: false,
    expanded: true,
  };
}

export function SchemaEditor({
  isOpen,
  onClose,
  collection,
  onUpdated,
}: SchemaEditorProps) {
  const { addToast } = useToast();
  const [fields, setFields] = useState<FieldRowData[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldsToDelete, setFieldsToDelete] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && collection) {
      setFields(collection.fields.map(fieldToRow));
      setFieldsToDelete([]);
      setError(null);
    }
  }, [isOpen, collection]);

  const newFieldCount = fields.filter((f) => !f.isExisting).length;
  const deleteCount = fieldsToDelete.length;
  const hasChanges = newFieldCount > 0 || deleteCount > 0;

  const addField = () => {
    setFields((prev) => [...prev, createEmptyRow()]);
  };

  const removeField = (id: string) => {
    const field = fields.find((f) => f.id === id);
    if (!field) return;

    if (field.isExisting) {
      // Mark for deletion
      setFieldsToDelete((prev) => [...prev, field.name]);
      setFields((prev) => prev.filter((f) => f.id !== id));
    } else {
      setFields((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const updateField = (id: string, updates: Partial<FieldRowData>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const toggleExpand = (id: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, expanded: !f.expanded } : f))
    );
  };

  const handleSave = async () => {
    setError(null);

    // Validate new fields
    const newFields = fields.filter((f) => !f.isExisting);
    for (const f of newFields) {
      if (!f.name.trim()) {
        setError("All new fields must have a name.");
        return;
      }
    }

    // Check duplicates
    const allNames = fields.map((f) => f.name.trim());
    const dupes = allNames.filter((n, i) => n && allNames.indexOf(n) !== i);
    if (dupes.length > 0) {
      setError(`Duplicate field name: ${dupes[0]}`);
      return;
    }

    setSaving(true);

    try {
      // Typesense schema update: drop fields first, then add new ones
      const updates: any = { fields: [] };

      // Drop fields
      for (const name of fieldsToDelete) {
        updates.fields.push({ name, drop: true });
      }

      // Add new fields
      for (const f of newFields) {
        const fieldDef: any = {
          name: f.name.trim(),
          type: f.type,
          optional: f.optional,
          facet: f.facet,
          index: f.index,
          sort: f.sort,
        };
        if (f.infix) fieldDef.infix = true;
        updates.fields.push(fieldDef);
      }

      if (updates.fields.length === 0) {
        setError("No changes to save.");
        setSaving(false);
        return;
      }

      // Use the Typesense client to update schema
      // @ts-ignore - update method exists on collection
      await typesenseService["client"]!
        .collections(collection.name)
        .update(updates);

      addToast("success", `Schema updated: ${newFields.length} added, ${fieldsToDelete.length} removed`);
      fireSparkle();
      onUpdated();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update schema";
      setError(msg);
      addToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schema — ${collection?.name}`}>
      <div className="min-w-[560px] max-w-[700px]">
        {/* Summary bar */}
        <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold">{fields.filter((f) => f.isExisting).length} existing fields</span>
          {newFieldCount > 0 && (
            <span className="text-green-600 dark:text-green-400 font-semibold">
              +{newFieldCount} new
            </span>
          )}
          {deleteCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-semibold">
              -{deleteCount} removed
            </span>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {fields.map((field) => (
            <div
              key={field.id}
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                field.isExisting
                  ? "border-gray-200 dark:border-slate-700"
                  : "border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10"
              }`}
            >
              {/* Field header row */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  onClick={() => toggleExpand(field.id)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
                >
                  {field.expanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {field.isExisting ? (
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1 min-w-0 truncate">
                    {field.name}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    placeholder="Field name"
                    className="flex-1 min-w-0 text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-400"
                  />
                )}

                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    TYPE_COLORS[field.type] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {field.type}
                </span>

                {/* Quick toggles visible in collapsed view */}
                <div className="flex items-center gap-1 shrink-0">
                  {field.facet && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                      FACET
                    </span>
                  )}
                  {field.sort && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      SORT
                    </span>
                  )}
                </div>

                {!field.isExisting && (
                  <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full shrink-0">
                    NEW
                  </span>
                )}

                <button
                  onClick={() => removeField(field.id)}
                  className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0 ml-1"
                  title={field.isExisting ? "Mark for deletion" : "Remove"}
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>

              {/* Expanded details */}
              {field.expanded && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-slate-700/50 space-y-3 animate-fade-in">
                  {/* Type selector (new fields only) */}
                  {!field.isExisting && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                        Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Toggle grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <ToggleSwitch
                      label="Facet"
                      icon={<Filter className="w-3 h-3" />}
                      checked={field.facet}
                      onChange={(v) => updateField(field.id, { facet: v })}
                      disabled={field.isExisting}
                    />
                    <ToggleSwitch
                      label="Sort"
                      icon={<ArrowUpDown className="w-3 h-3" />}
                      checked={field.sort}
                      onChange={(v) => updateField(field.id, { sort: v })}
                      disabled={field.isExisting}
                      disabledReason={
                        !NUMERIC_TYPES.includes(field.type) && field.type !== "string"
                          ? "Only numeric/string"
                          : undefined
                      }
                    />
                    <ToggleSwitch
                      label="Index"
                      icon={<SearchIcon className="w-3 h-3" />}
                      checked={field.index}
                      onChange={(v) => updateField(field.id, { index: v })}
                      disabled={field.isExisting}
                    />
                    <ToggleSwitch
                      label="Optional"
                      icon={<ToggleLeft className="w-3 h-3" />}
                      checked={field.optional}
                      onChange={(v) => updateField(field.id, { optional: v })}
                      disabled={field.isExisting}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Deleted fields shown as ghost */}
          {fieldsToDelete.map((name) => (
            <div
              key={`del-${name}`}
              className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-red-300 dark:border-red-700 rounded-xl opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400 line-through flex-1">
                {name}
              </span>
              <button
                onClick={() => {
                  // Restore: remove from delete list, add back
                  setFieldsToDelete((prev) => prev.filter((n) => n !== name));
                  const original = collection?.fields.find((f) => f.name === name);
                  if (original) {
                    setFields((prev) => [...prev, fieldToRow(original)]);
                  }
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Undo
              </button>
            </div>
          ))}
        </div>

        {/* Add field button */}
        <button
          onClick={addField}
          className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </button>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Save */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
                {hasChanges && (
                  <span className="text-xs opacity-80">
                    ({newFieldCount} add, {deleteCount} remove)
                  </span>
                )}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ToggleSwitch({
  label,
  icon,
  checked,
  onChange,
  disabled,
  disabledReason,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      title={disabled ? disabledReason || "Cannot change existing field" : `Toggle ${label.toLowerCase()}`}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
        checked
          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"}`}
    >
      {icon}
      {label}
      <div
        className={`ml-auto w-6 h-3.5 rounded-full flex items-center transition-all ${
          checked ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"
        }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-3" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
