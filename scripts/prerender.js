/**
 * Pre-render script for SEO.
 * 
 * Generates static HTML snapshots of key routes so search engine crawlers
 * can index the full content even though this is a SPA.
 * 
 * Usage: node scripts/prerender.js
 * 
 * This creates a _prerender/ directory with HTML files for each route.
 * You can serve these via your CDN/hosting for crawler user agents,
 * or integrate with a service like prerender.io.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROUTES = [
  { path: "/", file: "index.html" },
  { path: "/app", file: "app/index.html" },
];

const DIST_DIR = resolve(__dirname, "../dist");
const PRERENDER_DIR = resolve(__dirname, "../dist/_prerender");

function generatePrerenderedHTML() {
  const templatePath = resolve(DIST_DIR, "index.html");
  
  if (!existsSync(templatePath)) {
    console.error("Build the project first: npm run build");
    process.exit(1);
  }

  const template = readFileSync(templatePath, "utf-8");

  // SEO content for each route
  const routeContent = {
    "/": {
      title: "Typesense UI — Open Source Search Engine Dashboard & Admin Panel",
      description: "A modern, open-source visual dashboard for managing Typesense search engine collections. AI-powered queries, real-time search, schema editor, and zero-install CLI.",
      content: `
        <div id="seo-content" style="position:absolute;left:-9999px">
          <h1>Typesense UI — Open Source Search Engine Dashboard</h1>
          <h2>Manage Your Search, Powered by AI</h2>
          <p>A modern visual dashboard for Typesense with a built-in AI assistant. Explore collections, tweak data, and converse with your search schemas—all right from your browser.</p>
          
          <h2>Features</h2>
          <h3>Visual Collections</h3>
          <p>Browse all collections, track document counts, and dive into your search schema effortlessly.</p>
          <h3>Full-Text Search</h3>
          <p>Experience sub-millisecond, typo-tolerant search across all your text fields in real-time.</p>
          <h3>Dynamic Filters</h3>
          <p>Auto-generated facets let you filter by string matches, numeric ranges, and booleans.</p>
          <h3>Document CRUD</h3>
          <p>Create, read, update, and delete documents with a fully integrated JSON editor.</p>
          <h3>Visual Schema Creator</h3>
          <p>Define index properties, sort fields, and nested objects without writing scripts.</p>
          <h3>Zero Setup CLI</h3>
          <p>Run npx typesense-ui to spin up the dashboard against any local or remote server.</p>
          <h3>Beautiful Dark Mode</h3>
          <p>A meticulously crafted interface that's easy on the eyes during late-night debugging.</p>
          <h3>Fully Responsive</h3>
          <p>Manage your search from your desktop, tablet, or phone. It works everywhere.</p>
          
          <h2>AI-Powered Search</h2>
          <p>Natural Language Queries — Ask questions in plain English. Gemini translates them into precise Typesense search parameters.</p>
          <p>Schema-Aware Intelligence — The AI automatically reads your collections and understands your data structure.</p>
          
          <h2>How It Works</h2>
          <ol>
            <li>Connect — Enter your Typesense server details. No backend configuration needed.</li>
            <li>Explore — Browse collections. The dashboard automatically reads your schema.</li>
            <li>Manage — Create or edit documents with the built-in JSON editor.</li>
            <li>Ask AI — Open the chat panel and ask questions about your data in plain English.</li>
          </ol>
          
          <h2>Quick Start</h2>
          <p>Run npx typesense-ui in your terminal. Opens at http://localhost:3000. No install needed.</p>
          
          <h2>Links</h2>
          <a href="https://github.com/Mothilal-M/typesense-ui">GitHub Repository</a>
          <a href="https://www.npmjs.com/package/typesense-ui">npm Package</a>
        </div>
      `,
    },
    "/app": {
      title: "Dashboard — Typesense UI",
      description: "Connect to your Typesense server and manage collections, documents, and search configurations with an intuitive visual interface.",
      content: `
        <div id="seo-content" style="position:absolute;left:-9999px">
          <h1>Typesense UI Dashboard</h1>
          <p>Connect to your Typesense server to manage collections, documents, and search configurations.</p>
        </div>
      `,
    },
  };

  for (const route of ROUTES) {
    const config = routeContent[route.path];
    if (!config) continue;

    let html = template;
    
    // Inject SEO content before closing </body>
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${config.content}</div>`
    );

    // Update title
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${config.title}</title>`
    );

    const outputPath = resolve(PRERENDER_DIR, route.file);
    const outputDir = dirname(outputPath);
    
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputPath, html, "utf-8");
    console.log(`✓ Pre-rendered: ${route.path} → ${route.file}`);
  }

  console.log(`\nPre-rendered ${ROUTES.length} routes to ${PRERENDER_DIR}`);
}

generatePrerenderedHTML();
