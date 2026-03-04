/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    // Optimize chunk splitting for better caching and loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
          "vendor-gsap": ["gsap"],
          "vendor-ai": ["@google/generative-ai", "react-markdown", "remark-gfm"],
        },
      },
    },
    // Enable source maps for debugging but not in production
    sourcemap: false,
    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Target modern browsers for smaller bundles
    target: "es2020",
    // CSS code splitting
    cssCodeSplit: true,
    // Asset inlining threshold
    assetsInlineLimit: 4096,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    exclude: ["**/node_modules/**", "**/.claude/**"],
  },
});
