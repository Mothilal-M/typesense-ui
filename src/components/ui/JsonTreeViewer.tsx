import { useState, memo } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";

interface JsonTreeViewerProps {
  data: any;
  rootLabel?: string;
  defaultExpanded?: number; // how many levels to auto-expand (default 2)
}

export const JsonTreeViewer = memo(function JsonTreeViewer({
  data,
  rootLabel,
  defaultExpanded = 2,
}: JsonTreeViewerProps) {
  return (
    <div className="font-mono text-sm leading-relaxed select-text">
      <TreeNode
        label={rootLabel}
        value={data}
        depth={0}
        defaultExpanded={defaultExpanded}
        isLast
      />
    </div>
  );
});

interface TreeNodeProps {
  label?: string;
  value: any;
  depth: number;
  defaultExpanded: number;
  isLast: boolean;
}

function TreeNode({ label, value, depth, defaultExpanded, isLast }: TreeNodeProps) {
  const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;
  const [expanded, setExpanded] = useState(depth < defaultExpanded);

  if (!isExpandable) {
    return (
      <div className="flex items-start gap-1 py-[1px]" style={{ paddingLeft: depth * 16 }}>
        {label !== undefined && (
          <span className="text-purple-600 dark:text-purple-400 font-medium shrink-0">
            "{label}"
            <span className="text-gray-500 dark:text-gray-400">: </span>
          </span>
        )}
        <PrimitiveValue value={value} />
        {!isLast && <span className="text-gray-400">,</span>}
      </div>
    );
  }

  const entries = isArray ? value : Object.entries(value);
  const count = isArray ? value.length : Object.keys(value).length;
  const bracketOpen = isArray ? "[" : "{";
  const bracketClose = isArray ? "]" : "}";

  return (
    <div>
      <div
        className="flex items-center gap-0.5 py-[1px] cursor-pointer group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded transition-colors"
        style={{ paddingLeft: depth * 16 }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="w-4 h-4 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        {label !== undefined && (
          <span className="text-purple-600 dark:text-purple-400 font-medium">
            "{label}"
            <span className="text-gray-500 dark:text-gray-400">: </span>
          </span>
        )}
        <span className="text-gray-700 dark:text-gray-300">{bracketOpen}</span>
        {!expanded && (
          <>
            <span className="text-gray-400 dark:text-gray-500 text-xs mx-1">
              {count} {isArray ? (count === 1 ? "item" : "items") : (count === 1 ? "key" : "keys")}
            </span>
            <span className="text-gray-700 dark:text-gray-300">{bracketClose}</span>
            {!isLast && <span className="text-gray-400">,</span>}
          </>
        )}
      </div>
      {expanded && (
        <>
          {isArray
            ? entries.map((item: any, idx: number) => (
                <TreeNode
                  key={idx}
                  value={item}
                  depth={depth + 1}
                  defaultExpanded={defaultExpanded}
                  isLast={idx === count - 1}
                />
              ))
            : (entries as [string, any][]).map(([key, val], idx) => (
                <TreeNode
                  key={key}
                  label={key}
                  value={val}
                  depth={depth + 1}
                  defaultExpanded={defaultExpanded}
                  isLast={idx === count - 1}
                />
              ))}
          <div
            className="text-gray-700 dark:text-gray-300 py-[1px]"
            style={{ paddingLeft: depth * 16 }}
          >
            {bracketClose}
            {!isLast && <span className="text-gray-400">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

function PrimitiveValue({ value }: { value: any }) {
  if (value === null) {
    return <span className="text-orange-500 dark:text-orange-400 italic">null</span>;
  }
  if (value === undefined) {
    return <span className="text-gray-400 italic">undefined</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span className="text-amber-600 dark:text-amber-400 font-semibold">
        {value ? "true" : "false"}
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  }
  if (typeof value === "string") {
    const isUrl = /^https?:\/\//.test(value);
    if (isUrl) {
      return (
        <span className="text-green-600 dark:text-green-400">
          "<a href={value} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:decoration-solid" onClick={(e) => e.stopPropagation()}>{value}</a>"
        </span>
      );
    }
    // Truncate very long strings in tree view
    const display = value.length > 120 ? value.slice(0, 120) + "…" : value;
    return (
      <span className="text-green-600 dark:text-green-400" title={value.length > 120 ? value : undefined}>
        "{display}"
      </span>
    );
  }
  return <span className="text-gray-600 dark:text-gray-300">{String(value)}</span>;
}

/** A wrapper that shows a JSON tree with a copy button */
export function JsonTreePanel({ data, title }: { data: any; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-inner overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/60 dark:bg-slate-800/60 border-b border-gray-200/50 dark:border-slate-700/50">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title || "JSON"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
        <JsonTreeViewer data={data} defaultExpanded={3} />
      </div>
    </div>
  );
}
