/**
 * Backend Configuration
 * 
 * Centralized configuration reading from environment variables with defaults.
 * All configurable values should be defined here.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Helper to parse integer with default
const parseIntEnv = (key, defaultValue) => {
  const val = process.env[key];
  if (val === undefined || val === "") return defaultValue;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const config = {
  // Server
  port: parseIntEnv("PORT", 31111),
  
  // Database
  dbPath: process.env.DB_PATH || "data/local_notes_mcp.db",
  
  // User/Session
  maxUsernameLength: parseIntEnv("MAX_USERNAME_LENGTH", 16),
  sessionMaxAgeDays: parseIntEnv("SESSION_MAX_AGE_DAYS", 30),
  
  // Computed: session max age in seconds
  get sessionMaxAgeSeconds() {
    return this.sessionMaxAgeDays * 24 * 60 * 60;
  },
  
  // MCP Transport
  heartbeatIntervalMs: parseIntEnv("HEARTBEAT_INTERVAL_MS", 15000),
  heartbeatStartDelayMs: parseIntEnv("HEARTBEAT_START_DELAY_MS", 2000),
  
  // API Limits
  notesDefaultLimit: parseIntEnv("NOTES_DEFAULT_LIMIT", 10),
  notesMaxLimit: parseIntEnv("NOTES_MAX_LIMIT", 100),
  jsonBodyLimitMb: parseIntEnv("JSON_BODY_LIMIT_MB", 50),
  
  // Computed: JSON body limit string for Express
  get jsonBodyLimit() {
    return `${this.jsonBodyLimitMb}mb`;
  },
};

export default config;
