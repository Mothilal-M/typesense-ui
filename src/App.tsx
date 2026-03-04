import { useState, lazy, Suspense, useCallback, useEffect, useMemo } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { ConnectionSetup } from "./components/ConnectionSetup";
import { Header } from "./components/Header";
import { CollectionsList } from "./components/CollectionsList";
import { CollectionViewer } from "./components/CollectionViewer";
import { ToastContainer } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AiChatButton } from "./components/ai/AiChatButton";
import { AiChatPanel } from "./components/ai/AiChatPanel";
import { CommandPalette, type CommandItem } from "./components/ui/CommandPalette";
import { ProfileManager } from "./components/ServerProfiles";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ApiKeysManager } from "./components/ApiKeysManager";
import { SearchAnalytics } from "./components/SearchAnalytics";
import { AiSchemaGenerator } from "./components/AiSchemaGenerator";
import { VisualPipelineBuilder } from "./components/VisualPipelineBuilder";
import { SchemaMigrationTool } from "./components/SchemaMigrationTool";
import { Collaboration } from "./components/Collaboration";
import { PluginSystem } from "./components/PluginSystem";
import { ServerStatus } from "./components/ServerStatus";
import {
  Key,
  BarChart3,
  Wand2,
  Workflow,
  GitCompare,
  Share2,
  Puzzle,
  Activity,
} from "lucide-react";

const LandingPage = lazy(() => import("./pages/LandingPage"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center animate-fade-in">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-pulse shadow-2xl" />
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}

type ActiveView = "server-status" | "analytics" | "api-keys" | "ai-schema" | "pipeline" | "migration" | "collaboration" | "plugins" | null;

function DashboardContent() {
  const { isConnected, config, setConfig, refreshCollections } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);

  // Full-page feature views
  const [activeView, setActiveView] = useState<ActiveView>(null);

  // Extra commands for the command palette
  const extraCommands = useMemo<CommandItem[]>(() => [
    { id: "api-keys", label: "API Keys Manager", description: "Create and manage scoped API keys", icon: <Key className="w-4 h-4" />, category: "action", action: () => { setActiveView("api-keys"); setCommandPaletteOpen(false); }, keywords: ["api", "keys", "auth", "token"] },
    { id: "analytics", label: "Search Analytics", description: "View search analytics dashboard", icon: <BarChart3 className="w-4 h-4" />, category: "action", action: () => { setActiveView("analytics"); setCommandPaletteOpen(false); }, keywords: ["analytics", "stats", "metrics", "dashboard"] },
    { id: "ai-schema", label: "AI Schema Generator", description: "Generate schemas from sample data using AI", icon: <Wand2 className="w-4 h-4" />, category: "action", action: () => { setActiveView("ai-schema"); setCommandPaletteOpen(false); }, keywords: ["ai", "schema", "generate", "create"] },
    { id: "pipeline", label: "Visual Pipeline Builder", description: "Build import/transform/search workflows", icon: <Workflow className="w-4 h-4" />, category: "action", action: () => { setActiveView("pipeline"); setCommandPaletteOpen(false); }, keywords: ["pipeline", "workflow", "import", "transform"] },
    { id: "migration", label: "Schema Migration Tool", description: "Compare and migrate schemas across servers", icon: <GitCompare className="w-4 h-4" />, category: "action", action: () => { setActiveView("migration"); setCommandPaletteOpen(false); }, keywords: ["migration", "schema", "diff", "compare", "remote"] },
    { id: "collaboration", label: "Collaboration", description: "Share links and view audit log", icon: <Share2 className="w-4 h-4" />, category: "action", action: () => { setActiveView("collaboration"); setCommandPaletteOpen(false); }, keywords: ["share", "collaborate", "audit", "link", "team"] },
    { id: "plugins", label: "Plugin System", description: "Manage and create custom plugins", icon: <Puzzle className="w-4 h-4" />, category: "action", action: () => { setActiveView("plugins"); setCommandPaletteOpen(false); }, keywords: ["plugin", "extension", "hook", "custom"] },
    { id: "server-status", label: "Server Status", description: "View server metrics, CPU, memory, disk usage", icon: <Activity className="w-4 h-4" />, category: "action", action: () => { setActiveView("server-status"); setCommandPaletteOpen(false); }, keywords: ["server", "status", "metrics", "cpu", "memory", "disk", "health", "monitor", "cache"] },
  ], []);

  // Keyboard shortcuts (only when connected)
  useKeyboardShortcuts({
    onSearch: useCallback(() => setCommandPaletteOpen(true), []),
    onNewDoc: useCallback(() => window.dispatchEvent(new Event("new-document")), []),
    onRefresh: useCallback(() => { refreshCollections(); }, [refreshCollections]),
    onToggleAI: useCallback(() => window.dispatchEvent(new Event("toggle-ai-chat")), []),
    onEscape: useCallback(() => {
      setCommandPaletteOpen(false);
      setSidebarOpen(false);
    }, []),
  });

  if (!isConnected) {
    return <ConnectionSetup />;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
        onManageProfiles={() => setProfileManagerOpen(true)}
        onServerStatus={() => setActiveView("server-status")}
      />
      {/* Full-page feature views replace sidebar+main when active */}
      {activeView ? (
        <div className="flex-1 overflow-hidden">
          {activeView === "server-status" && <ServerStatus onClose={() => setActiveView(null)} />}
          {activeView === "analytics" && <SearchAnalytics onClose={() => setActiveView(null)} />}
          {activeView === "api-keys" && <ApiKeysManager onClose={() => setActiveView(null)} />}
          {activeView === "ai-schema" && <AiSchemaGenerator onClose={() => setActiveView(null)} />}
          {activeView === "pipeline" && <VisualPipelineBuilder onClose={() => setActiveView(null)} />}
          {activeView === "migration" && <SchemaMigrationTool onClose={() => setActiveView(null)} />}
          {activeView === "collaboration" && <Collaboration onClose={() => setActiveView(null)} />}
          {activeView === "plugins" && <PluginSystem onClose={() => setActiveView(null)} />}
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden animate-fade-in"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`
              fixed inset-y-0 left-0 z-40 w-72 sm:w-80 border-r border-gray-200/50 dark:border-slate-700/50
              bg-white dark:bg-slate-900 shadow-xl
              transform transition-transform duration-300 ease-in-out
              md:relative md:translate-x-0 md:z-auto
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
            style={{ top: 0 }}
          >
            <div className="md:hidden absolute top-3 right-3 z-50">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CollectionsList onCollectionSelect={() => setSidebarOpen(false)} />
          </aside>

          <main className="flex-1 overflow-hidden">
            <CollectionViewer />
          </main>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        extraCommands={extraCommands}
      />

      {/* Profile Manager */}
      <ProfileManager
        isOpen={profileManagerOpen}
        onClose={() => setProfileManagerOpen(false)}
        onConnect={setConfig}
        currentConfig={config}
      />
    </div>
  );
}

function AiChat() {
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  // Listen for toggle-ai-chat event from keyboard shortcut
  useEffect(() => {
    const handler = () => setChatOpen((v) => !v);
    window.addEventListener("toggle-ai-chat", handler);
    return () => window.removeEventListener("toggle-ai-chat", handler);
  }, []);

  // Hide the chat button on the landing page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <>
      <AiChatButton isOpen={chatOpen} onClick={() => setChatOpen(!chatOpen)} />
      <AiChatPanel isOpen={chatOpen} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<DashboardContent />} />
          </Routes>
        </Suspense>
        <AiChat />
        <ToastContainer />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
