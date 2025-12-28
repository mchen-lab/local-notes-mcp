/**
 * Local Notes MCP - Server
 * Copyright (c) 2025 Michael Chen (mchen-lab)
 * https://github.com/mchen-lab/local-notes-mcp
 * Licensed under MIT License
 */

import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

import config from "./src/config.js";
import { initializeDb, getUserCount } from "./notesDb.js";
import { setupFrontend } from "./src/frontend.js";

// Routes
import notesRoutes from "./src/routes/notes.js";
import usersRoutes from "./src/routes/users.js";
import adminRoutes from "./src/routes/admin.js";
import mcpRoutes from "./src/mcp/transport.js";
import imagesRoutes from "./src/routes/images.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const PORT = config.port;

const app = express();
export { app };

app.use(cors());

// Initialize DB with default path (from env or data/...)
initializeDb();

// --- CRITICAL FIX: Only parse JSON for REST API routes ---
// This prevents Express from consuming the stream for MCP requests.
app.use("/api", express.json({ limit: config.jsonBodyLimit }));

// Mount Routes
app.use("/api/notes", notesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/images", imagesRoutes);

// Serve uploaded images statically
// We want /images/foo.png to map to ../data/images/foo.png (root/data)
app.use("/images", express.static(path.join(__dirname, "../data/images")));

// Mount MCP Transport
app.use("/mcp", mcpRoutes);

app.get("/api/system/status", (req, res) => {
  try {
    const count = getUserCount();
    res.json({ userCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
async function startServer() {
  const viteEnabled = await setupFrontend(app);
  const server = http.createServer(app);

  // TUNING: Increase Keep-Alive timeout to prevent premature socket closure
  // This is critical for long-lived SSE connections on some networks.
  server.keepAliveTimeout = config.keepAliveTimeoutMs; 
  server.headersTimeout = config.headersTimeoutMs;

  // Add error handler for server.listen()
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Error: Port ${PORT} is already in use.`);
      console.error(`   Please stop the process using port ${PORT} or wait a moment and try again.`);
      console.error(`   You can find the process with: lsof -ti :${PORT}`);
    } else {
      console.error(`❌ Server error:`, err);
    }
    process.exit(1);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.error(`Server running on http://0.0.0.0:${PORT}/`);
    console.error(`  Web UI: http://0.0.0.0:${PORT}/`);
    console.error(`  REST API: http://0.0.0.0:${PORT}/api/notes`);
    console.error(`  MCP Endpoint (SSE): http://0.0.0.0:${PORT}/mcp`);
    if (viteEnabled) {
      console.error(`  🔥 Hot reload enabled`);
    }
  });
}

// Export startServer for testing or external control if needed
export { startServer };

// Check if run directly
const isMain = process.argv[1] && (
  process.argv[1] === __filename || 
  process.argv[1].endsWith('backend/server.js') ||
  process.argv[1].endsWith('server.js')
);

if (isMain) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}