import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0a0a1a] border-t border-[#1e2035] relative overflow-hidden">
      {/* Neon Gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8d30ff] to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#0cdcf7] to-[#8d30ff] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(12,220,247,0.3)]">
              T
            </div>
            <span className="font-heading font-bold text-white text-lg tracking-wide">Typesense UI</span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#12141f] text-[var(--landing-text-secondary)] border border-[#1e2035]">
              Open Source
            </span>
          </div>

          <div className="flex items-center gap-8 text-[var(--landing-text-secondary)] text-sm">
            <a href="https://github.com/Mothilal-M/typesense-ui" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
              <Github size={16} />
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/typesense-ui" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H3.334v-4h3.332v4zm8.668 0h-3.334v-4h3.334v4zm0-5.332H12v6.664h3.334v-1.332h2V8.666h-2z"/></svg>
              npm
            </a>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-[#1e2035] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--landing-text-muted)]">
          <p>© {new Date().getFullYear()} Typesense UI. Released under the MIT License.</p>
          <p>Built with React, Typesense, and Gemini AI. 🚀</p>
        </div>
      </div>
    </footer>
  );
}
