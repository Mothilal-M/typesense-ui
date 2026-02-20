import { AppProvider, useApp } from "./context/AppContext";
import { ConnectionSetup } from "./components/ConnectionSetup";
import { Header } from "./components/Header";
import { CollectionsList } from "./components/CollectionsList";
import { CollectionViewer } from "./components/CollectionViewer";
import { ToastContainer } from "./components/ui/Toast";

function AppContent() {
  const { isConnected } = useApp();

  if (!isConnected) {
    return <ConnectionSetup />;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden shadow-xl">
          <CollectionsList />
        </aside>
        <main className="flex-1 overflow-hidden">
          <CollectionViewer />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
      <ToastContainer />
    </AppProvider>
  );
}

export default App;
