import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { Github } from "lucide-react";
import { Logo } from "../ui/Logo";

export function Navbar() {
  const navRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We'll use window.gsap to animate
    const ctx = gsap.context(() => {
      // Background blur on scroll
      gsap.to(navRef.current, {
        scrollTrigger: {
          trigger: "body",
          start: "100px top",
          end: "+=100",
          toggleActions: "play none none reverse",
        },
        backgroundColor: "rgba(10, 10, 26, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(30, 32, 53, 0.5)",
        duration: 0.3,
      });

      // Character animation
      if (brandRef.current) {
        const chars = brandRef.current.querySelectorAll(".nav-brand-char");
        gsap.from(chars, {
          y: 20,
          opacity: 0,
          rotateX: -90,
          stagger: 0.05,
          duration: 0.8,
          ease: "back.out(1.7)",
          delay: 0.5,
        });
      }
    });
    return () => ctx.revert();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 transition-colors border-b border-transparent"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2" ref={brandRef}>
          <Logo size={36} />
          <span className="text-xl font-heading font-bold text-white tracking-wide flex">
            {"Typesense UI".split("").map((char, i) => (
              <span key={i} className="nav-brand-char inline-block">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--landing-text-secondary)]">
          <button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">Features</button>
          <button onClick={() => scrollTo("ai")} className="hover:text-white transition-colors">AI Search</button>
          <button onClick={() => scrollTo("how-it-works")} className="hover:text-white transition-colors">How It Works</button>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Mothilal-M/typesense-ui" // Will use github URL
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-[var(--landing-text-secondary)] hover:text-white transition-colors"
          >
            <Github size={18} />
            <span className="sr-only sm:not-sr-only">GitHub</span>
          </a>
          <Link
            to="/app"
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-[#1e2035] transition-all hover:border-[#8d30ff]/50 hover:shadow-[0_0_20px_rgba(141,48,255,0.2)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
