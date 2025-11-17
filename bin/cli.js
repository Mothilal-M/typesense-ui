#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "vite";
import express from "express";
import { readFileSync } from "fs";
import { createServer as createHttpServer } from "http";

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

// Get port from args or environment or default
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const PORT = portArg ? parseInt(portArg.split('=')[1]) : (process.env.PORT || 3000);

// Function to find an available port
async function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = createHttpServer();
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      // Port is in use, try next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

if (isBuilt) {
  // Production mode - serve built files
  const app = express();

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });

  // Find available port and start server
  (async () => {
    const availablePort = await findAvailablePort(PORT);
    
    if (availablePort !== PORT) {
      console.log(`⚠️  Port ${PORT} is in use, using port ${availablePort} instead\n`);
    }

    app.listen(availablePort, () => {
      console.log("✅ Typesense UI is running!\n");
      console.log(`📱 Local:    http://localhost:${availablePort}`);
      console.log(`🌍 Network:  http://0.0.0.0:${availablePort}\n`);
      console.log("💡 Press Ctrl+C to stop\n");
      console.log(`💡 To use a specific port: npx typesense-ui --port=3001\n`);
    });
  })();
} else {
  // Development mode - use Vite dev server
  (async () => {
    const availablePort = await findAvailablePort(PORT);
    
    if (availablePort !== PORT) {
      console.log(`⚠️  Port ${PORT} is in use, using port ${availablePort} instead\n`);
    }

    const server = await createServer({
      root: rootDir,
      server: {
        port: availablePort,
        open: true,
        strictPort: false,
      },
    });

    await server.listen();

    console.log("✅ Typesense UI is running in dev mode!\n");
    server.printUrls();
    console.log("\n💡 Press Ctrl+C to stop");
    console.log(`💡 To use a specific port: npx typesense-ui --port=3001\n`);
  })();
}
