import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type Content,
  type Part,
} from "@google/generative-ai";
import {
  typesenseToolDeclarations,
  executeFunctionCall,
  WRITE_TOOLS,
} from "./geminiTools";
import type { CollectionSchema } from "../types";
import type { TableResult, FunctionCallRecord, PendingAction } from "../types/chat";

export interface SendMessageResult {
  text: string;
  tableData?: TableResult;
  functionCalls: FunctionCallRecord[];
  pendingAction?: PendingAction;
}

type StatusCallback = (status: string) => void;
type ConfirmCallback = (action: PendingAction) => Promise<boolean>;

class GeminiService {
  private client: GoogleGenerativeAI | null = null;

  initialize(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  isInitialized(): boolean {
    return this.client !== null;
  }

  disconnect() {
    this.client = null;
  }

  private getModel(systemPrompt: string): GenerativeModel {
    if (!this.client) throw new Error("Gemini not initialized");
    return this.client.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ functionDeclarations: typesenseToolDeclarations }],
      systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
    });
  }

  private buildSystemPrompt(
    collections: CollectionSchema[],
    selectedCollection: string | null
  ): string {
    const collectionSummaries = collections
      .map((c) => {
        const fieldsList = c.fields
          .filter((f) => !f.type.startsWith("float") || !f.name.toLowerCase().includes("embedding"))
          .map(
            (f) =>
              `  - ${f.name} (${f.type}${f.optional ? ", optional" : ""}${f.facet ? ", facet" : ""})`
          )
          .join("\n");
        const embeddingFields = c.fields.filter(
          (f) => f.type.startsWith("float") && f.name.toLowerCase().includes("embedding")
        );
        const embeddingNote = embeddingFields.length > 0
          ? `\n  [${embeddingFields.length} embedding field(s) hidden - not queryable]`
          : "";
        return `Collection "${c.name}" (${c.num_documents} documents):\n${fieldsList}${embeddingNote}`;
      })
      .join("\n\n");

    const selectedInfo = selectedCollection
      ? `\nThe user is currently viewing the collection "${selectedCollection}". When they ask questions without specifying a collection, assume they mean "${selectedCollection}".`
      : "\nNo collection is currently selected. Ask the user which collection they want to query if their question is ambiguous.";

    return `You are an AI assistant for a Typesense search database dashboard. You help users explore and query their data using natural language.

## Available Collections
${collectionSummaries}
${selectedInfo}

## Your Capabilities
- List collections and their schemas
- Search documents with full-text search, filters, and sorting
- Count documents (with optional filters)
- Retrieve specific documents by ID
- Create, update, and delete documents

## Typesense Query Syntax Reference
- filter_by: "field:=value", "field:>100", "field:[min..max]", "field:=[val1,val2]"
- sort_by: "field:asc" or "field:desc"
- query_by: must be string or string[] fields (comma-separated for multiple)
- Use q="*" with filter_by for exact matching without full-text search

## Response Guidelines
- CRITICAL: All function call results (search_documents, get_document, list_collections, get_collection_schema) are AUTOMATICALLY displayed as a data table in the main UI. Your text response must be a SHORT summary only (1-2 sentences max). NEVER list document data, field values, or record details in your text. Just say something like "Here are 25 documents from jds_v4" or "Found 10 matching results."
- When the user asks to "show data", "show collection data", or similar, ALWAYS use search_documents with q="*".
- For count queries, provide a direct numeric answer.
- If a query fails, explain what went wrong and suggest corrections.
- Be concise. Keep responses under 2 sentences when data is returned via function calls.
- For write operations, confirm what you did after the action completes.`;
  }

  async sendMessage(
    userMessage: string,
    chatHistory: Content[],
    collections: CollectionSchema[],
    selectedCollection: string | null,
    onStatusChange?: StatusCallback,
    onConfirm?: ConfirmCallback
  ): Promise<SendMessageResult> {
    if (!this.client) throw new Error("Gemini not initialized");

    const systemPrompt = this.buildSystemPrompt(collections, selectedCollection);
    const functionCalls: FunctionCallRecord[] = [];
    const model = this.getModel(systemPrompt);

    const chat = model.startChat({
      history: chatHistory,
    });

    try {
      let response = await chat.sendMessage(userMessage);
      let result = response.response;

      const MAX_ITERATIONS = 5;
      let iterations = 0;

      while (iterations < MAX_ITERATIONS) {
        const candidate = result.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const fnCallParts = parts.filter(
          (p): p is Part & { functionCall: { name: string; args: Record<string, unknown> } } =>
            "functionCall" in p
        );

        if (fnCallParts.length === 0) break;

        onStatusChange?.("calling-function");

        const functionResponses: Part[] = [];
        for (const part of fnCallParts) {
          const { name, args } = part.functionCall;
          const typedArgs = args as Record<string, unknown>;
          const record: FunctionCallRecord = { name, args: typedArgs };

          try {
            if (WRITE_TOOLS.has(name) && onConfirm) {
              const description = getActionDescription(name, typedArgs);
              const confirmed = await onConfirm({ name, args: typedArgs, description });

              if (!confirmed) {
                record.result = { error: "User denied this action" };
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: { error: "User denied this action. Do not retry." },
                  },
                } as Part);
                functionCalls.push(record);
                continue;
              }
            }

            const fnResult = await executeFunctionCall(name, typedArgs);
            record.result = fnResult;
            functionResponses.push({
              functionResponse: { name, response: { result: fnResult } },
            } as Part);
          } catch (err) {
            const errorMsg =
              err instanceof Error ? err.message : "Function execution failed";
            record.result = { error: errorMsg };
            functionResponses.push({
              functionResponse: { name, response: { error: errorMsg } },
            } as Part);
          }
          functionCalls.push(record);
        }

        onStatusChange?.("generating");
        response = await chat.sendMessage(functionResponses);
        result = response.response;
        iterations++;
      }

      const rawText = result.text() || "";
      const tableData = this.extractTableData(functionCalls);

      // When table data exists, condense the AI text response.
      // The data is shown in the main content area table, so the chat
      // only needs a brief summary — not a verbose listing of fields/values.
      const text = tableData ? this.condenseTextForTable(rawText, tableData) : rawText;

      return { text, tableData, functionCalls };
    } catch (err) {
      throw new Error(parseGeminiError(err));
    }
  }

  /**
   * When table data is being displayed in the main UI, condense the AI's text
   * response to just a brief summary. Gemini often lists all document data as
   * text even when told not to — this ensures the chat stays clean.
   */
  private condenseTextForTable(rawText: string, tableData: TableResult): string {
    // If the text is already short (under 200 chars), keep it as-is
    if (rawText.length <= 200) return rawText;

    // Extract just the first sentence or line as a summary
    const firstLine = rawText.split("\n").find((line) => line.trim().length > 0) || "";
    const firstSentence = firstLine.split(/[.!]\s/)[0];

    // Build a concise summary
    if (firstSentence && firstSentence.length <= 150) {
      return firstSentence + ".";
    }

    // Fallback: generate our own summary
    const { collectionName, rows, totalFound } = tableData;
    const count = totalFound ?? rows.length;
    return `Found ${count} result${count !== 1 ? "s" : ""} from **${collectionName}**.`;
  }

  private extractTableData(
    functionCalls: FunctionCallRecord[]
  ): TableResult | undefined {
    // Priority 1: search_documents — most common for data queries
    const searchCall = functionCalls.find(
      (fc) =>
        fc.name === "search_documents" &&
        fc.result &&
        typeof fc.result === "object" &&
        (fc.result as { documents?: unknown[] }).documents &&
        ((fc.result as { documents: unknown[] }).documents.length > 0)
    );
    if (searchCall) {
      const resultObj = searchCall.result as {
        documents: Record<string, unknown>[];
        found: number;
      };
      const docs = resultObj.documents;
      const columns = Object.keys(docs[0] || {});
      return {
        columns,
        rows: docs,
        collectionName: searchCall.args.collection_name as string,
        totalFound: resultObj.found,
      };
    }

    // Priority 2: get_document — single document as 1-row table
    const getDocCall = functionCalls.find(
      (fc) =>
        fc.name === "get_document" &&
        fc.result &&
        typeof fc.result === "object" &&
        !("error" in (fc.result as Record<string, unknown>))
    );
    if (getDocCall) {
      const doc = getDocCall.result as Record<string, unknown>;
      const columns = Object.keys(doc);
      return {
        columns,
        rows: [doc],
        collectionName: getDocCall.args.collection_name as string,
        totalFound: 1,
      };
    }

    // Priority 3: list_collections — array of collection metadata
    const listCall = functionCalls.find(
      (fc) =>
        fc.name === "list_collections" &&
        fc.result &&
        Array.isArray(fc.result) &&
        (fc.result as unknown[]).length > 0
    );
    if (listCall) {
      const collections = listCall.result as Record<string, unknown>[];
      const rows = collections.map((c) => ({
        name: c.name,
        num_documents: c.num_documents,
        fields: Array.isArray(c.fields) ? (c.fields as unknown[]).length : 0,
      }));
      return {
        columns: ["name", "num_documents", "fields"],
        rows,
        collectionName: "Collections",
        totalFound: collections.length,
      };
    }

    // Priority 4: get_collection_schema — fields as table rows
    const schemaCall = functionCalls.find(
      (fc) =>
        fc.name === "get_collection_schema" &&
        fc.result &&
        typeof fc.result === "object" &&
        Array.isArray((fc.result as { fields?: unknown[] }).fields)
    );
    if (schemaCall) {
      const schema = schemaCall.result as {
        name: string;
        fields: { name: string; type: string; facet?: boolean; optional?: boolean; index?: boolean }[];
      };
      const rows = schema.fields.map((f) => ({
        name: f.name,
        type: f.type,
        facet: f.facet ? "Yes" : "No",
        optional: f.optional ? "Yes" : "No",
        index: f.index === false ? "No" : "Yes",
      }));
      return {
        columns: ["name", "type", "facet", "optional", "index"],
        rows,
        collectionName: schema.name || (schemaCall.args.collection_name as string),
        totalFound: schema.fields.length,
      };
    }

    return undefined;
  }
}

function getActionDescription(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case "create_document":
      return `Create a new document in "${args.collection_name}"`;
    case "update_document":
      return `Update document "${args.document_id}" in "${args.collection_name}"`;
    case "delete_document":
      return `Delete document "${args.document_id}" from "${args.collection_name}"`;
    default:
      return `Execute ${name}`;
  }
}

function parseGeminiError(err: unknown): string {
  if (!(err instanceof Error)) return "An unknown error occurred";

  const msg = err.message;

  // Try to extract a clean message from JSON error responses
  try {
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        const apiMsg = parsed.error.message as string;
        if (apiMsg.includes("quota") || apiMsg.includes("429") || apiMsg.includes("RESOURCE_EXHAUSTED")) {
          return "Gemini API rate limit reached. Please wait a moment and try again.";
        }
        if (apiMsg.includes("API_KEY_INVALID") || apiMsg.includes("401")) {
          return "Invalid Gemini API key. Please check your key in settings.";
        }
        // Return first sentence of API message
        const firstSentence = apiMsg.split(".")[0];
        return firstSentence.length > 150 ? firstSentence.substring(0, 150) + "..." : firstSentence;
      }
    }
  } catch {
    // JSON parsing failed, fall through
  }

  // Common error patterns
  if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.includes("quota")) {
    return "Gemini API rate limit reached. Please wait a moment and try again.";
  }
  if (msg.includes("API_KEY_INVALID") || msg.includes("401") || msg.includes("PERMISSION_DENIED")) {
    return "Invalid Gemini API key. Please check your key in settings.";
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
    return "Network error. Please check your internet connection.";
  }

  // Truncate overly long messages
  return msg.length > 200 ? msg.substring(0, 200) + "..." : msg;
}

export const geminiService = new GeminiService();
