import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  AiSection,
  HowItWorksSection,
  DemoSection,
  Footer
} from "../components/landing";

export default function LandingPage() {
  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (!prefersReducedMotion) {
      // Initialize Lenis smooth scroll
      const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
      });

      // Sync Lenis with GSAP
      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);

      // Trigger GSAP refresh
      ScrollTrigger.refresh();

      return () => {
        lenis.destroy();
        gsap.ticker.remove((time) => lenis.raf(time * 1000));
      };
    }
  }, []);

  return (
    <div className="landing-dark bg-[#0a0a1a] min-h-screen text-[var(--landing-text-primary)] font-sans antialiased overflow-x-hidden selection:bg-[#8d30ff]/30 selection:text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AiSection />
      <HowItWorksSection />
      <DemoSection />
      <Footer />
    </div>
  );
}
