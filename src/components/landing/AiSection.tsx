import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, MessageSquare, ShieldAlert, TableProperties } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const AI_FEATURES = [
  {
    icon: MessageSquare,
    title: "Natural Language Queries",
    desc: "Ask questions in plain English—Gemini translates them into precise Typesense search parameters.",
  },
  {
    icon: Sparkles,
    title: "Schema-Aware Intelligence",
    desc: "The AI automatically reads your collections and understands your data structure to give accurate answers.",
  },
  {
    icon: ShieldAlert,
    title: "Protected Operations",
    desc: "Create, update, or delete data via chat. Built-in confirmation dialogs ensure accidents never happen.",
  },
  {
    icon: TableProperties,
    title: "Inline Data Tables",
    desc: "Complex JSON results are instantly transformed into beautiful, readable tables right inside the chat.",
  },
];

export function AiSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightMockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Left side stagger
      const items = leftContentRef.current?.querySelectorAll(".ai-feature-item");
      if (items) {
        gsap.from(items, {
          scrollTrigger: {
            trigger: leftContentRef.current,
            start: "top 80%",
          },
          x: -30,
          opacity: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: "power2.out"
        });
      }

      // Mockup animation sequence
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rightMockupRef.current,
          start: "top 70%",
        }
      });

      tl.from(".mockup-container", {
        y: 50,
        opacity: 0,
        rotationY: -15,
        transformPerspective: 1000,
        duration: 1,
        ease: "power3.out"
      })
      .fromTo(".mockup-user-msg", { opacity: 0, scale: 0.9, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.4 })
      .to(".mockup-thinking", { opacity: 1, duration: 0.2 })
      .to(".mockup-thinking", { opacity: 0, delay: 1, duration: 0.2 })
      .fromTo(".mockup-ai-msg", { opacity: 0, scale: 0.9, x: -10 }, { opacity: 1, scale: 1, x: 0, duration: 0.4 })
      .fromTo(".mockup-table", { opacity: 0, height: 0 }, { opacity: 1, height: "auto", duration: 0.6, ease: "power2.out" }, "-=0.2");

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="ai" ref={sectionRef} className="landing-section bg-[#0a0a1a] py-32 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8d30ff]/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#0cdcf7]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left Content */}
        <div ref={leftContentRef}>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-[#8d30ff]/30 bg-[#8d30ff]/10 text-[#8d30ff] text-sm font-medium">
            <Sparkles size={16} />
            Gemini 2.0 Integration
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Talk to Your Data with<br />
            <span className="text-gradient-neon">AI Intelligence.</span>
          </h2>
          <p className="text-[var(--landing-text-secondary)] text-lg mb-12">
            Stop writing complex filter queries. Just ask for what you need, and let the AI handle the heavy lifting of reading schemas, executing searches, and formatting results.
          </p>

          <div className="space-y-8">
            {AI_FEATURES.map((feat, i) => (
              <div key={i} className="ai-feature-item flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#12141f] border border-[#1e2035] flex items-center justify-center text-white">
                  <feat.icon size={24} className="text-[#0cdcf7]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">{feat.title}</h4>
                  <p className="text-[var(--landing-text-muted)] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Mockup */}
        <div ref={rightMockupRef} className="perspective-1000 relative">
          <div className="mockup-container landing-card rounded-2xl overflow-hidden border border-[#1e2035] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            
            {/* Header */}
            <div className="bg-[#0f1025] px-4 py-3 border-b border-[#1e2035] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0cdcf7] to-[#8d30ff] flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Typesense AI Assistant</div>
                <div className="text-xs text-[#0cdcf7]">Connected to Schema</div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-6 space-y-6 bg-[#0a0a1a] h-[400px] overflow-hidden">
              
              {/* User Msg */}
              <div className="mockup-user-msg flex justify-end">
                <div className="bg-[#1e2035] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[85%]">
                  Find the top 3 electronic products under $500, sorted by rating.
                </div>
              </div>

              {/* Thinking Indicator */}
              <div className="mockup-thinking opacity-0 flex items-center gap-2 text-[var(--landing-text-muted)] text-sm">
                <Sparkles size={14} className="animate-pulse" />
                Querying Typesense...
              </div>

              {/* AI Msg */}
              <div className="mockup-ai-msg flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#0cdcf7] to-[#8d30ff] flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="text-[var(--landing-text-secondary)] text-sm mt-1">
                    Here are the top-rated electronics under $500 from your collection:
                  </div>
                  
                  {/* Mock Table */}
                  <div className="mockup-table overflow-hidden rounded-lg border border-[#1e2035] bg-[#0f1025]">
                    <div className="grid grid-cols-3 bg-[#12141f] text-xs font-semibold text-[var(--landing-text-primary)] border-b border-[#1e2035] p-2">
                      <div>Product</div>
                      <div>Price</div>
                      <div>Rating</div>
                    </div>
                    <div className="grid grid-cols-3 text-xs text-[var(--landing-text-muted)] border-b border-[#1e2035] p-2">
                      <div className="text-white">Sony Headphones</div>
                      <div>$299.99</div>
                      <div>4.9/5</div>
                    </div>
                    <div className="grid grid-cols-3 text-xs text-[var(--landing-text-muted)] border-b border-[#1e2035] p-2">
                      <div className="text-white">Smart Watch</div>
                      <div>$199.50</div>
                      <div>4.8/5</div>
                    </div>
                    <div className="grid grid-cols-3 text-xs text-[var(--landing-text-muted)] p-2">
                      <div className="text-white">Portable SSD 1TB</div>
                      <div>$120.00</div>
                      <div>4.7/5</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
