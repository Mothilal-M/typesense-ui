interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 40 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Outer glow gradient */}
        <radialGradient id="logoOuterGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
          <stop offset="40%" stopColor="#818cf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>

        {/* Glass sphere gradient */}
        <radialGradient id="logoGlass" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#0f172a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
        </radialGradient>

        {/* Ring gradient */}
        <linearGradient id="logoRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#818cf8" />
          <stop offset="70%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Inner ring glow */}
        <linearGradient id="logoRingInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>

        {/* Lightning bolt gradient */}
        <linearGradient id="logoBolt" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="30%" stopColor="#7dd3fc" />
          <stop offset="60%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>

        {/* Bolt glow filter */}
        <filter id="logoBoltGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Outer ring glow */}
        <filter id="logoRingGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Handle gradient */}
        <linearGradient id="logoHandle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Handle accent */}
        <linearGradient id="logoHandleAccent" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        {/* Specular highlight */}
        <radialGradient id="logoSpecular" cx="38%" cy="30%" r="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow */}
      <circle cx="52" cy="48" r="46" fill="url(#logoOuterGlow)" opacity="0.7">
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Outer energy ring */}
      <circle
        cx="52"
        cy="48"
        r="38"
        fill="none"
        stroke="url(#logoRing)"
        strokeWidth="3.5"
        opacity="0.5"
        filter="url(#logoRingGlow)"
      >
        <animateTransform attributeName="transform" type="rotate" from="0 52 48" to="360 52 48" dur="8s" repeatCount="indefinite" />
      </circle>

      {/* Middle energy ring */}
      <circle
        cx="52"
        cy="48"
        r="34"
        fill="none"
        stroke="url(#logoRingInner)"
        strokeWidth="2"
        opacity="0.35"
        strokeDasharray="8 6"
      >
        <animateTransform attributeName="transform" type="rotate" from="360 52 48" to="0 52 48" dur="6s" repeatCount="indefinite" />
      </circle>

      {/* Glass sphere */}
      <circle cx="52" cy="48" r="30" fill="url(#logoGlass)" stroke="url(#logoRing)" strokeWidth="2.5" />

      {/* Inner stars / sparkles */}
      <circle cx="38" cy="36" r="0.8" fill="#e0f2fe" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="40" r="0.6" fill="#c4b5fd" opacity="0.5">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="45" cy="60" r="0.5" fill="#bae6fd" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.8s" repeatCount="indefinite" />
      </circle>

      {/* Lightning bolt */}
      <g filter="url(#logoBoltGlow)">
        <polygon
          points="56,28 44,50 52,50 46,68 62,44 54,44 60,28"
          fill="url(#logoBolt)"
          stroke="#bae6fd"
          strokeWidth="0.5"
          strokeLinejoin="round"
        >
          <animate attributeName="opacity" values="0.85;1;0.85" dur="1.5s" repeatCount="indefinite" />
        </polygon>
      </g>

      {/* Specular highlight on glass */}
      <ellipse cx="44" cy="38" rx="14" ry="8" fill="url(#logoSpecular)" transform="rotate(-15 44 38)" />

      {/* Handle */}
      <g transform="rotate(45 52 48)">
        <rect x="48" y="78" width="9" height="26" rx="4" fill="url(#logoHandle)" stroke="#475569" strokeWidth="0.8" />
        {/* Handle blue accent strip */}
        <rect x="51" y="80" width="3" height="20" rx="1.5" fill="url(#logoHandleAccent)" opacity="0.8" />
        {/* Handle cap bottom */}
        <rect x="48.5" y="100" width="8" height="3" rx="1.5" fill="#475569" />
      </g>
    </svg>
  );
}

/** Compact favicon-sized version (no animations, simpler) */
export function LogoStatic({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="fBolt" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="fHandle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="fGlass" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#0f172a" />
      <circle cx="14" cy="13" r="8.5" fill="url(#fGlass)" stroke="url(#fRing)" strokeWidth="1.5" />
      <polygon points="16,6 12,14 14.5,14 12.5,20 18,12.5 15.5,12.5 17.5,6" fill="url(#fBolt)" />
      <line x1="20" y1="19" x2="27" y2="26" stroke="url(#fHandle)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="20.5" y1="19.5" x2="26.5" y2="25.5" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
