export function DashboardIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="dash-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="dash-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="dash-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Window frame */}
      <rect x="20" y="20" width="440" height="320" rx="16" fill="white" fillOpacity="0.1" stroke="url(#dash-grad-1)" strokeWidth="1.5" />

      {/* Title bar */}
      <rect x="20" y="20" width="440" height="40" rx="16" fill="url(#dash-grad-1)" fillOpacity="0.15" />
      <rect x="20" y="44" width="440" height="16" fill="url(#dash-grad-1)" fillOpacity="0.15" />
      <circle cx="44" cy="40" r="6" fill="#EF4444" fillOpacity="0.8" />
      <circle cx="64" cy="40" r="6" fill="#F59E0B" fillOpacity="0.8" />
      <circle cx="84" cy="40" r="6" fill="#22C55E" fillOpacity="0.8" />

      {/* Sidebar */}
      <rect x="20" y="60" width="120" height="280" fill="url(#dash-grad-1)" fillOpacity="0.08" />
      <line x1="140" y1="60" x2="140" y2="340" stroke="url(#dash-grad-1)" strokeOpacity="0.3" strokeWidth="1" />

      {/* Sidebar items */}
      <rect x="32" y="78" width="96" height="10" rx="5" fill="url(#dash-grad-1)" fillOpacity="0.4" />
      <rect x="32" y="100" width="96" height="32" rx="8" fill="url(#dash-grad-1)" fillOpacity="0.2" />
      <rect x="44" y="110" width="72" height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.5" />
      <rect x="44" y="118" width="48" height="3" rx="1.5" fill="url(#dash-grad-1)" fillOpacity="0.3" />

      <rect x="32" y="142" width="96" height="32" rx="8" fill="url(#dash-grad-2)" fillOpacity="0.15" />
      <rect x="44" y="152" width="72" height="4" rx="2" fill="url(#dash-grad-2)" fillOpacity="0.4" />
      <rect x="44" y="160" width="56" height="3" rx="1.5" fill="url(#dash-grad-2)" fillOpacity="0.25" />

      <rect x="32" y="184" width="96" height="32" rx="8" fill="url(#dash-grad-1)" fillOpacity="0.1" />
      <rect x="44" y="194" width="72" height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.3" />
      <rect x="44" y="202" width="40" height="3" rx="1.5" fill="url(#dash-grad-1)" fillOpacity="0.2" />

      {/* Search bar */}
      <rect x="156" y="74" width="288" height="36" rx="10" fill="white" fillOpacity="0.08" stroke="url(#dash-grad-1)" strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="174" cy="92" r="8" stroke="url(#dash-grad-1)" strokeWidth="1.5" fill="none" strokeOpacity="0.5" />
      <line x1="180" y1="98" x2="185" y2="103" stroke="url(#dash-grad-1)" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
      <rect x="194" y="88" width="80" height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.2" />

      {/* Table header */}
      <rect x="156" y="122" width="288" height="28" rx="6" fill="url(#dash-grad-3)" />
      <rect x="168" y="132" width="50" height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.5" />
      <rect x="248" y="132" width="60" height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.5" />
      <rect x="338" y="132" width="40" height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.5" />
      <rect x="408" y="132" width="24" height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.5" />

      {/* Table rows */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x="156" y={158 + i * 30} width="288" height="28" rx="4" fill="url(#dash-grad-1)" fillOpacity={i % 2 === 0 ? 0.03 : 0.06} />
          <rect x="168" y={168 + i * 30} width={40 + (i * 7) % 20} height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.25" />
          <rect x="248" y={168 + i * 30} width={50 + (i * 11) % 25} height="4" rx="2" fill="url(#dash-grad-2)" fillOpacity="0.2" />
          <rect x="338" y={168 + i * 30} width={30 + (i * 5) % 15} height="4" rx="2" fill="url(#dash-grad-1)" fillOpacity="0.15" />
          <circle cx="416" cy={170 + i * 30} r="5" fill="url(#dash-grad-2)" fillOpacity="0.2" />
        </g>
      ))}
    </svg>
  );
}
