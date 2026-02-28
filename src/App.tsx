import { useState, lazy, Suspense, useCallback, useEffect } from "react";
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
import { CommandPalette } from "./components/ui/CommandPalette";
import { ProfileManager } from "./components/ServerProfiles";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

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

function DashboardContent() {
  const { isConnected, config, setConfig, refreshCollections } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);

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
      />
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

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
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
