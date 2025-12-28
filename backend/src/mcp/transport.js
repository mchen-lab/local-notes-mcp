import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { getUserByApiKey } from "../../notesDb.js";
import { userContext } from "../middleware/context.js";
import { mcpServer } from "./index.js";
import config from "../config.js";

const router = express.Router();
const transports = new Map();

// MCP SSE Endpoint (Connection)
router.get("/:apiKey?", async (req, res) => {
  try {
    const apiKey = req.params.apiKey;
    const userAgent = req.get("user-agent") || "unknown";
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    
    // Log connection attempt with context
    const logContext = {
      apiKey: apiKey ? (apiKey.length > 4 ? `${apiKey.substring(0, 4)}...` : apiKey) : "none",
      userAgent: userAgent.substring(0, 50), // Truncate long user agents
      ip: ip,
    };

    let userId = null;
    if (apiKey) {
      const user = getUserByApiKey(apiKey);
      if (user) {
        userId = user.id;
        console.error("✅ MCP connection authenticated:", {
          userId: userId,
          username: user.username,
          ...logContext,
        });
      } else {
        console.error(`⚠️  MCP connection with invalid API key:`, logContext);
      }
    } else {
      console.error("ℹ️  MCP connection (anonymous):", logContext);
    }

    // Disable Express timeout for this long-lived SSE connection
    req.setTimeout(0);
    res.setTimeout(0);
    
    // Set additional SSE headers (transport will set Content-Type and status)
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering if present

    // Initialize transport
    // The first argument tells Cursor where to send POST messages
    // IMPORTANT: It needs to match the mounted path in express.
    // If we mount this router at /mcp, then messages are at /mcp/messages
    const transport = new SSEServerTransport("/mcp/messages", res);
    const sessionId = transport.sessionId;

    // Store transport and userId
    transports.set(sessionId, { transport, userId });

    // Connect the server
    // NOTE: This automatically writes the 200 OK and Content-Type headers
    await mcpServer.connect(transport);
    
    console.error(`✅ MCP SSE connection established: sessionId=${sessionId}`);

    // Store heartbeat interval ID for cleanup
    let heartbeat = null;

    // Cleanup function to avoid duplicate cleanup
    const cleanup = () => {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      if (transports.has(sessionId)) {
        transports.delete(sessionId);
        console.error(`MCP session cleaned up: sessionId=${sessionId}`);
      }
    };

    // Start heartbeat after a short delay to allow initial handshake to complete
    // Heartbeat: Send a comment to keep connection alive
    setTimeout(() => {
      heartbeat = setInterval(() => {
        try {
          // Only write if the stream is still open and writable
          if (res.writable && !res.destroyed && !res.closed) {
            res.write(":\n\n");
          } else {
            // Connection closed, cleanup
            cleanup();
            console.error(`MCP heartbeat stopped: sessionId=${sessionId} (connection closed)`);
          }
        } catch (err) {
          console.error(`MCP heartbeat error for sessionId=${sessionId}:`, err.message);
          cleanup();
        }
      }, config.heartbeatIntervalMs);
    }, config.heartbeatStartDelayMs);

    // Handle connection errors - use once to avoid duplicate handlers
    res.once("close", () => {
      console.error(`MCP SSE connection closed: sessionId=${sessionId}`);
      cleanup();
    });

    res.once("error", (err) => {
      console.error(`MCP SSE connection error for sessionId=${sessionId}:`, err.message);
      cleanup();
    });

    // Cleanup on transport close
    transport.onclose = () => {
      console.error(`MCP transport closed: sessionId=${sessionId} (transport.onclose called)`);
      cleanup();
    };
    
    // Log when messages are received to track activity
    console.error(`MCP session ready: sessionId=${sessionId}, waiting for messages...`);

  } catch (err) {
    console.error("Error handling MCP connection:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    }
  }
});

// MCP Message Endpoint
router.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const session = transports.get(sessionId);

  if (!session) {
    console.warn(`MCP message received for unknown session: ${sessionId}`);
    res.status(404).send("Session not found");
    return;
  }

  const { transport, userId } = session;
  
  console.error(`MCP message received: sessionId=${sessionId}, userId=${userId || 'anonymous'}`);

  try {
    // Run the request in the context of the user
    await userContext.run(userId, async () => {
      // Handle the raw stream (since we removed global express.json() for this route)
      await transport.handlePostMessage(req, res);
    });
    console.error(`MCP message processed successfully: sessionId=${sessionId}`);
  } catch (error) {
    console.error(`Error processing MCP message for sessionId=${sessionId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Error" });
    }
  }
});

export default router;
