import { useState, useEffect } from "react";
import { typesenseService } from "../services/typesense";
import type {
  CollectionSchema,
  Document,
  SearchResponse,
  FilterValue,
} from "../types";

export function useCollectionDocuments(selectedCollection: string | null) {
  const [collection, setCollection] = useState<CollectionSchema | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("*");
  const [filters, setFilters] = useState<FilterValue>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(25);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (selectedCollection) {
      loadCollection();
    } else {
      setCollection(null);
      setDocuments([]);
    }
  }, [selectedCollection]);

  useEffect(() => {
    if (collection) {
      performSearch();
    }
  }, [collection, searchQuery, filters, currentPage, sortBy, sortOrder]);

  const loadCollection = async () => {
    if (!selectedCollection) return;

    setIsLoading(true);
    setError(null);
    try {
      const col = await typesenseService.getCollection(selectedCollection);
      setCollection(col);
      setFilters({});
      setSearchQuery("*");
      setCurrentPage(1);
      setSortBy(col.default_sorting_field || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load collection"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    if (!collection) return;

    setIsLoading(true);
    setError(null);
    try {
      const queryBy =
        collection.fields
          .filter(
            (f) =>
              ["string", "string[]"].includes(f.type) && f.index !== false
          )
          .map((f) => f.name)
          .join(",") ||
        collection.fields.filter((f) => f.index !== false)[0]?.name ||
        "*";

      const filterBy = buildFilterString();
      const sort = sortBy ? `${sortBy}:${sortOrder}` : undefined;

      const response = await typesenseService.searchDocuments(collection.name, {
        q: searchQuery || "*",
        query_by: queryBy,
        filter_by: filterBy,
        sort_by: sort,
        page: currentPage,
        per_page: perPage,
      });

      setSearchResponse(response);
      setDocuments(response.hits.map((hit) => hit.document));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search documents"
      );
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildFilterString = (): string | undefined => {
    const filterParts: string[] = [];

    Object.entries(filters).forEach(([field, value]) => {
      if (value === null || value === undefined || value === "") return;

      const fieldSchema = collection?.fields.find((f) => f.name === field);
      if (!fieldSchema) return;
      if (fieldSchema.index === false) return;

      if (fieldSchema.type === "string" || fieldSchema.type === "string[]") {
        filterParts.push(`${field}:=${value}`);
      } else if (
        fieldSchema.type.includes("int") ||
        fieldSchema.type.includes("float")
      ) {
        if (typeof value === "object" && value !== null) {
          const { min, max } = value;
          if (min !== undefined && max !== undefined) {
            filterParts.push(`${field}:[${min}..${max}]`);
          } else if (min !== undefined) {
            filterParts.push(`${field}:>=${min}`);
          } else if (max !== undefined) {
            filterParts.push(`${field}:<=${max}`);
          }
        } else {
          filterParts.push(`${field}:=${value}`);
        }
      } else if (fieldSchema.type === "bool") {
        filterParts.push(`${field}:=${value}`);
      }
    });

    return filterParts.length > 0 ? filterParts.join(" && ") : undefined;
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilter = (field: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
    setCurrentPage(1);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  return {
    collection,
    documents,
    searchResponse,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,
    clearFilter,
    currentPage,
    setCurrentPage,
    perPage,
    sortBy,
    toggleSort,
    sortOrder,
    refresh: performSearch,
  };
}
