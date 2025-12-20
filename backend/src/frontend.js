import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

// NOTE: We need to point to the correct directories relative to THIS file.
// This file is in: backend/src/frontend.js
// Repository root is: backend/.. (which is technically just one level up if we consider backend as root context for node, but actually repo root is ../../)
// Wait, the project structure is:
// /workspace/local-notes-mcp2/
//   backend/
//     src/frontend.js
//     server.js
//   frontend/
//     dist/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/src is where we are.
// We need to reach ../../frontend/dist
const distDir = path.resolve(__dirname, "../../frontend/dist");

// Development mode: when dist directory doesn't exist AND NODE_ENV is not explicitly production
// If dist exists, use production mode (serves static files)
const isDev = !fs.existsSync(distDir) && process.env.NODE_ENV !== "production";

// Serve frontend - use Vite in dev mode, static files in production
export async function setupFrontend(app) {
  if (isDev) {
    // Development mode: Use Vite middleware for hot-reload
    try {
      const { createServer: createViteServer } = await import("vite");
      const frontendDir = path.resolve(__dirname, "../../frontend");
      
      // Change to frontend directory so PostCSS/Tailwind configs are found
      // Note: We don't restore this because PostCSS processes files lazily
      process.chdir(frontendDir);
      
      const vite = await createViteServer({
        server: { 
          middlewareMode: true
        },
        appType: "spa",
        root: frontendDir,
        configFile: path.resolve(frontendDir, "vite.config.js"),
      });

      // Use Vite middleware for all routes except API and MCP
      app.use((req, res, next) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/mcp")) {
          return next();
        }
        vite.middlewares(req, res, next);
      });

      console.error("✅ Development mode: Vite HMR enabled");
      return true;
    } catch (err) {
      console.warn("⚠️  Vite not available, falling back to static files:", err.message);
      // Fallback to static files if Vite is not available
      if (fs.existsSync(distDir)) {
        app.use(express.static(distDir));
        app.get("*", (req, res, next) => {
          if (req.path.startsWith("/api") || req.path.startsWith("/mcp")) {
            return next();
          }
          res.sendFile(path.join(distDir, "index.html"));
        });
      }
      return false;
    }
  } else {
    // Production mode: Serve static files
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/mcp")) {
          return next();
        }
        res.sendFile(path.join(distDir, "index.html"));
      });
      console.error("✅ Production mode: Serving static files from frontend/dist");
      return false;
    } else {
      console.warn("⚠️  Frontend dist directory not found. Run 'npm run build --workspace=frontend' first.");
      return false;
    }
  }
}
