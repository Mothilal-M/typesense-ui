import { useState } from "react";
import { Database, Trash2, Eye, Search, X, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { typesenseService } from "../services/typesense";
import { CollectionCreator } from "./CollectionCreator";
import { useToast } from "../hooks/useToast";
import { Tooltip } from "./ui/Tooltip";

interface CollectionsListProps {
  onCollectionSelect?: () => void;
}

export function CollectionsList({ onCollectionSelect }: CollectionsListProps) {
  const {
    collections,
    selectedCollection,
    setSelectedCollection,
    refreshCollections,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingCollection, setDeletingCollection] = useState<string | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addToast } = useToast();

  const filteredCollections = collections.filter((col) =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (collectionName: string) => {
    setDeletingCollection(collectionName);
    try {
      await typesenseService.deleteCollection(collectionName);
      await refreshCollections();
      if (selectedCollection === collectionName) {
        setSelectedCollection(null);
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
      addToast(
        "error",
        "Failed to delete collection: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setDeletingCollection(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleCollectionCreated = async () => {
    await refreshCollections();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white/50 to-gray-50/50 dark:from-slate-900/50 dark:to-slate-950/50">
      <div className="p-5 border-b border-gray-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            Collections ({collections.length})
          </h2>
          <Tooltip content="Create new collection" side="bottom">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 backdrop-blur-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm font-medium transition-all duration-300 shadow-sm focus:shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 hover:scale-110"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredCollections.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 mb-4">
              <Database className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-300 font-semibold">
              {searchQuery
                ? "No collections found"
                : "No collections available"}
            </p>
          </div>
        ) : (
          filteredCollections.map((collection, index) => (
            <div
              key={collection.name}
              className={`card p-5 cursor-pointer transition-all duration-300 animate-fade-in ${
                selectedCollection === collection.name
                  ? "ring-2 ring-blue-500 dark:ring-purple-400 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl"
                  : "hover:shadow-xl"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex-1"
                  onClick={() => {
                    setSelectedCollection(collection.name);
                    onCollectionSelect?.();
                  }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedCollection === collection.name
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"
                          : "bg-gray-400 dark:bg-gray-600"
                      }`}
                    ></div>
                    <Tooltip content={collection.name} side="right">
                      <h3 className="font-bold text-gray-900 dark:text-gray-50 tracking-tight truncate max-w-[140px]">
                        {collection.name}
                      </h3>
                    </Tooltip>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {collection.num_documents.toLocaleString()}{" "}
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        docs
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      • {collection.fields.length} fields
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {showDeleteConfirm === collection.name ? (
                    <div className="flex items-center space-x-1 animate-fade-in">
                      <button
                        onClick={() => handleDelete(collection.name)}
                        disabled={deletingCollection === collection.name}
                        className="px-3 py-1.5 text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-300 disabled:opacity-50 shadow-md font-semibold tracking-tight"
                      >
                        {deletingCollection === collection.name
                          ? "Deleting..."
                          : "Confirm"}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-800 dark:to-slate-700 hover:from-gray-300 hover:to-gray-400 dark:hover:from-slate-700 dark:hover:to-slate-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-300 shadow-md font-semibold tracking-tight"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <Tooltip content="View documents" side="top">
                        <button
                          onClick={() => {
                            setSelectedCollection(collection.name);
                            onCollectionSelect?.();
                          }}
                          className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 transition-all duration-300 group"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete collection" side="top">
                        <button
                          onClick={() => setShowDeleteConfirm(collection.name)}
                          className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-950/30 dark:hover:to-red-900/30 transition-all duration-300 group"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>

              {selectedCollection === collection.name && (
                <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-slate-700/50 animate-fade-in">
                  <div className="flex flex-wrap gap-2">
                    {collection.fields.slice(0, 5).map((field, idx) => (
                      <span
                        key={field.name}
                        className="px-2.5 py-1 text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-300 rounded-lg font-semibold border border-blue-200/50 dark:border-blue-800/50 shadow-sm animate-slide-in-right tracking-tight"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {field.name}
                      </span>
                    ))}
                    {collection.fields.length > 5 && (
                      <span className="px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                        +{collection.fields.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Collection Modal */}
      <CollectionCreator
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCollectionCreated}
      />
    </div>
  );
}
