import { useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Connect",
    description: "Enter your Typesense server host, port, and API key. Your credentials are securely stored in your browser — nothing leaves your machine.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.856-1.514a4.5 4.5 0 00-6.364-6.364L4.5 8.257" />
      </svg>
    ),
    gradient: "from-[#4ff0b7] to-[#0cdcf7]",
  },
  {
    number: "02",
    title: "Explore",
    description: "Browse all your collections, view schemas, and search across documents instantly. Filter, sort, and paginate with zero configuration.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    gradient: "from-[#0cdcf7] to-[#8d30ff]",
  },
  {
    number: "03",
    title: "Manage",
    description: "Create, edit, and delete documents and collections directly in the UI. Full JSON editing with validation, formatting, and instant feedback.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: "from-[#8d30ff] to-[#ff4fba]",
  },
];

function Step3DCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    el.style.transform = `perspective(800px) rotateY(${dx * 10}deg) rotateX(${-dy * 10}deg) translateZ(15px)`;
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transformStyle: "preserve-3d", transition: "transform 0.15s ease-out" }}
    >
      {children}
    </div>
  );
}

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".hiw-heading", {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 85%",
        toggleActions: "play none none none",
      },
      opacity: 0,
      y: 40,
      z: -60,
      rotationX: -8,
      duration: 0.8,
      ease: "power3.out",
      transformPerspective: 800,
    });

    gsap.from(".hiw-step", {
      scrollTrigger: {
        trigger: ".hiw-steps",
        start: "top 85%",
        toggleActions: "play none none none",
      },
      opacity: 0,
      y: 60,
      z: -200,
      rotationY: (i: number) => [-20, 0, 20][i],
      rotationX: -15,
      stagger: 0.2,
      duration: 1,
      ease: "power4.out",
      transformPerspective: 1200,
    });

    gsap.from(".hiw-connector", {
      scrollTrigger: {
        trigger: ".hiw-steps",
        start: "top 80%",
        toggleActions: "play none none none",
      },
      scaleX: 0,
      duration: 1,
      delay: 0.6,
      ease: "power2.inOut",
    });

    gsap.from(".hiw-number", {
      scrollTrigger: {
        trigger: ".hiw-steps",
        start: "top 85%",
        toggleActions: "play none none none",
      },
      opacity: 0,
      z: -100,
      scale: 0.5,
      stagger: 0.2,
      duration: 0.8,
      delay: 0.3,
      ease: "back.out(2)",
      transformPerspective: 600,
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="hiw-heading text-center mb-14 sm:mb-18" style={{ perspective: "800px" }}>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#8d30ff]/10 text-xs font-semibold text-[#8d30ff] mb-4 border border-[#8d30ff]/20">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
            <span className="text-white">Up and Running in </span>
            <span className="bg-gradient-to-r from-[#8d30ff] to-[#ff4fba] bg-clip-text text-transparent">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[#8b8da0] max-w-2xl mx-auto font-medium">
            No installation, no configuration files, no accounts. Just connect and go.
          </p>
        </div>

        {/* Steps */}
        <div className="hiw-steps relative grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6" style={{ perspective: "1200px" }}>
          {/* Connectors (desktop) */}
          <div className="hidden lg:block absolute top-24 left-[33%] right-[33%] h-0.5 z-10">
            <div className="hiw-connector h-full bg-gradient-to-r from-[#0cdcf7] to-[#8d30ff] opacity-50 origin-left rounded-full shadow-sm shadow-[#8d30ff]/20" />
          </div>
          <div className="hidden lg:block absolute top-24 left-[66%] right-[0%] h-0.5 -mr-[33%] z-10">
            <div className="hiw-connector h-full bg-gradient-to-r from-[#8d30ff] to-[#ff4fba] opacity-50 origin-left rounded-full shadow-sm shadow-[#ff4fba]/20" style={{ width: "50%" }} />
          </div>

          {steps.map((step, i) => (
            <div key={step.number} className="hiw-step relative" style={{ transformStyle: "preserve-3d" }}>
              {/* Step number */}
              <div
                className="hiw-number absolute -top-3 -left-2 text-7xl sm:text-8xl font-black text-[#1e2035]/60 select-none pointer-events-none leading-none"
                style={{ transform: "translateZ(-20px)" }}
              >
                {step.number}
              </div>

              <Step3DCard className="relative landing-card rounded-2xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-black/30 transition-shadow duration-300">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white mb-5 shadow-lg`}
                  style={{ transform: "translateZ(30px)" }}
                >
                  {step.icon}
                </div>

                {/* Content */}
                <h3
                  className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight"
                  style={{ transform: "translateZ(20px)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-[#8b8da0] leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                  {step.description}
                </p>

                {/* Step indicator */}
                <div className="mt-5 flex items-center space-x-2" style={{ transform: "translateZ(15px)" }}>
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className={`h-1.5 rounded-full transition-all ${
                        j === i
                          ? `w-8 bg-gradient-to-r ${step.gradient}`
                          : "w-1.5 bg-[#1e2035]"
                      }`}
                    />
                  ))}
                </div>
              </Step3DCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
