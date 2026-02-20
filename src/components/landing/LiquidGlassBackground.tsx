import { useMouse3D } from "../../hooks/useMouse3D";

export function LiquidGlassBackground() {
  const mouse = useMouse3D();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ perspective: "1200px" }}>
      {/* 3D Perspective Grid that responds to mouse */}
      <div
        className="absolute inset-0"
        style={{
          transform: `rotateX(${mouse.y * 3}deg) rotateY(${mouse.x * 3}deg)`,
          transition: "transform 0.3s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Animated 3D grid floor */}
        <div
          className="absolute left-[-50%] right-[-50%] bottom-[-20%] h-[80vh] opacity-60 dark:opacity-40"
          style={{
            transform: "rotateX(65deg) translateZ(-100px)",
            background: `
              linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px),
              linear-gradient(0deg, rgba(99,102,241,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 65%)",
          }}
        />

        {/* Glowing orbs at different Z depths */}
        <div
          className="absolute top-[10%] left-[15%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-blue-500/20 dark:bg-blue-500/10 blur-[80px] animate-blob-1"
          style={{ transform: "translateZ(50px)" }}
        />
        <div
          className="absolute top-[30%] right-[10%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[80px] animate-blob-2"
          style={{ transform: "translateZ(100px)" }}
        />
        <div
          className="absolute bottom-[15%] left-[30%] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-pink-400/15 dark:bg-pink-500/8 blur-[80px] animate-blob-3"
          style={{ transform: "translateZ(30px)" }}
        />
        <div
          className="absolute top-[50%] left-[60%] w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] rounded-full bg-cyan-400/15 dark:bg-cyan-500/8 blur-[80px] animate-blob-4"
          style={{ transform: "translateZ(80px)" }}
        />
      </div>

      {/* Floating 3D geometric shapes that track mouse */}
      <div className="absolute inset-0" style={{ perspective: "800px", transformStyle: "preserve-3d" }}>
        {/* Cube wireframe */}
        <div
          className="absolute top-[18%] right-[18%] w-14 h-14 sm:w-20 sm:h-20 border-2 border-blue-400/20 dark:border-blue-400/10 rounded-lg"
          style={{
            animation: "float3d1 8s ease-in-out infinite",
            transform: `translateZ(60px) rotateX(${mouse.y * 20}deg) rotateY(${mouse.x * 20}deg)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        {/* Ring */}
        <div
          className="absolute top-[60%] left-[8%] w-10 h-10 sm:w-16 sm:h-16 border-2 border-purple-400/20 dark:border-purple-400/10 rounded-full"
          style={{
            animation: "float3d2 10s ease-in-out infinite",
            transform: `translateZ(40px) rotateX(${mouse.y * 15}deg) rotateZ(${mouse.x * 15}deg)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        {/* Triangle */}
        <div
          className="absolute top-[35%] left-[78%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderBottom: "24px solid rgba(236,72,153,0.15)",
            animation: "float3d3 12s ease-in-out infinite",
            transform: `translateZ(70px) rotateY(${mouse.x * 25}deg)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        {/* Diamond */}
        <div
          className="absolute top-[72%] right-[30%] w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 dark:from-cyan-400/8 dark:to-blue-400/8"
          style={{
            animation: "float3d1 9s ease-in-out infinite reverse",
            transform: `translateZ(50px) rotate(45deg) rotateX(${mouse.y * 20}deg)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        {/* Cross */}
        <div
          className="absolute top-[12%] left-[45%]"
          style={{
            animation: "float3d2 7s ease-in-out infinite",
            transform: `translateZ(90px) rotate(${mouse.x * 30}deg)`,
            transition: "transform 0.4s ease-out",
          }}
        >
          <div className="w-5 h-0.5 bg-indigo-400/25 dark:bg-indigo-400/10 rounded-full" />
          <div className="w-0.5 h-5 bg-indigo-400/25 dark:bg-indigo-400/10 rounded-full absolute top-[-9px] left-[9px]" />
        </div>
        {/* Hexagon */}
        <div
          className="absolute top-[48%] left-[5%] w-10 h-10 sm:w-12 sm:h-12 opacity-20 dark:opacity-10"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
            animation: "float3d3 11s ease-in-out infinite reverse",
            transform: `translateZ(60px) rotateZ(${mouse.x * 30}deg)`,
            transition: "transform 0.4s ease-out",
          }}
        />
      </div>

      {/* Glass overlay */}
      <div className="absolute inset-0 backdrop-blur-[40px] bg-white/20 dark:bg-slate-950/30" />
    </div>
  );
}
