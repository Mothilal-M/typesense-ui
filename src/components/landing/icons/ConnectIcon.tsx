export function ConnectIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="conn-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* Plug / connection visual */}
      <circle cx="18" cy="32" r="10" fill="url(#conn-grad)" fillOpacity="0.12" stroke="url(#conn-grad)" strokeWidth="2" />
      <circle cx="46" cy="32" r="10" fill="url(#conn-grad)" fillOpacity="0.12" stroke="url(#conn-grad)" strokeWidth="2" />
      {/* Connecting line with pulse */}
      <line x1="28" y1="32" x2="36" y2="32" stroke="url(#conn-grad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 2" />
      {/* Inner symbols */}
      <text x="18" y="36" textAnchor="middle" fontSize="10" fill="url(#conn-grad)" fillOpacity="0.7" fontWeight="bold">{'{'}</text>
      <text x="46" y="36" textAnchor="middle" fontSize="10" fill="url(#conn-grad)" fillOpacity="0.7" fontWeight="bold">T</text>
      {/* Signal waves */}
      <path d="M52 22C56 24 58 28 58 32S56 40 52 42" stroke="url(#conn-grad)" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" fill="none" />
      <path d="M55 18C60 22 62 27 62 32S60 42 55 46" stroke="url(#conn-grad)" strokeWidth="1.5" strokeOpacity="0.25" strokeLinecap="round" fill="none" />
      {/* Status dot */}
      <circle cx="32" cy="32" r="3" fill="url(#conn-grad)" fillOpacity="0.8" />
    </svg>
  );
}
