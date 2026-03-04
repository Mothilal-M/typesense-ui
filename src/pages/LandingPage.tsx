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
import { SEOHead } from "../components/SEOHead";

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
    <>
      <SEOHead
        title="Typesense UI — Open Source Search Engine Dashboard & Admin Panel"
        description="A modern, open-source visual dashboard for managing Typesense search engine collections. AI-powered natural language queries, real-time full-text search, dynamic filtering, schema editor, and zero-install CLI. The best Typesense admin panel for developers."
        keywords="typesense, typesense ui, typesense dashboard, typesense admin panel, search engine dashboard, typesense collections manager, open source search ui, typesense visual editor, AI search, natural language search queries, typesense react dashboard, search analytics, document management, schema editor, typesense cli, npx typesense-ui, typesense gui, search engine management tool"
        canonicalPath="/"
      />
      <a href="#features" className="skip-to-main">Skip to main content</a>
      <div
        className="landing-dark bg-[#0a0a1a] min-h-screen text-[var(--landing-text-primary)] font-sans antialiased overflow-x-hidden selection:bg-[#8d30ff]/30 selection:text-white"
        role="main"
      >
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <AiSection />
        <HowItWorksSection />
        <DemoSection />
        <Footer />
      </div>
    </>
  );
}
