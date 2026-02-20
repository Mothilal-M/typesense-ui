export function ThemeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="theme-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* Split circle — sun/moon */}
      <circle cx="32" cy="32" r="18" fill="url(#theme-grad)" fillOpacity="0.1" stroke="url(#theme-grad)" strokeWidth="2" />
      {/* Dark half (left) */}
      <path d="M32 14A18 18 0 0 0 32 50Z" fill="url(#theme-grad)" fillOpacity="0.3" />
      {/* Moon crescent on dark side */}
      <circle cx="26" cy="28" r="7" fill="url(#theme-grad)" fillOpacity="0.15" />
      <circle cx="29" cy="25" r="6" fill="url(#theme-grad)" fillOpacity="0.08" />
      {/* Stars on dark side */}
      <circle cx="20" cy="22" r="1.2" fill="url(#theme-grad)" fillOpacity="0.6" />
      <circle cx="24" cy="38" r="1" fill="url(#theme-grad)" fillOpacity="0.5" />
      <circle cx="18" cy="32" r="0.8" fill="url(#theme-grad)" fillOpacity="0.4" />
      {/* Sun rays on light side */}
      {[0, 45, 90, 135, 180].map((angle) => (
        <line
          key={angle}
          x1="42"
          y1="32"
          x2={42 + 8 * Math.cos((angle * Math.PI) / 180)}
          y2={32 + 8 * Math.sin((angle * Math.PI) / 180)}
          stroke="url(#theme-grad)"
          strokeWidth="1.5"
          strokeOpacity="0.35"
          strokeLinecap="round"
        />
      ))}
      <circle cx="42" cy="32" r="4" fill="url(#theme-grad)" fillOpacity="0.25" />
    </svg>
  );
}
