import { Github } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-[#0a0a1a] border-t border-[#1e2035] relative overflow-hidden" role="contentinfo" aria-label="Typesense UI footer">
      {/* Neon Gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8d30ff] to-transparent opacity-50" aria-hidden="true" />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* SEO-rich footer content with internal links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#0cdcf7] to-[#8d30ff] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(12,220,247,0.3)]" aria-hidden="true">
                T
              </div>
              <span className="font-heading font-bold text-white text-lg tracking-wide">Typesense UI</span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#12141f] text-[var(--landing-text-secondary)] border border-[#1e2035]">
                Open Source
              </span>
            </div>
            <p className="text-[var(--landing-text-muted)] text-sm leading-relaxed">
              The <strong className="text-[var(--landing-text-secondary)]">open-source Typesense dashboard</strong> for developers. 
              Manage search collections, explore documents, and query your data with AI — all from a beautiful visual interface.
            </p>
          </div>

          {/* Quick Links - SEO internal linking */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-[var(--landing-text-muted)]">
              <li>
                <Link to="/app" className="hover:text-white transition-colors">
                  Launch Dashboard
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features Overview
                </a>
              </li>
              <li>
                <a href="#ai" className="hover:text-white transition-colors">
                  AI-Powered Search
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Resources - External links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-[var(--landing-text-muted)]">
              <li>
                <a href="https://github.com/Mothilal-M/typesense-ui" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                  <Github size={14} aria-hidden="true" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="https://www.npmjs.com/package/typesense-ui" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  npm Package
                </a>
              </li>
              <li>
                <a href="https://typesense.org/docs/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Typesense Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/Mothilal-M/typesense-ui/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Report an Issue
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1e2035] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--landing-text-muted)]">
          <p>© {new Date().getFullYear()} Typesense UI. Released under the MIT License.</p>
          <p>Built with React, Typesense, and Gemini AI.</p>
        </div>
      </div>
    </footer>
  );
}
