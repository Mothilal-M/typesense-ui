export function DocumentIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="doc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {/* Document body */}
      <rect x="12" y="6" width="32" height="42" rx="4" fill="url(#doc-grad)" fillOpacity="0.12" stroke="url(#doc-grad)" strokeWidth="2" />
      {/* Folded corner */}
      <path d="M34 6L44 16H38C35.8 16 34 14.2 34 12V6Z" fill="url(#doc-grad)" fillOpacity="0.3" />
      {/* Text lines */}
      <rect x="18" y="22" width="20" height="2.5" rx="1.25" fill="url(#doc-grad)" fillOpacity="0.5" />
      <rect x="18" y="28" width="16" height="2.5" rx="1.25" fill="url(#doc-grad)" fillOpacity="0.4" />
      <rect x="18" y="34" width="18" height="2.5" rx="1.25" fill="url(#doc-grad)" fillOpacity="0.3" />
      <rect x="18" y="40" width="12" height="2.5" rx="1.25" fill="url(#doc-grad)" fillOpacity="0.25" />
      {/* Pencil overlay */}
      <g transform="translate(36, 32) rotate(-45)">
        <rect x="0" y="0" width="6" height="24" rx="1" fill="url(#doc-grad)" fillOpacity="0.8" />
        <polygon points="0,24 3,30 6,24" fill="url(#doc-grad)" fillOpacity="0.9" />
        <rect x="0" y="0" width="6" height="5" rx="1" fill="url(#doc-grad)" fillOpacity="0.4" />
      </g>
    </svg>
  );
}
