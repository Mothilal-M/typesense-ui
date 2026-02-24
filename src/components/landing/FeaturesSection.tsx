import { useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CollectionIcon } from "./icons/CollectionIcon";
import { SearchIcon } from "./icons/SearchIcon";
import { DocumentIcon } from "./icons/DocumentIcon";
import { FilterIcon } from "./icons/FilterIcon";
import { ThemeIcon } from "./icons/ThemeIcon";
import { ConnectIcon } from "./icons/ConnectIcon";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: CollectionIcon,
    title: "Collection Management",
    description: "Browse, create, and delete collections with an intuitive visual interface. See field schemas, document counts, and metadata at a glance.",
    gradient: "from-[#0cdcf7] to-[#8d30ff]",
    glowColor: "rgba(12, 220, 247, 0.15)",
  },
  {
    icon: SearchIcon,
    title: "Real-time Search",
    description: "Instant search across all documents with Typesense's blazing-fast typo-tolerant engine. Results in milliseconds.",
    gradient: "from-[#4ff0b7] to-[#0cdcf7]",
    glowColor: "rgba(79, 240, 183, 0.15)",
  },
  {
    icon: DocumentIcon,
    title: "Document CRUD",
    description: "Create, view, edit, and delete documents directly in the browser. Full JSON editor with validation and formatting.",
    gradient: "from-[#4ff0b7] to-[#8d30ff]",
    glowColor: "rgba(79, 240, 183, 0.15)",
  },
  {
    icon: FilterIcon,
    title: "Advanced Filtering",
    description: "Filter documents by facets, numeric ranges, and boolean fields. Smart filters auto-generated from your schema.",
    gradient: "from-[#ff4fba] to-[#8d30ff]",
    glowColor: "rgba(255, 79, 186, 0.15)",
  },
  {
    icon: ThemeIcon,
    title: "Dark Mode",
    description: "Beautiful dark theme with a single click. Glassmorphism design that looks stunning in both light and dark modes.",
    gradient: "from-[#8d30ff] to-[#ff4fba]",
    glowColor: "rgba(141, 48, 255, 0.15)",
  },
  {
    icon: ConnectIcon,
    title: "One-Click Connect",
    description: "Connect to any Typesense server with just your API key and host. Credentials stored securely in your browser.",
    gradient: "from-[#0cdcf7] to-[#4ff0b7]",
    glowColor: "rgba(12, 220, 247, 0.15)",
  },
];

function Tilt3DCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    el.style.transform = `perspective(800px) rotateY(${dx * 12}deg) rotateX(${-dy * 12}deg) translateZ(10px) scale3d(1.03, 1.03, 1.03)`;
  }, []);

  const handleLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale3d(1, 1, 1)";
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease-out, box-shadow 0.3s",
      }}
    >
      {children}
    </div>
  );
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".feature-heading", {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 85%",
        toggleActions: "play none none none",
      },
      opacity: 0,
      y: 40,
      z: -80,
      rotationX: -10,
      duration: 0.8,
      ease: "power3.out",
      transformPerspective: 800,
    });

    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: ".feature-grid",
        start: "top 85%",
        toggleActions: "play none none none",
      },
      opacity: 0,
      y: 80,
      z: -150,
      rotationX: -15,
      rotationY: (i) => (i % 2 === 0 ? -10 : 10),
      stagger: {
        each: 0.1,
        from: "start",
      },
      duration: 0.9,
      ease: "power4.out",
      transformPerspective: 1000,
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="features" className="relative py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="feature-heading text-center mb-14 sm:mb-18" style={{ perspective: "800px" }}>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0cdcf7]/10 text-xs font-semibold text-[#0cdcf7] mb-4 border border-[#0cdcf7]/20">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
            <span className="text-white">Everything You Need to </span>
            <span className="bg-gradient-to-r from-[#0cdcf7] via-[#8d30ff] to-[#ff4fba] bg-clip-text text-transparent">
              Manage Typesense
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[#8b8da0] max-w-2xl mx-auto font-medium">
            A complete toolkit for exploring and managing your Typesense search engine,
            designed for developers who value their time.
          </p>
        </div>

        {/* Feature grid */}
        <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" style={{ perspective: "1200px" }}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Tilt3DCard
                key={feature.title}
                className="feature-card group relative landing-card rounded-2xl p-6 sm:p-7 hover:shadow-2xl hover:shadow-black/30 cursor-default"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 40px ${feature.glowColor}, 0 0 30px ${feature.glowColor}` }}
                />

                <div className="relative" style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-5 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    style={{ transform: "translateZ(20px)" }}
                  >
                    <div className="w-full h-full bg-[#12141f] rounded-[10px] flex items-center justify-center">
                      <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight" style={{ transform: "translateZ(15px)" }}>
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-[15px] text-[#8b8da0] leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                    {feature.description}
                  </p>
                </div>
              </Tilt3DCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
