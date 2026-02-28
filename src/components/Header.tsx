import { LogOut, Menu, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ThemeToggle } from "./ui/ThemeToggle";
import { Logo } from "./ui/Logo";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const {
    config,
    disconnect,
    theme,
    toggleTheme,
  } = useApp();

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 shadow-lg">
      <div className="px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Hamburger menu — mobile only */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors md:hidden flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              )}
            </button>

            <div className="flex-shrink-0 transform transition-transform duration-300 hover:scale-110">
              <Logo size={44} className="hidden sm:block" />
              <Logo size={36} className="block sm:hidden" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                Typesense UI
              </h1>
              {config && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono font-medium truncate max-w-[140px] sm:max-w-none">
                  {config.protocol}://{config.host}:{config.port}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <ThemeToggle isDark={theme === "dark"} onToggle={toggleTheme} />

            <button
              onClick={disconnect}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/50 dark:hover:to-red-800/40 text-red-700 dark:text-red-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-red-200/50 dark:border-red-800/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-semibold tracking-tight">
                Disconnect
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
