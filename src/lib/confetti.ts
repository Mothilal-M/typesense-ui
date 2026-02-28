import confetti from "canvas-confetti";

/** Standard celebration burst — collection created, API key saved, etc. */
export function fireConfetti() {
  const end = Date.now() + 300;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/** Smaller, subtle sparkle — for lighter wins like document saved */
export function fireSparkle() {
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#3b82f6", "#8b5cf6", "#06b6d4"],
    ticks: 150,
    gravity: 1.2,
    scalar: 0.8,
  });
}

/** Star burst — for key moments like first connection */
export function fireStars() {
  const defaults = {
    spread: 360,
    ticks: 80,
    gravity: 0,
    decay: 0.94,
    startVelocity: 20,
    colors: ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"],
  };

  confetti({
    ...defaults,
    particleCount: 30,
    scalar: 1.2,
    shapes: ["star"] as confetti.Shape[],
  });

  confetti({
    ...defaults,
    particleCount: 15,
    scalar: 0.75,
    shapes: ["circle"],
  });
}
