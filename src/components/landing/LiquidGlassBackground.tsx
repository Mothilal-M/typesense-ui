import { useMouse3D } from "../../hooks/useMouse3D";
import AntigravityCanvas from "./AntigravityCanvas";

export function LiquidGlassBackground() {
  const mouse = useMouse3D();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Layer 0: Dark radial gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, #0f1025 0%, #0a0a1a 50%, #060612 100%)",
        }}
      />

      {/* Layer 1: Antigravity particle canvas */}
      <AntigravityCanvas
        mousePosition={{ px: mouse.px, py: mouse.py }}
        className="absolute inset-0"
      />

      {/* Layer 2: Neon glow orbs with mouse parallax */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translateX(${mouse.x * 10}px) translateY(${mouse.y * 10}px)`,
          transition: "transform 0.6s ease-out",
        }}
      >
        {/* Cyan orb */}
        <div className="absolute top-[8%] left-[12%] w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] rounded-full bg-[#0cdcf7]/[0.07] blur-[120px] animate-orb-drift-1" />
        {/* Purple orb */}
        <div className="absolute top-[35%] right-[8%] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full bg-[#8d30ff]/[0.07] blur-[100px] animate-orb-drift-2" />
        {/* Pink orb */}
        <div className="absolute bottom-[12%] left-[30%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-[#ff4fba]/[0.05] blur-[120px] animate-orb-drift-3" />
        {/* Mint orb */}
        <div className="absolute top-[55%] left-[3%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] rounded-full bg-[#4ff0b7]/[0.05] blur-[80px] animate-orb-drift-4" />
      </div>

      {/* Layer 3: Subtle noise/grain texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Layer 4: Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
}
