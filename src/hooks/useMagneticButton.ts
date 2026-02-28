import { useEffect, type RefObject } from "react";
import gsap from "gsap";

/**
 * Enhancement #8: Magnetic CTA Buttons
 * Detects cursor proximity to a button and smoothly pulls it toward the cursor.
 * Snaps back with elastic.out on mouse leave.
 */
export function useMagneticButton(ref: RefObject<HTMLElement | null>, strength = 0.35) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Disable on touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = Math.max(rect.width, rect.height) * 1.5;

      if (dist < threshold) {
        gsap.to(el, {
          x: dx * strength,
          y: dy * strength,
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)",
      });
    };

    el.addEventListener("mousemove", handleMove, { passive: true });
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref, strength]);
}
