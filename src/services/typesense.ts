import Typesense from "typesense";
import type { Client } from "typesense";
import type {
  TypesenseConfig,
  CollectionSchema,
  Document,
  SearchParams,
  SearchResponse,
} from "../types";

class TypesenseService {
  private client: Client | null = null;
  private config: TypesenseConfig | null = null;

  initialize(config: TypesenseConfig) {
    this.config = config;
    this.client = new Typesense.Client({
      nodes: [
        {
          host: config.host,
          port: config.port,
          protocol: config.protocol,
        },
      ],
      apiKey: config.apiKey,
      connectionTimeoutSeconds: config.connectionTimeoutSeconds,
    });
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  getConfig(): TypesenseConfig | null {
    return this.config;
  }

  disconnect() {
    this.client = null;
    this.config = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      await this.client.collections().retrieve();
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      throw error;
    }
  }

  async getCollections(): Promise<CollectionSchema[]> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      const response = await this.client.collections().retrieve();
      return response as CollectionSchema[];
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  }

  async getCollection(name: string): Promise<CollectionSchema> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      const response = await this.client.collections(name).retrieve();
      return response as CollectionSchema;
    } catch (error) {
      console.error("Error fetching collection:", error);
      throw error;
    }
  }

  async deleteCollection(name: string): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      await this.client.collections(name).delete();
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw error;
    }
  }

  async searchDocuments(
    collectionName: string,
    params: SearchParams
  ): Promise<SearchResponse> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      const searchParams = {
        q: params.q || "*",
        query_by: params.query_by,
        filter_by: params.filter_by,
        sort_by: params.sort_by,
        page: params.page || 1,
        per_page: params.per_page || 25,
      };

      // Remove undefined values
      Object.keys(searchParams).forEach((key) => {
        if (searchParams[key as keyof typeof searchParams] === undefined) {
          delete searchParams[key as keyof typeof searchParams];
        }
      });

      const response = await this.client
        .collections(collectionName)
        .documents()
        .search(searchParams);

      return response as SearchResponse;
    } catch (error) {
      console.error("Error searching documents:", error);
      throw error;
    }
  }

  async getDocument(
    collectionName: string,
    documentId: string
  ): Promise<Document> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      const response = await this.client
        .collections(collectionName)
        .documents(documentId)
        .retrieve();
      return response as Document;
    } catch (error) {
      console.error("Error fetching document:", error);
      throw error;
    }
  }

  async deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      await this.client
        .collections(collectionName)
        .documents(documentId)
        .delete();
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  async createDocument(
    collectionName: string,
    document: Document
  ): Promise<Document> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      const response = await this.client
        .collections(collectionName)
        .documents()
        .create(document);
      return response as Document;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  async updateDocument(
    collectionName: string,
    documentId: string,
    document: Partial<Document>
  ): Promise<Document> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      const response = await this.client
        .collections(collectionName)
        .documents(documentId)
        .update(document);
      return response as Document;
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  }

  async importDocuments(
    collectionName: string,
    documents: Document[],
    action: "create" | "upsert" | "update" = "create"
  ): Promise<any[]> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      const response = await this.client
        .collections(collectionName)
        .documents()
        .import(documents, { action });
      return response;
    } catch (error) {
      console.error("Error importing documents:", error);
      throw error;
    }
  }

  async exportDocuments(collectionName: string): Promise<string> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    try {
      const response = await this.client
        .collections(collectionName)
        .documents()
        .export();
      return response as unknown as string;
    } catch (error) {
      console.error("Error exporting documents:", error);
      throw error;
    }
  }
}

export const typesenseService = new TypesenseService();
