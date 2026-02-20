import { useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DashboardIllustration } from "./icons/DashboardIllustration";
import { useMouse3D } from "../../hooks/useMouse3D";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouse = useMouse3D();

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // 3D entrance animations
    tl.from(".hero-badge", {
      opacity: 0, y: 40, rotationX: -30, duration: 0.7,
      transformPerspective: 800, transformOrigin: "center bottom",
    })
      .from(".hero-word", {
        opacity: 0, y: 50, z: -80, rotationX: -20, stagger: 0.07, duration: 0.6,
        transformPerspective: 600,
      }, "-=0.4")
      .from(".hero-subtitle", {
        opacity: 0, y: 30, z: -40, duration: 0.6,
        transformPerspective: 600,
      }, "-=0.2")
      .from(".hero-cta", {
        opacity: 0, y: 30, z: -60, scale: 0.9, stagger: 0.15, duration: 0.6,
        transformPerspective: 600,
      }, "-=0.3")
      .from(".hero-3d-card", {
        opacity: 0, x: 100, z: -200, rotationY: -25, scale: 0.8, duration: 1.2,
        transformPerspective: 1000, ease: "power4.out",
      }, "-=0.7")
      .from(".hero-floating-card", {
        opacity: 0, y: 40, z: -100, scale: 0.7, stagger: 0.15, duration: 0.8,
        transformPerspective: 800,
      }, "-=0.6")
      .from(".hero-stat", {
        opacity: 0, y: 20, z: -30, stagger: 0.1, duration: 0.4,
        transformPerspective: 600,
      }, "-=0.4");
  }, { scope: sectionRef });

  const headlineWords = "Manage Your Search Engine Visually".split(" ");

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center pt-20 sm:pt-24 pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — Text content */}
          <div style={{ perspective: "1000px" }}>
            {/* Badge */}
            <div className="hero-badge inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-purple-700/50 mb-6 sm:mb-8 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">
                Open Source Typesense Dashboard
              </span>
            </div>

            {/* Headline with 3D word reveal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-5 sm:mb-6" style={{ perspective: "800px" }}>
              {headlineWords.map((word, i) => (
                <span key={i} className="hero-word inline-block mr-2.5 sm:mr-3" style={{ transformStyle: "preserve-3d" }}>
                  <span className={
                    i >= 3
                      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                      : "text-gray-900 dark:text-white"
                  }>
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg mb-8 leading-relaxed font-medium">
              A beautiful, modern dashboard to browse collections, search documents,
              and manage your Typesense data — all from your browser.
            </p>

            {/* CTA Buttons with 3D hover */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-10 sm:mb-12" style={{ perspective: "600px" }}>
              <Link
                to="/app"
                className="hero-cta group px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow-xl shadow-purple-500/25 hover:shadow-2xl transition-all duration-300 flex items-center space-x-2"
                style={{
                  transform: "translateZ(0px)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateZ(20px) scale(1.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateZ(0px) scale(1)"; }}
              >
                <span>Get Started</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 font-semibold border border-gray-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                style={{ transform: "translateZ(0px)", transition: "transform 0.3s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateZ(15px) scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateZ(0px) scale(1)"; }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span>GitHub</span>
              </a>
            </div>

            {/* Stats with 3D depth */}
            <div className="flex flex-wrap gap-6 sm:gap-8" style={{ perspective: "600px" }}>
              {[
                { value: "100%", label: "Open Source" },
                { value: "<1ms", label: "Search Speed" },
                { value: "Zero", label: "Config Needed" },
              ].map((stat) => (
                <div key={stat.label} className="hero-stat" style={{ transformStyle: "preserve-3d" }}>
                  <div className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — 3D Illustration with floating cards */}
          <div className="hero-3d-card relative hidden lg:block" style={{ perspective: "1200px", transformStyle: "preserve-3d" }}>
            <div
              className="relative"
              style={{
                transform: `rotateY(${mouse.x * 8}deg) rotateX(${-mouse.y * 5}deg) translateZ(0px)`,
                transition: "transform 0.4s ease-out",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Glow behind */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl scale-110" style={{ transform: "translateZ(-30px)" }} />

              {/* Main card with 3D depth */}
              <div
                className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-2xl p-4 sm:p-6"
                style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}
              >
                <DashboardIllustration className="w-full h-auto" />
              </div>

              {/* Floating mini-cards around the illustration */}
              <div
                className="hero-floating-card absolute -top-6 -right-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-3 shadow-xl border border-gray-200/50 dark:border-slate-700/50"
                style={{
                  transform: `translateZ(60px) rotateY(${mouse.x * 3}deg)`,
                  transition: "transform 0.3s ease-out",
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-100">Search Time</div>
                    <div className="text-[10px] text-green-600 dark:text-green-400 font-semibold">0.4ms</div>
                  </div>
                </div>
              </div>

              <div
                className="hero-floating-card absolute -bottom-4 -left-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-3 shadow-xl border border-gray-200/50 dark:border-slate-700/50"
                style={{
                  transform: `translateZ(50px) rotateX(${mouse.y * 3}deg)`,
                  transition: "transform 0.3s ease-out",
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-100">Collections</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">12 Active</div>
                  </div>
                </div>
              </div>

              <div
                className="hero-floating-card absolute top-1/2 -right-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-3 shadow-xl border border-gray-200/50 dark:border-slate-700/50"
                style={{
                  transform: `translateZ(70px) rotateY(${mouse.x * 5}deg)`,
                  transition: "transform 0.3s ease-out",
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-100">Documents</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">1.2M indexed</div>
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
