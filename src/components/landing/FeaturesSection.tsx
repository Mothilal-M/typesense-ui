import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Database,
  Search,
  SlidersHorizontal,
  Edit3,
  MoonStar,
  TerminalSquare,
  Layers,
  MonitorSmartphone,
} from "lucide-react";
import { useTilt3D } from "../../hooks/useMouse3D";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: Database,
    title: "Visual Collections",
    desc: "Browse all collections, track document counts, and dive into your search schema effortlessly.",
    color: "#0cdcf7",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    desc: "Experience sub-millisecond, typo-tolerant search across all your text fields in real-time.",
    color: "#8d30ff",
  },
  {
    icon: SlidersHorizontal,
    title: "Dynamic Filters",
    desc: "Auto-generated facets let you filter by string matches, numeric ranges, and booleans.",
    color: "#ff4fba",
  },
  {
    icon: Edit3,
    title: "Document CRUD",
    desc: "Create, read, update, and delete documents with a fully integrated JSON editor.",
    color: "#4ff0b7",
  },
  {
    icon: Layers,
    title: "Visual Schema Creator",
    desc: "Define index properties, sort fields, and nested objects without writing scripts.",
    color: "#0cdcf7",
  },
  {
    icon: TerminalSquare,
    title: "Zero Setup CLI",
    desc: "Run `npx typesense-ui` to spin up the dashboard against any local or remote server.",
    color: "#8d30ff",
  },
  {
    icon: MoonStar,
    title: "Beautiful Dark Mode",
    desc: "A meticulously crafted interface that’s easy on the eyes during late-night debugging.",
    color: "#ff4fba",
  },
  {
    icon: MonitorSmartphone,
    title: "Fully Responsive",
    desc: "Manage your search from your desktop, tablet, or phone. It works everywhere.",
    color: "#4ff0b7",
  },
];

function FeatureCard({ feature }: { feature: typeof FEATURES[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltStyle = useTilt3D(cardRef, 10);

  return (
    <div
      ref={cardRef}
      style={tiltStyle}
      className="landing-card flex-shrink-0 w-[300px] h-[340px] p-8 rounded-2xl flex flex-col items-start gap-6 group transition-all duration-300"
    >
      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
        style={{ 
          backgroundColor: `${feature.color}15`,
          boxShadow: `0 0 20px ${feature.color}30` 
        }}
      >
        <feature.icon size={28} color={feature.color} />
      </div>
      
      <div>
        <h3 className="text-xl font-heading font-semibold text-white mb-3">
          {feature.title}
        </h3>
        <p className="text-[var(--landing-text-secondary)] leading-relaxed">
          {feature.desc}
        </p>
      </div>

      <div className="mt-auto w-full h-[1px] bg-gradient-to-r from-transparent via-[#1e2035] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only apply horizontal scroll on desktop
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const wrapper = scrollWrapperRef.current;
      if (!wrapper) return;

      const itemsWidth = wrapper.scrollWidth;
      const windowWidth = window.innerWidth;

      gsap.to(wrapper, {
        x: () => -(itemsWidth - windowWidth + 100), // padding
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${itemsWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(".scroll-progress-fill", { scaleX: self.progress });
          }
        }
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="landing-section bg-[#0a0a1a] py-24 lg:py-0 lg:h-screen flex flex-col justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16 w-full relative z-10">
        <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
          Everything You Need,
          <br />
          <span className="text-gradient-neon">Out of the Box.</span>
        </h2>
        <p className="text-[var(--landing-text-secondary)] text-lg max-w-2xl">
          Say goodbye to complex curl commands. Typesense UI gives you complete control over your search data with a beautiful, intuitive interface.
        </p>
      </div>

      <div className="pl-6 md:pl-[calc((100vw-1280px)/2+24px)] feature-scroll-container">
        <div ref={scrollWrapperRef} className="flex flex-wrap lg:flex-nowrap gap-6 pb-8 lg:pb-0">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </div>
      </div>
      
      {/* Scroll indicator overlay */}
      <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-1 bg-[#1e2035]">
        <div className="scroll-progress-fill h-full bg-gradient-to-r from-[#0cdcf7] via-[#8d30ff] to-[#ff4fba] w-full origin-left scale-x-0" />
      </div>
    </section>
  );
}
