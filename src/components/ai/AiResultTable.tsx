import type { TableResult } from "../../types/chat";

interface AiResultTableProps {
  data: TableResult;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AiResultTable({ data }: AiResultTableProps) {
  if (data.rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {data.collectionName}
        </span>
        {data.totalFound !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {data.rows.length} of {data.totalFound.toLocaleString()} shown
          </span>
        )}
      </div>

      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
            <tr>
              {data.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tight whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
            {data.rows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
              >
                {data.columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2 text-gray-900 dark:text-gray-50 max-w-[200px] truncate whitespace-nowrap"
                    title={formatCellValue(row[col])}
                  >
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
