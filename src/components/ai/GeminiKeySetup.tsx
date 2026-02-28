import { useState } from "react";
import { Key, ExternalLink, Check } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../hooks/useToast";
import { fireConfetti } from "../../lib/confetti";

export function GeminiKeySetup() {
  const { setGeminiApiKey } = useApp();
  const { addToast } = useToast();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!key.trim()) {
      setError("Please enter a valid API key");
      return;
    }
    setGeminiApiKey(key.trim());
    setSaved(true);
    addToast("success", "Gemini API key saved — AI chat is ready!");
    fireConfetti();
    // Reset the saved state after animation
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 animate-fade-in">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-3">
          <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
          Set up Gemini AI
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Enter your Google Gemini API key to enable AI-powered queries
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError(null);
          }}
          placeholder="AIza..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-medium"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
            saved
              ? "bg-emerald-500 shadow-lg shadow-emerald-500/25"
              : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-xl"
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Connected!
            </>
          ) : (
            "Save API Key"
          )}
        </button>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <span>Get a free API key</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
