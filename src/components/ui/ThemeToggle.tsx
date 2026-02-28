import { useState } from "react";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative w-[68px] h-[34px] rounded-full p-[3px] transition-all duration-500 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 group flex-shrink-0"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%)"
          : "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 50%, #38bdf8 100%)",
        boxShadow: isDark
          ? "0 2px 12px rgba(99, 102, 241, 0.25), inset 0 1px 1px rgba(255,255,255,0.05)"
          : "0 2px 12px rgba(251, 191, 36, 0.25), inset 0 1px 1px rgba(255,255,255,0.25)",
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Stars (dark mode background) */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500"
        style={{ opacity: isDark ? 1 : 0 }}
      >
        {[
          { top: 7, left: 10, size: 2, delay: 0 },
          { top: 13, left: 18, size: 1.5, delay: 0.3 },
          { top: 5, left: 26, size: 2, delay: 0.6 },
          { top: 17, left: 7, size: 1.5, delay: 0.9 },
          { top: 21, left: 22, size: 1, delay: 1.2 },
          { top: 9, left: 36, size: 1.5, delay: 0.4 },
        ].map((star, i) => (
          <span
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Clouds (light mode background) */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500"
        style={{ opacity: isDark ? 0 : 1 }}
      >
        <div
          className="absolute bg-white/40 rounded-full animate-cloud-drift"
          style={{ top: 5, left: 6, width: 14, height: 5, filter: "blur(1px)" }}
        />
        <div
          className="absolute bg-white/30 rounded-full animate-cloud-drift"
          style={{
            top: 15,
            left: 16,
            width: 10,
            height: 4,
            filter: "blur(1px)",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute bg-white/25 rounded-full animate-cloud-drift"
          style={{
            top: 21,
            left: 5,
            width: 8,
            height: 3,
            filter: "blur(0.5px)",
            animationDelay: "4s",
          }}
        />
      </div>

      {/* Sliding knob */}
      <div
        className="relative w-[28px] h-[28px] rounded-full transition-all duration-500 flex items-center justify-center overflow-hidden"
        style={{
          transform: isDark ? "translateX(34px)" : "translateX(0px)",
          transitionTimingFunction: "cubic-bezier(0.68, -0.4, 0.265, 1.3)",
          background: isDark
            ? "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)"
            : "linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)",
          boxShadow: isDark
            ? "0 0 8px rgba(200, 210, 220, 0.3), inset 0 -2px 3px rgba(0,0,0,0.15)"
            : "0 0 10px rgba(251, 191, 36, 0.5), 0 0 20px rgba(251, 191, 36, 0.15), inset 0 -2px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* Sun face */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-500"
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark
              ? "rotate(-90deg) scale(0.4)"
              : "rotate(0deg) scale(1)",
          }}
        >
          <svg viewBox="0 0 28 28" className="w-full h-full">
            {/* Sun rays */}
            <g
              className={isAnimating && !isDark ? "animate-spin-slow" : ""}
              style={{ transformOrigin: "14px 14px" }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <line
                  key={angle}
                  x1="14"
                  y1={i % 2 === 0 ? "1.5" : "3"}
                  x2="14"
                  y2={i % 2 === 0 ? "4.5" : "4.5"}
                  stroke="#f59e0b"
                  strokeWidth={i % 2 === 0 ? "1.6" : "1"}
                  strokeLinecap="round"
                  transform={`rotate(${angle} 14 14)`}
                  opacity="0.85"
                />
              ))}
            </g>
            {/* Sun inner glow */}
            <circle cx="14" cy="14" r="6" fill="#fbbf24" opacity="0.15" />
          </svg>
        </div>

        {/* Moon face */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-500"
          style={{
            opacity: isDark ? 1 : 0,
            transform: isDark
              ? "rotate(0deg) scale(1)"
              : "rotate(90deg) scale(0.4)",
          }}
        >
          <svg viewBox="0 0 28 28" className="w-full h-full">
            <defs>
              <mask id="moonCrescent">
                <rect width="28" height="28" fill="white" />
                <circle cx="18" cy="11" r="6.5" fill="black" />
              </mask>
            </defs>
            <circle
              cx="14"
              cy="14"
              r="8.5"
              fill="#cbd5e1"
              mask="url(#moonCrescent)"
            />
            {/* Craters */}
            <circle
              cx="11"
              cy="15"
              r="1.3"
              fill="#94a3b8"
              opacity="0.35"
              mask="url(#moonCrescent)"
            />
            <circle
              cx="14"
              cy="19"
              r="0.9"
              fill="#94a3b8"
              opacity="0.25"
              mask="url(#moonCrescent)"
            />
            <circle
              cx="9"
              cy="19"
              r="0.7"
              fill="#94a3b8"
              opacity="0.2"
              mask="url(#moonCrescent)"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}
