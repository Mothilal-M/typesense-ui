import { SchemaType } from "@google/generative-ai";
import type { FunctionDeclaration } from "@google/generative-ai";
import { typesenseService } from "./typesense";

export const WRITE_TOOLS = new Set([
  "create_document",
  "update_document",
  "delete_document",
]);

export const typesenseToolDeclarations: FunctionDeclaration[] = [
  {
    name: "list_collections",
    description:
      "List all Typesense collections with their schemas, field definitions, and document counts.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_collection_schema",
    description:
      "Get the full schema of a specific collection including all field names, types, and settings.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        collection_name: {
          type: SchemaType.STRING,
          description: "The name of the collection.",
        },
      },
      required: ["collection_name"],
    },
  },
  {
    name: "search_documents",
    description:
      'Search documents in a collection with full-text search, filters, sorting, and pagination. Use q="*" to match all documents. Use filter_by for exact matching (e.g., "status:=active"). Use sort_by for ordering (e.g., "created_at:desc").',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        collection_name: {
          type: SchemaType.STRING,
          description: "The collection to search in.",
        },
        q: {
          type: SchemaType.STRING,
          description: 'Search query. Use "*" to match all documents.',
        },
        query_by: {
          type: SchemaType.STRING,
          description:
            "Comma-separated list of fields to search in (must be string or string[] fields).",
        },
        filter_by: {
          type: SchemaType.STRING,
          description:
            'Optional Typesense filter expression. Examples: "status:=active", "price:>100", "category:=[Electronics,Books]".',
        },
        sort_by: {
          type: SchemaType.STRING,
          description:
            'Optional sort expression like "field_name:desc" or "field_name:asc".',
        },
        page: {
          type: SchemaType.NUMBER,
          description: "Page number (1-based). Default: 1.",
        },
        per_page: {
          type: SchemaType.NUMBER,
          description: "Results per page (max 250). Default: 25.",
        },
      },
      required: ["collection_name", "q", "query_by"],
    },
  },
  {
    name: "get_document",
    description: "Retrieve a single document by its ID from a collection.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        collection_name: {
          type: SchemaType.STRING,
          description: "The collection name.",
        },
        document_id: {
          type: SchemaType.STRING,
          description: "The document ID to retrieve.",
        },
      },
      required: ["collection_name", "document_id"],
    },
  },
  {
    name: "count_documents",
    description:
      "Count the total number of documents in a collection, optionally with a filter.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        collection_name: {
          type: SchemaType.STRING,
          description: "The collection to count documents in.",
        },
        filter_by: {
          type: SchemaType.STRING,
          description:
            "Optional Typesense filter expression to count only matching documents.",
        },
      },
      required: ["collection_name"],
    },
  },
  {
    name: "create_document",
    description: "Create a new document in a collection.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        collection_name: {
          type: SchemaType.STRING,
          description: "The collection to create the document in.",
        },
        document: {
          type: SchemaType.STRING,
          description:
            "The document to create as a JSON string. Must match the collection schema.",
        },
      },
      required: ["collection_name", "document"],
    },
  },
  {
    name: "update_document",
    description: "Update an existing document in a collection.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        collection_name: {
          type: SchemaType.STRING,
          description: "The collection name.",
        },
        document_id: {
          type: SchemaType.STRING,
          description: "The ID of the document to update.",
        },
        document: {
          type: SchemaType.STRING,
          description: "The partial document with fields to update as a JSON string.",
        },
      },
      required: ["collection_name", "document_id", "document"],
    },
  },
  {
    name: "delete_document",
    description: "Delete a document from a collection by its ID.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        collection_name: {
          type: SchemaType.STRING,
          description: "The collection name.",
        },
        document_id: {
          type: SchemaType.STRING,
          description: "The ID of the document to delete.",
        },
      },
      required: ["collection_name", "document_id"],
    },
  },
];

/**
 * Detects if a value is a vector/embedding field (large numeric array).
 * These fields are stripped before sending to Gemini to avoid token limit issues.
 */
function isEmbeddingValue(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 10 &&
    typeof value[0] === "number"
  );
}

/**
 * Strips embedding/vector fields from a document to keep payloads small.
 * Embeddings are large float arrays that are meaningless to the AI and blow
 * past Gemini's token limit.
 */
function stripEmbeddingFields(doc: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (isEmbeddingValue(value)) {
      // Replace with a placeholder so the AI knows the field exists
      cleaned[key] = `[embedding: ${(value as number[]).length} dimensions]`;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function executeFunctionCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "list_collections":
      return await typesenseService.getCollections();

    case "get_collection_schema":
      return await typesenseService.getCollection(args.collection_name as string);

    case "search_documents": {
      const response = await typesenseService.searchDocuments(
        args.collection_name as string,
        {
          q: (args.q as string) || "*",
          query_by: args.query_by as string,
          filter_by: args.filter_by as string | undefined,
          sort_by: args.sort_by as string | undefined,
          page: (args.page as number) || 1,
          per_page: (args.per_page as number) || 25,
        }
      );
      return {
        found: response.found,
        page: response.page,
        search_time_ms: response.search_time_ms,
        documents: response.hits.map((h) =>
          stripEmbeddingFields(h.document as Record<string, unknown>)
        ),
      };
    }

    case "get_document": {
      const doc = await typesenseService.getDocument(
        args.collection_name as string,
        args.document_id as string
      );
      return stripEmbeddingFields(doc as Record<string, unknown>);
    }

    case "count_documents": {
      const col = await typesenseService.getCollection(
        args.collection_name as string
      );
      const queryBy = col.fields
        .filter((f) =>
          ["string", "string[]"].includes(f.type) && f.index !== false
        )
        .map((f) => f.name)
        .join(",");

      const response = await typesenseService.searchDocuments(
        args.collection_name as string,
        {
          q: "*",
          query_by: queryBy || col.fields[0]?.name || "id",
          filter_by: args.filter_by as string | undefined,
          per_page: 0,
        }
      );
      return {
        count: response.found,
        collection: args.collection_name,
      };
    }

    case "create_document": {
      const doc =
        typeof args.document === "string"
          ? JSON.parse(args.document as string)
          : args.document;
      return await typesenseService.createDocument(
        args.collection_name as string,
        doc
      );
    }

    case "update_document": {
      const updates =
        typeof args.document === "string"
          ? JSON.parse(args.document as string)
          : args.document;
      return await typesenseService.updateDocument(
        args.collection_name as string,
        args.document_id as string,
        updates
      );
    }

    case "delete_document":
      await typesenseService.deleteDocument(
        args.collection_name as string,
        args.document_id as string
      );
      return { success: true, deleted: args.document_id };

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}
