import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CollectionViewer } from "./CollectionViewer";
import { useApp } from "../context/AppContext";
import { useCollectionDocuments } from "../hooks/useCollectionDocuments";
import type { CollectionSchema, SearchResponse } from "../types";

// Mock hooks
vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

vi.mock("../hooks/useCollectionDocuments", () => ({
  useCollectionDocuments: vi.fn(),
}));

describe("CollectionViewer", () => {
  const mockCollection: CollectionSchema = {
    name: "test_collection",
    num_documents: 10,
    fields: [
      { name: "title", type: "string", facet: false, optional: false, index: true },
      { name: "count", type: "int32", facet: false, optional: false, index: true },
    ],
    created_at: 1234567890,
  };

  const mockHookReturn = {
    collection: mockCollection,
    documents: [
      { id: "1", title: "Doc 1", count: 10 },
      { id: "2", title: "Doc 2", count: 20 },
    ],
    searchResponse: { found: 10, search_time_ms: 5 } as SearchResponse,
    isLoading: false,
    error: null,
    searchQuery: "",
    setSearchQuery: vi.fn(),
    filters: {},
    handleFilterChange: vi.fn(),
    clearFilter: vi.fn(),
    currentPage: 1,
    setCurrentPage: vi.fn(),
    perPage: 25,
    sortBy: "count",
    toggleSort: vi.fn(),
    sortOrder: "desc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue({
      selectedCollection: "test_collection",
    } as any);
  });

  it("should render no collection selected state", () => {
    vi.mocked(useApp).mockReturnValue({
      selectedCollection: null,
    } as any);
    vi.mocked(useCollectionDocuments).mockReturnValue({
        ...mockHookReturn,
        collection: null,
    } as any);

    render(<CollectionViewer />);

    expect(screen.getByText("No Collection Selected")).toBeInTheDocument();
  });

  it("should render documents table", () => {
    vi.mocked(useCollectionDocuments).mockReturnValue(mockHookReturn as any);

    render(<CollectionViewer />);

    expect(screen.getByText("test_collection")).toBeInTheDocument();
    expect(screen.getByText("Doc 1")).toBeInTheDocument();
    expect(screen.getByText("Doc 2")).toBeInTheDocument();
  });

  it("should show JSON modal on eye click", () => {
    vi.mocked(useCollectionDocuments).mockReturnValue(mockHookReturn as any);

    render(<CollectionViewer />);

    const eyeButtons = screen.getAllByTitle("View JSON");
    fireEvent.click(eyeButtons[0]);

    expect(screen.getByText("Document JSON")).toBeInTheDocument();
    // Using a regex to find the JSON content
    expect(screen.getByText(/"title": "Doc 1"/)).toBeInTheDocument();
  });
});
