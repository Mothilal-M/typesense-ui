export function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="search-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {/* Magnifying glass */}
      <circle cx="28" cy="28" r="14" stroke="url(#search-grad)" strokeWidth="3" fill="url(#search-grad)" fillOpacity="0.1" />
      <line x1="38" y1="38" x2="52" y2="52" stroke="url(#search-grad)" strokeWidth="3.5" strokeLinecap="round" />
      {/* Search result lines inside */}
      <rect x="20" y="22" width="16" height="2.5" rx="1.25" fill="url(#search-grad)" fillOpacity="0.6" />
      <rect x="20" y="27" width="12" height="2.5" rx="1.25" fill="url(#search-grad)" fillOpacity="0.4" />
      <rect x="20" y="32" width="14" height="2.5" rx="1.25" fill="url(#search-grad)" fillOpacity="0.3" />
      {/* Sparkle */}
      <circle cx="48" cy="14" r="2" fill="url(#search-grad)" fillOpacity="0.6" />
      <line x1="48" y1="10" x2="48" y2="18" stroke="url(#search-grad)" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="44" y1="14" x2="52" y2="14" stroke="url(#search-grad)" strokeWidth="1" strokeOpacity="0.4" />
    </svg>
  );
}
