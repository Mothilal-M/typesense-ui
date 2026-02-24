export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: number;
  tableData?: TableResult;
  functionCalls?: FunctionCallRecord[];
  isLoading?: boolean;
  pendingAction?: PendingAction;
}

export interface TableResult {
  columns: string[];
  rows: Record<string, unknown>[];
  collectionName: string;
  totalFound?: number;
}

export interface FunctionCallRecord {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface PendingAction {
  name: string;
  args: Record<string, unknown>;
  description: string;
}

export type ChatStatus =
  | "idle"
  | "sending"
  | "calling-function"
  | "generating"
  | "awaiting-confirmation";
