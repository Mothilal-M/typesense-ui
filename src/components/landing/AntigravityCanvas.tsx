import { useEffect, useRef, useCallback } from "react";

// Neon accent colors at low alpha
const NEON_COLORS = [
  [12, 220, 247],   // cyan
  [79, 240, 183],   // mint
  [255, 79, 186],   // pink
  [141, 48, 255],   // purple
];

type Shape = "circle" | "triangle" | "hexagon" | "square";
const SHAPES: Shape[] = ["circle", "triangle", "hexagon", "square"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  shape: Shape;
  color: number[];
  rotation: number;
  rotationSpeed: number;
  phase: number;
}

interface AntigravityCanvasProps {
  mousePosition?: { px: number; py: number };
  className?: string;
}

function createParticle(w: number, h: number): Particle {
  const depth = Math.random();
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(0.1 + Math.random() * 0.35) * (0.3 + depth * 0.7),
    size: (2 + Math.random() * 4) * (0.4 + depth * 0.6),
    depth,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    phase: Math.random() * Math.PI * 2,
  };
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number, rotation: number,
  shape: Shape,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  switch (shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.lineTo(-size * 0.866, size * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    case "hexagon": {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "square":
      ctx.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
      break;
  }

  ctx.restore();
}

export default function AntigravityCanvas({ mousePosition, className }: AntigravityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const reducedMotionRef = useRef(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 30 : 60;
  const REPULSION_RADIUS = 120;
  const CONNECTION_DIST = 100;

  const init = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(w, h));
    }
    particlesRef.current = particles;
  }, [PARTICLE_COUNT]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dpr = isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particlesRef.current.length === 0) {
        init(rect.width, rect.height);
      }
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // If reduced motion, draw one static frame and stop
    if (reducedMotionRef.current) {
      const rect = canvas.getBoundingClientRect();
      const particles = particlesRef.current;
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (const p of particles) {
        const alpha = (0.15 + p.depth * 0.25);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha})`;
        drawShape(ctx, p.x, p.y, p.size, p.rotation, p.shape);
      }
      return () => ro.disconnect();
    }

    let lastTime = performance.now();
    let visible = true;

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) {
        lastTime = performance.now();
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const animate = (now: number) => {
      if (!visible) return;

      const dt = Math.min((now - lastTime) / 16.667, 3); // Normalize to ~60fps, cap at 3x
      lastTime = now;
      timeRef.current += dt * 0.02;
      const time = timeRef.current;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const particles = particlesRef.current;

      ctx.clearRect(0, 0, w, h);

      const mx = mousePosition?.px ?? -9999;
      const my = mousePosition?.py ?? -9999;

      // Update particles
      for (const p of particles) {
        // Antigravity + oscillation
        p.x += (p.vx + Math.sin(time * 2 + p.phase) * 0.15) * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;

        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSION_RADIUS && dist > 0) {
          const force = (1 - dist / REPULSION_RADIUS) * 1.5 * p.depth;
          p.x += (dx / dist) * force * dt;
          p.y += (dy / dist) * force * dt;
        }

        // Wrap
        if (p.y < -p.size * 2) {
          p.y = h + p.size * 2;
          p.x = Math.random() * w;
        }
        if (p.y > h + p.size * 2) {
          p.y = -p.size * 2;
          p.x = Math.random() * w;
        }
        if (p.x < -p.size * 2) p.x = w + p.size;
        if (p.x > w + p.size * 2) p.x = -p.size;
      }

      // Draw connecting lines (front-layer particles only)
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        if (a.depth < 0.4) continue;
        let conns = 0;
        for (let j = i + 1; j < particles.length; j++) {
          if (conns >= 3) break;
          const b = particles[j];
          if (b.depth < 0.4) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.12;
            ctx.strokeStyle = `rgba(${a.color[0]},${a.color[1]},${a.color[2]},${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            conns++;
          }
        }
      }

      // Draw particles (back to front)
      const sorted = [...particles].sort((a, b) => a.depth - b.depth);
      for (const p of sorted) {
        const alpha = (0.1 + p.depth * 0.3);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha})`;
        drawShape(ctx, p.x, p.y, p.size, p.rotation, p.shape);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
    };
  }, [init, isMobile, mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}
