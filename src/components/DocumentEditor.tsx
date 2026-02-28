import { useState, useEffect } from "react";
import { Save, Plus } from "lucide-react";
import { Modal } from "./ui/Modal";
import { JsonEditor } from "./ui/JsonEditor";
import { typesenseService } from "../services/typesense";
import { useToast } from "../hooks/useToast";
import { fireSparkle } from "../lib/confetti";
import type { Document, Field } from "../types";

interface DocumentEditorProps {
  isOpen: boolean;
  collectionName: string;
  document?: Document | null; // null = create mode
  fields: Field[];
  onClose: () => void;
  onSaved: () => void;
}

function generateTemplate(fields: Field[]): string {
  const template: Record<string, any> = {};
  for (const field of fields) {
    if (field.name === "id") continue; // Skip id for new docs
    switch (field.type) {
      case "string":
        template[field.name] = "";
        break;
      case "string[]":
        template[field.name] = [];
        break;
      case "int32":
      case "int64":
        template[field.name] = 0;
        break;
      case "float":
        template[field.name] = 0.0;
        break;
      case "bool":
        template[field.name] = false;
        break;
      case "geopoint":
        template[field.name] = [0.0, 0.0];
        break;
      case "object":
        template[field.name] = {};
        break;
      case "object[]":
        template[field.name] = [];
        break;
      default:
        if (field.type.endsWith("[]")) {
          template[field.name] = [];
        } else {
          template[field.name] = "";
        }
    }
  }
  return JSON.stringify(template, null, 2);
}

export function DocumentEditor({
  isOpen,
  collectionName,
  document,
  fields,
  onClose,
  onSaved,
}: DocumentEditorProps) {
  const isEditMode = !!document;
  const { addToast } = useToast();
  const [jsonValue, setJsonValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (document) {
        setJsonValue(JSON.stringify(document, null, 2));
      } else {
        setJsonValue(generateTemplate(fields));
      }
      setSaveError(null);
    }
  }, [isOpen, document, fields]);

  const handleSave = async () => {
    setSaveError(null);

    let parsed: Document;
    try {
      parsed = JSON.parse(jsonValue);
    } catch {
      setSaveError("Invalid JSON. Please fix the syntax and try again.");
      return;
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setSaveError("Document must be a JSON object.");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && document?.id) {
        // Remove the id from the update payload (can't update id)
        const { id, ...updateData } = parsed;
        await typesenseService.updateDocument(
          collectionName,
          String(document.id),
          updateData
        );
        addToast("success", "Document updated successfully");
        fireSparkle();
      } else {
        await typesenseService.createDocument(collectionName, parsed);
        addToast("success", "Document created successfully");
        fireSparkle();
      }
      onSaved();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save document";
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
      title={isEditMode ? "Edit Document" : "Create New Document"}
      maxWidth="max-w-4xl"
    >
      <div className="p-6 space-y-4">
        {/* Info bar */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Collection:{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {collectionName}
            </span>
          </span>
          {isEditMode && document?.id && (
            <span className="text-gray-600 dark:text-gray-400">
              ID:{" "}
              <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {String(document.id)}
              </span>
            </span>
          )}
        </div>

        {/* Schema hint */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
            Schema Fields
          </p>
          <div className="flex flex-wrap gap-1.5">
            {fields.map((field) => (
              <span
                key={field.name}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 text-xs font-mono border border-blue-200/50 dark:border-slate-600/50"
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {field.name}
                </span>
                <span className="text-gray-400 dark:text-gray-500 ml-1">
                  ({field.type})
                </span>
                {field.optional && (
                  <span className="text-yellow-500 ml-1" title="Optional">
                    ?
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* JSON Editor */}
        <JsonEditor
          value={jsonValue}
          onChange={setJsonValue}
          error={saveError || undefined}
          placeholder='{\n  "field_name": "value"\n}'
        />

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-2">
          <button onClick={onClose} className="btn-secondary" disabled={isSaving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                {isEditMode ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{isEditMode ? "Update Document" : "Create Document"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
