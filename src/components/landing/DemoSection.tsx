import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function DemoSection() {
  const containerRef = useRef<HTMLElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Rotate mockup on scroll
      gsap.fromTo(mockupRef.current,
        {
          rotateX: 10,
          scale: 0.95,
          y: 50,
        },
        {
          rotateX: 0,
          scale: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            end: "center center",
            scrub: 1,
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="demo" ref={containerRef} className="landing-section bg-[#0a0a1a] py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
          See It In <span className="text-gradient-neon">Action.</span>
        </h2>
        <p className="text-[var(--landing-text-secondary)] text-lg mb-16 max-w-2xl mx-auto">
          Ready to experience the fastest way to manage Typesense collections? Start using Typesense UI in your browser right now.
        </p>

        {/* Browser Mockup */}
        <div className="perspective-1000">
          <div 
            ref={mockupRef}
            className="mockup-frame landing-card max-w-5xl mx-auto rounded-xl border border-[#1e2035] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Toolbar */}
            <div className="bg-[#0f1025] px-4 py-3 flex items-center gap-2 border-b border-[#1e2035]">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <div className="mx-auto px-3 py-1 rounded bg-[#12141f] text-[11px] text-[var(--landing-text-muted)] font-mono flex-1 max-w-xs text-center border border-[#1e2035]">
                typesense-ui.vercel.app
              </div>
            </div>

            {/* Fake Content / Demo Placeholder */}
            <div className="relative aspect-video bg-[#0a0a1a] flex items-center justify-center group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0cdcf7]/5 via-transparent to-[#8d30ff]/5" />
              
              <Link to="/app" className="relative z-10 flex flex-col items-center gap-4 text-[var(--landing-text-secondary)] group-hover:text-white transition-colors duration-300">
                <div className="w-16 h-16 rounded-full bg-[#12141f] border border-[#1e2035] flex items-center justify-center group-hover:scale-110 group-hover:border-[#8d30ff]/50 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(141,48,255,0.3)]">
                  <PlayCircle size={32} className="text-[#8d30ff]" />
                </div>
                <span className="font-heading font-medium text-lg">Launch Application Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
