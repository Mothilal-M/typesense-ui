#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "vite";
import express from "express";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

console.log("\n🚀 Starting Typesense UI...\n");

// Check if running from built dist or dev mode
const distPath = join(rootDir, "dist");
const isBuilt = (() => {
  try {
    readFileSync(join(distPath, "index.html"));
    return true;
  } catch {
    return false;
  }
})();

const PORT = process.env.PORT || 3000;

if (isBuilt) {
  // Production mode - serve built files
  const app = express();

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });

  app.listen(PORT, () => {
    console.log("✅ Typesense UI is running!\n");
    console.log(`📱 Local:    http://localhost:${PORT}`);
    console.log(`🌍 Network:  http://0.0.0.0:${PORT}\n`);
    console.log("💡 Press Ctrl+C to stop\n");
  });
} else {
  // Development mode - use Vite dev server
  (async () => {
    const server = await createServer({
      root: rootDir,
      server: {
        port: PORT,
        open: true,
      },
    });

    await server.listen();

    console.log("✅ Typesense UI is running in dev mode!\n");
    server.printUrls();
    console.log("\n💡 Press Ctrl+C to stop\n");
  })();
}
