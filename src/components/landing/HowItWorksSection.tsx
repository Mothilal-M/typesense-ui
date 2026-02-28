import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    num: "01",
    title: "Connect",
    desc: "Enter your Typesense server details. No backend configuration needed—everything runs securely in your browser.",
    mockup: "ConnectionForm"
  },
  {
    num: "02",
    title: "Explore",
    desc: "Browse collections instantly. The dashboard automatically reads your schema and generates dynamic filters.",
    mockup: "CollectionList"
  },
  {
    num: "03",
    title: "Manage",
    desc: "Create or edit documents with our built-in JSON editor, complete with syntax highlighting and validation.",
    mockup: "JsonEditor"
  },
  {
    num: "04",
    title: "Ask AI",
    desc: "Open the chat panel and start asking questions about your data in plain English.",
    mockup: "AiChat"
  }
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate line tracing down
      gsap.fromTo(lineRef.current, 
        { scaleY: 0, transformOrigin: "top" },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top center",
            end: "bottom center",
            scrub: true,
          }
        }
      );

      // Section clip-path reveals
      const cards = gsap.utils.toArray(".step-card");
      cards.forEach((card: any) => {
        gsap.from(card, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="landing-section bg-[#0a0a1a] py-32">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Up and Running in <span className="text-gradient-neon">Minutes.</span>
          </h2>
          <p className="text-[var(--landing-text-secondary)] text-lg">
            A zero-setup architecture. Run it locally or host it yourself.
          </p>
        </div>

        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-[#1e2035] md:left-1/2 md:-ml-[1px]" />
          <div ref={lineRef} className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#0cdcf7] via-[#8d30ff] to-[#ff4fba] md:left-1/2 md:-ml-[1px]" />

          <div className="space-y-24">
            {STEPS.map((step, i) => {
              const isEven = i % 2 !== 0;
              return (
                <div key={i} className="step-card relative flex flex-col md:flex-row items-center gap-8 md:gap-16">
                  
                  {/* Glowing Dot */}
                  <div className={`hiw-dot absolute left-[24px] md:left-1/2`} />

                  {/* Left Side (Content/Mockup depending on even/odd) */}
                  <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? "md:order-2" : "md:order-1 md:text-right"}`}>
                    <div className="text-[#0cdcf7] font-display text-5xl font-bold mb-4 opacity-50">
                      {step.num}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-[var(--landing-text-secondary)] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Right Side (Visual Mockup box) */}
                  <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? "md:order-1" : "md:order-2"}`}>
                    <div className="landing-card h-48 rounded-2xl border border-[#1e2035] flex items-center justify-center p-6 text-[var(--landing-text-muted)] font-mono text-sm relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#0cdcf7]/5 to-[#8d30ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      Visual Representation: {step.mockup}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
