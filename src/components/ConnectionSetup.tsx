import React, { useState, useRef, useCallback, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import type { TypesenseConfig } from "../types";
import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";
import { Logo } from "./ui/Logo";
import { useToast } from "../hooks/useToast";
import { fireStars } from "../lib/confetti";

export function ConnectionSetup() {
  const { setConfig, theme, toggleTheme } = useApp();
  const { addToast } = useToast();
  const [formData, setFormData] = useState<TypesenseConfig>({
    apiKey: "",
    host: "localhost",
    port: 8108,
    protocol: "http",
    connectionTimeoutSeconds: 5,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setError(null);

    try {
      await setConfig(formData);
      addToast("success", "Connected to Typesense successfully!");
      fireStars();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      addToast("error", err instanceof Error ? err.message : "Failed to connect to Typesense");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleChange = (field: keyof TypesenseConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 z-20 border border-gray-200/50 dark:border-slate-700/50"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon className="w-5 h-5 text-gray-700 transition-transform duration-300" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400 transition-transform duration-300 animate-spin-slow" />
        )}
      </button>

      {/* ====== LEFT PANEL — Hero / Brand / Visual ====== */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[50%] relative items-center justify-center p-10 xl:p-16">
        {/* 3D background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "1000px" }}>
          {/* Gradient blobs */}
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-blue-500/20 dark:bg-blue-500/8 rounded-full blur-[80px] animate-blob-1" />
          <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-purple-500/20 dark:bg-purple-500/8 rounded-full blur-[80px] animate-blob-2" />
          <div className="absolute top-[50%] left-[40%] w-[300px] h-[300px] bg-pink-400/15 dark:bg-pink-500/5 rounded-full blur-[80px] animate-blob-3" />

          {/* 3D grid floor */}
          <div
            className="absolute left-[-30%] right-[-30%] bottom-[-30%] h-[70vh] opacity-40 dark:opacity-20"
            style={{
              transform: "rotateX(65deg) translateZ(-80px)",
              background: `
                linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px),
                linear-gradient(0deg, rgba(99,102,241,0.12) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
              maskImage: "radial-gradient(ellipse at center, black 20%, transparent 60%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 60%)",
            }}
          />

          {/* Floating shapes */}
          <div
            className="absolute top-[15%] right-[15%] w-12 h-12 border-2 border-blue-400/20 dark:border-blue-400/10 rounded-lg"
            style={{ animation: "float3d1 8s ease-in-out infinite" }}
          />
          <div
            className="absolute bottom-[25%] left-[12%] w-10 h-10 border-2 border-purple-400/20 dark:border-purple-400/10 rounded-full"
            style={{ animation: "float3d2 10s ease-in-out infinite" }}
          />
          <div
            className="absolute top-[60%] right-[25%] w-6 h-6 bg-gradient-to-br from-pink-400/15 to-purple-400/15 dark:from-pink-400/8 dark:to-purple-400/8"
            style={{ animation: "float3d1 9s ease-in-out infinite reverse", transform: "rotate(45deg)" }}
          />
        </div>

        {/* Left content */}
        <div
          className="relative z-10 max-w-lg"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0) translateZ(0)" : "translateX(-40px) translateZ(-60px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <Logo size={48} />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Typesense UI
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-extrabold text-gray-900 dark:text-white leading-[1.15] mb-5">
            Your Search Engine,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Visualized
            </span>
          </h1>

          <p className="text-base xl:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8 font-medium">
            Connect to any Typesense server and instantly browse collections,
            search documents, and manage your data — all from a beautiful interface.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 mb-8">
            {[
              { icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z", text: "Real-time search with typo tolerance", color: "from-blue-500 to-cyan-500" },
              { icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z", text: "Visual collection & document management", color: "from-purple-500 to-pink-500" },
              { icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z", text: "Credentials stay in your browser", color: "from-emerald-500 to-cyan-500" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center space-x-3"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateX(0)" : "translateX(-20px)",
                  transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + i * 0.15}s`,
                }}
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>

          {/* 3D floating dashboard preview card */}
          <DashboardPreview3D mounted={mounted} />

          {/* Back to landing link */}
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-6 font-medium"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "all 0.6s ease 1s",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* ====== RIGHT PANEL — Connection Form ====== */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-10">
        <div
          className="w-full max-w-md relative z-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) translateZ(0)" : "translateY(30px) translateZ(-40px)",
            transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
          }}
        >
          {/* Mobile-only header (hidden on lg+) */}
          <div className="text-center mb-8 lg:hidden">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white mb-4 shadow-2xl animate-float"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 tracking-tight">
              Typesense UI
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
              Connect to your server to get started
            </p>
          </div>

          {/* Desktop heading above form */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">
              Connect to Server
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Enter your Typesense server details below
            </p>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-6 sm:p-7 space-y-5"
          >
            {error && (
              <div
                className="p-3.5 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 border border-red-300 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-sm animate-fade-in shadow-md"
              >
                <div className="flex items-start space-x-2">
                  <svg className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* API Key */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                API Key <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => handleChange("apiKey", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm font-medium"
                  required
                  placeholder="Enter your API key"
                />
              </div>
            </div>

            {/* Host */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Host / URL <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => handleChange("host", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm font-medium"
                  required
                  placeholder="e.g., localhost or example.com"
                />
              </div>
            </div>

            {/* Port + Protocol row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Port <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleChange("port", parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm font-medium"
                  required
                  min="1"
                  max="65535"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Protocol <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.protocol}
                  onChange={(e) => handleChange("protocol", e.target.value as "http" | "https")}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm font-medium"
                  required
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Timeout (seconds) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.connectionTimeoutSeconds}
                onChange={(e) => handleChange("connectionTimeoutSeconds", parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm font-medium"
                required
                min="1"
                max="60"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg text-sm tracking-tight"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2.5 h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Connect to Typesense</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer text */}
          <div className="flex items-center justify-center space-x-1.5 mt-5">
            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
              Connection details stored securely in your browser
            </p>
          </div>

          {/* Mobile back link */}
          <div className="lg:hidden text-center mt-4">
            <Link
              to="/"
              className="inline-flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 3D floating dashboard mockup card for the left panel */
function DashboardPreview3D({ mounted }: { mounted: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    el.style.transform = `perspective(800px) rotateY(${dx * 8}deg) rotateX(${-dy * 6}deg) translateZ(10px)`;
  }, []);

  const handleLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative cursor-default"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease-out, opacity 0.8s ease 0.6s",
        opacity: mounted ? 1 : 0,
      }}
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-pink-500/15 rounded-2xl blur-2xl scale-105" style={{ transform: "translateZ(-20px)" }} />

      {/* Card */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-4 overflow-hidden" style={{ transform: "translateZ(10px)" }}>
        {/* Mini dashboard mockup */}
        <div className="flex gap-2">
          {/* Sidebar mini */}
          <div className="w-20 space-y-1.5 flex-shrink-0">
            <div className="h-2 w-14 rounded bg-gradient-to-r from-blue-400/30 to-purple-400/30" />
            <div className="h-6 w-full rounded-md bg-blue-500/10 border border-blue-400/20" />
            <div className="h-6 w-full rounded-md bg-gray-100 dark:bg-slate-800" />
            <div className="h-6 w-full rounded-md bg-gray-100 dark:bg-slate-800" />
          </div>
          {/* Content mini */}
          <div className="flex-1 space-y-1.5">
            <div className="h-6 w-full rounded-md bg-gray-100 dark:bg-slate-800 flex items-center px-2">
              <div className="w-3 h-3 rounded-full border border-gray-300 dark:border-slate-600" />
              <div className="ml-1.5 h-1.5 w-16 rounded bg-gray-300/50 dark:bg-slate-600/50" />
            </div>
            <div className="h-3 w-full rounded bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-900/20 dark:to-purple-900/20" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 w-full rounded bg-gray-50 dark:bg-slate-800/50 flex items-center px-2 gap-2">
                <div className="h-1.5 w-12 rounded bg-gray-200/70 dark:bg-slate-700/70" />
                <div className="h-1.5 w-16 rounded bg-gray-200/50 dark:bg-slate-700/50" />
                <div className="h-1.5 w-8 rounded bg-gray-200/30 dark:bg-slate-700/30 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div
        className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg"
        style={{ transform: "translateZ(30px)" }}
      >
        LIVE
      </div>
    </div>
  );
}
