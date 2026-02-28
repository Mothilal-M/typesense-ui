import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { Github, ChevronDown, Rocket } from "lucide-react";
import { HeroScene } from "./HeroScene";
import { useMagneticButton } from "../../hooks/useMagneticButton";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  
  useMagneticButton(buttonRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-badge", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
      })
      .from(".hero-title-line", {
        y: 40,
        opacity: 0,
        rotationX: -45,
        transformOrigin: "0% 50% -50",
        stagger: 0.2,
        duration: 1,
      }, "-=0.4")
      .from(".hero-subtitle", {
        y: 20,
        opacity: 0,
        duration: 0.8,
      }, "-=0.6")
      .from(".hero-cta", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
      }, "-=0.4");

      // Bounce the scroll indicator
      gsap.to(".scroll-indicator", {
        y: 10,
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="landing-section min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-[#0a0a1a]">
      <HeroScene />

      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        <div className="hero-badge flex items-center gap-2 px-4 py-2 rounded-full border border-[#0cdcf7]/30 bg-[#0cdcf7]/5 backdrop-blur-sm mb-8">
          <Rocket size={16} className="text-[#0cdcf7]" />
          <span className="text-sm font-medium text-[#0cdcf7]">Open Source Typesense Dashboard</span>
        </div>

        <h1 ref={headlineRef} className="font-heading font-black text-6xl md:text-8xl leading-[1.1] tracking-tight mb-6 perspective-1000">
          <div className="hero-title-line text-white">Manage Your Search,</div>
          <div className="hero-title-line text-gradient-neon">Powered by AI.</div>
        </h1>

        <p className="hero-subtitle text-lg md:text-xl text-[var(--landing-text-secondary)] max-w-2xl mb-12 leading-relaxed">
          A modern visual dashboard for Typesense with a built-in AI assistant. Explore collections, tweak data, and converse with your search schemas—all right from your browser.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/app"
            ref={buttonRef}
            className="hero-cta group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#8d30ff] to-[#0cdcf7] text-white font-medium text-lg rounded-full overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(12,220,247,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Exploring <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
          </Link>
          
          <a
            href="https://github.com/Mothilal-M/typesense-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-cta inline-flex items-center gap-2 px-8 py-4 border border-[#1e2035] bg-[#12141f]/50 backdrop-blur text-white font-medium text-lg rounded-full transition-all hover:bg-white/5 hover:border-white/20"
          >
            <Github size={20} />
            View on GitHub
          </a>
        </div>
      </div>

      <div className="scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--landing-text-muted)] flex flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
        <ChevronDown size={20} />
      </div>
      
      {/* Bottom gradient fade for smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a1a] to-transparent pointer-events-none" />
    </section>
  );
}
