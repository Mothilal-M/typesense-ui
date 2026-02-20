import { useState, useCallback } from "react";
import { Wand2, Copy, Check } from "lucide-react";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  readOnly?: boolean;
  maxHeight?: string;
  placeholder?: string;
}

export function JsonEditor({
  value,
  onChange,
  error,
  readOnly = false,
  maxHeight = "max-h-[60vh]",
  placeholder = '{\n  "key": "value"\n}',
}: JsonEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Can't format invalid JSON - do nothing
    }
  }, [value, onChange]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [value]);

  const isValidJson = useCallback(() => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, [value]);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!readOnly && (
            <button
              onClick={handleFormat}
              disabled={!isValidJson()}
              className="btn-secondary flex items-center space-x-1 text-xs py-1 px-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Format JSON"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Format</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="btn-secondary flex items-center space-x-1 text-xs py-1 px-2"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        {value && !isValidJson() && (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium">
            Invalid JSON
          </span>
        )}
        {value && isValidJson() && (
          <span className="text-xs text-green-500 dark:text-green-400 font-medium">
            Valid JSON
          </span>
        )}
      </div>

      {/* Editor */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        className={`w-full font-mono text-sm p-4 rounded-xl border transition-all duration-300 ${maxHeight} min-h-[200px] resize-y
          ${
            error
              ? "border-red-400 dark:border-red-600 focus:ring-red-500"
              : "border-gray-300 dark:border-slate-600 focus:ring-blue-500"
          }
          bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-50
          focus:outline-none focus:ring-2 focus:border-transparent
          ${readOnly ? "cursor-default opacity-75" : ""}
        `}
      />

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
