export function FilterIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="filter-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      {/* Funnel shape */}
      <path
        d="M8 12L28 34V50L36 54V34L56 12H8Z"
        fill="url(#filter-grad)"
        fillOpacity="0.12"
        stroke="url(#filter-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Horizontal filter lines with dots */}
      <line x1="14" y1="18" x2="50" y2="18" stroke="url(#filter-grad)" strokeWidth="1.5" strokeOpacity="0.3" />
      <circle cx="30" cy="18" r="3" fill="url(#filter-grad)" fillOpacity="0.7" />
      <line x1="20" y1="25" x2="44" y2="25" stroke="url(#filter-grad)" strokeWidth="1.5" strokeOpacity="0.3" />
      <circle cx="38" cy="25" r="3" fill="url(#filter-grad)" fillOpacity="0.6" />
      <line x1="26" y1="32" x2="38" y2="32" stroke="url(#filter-grad)" strokeWidth="1.5" strokeOpacity="0.3" />
      <circle cx="32" cy="32" r="2.5" fill="url(#filter-grad)" fillOpacity="0.5" />
    </svg>
  );
}
