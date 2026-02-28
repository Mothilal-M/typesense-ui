import { useState, useEffect } from "react";
import {
  Server,
  Plus,
  Trash2,
  Check,
  Edit3,
  Star,
  ChevronDown,
  Globe,
} from "lucide-react";
import type { TypesenseConfig } from "../types";
import { Modal } from "./ui/Modal";
import { useToast } from "../hooks/useToast";

export interface ServerProfile {
  id: string;
  name: string;
  color: string;
  config: TypesenseConfig;
  isDefault: boolean;
  createdAt: number;
}

const STORAGE_KEY = "typesense-profiles";

const PROFILE_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
];

// --- Storage helpers ---
export function loadProfiles(): ServerProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: ServerProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// --- Profile Manager Modal ---
interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: TypesenseConfig) => void;
  currentConfig: TypesenseConfig | null;
}

export function ProfileManager({
  isOpen,
  onClose,
  onConnect,
  currentConfig,
}: ProfileManagerProps) {
  const { addToast } = useToast();
  const [profiles, setProfiles] = useState<ServerProfile[]>([]);
  const [editing, setEditing] = useState<ServerProfile | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfiles(loadProfiles());
      setEditing(null);
      setShowForm(false);
    }
  }, [isOpen]);

  const handleSave = (profile: ServerProfile) => {
    let updated: ServerProfile[];
    if (profiles.some((p) => p.id === profile.id)) {
      updated = profiles.map((p) => (p.id === profile.id ? profile : p));
    } else {
      updated = [...profiles, profile];
    }
    // If marked default, unmark others
    if (profile.isDefault) {
      updated = updated.map((p) =>
        p.id === profile.id ? p : { ...p, isDefault: false }
      );
    }
    saveProfiles(updated);
    setProfiles(updated);
    setEditing(null);
    setShowForm(false);
    addToast("success", `Profile "${profile.name}" saved`);
  };

  const handleDelete = (id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    saveProfiles(updated);
    setProfiles(updated);
    addToast("info", "Profile deleted");
  };

  const handleConnect = (profile: ServerProfile) => {
    onConnect(profile.config);
    onClose();
  };

  const handleSaveCurrentAs = () => {
    if (!currentConfig) return;
    const profile: ServerProfile = {
      id: generateId(),
      name: `${currentConfig.host}:${currentConfig.port}`,
      color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
      config: currentConfig,
      isDefault: profiles.length === 0,
      createdAt: Date.now(),
    };
    setEditing(profile);
    setShowForm(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Server Profiles">
      <div className="min-w-[480px] space-y-4">
        {!showForm ? (
          <>
            {/* Profile List */}
            {profiles.length === 0 ? (
              <div className="text-center py-10">
                <Server className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No saved profiles yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Save server connections for quick switching
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {profiles.map((profile) => {
                  const isCurrent =
                    currentConfig &&
                    profile.config.host === currentConfig.host &&
                    profile.config.port === currentConfig.port &&
                    profile.config.apiKey === currentConfig.apiKey;

                  return (
                    <div
                      key={profile.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                        isCurrent
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/15"
                          : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: profile.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {profile.name}
                          </span>
                          {profile.isDefault && (
                            <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-current" />
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {profile.config.protocol}://{profile.config.host}:
                          {profile.config.port}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!isCurrent && (
                          <button
                            onClick={() => handleConnect(profile)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm hover:shadow-md transition-all"
                          >
                            Connect
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditing(profile);
                            setShowForm(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(profile.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200/50 dark:border-slate-700/50">
              <button
                onClick={() => {
                  setEditing({
                    id: generateId(),
                    name: "",
                    color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
                    config: {
                      apiKey: "",
                      host: "localhost",
                      port: 8108,
                      protocol: "http",
                      connectionTimeoutSeconds: 5,
                    },
                    isDefault: profiles.length === 0,
                    createdAt: Date.now(),
                  });
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Profile
              </button>
              {currentConfig && (
                <button
                  onClick={handleSaveCurrentAs}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Save Current Connection
                </button>
              )}
            </div>
          </>
        ) : (
          <ProfileForm
            profile={editing!}
            onSave={handleSave}
            onCancel={() => {
              setEditing(null);
              setShowForm(false);
            }}
          />
        )}
      </div>
    </Modal>
  );
}

// --- Profile Edit Form ---
function ProfileForm({
  profile,
  onSave,
  onCancel,
}: {
  profile: ServerProfile;
  onSave: (p: ServerProfile) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);
  const [apiKey, setApiKey] = useState(profile.config.apiKey);
  const [host, setHost] = useState(profile.config.host);
  const [port, setPort] = useState(profile.config.port);
  const [protocol, setProtocol] = useState(profile.config.protocol);
  const [timeout, setTimeout_] = useState(profile.config.connectionTimeoutSeconds);
  const [isDefault, setIsDefault] = useState(profile.isDefault);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      name: name.trim() || `${host}:${port}`,
      color,
      config: {
        apiKey,
        host,
        port,
        protocol,
        connectionTimeoutSeconds: timeout,
      },
      isDefault,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            Profile Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production, Staging"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            Color
          </label>
          <div className="flex gap-1.5">
            {PROFILE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-all ${
                  color === c ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            Host
          </label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="localhost"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            Port
          </label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Your Typesense API key"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            Protocol
          </label>
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as "http" | "https")}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            Timeout (s)
          </label>
          <input
            type="number"
            value={timeout}
            min={1}
            onChange={(e) => setTimeout_(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          Set as default profile
        </span>
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/15 transition-all"
        >
          Save Profile
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// --- Quick Switcher (for Header) ---
interface ProfileSwitcherProps {
  currentConfig: TypesenseConfig | null;
  onSwitch: (config: TypesenseConfig) => void;
  onManageProfiles: () => void;
}

export function ProfileSwitcher({
  currentConfig,
  onSwitch,
  onManageProfiles,
}: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);
  const profiles = loadProfiles();

  if (profiles.length === 0) return null;

  const currentProfile = currentConfig
    ? profiles.find(
        (p) =>
          p.config.host === currentConfig.host &&
          p.config.port === currentConfig.port &&
          p.config.apiKey === currentConfig.apiKey
      )
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-gray-600 dark:text-gray-300"
      >
        {currentProfile && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: currentProfile.color }}
          />
        )}
        <span className="max-w-[100px] truncate">
          {currentProfile?.name || "Server"}
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-fade-in">
            <div className="p-1.5 max-h-52 overflow-y-auto">
              {profiles.map((p) => {
                const isActive = currentProfile?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (!isActive) onSwitch(p.config);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {p.name}
                      </span>
                      <span className="block text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
                        {p.config.host}:{p.config.port}
                      </span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-gray-200/50 dark:border-slate-700/50 p-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  onManageProfiles();
                }}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-left transition-colors flex items-center gap-2"
              >
                <Server className="w-3.5 h-3.5" />
                Manage Profiles...
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
