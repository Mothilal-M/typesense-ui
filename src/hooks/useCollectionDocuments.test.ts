import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCollectionDocuments } from "./useCollectionDocuments";
import { typesenseService } from "../services/typesense";
import type { CollectionSchema, SearchResponse } from "../types";

// Mock typesenseService
vi.mock("../services/typesense", () => ({
  typesenseService: {
    getCollection: vi.fn(),
    searchDocuments: vi.fn(),
  },
}));

describe("useCollectionDocuments", () => {
  const mockCollection: CollectionSchema = {
    name: "test_collection",
    num_documents: 10,
    fields: [
      { name: "title", type: "string", facet: false, optional: false, index: true },
      { name: "count", type: "int32", facet: false, optional: false, index: true },
      { name: "is_active", type: "bool", facet: false, optional: false, index: true },
    ],
    created_at: 1234567890,
    default_sorting_field: "count",
  };

  const mockSearchResponse: SearchResponse = {
    found: 10,
    out_of: 10,
    page: 1,
    request_params: { q: "*", query_by: "*" },
    search_time_ms: 10,
    hits: [
      {
        document: { id: "1", title: "Doc 1", count: 1, is_active: true },
        highlights: [],
        text_match: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useCollectionDocuments(null));

    expect(result.current.collection).toBeNull();
    expect(result.current.documents).toEqual([]);
    expect(result.current.searchQuery).toBe("*");
  });

  it("should load collection and perform initial search", async () => {
    vi.mocked(typesenseService.getCollection).mockResolvedValue(mockCollection);
    vi.mocked(typesenseService.searchDocuments).mockResolvedValue(
      mockSearchResponse
    );

    const { result } = renderHook(() =>
      useCollectionDocuments("test_collection")
    );

    await waitFor(() => {
      expect(result.current.collection).toEqual(mockCollection);
    });

    await waitFor(() => {
      expect(result.current.documents).toHaveLength(1);
    });

    expect(typesenseService.getCollection).toHaveBeenCalledWith(
      "test_collection"
    );
    expect(typesenseService.searchDocuments).toHaveBeenCalled();
  });

  it("should handle filter changes", async () => {
    vi.mocked(typesenseService.getCollection).mockResolvedValue(mockCollection);
    vi.mocked(typesenseService.searchDocuments).mockResolvedValue(
      mockSearchResponse
    );

    const { result } = renderHook(() =>
      useCollectionDocuments("test_collection")
    );

    await waitFor(() => {
      expect(result.current.collection).toEqual(mockCollection);
    });

    act(() => {
      result.current.handleFilterChange("title", "test");
    });

    expect(result.current.filters).toEqual({ title: "test" });
    expect(result.current.currentPage).toBe(1);
  });

  it("should handle sort toggling", async () => {
    vi.mocked(typesenseService.getCollection).mockResolvedValue(mockCollection);
    vi.mocked(typesenseService.searchDocuments).mockResolvedValue(
      mockSearchResponse
    );

    const { result } = renderHook(() =>
      useCollectionDocuments("test_collection")
    );

    await waitFor(() => {
        // Initial sort from collection default
        expect(result.current.sortBy).toBe("count");
    });

    act(() => {
      result.current.toggleSort("title");
    });

    expect(result.current.sortBy).toBe("title");
    expect(result.current.sortOrder).toBe("desc");

    act(() => {
      result.current.toggleSort("title");
    });

    expect(result.current.sortOrder).toBe("asc");
  });
});
