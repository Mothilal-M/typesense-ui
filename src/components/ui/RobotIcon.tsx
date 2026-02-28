import { memo } from "react";

export const RobotIcon = memo(function RobotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Body gradient - white/light gray 3D feel */}
        <radialGradient id="bodyGrad" cx="0.4" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#fdfdfe" />
          <stop offset="60%" stopColor="#e8e9ed" />
          <stop offset="100%" stopColor="#c8c9d0" />
        </radialGradient>
        {/* Head gradient */}
        <radialGradient id="headGrad" cx="0.45" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#edeef2" />
          <stop offset="100%" stopColor="#d0d1d8" />
        </radialGradient>
        {/* Visor gradient - dark with slight blue */}
        <linearGradient id="visorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3d52" />
          <stop offset="50%" stopColor="#2a2d3e" />
          <stop offset="100%" stopColor="#1e2030" />
        </linearGradient>
        {/* Green glow for eyes */}
        <radialGradient id="eyeGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#b0ff5a" />
          <stop offset="60%" stopColor="#7ddf20" />
          <stop offset="100%" stopColor="#5abf00" />
        </radialGradient>
        {/* Pink accent */}
        <radialGradient id="pinkAccent" cx="0.4" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#f5a0b8" />
          <stop offset="100%" stopColor="#e87a9a" />
        </radialGradient>
        {/* Heart gradient */}
        <radialGradient id="heartGrad" cx="0.4" cy="0.35" r="0.6">
          <stop offset="0%" stopColor="#f5a0b8" />
          <stop offset="100%" stopColor="#d4687f" />
        </radialGradient>
        {/* Shadow filter */}
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#00000030" />
        </filter>
        <filter id="eyeGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* === ANTENNA === */}
      <g className="animate-antenna-bob">
        <line x1="32" y1="6" x2="32" y2="13" stroke="#c8c9d0" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="32" cy="5" r="2.5" fill="url(#bodyGrad)" stroke="#c0c1c8" strokeWidth="0.5" className="animate-antenna-glow" />
      </g>

      {/* === HEAD === */}
      <ellipse cx="32" cy="22" rx="16" ry="12" fill="url(#headGrad)" filter="url(#softShadow)" />

      {/* Visor / face screen */}
      <ellipse cx="32" cy="23" rx="12" ry="8" fill="url(#visorGrad)" />
      {/* Visor reflection */}
      <ellipse cx="29" cy="20" rx="6" ry="2.5" fill="white" opacity="0.08" />

      {/* Ear accents (pink headphones) */}
      <ellipse cx="16.5" cy="22" rx="3" ry="4.5" fill="url(#pinkAccent)" filter="url(#softShadow)" />
      <ellipse cx="47.5" cy="22" rx="3" ry="4.5" fill="url(#pinkAccent)" filter="url(#softShadow)" />

      {/* === EYES (glowing green triangles) === */}
      <g filter="url(#eyeGlowFilter)" className="animate-blink">
        <polygon points="25,21 28,25 22,25" fill="url(#eyeGlow)" />
        <polygon points="39,21 42,25 36,25" fill="url(#eyeGlow)" />
      </g>

      {/* Smile */}
      <path d="M28 27 Q32 29.5 36 27" stroke="#7ddf20" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.9" />

      {/* === BODY === */}
      <path d="M22 33 Q22 31 24 31 L40 31 Q42 31 42 33 L44 48 Q44 52 40 52 L24 52 Q20 52 20 48 Z" fill="url(#bodyGrad)" filter="url(#softShadow)" />

      {/* Heart on chest */}
      <g transform="translate(32,42)">
        <rect x="-5.5" y="-5.5" width="11" height="11" rx="2" fill="#d0d1d8" />
        <path d="M0,-2.5 C-1.5,-5 -5,-4.5 -5,-1.5 C-5,1 -1,4 0,5 C1,4 5,1 5,-1.5 C5,-4.5 1.5,-5 0,-2.5Z" fill="url(#heartGrad)" />
      </g>

      {/* === WAVING ARM (right side) === */}
      <g className="animate-wave" style={{ transformOrigin: "44px 36px" }}>
        {/* Upper arm */}
        <path d="M44 35 L50 30" stroke="#d0d1d8" strokeWidth="3.5" strokeLinecap="round" />
        {/* Forearm */}
        <path d="M50 30 L53 24" stroke="#d0d1d8" strokeWidth="3" strokeLinecap="round" />
        {/* Hand */}
        <circle cx="53" cy="23" r="2.8" fill="url(#headGrad)" />
        {/* Fingers */}
        <line x1="51.5" y1="21" x2="50.5" y2="19" stroke="#d0d1d8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="53" y1="20.5" x2="53" y2="18.3" stroke="#d0d1d8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="54.5" y1="21" x2="55.5" y2="19" stroke="#d0d1d8" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Left arm (hanging) */}
      <path d="M20 35 L15 42" stroke="#d0d1d8" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M15 42 L14 47" stroke="#d0d1d8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="14" cy="48" r="2.5" fill="url(#headGrad)" />
    </svg>
  );
});
