import { useState, useEffect, useCallback, useRef } from "react";

interface Mouse3D {
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (top to bottom)
  px: number; // pixel x
  py: number; // pixel y
}

export function useMouse3D() {
  const [mouse, setMouse] = useState<Mouse3D>({ x: 0, y: 0, px: 0, py: 0 });
  const rafRef = useRef<number>(0);
  const latestRef = useRef<Mouse3D>({ x: 0, y: 0, px: 0, py: 0 });

  const handleMove = useCallback((e: MouseEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    latestRef.current = { x: nx, y: ny, px: e.clientX, py: e.clientY };

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setMouse(latestRef.current);
        rafRef.current = 0;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMove]);

  return mouse;
}

/** Returns a style object that tilts an element based on mouse relative to element center */
export function useTilt3D(ref: React.RefObject<HTMLElement | null>, intensity = 15) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      setStyle({
        transform: `perspective(800px) rotateY(${dx * intensity}deg) rotateX(${-dy * intensity}deg) scale3d(1.02, 1.02, 1.02)`,
        transition: "transform 0.1s ease-out",
      });
    };

    const handleLeave = () => {
      setStyle({
        transform: "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)",
        transition: "transform 0.5s ease-out",
      });
    };

    el.addEventListener("mousemove", handleMove, { passive: true });
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref, intensity]);

  return style;
}
