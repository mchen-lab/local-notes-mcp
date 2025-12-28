/**
 * Local Notes MCP - Database Layer
 * Copyright (c) 2025 Michael Chen (mchen-lab)
 * https://github.com/mchen-lab/local-notes-mcp
 * Licensed under MIT License
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import crypto from "crypto";
import dotenv from "dotenv";
import { migrate } from "@blackglory/better-sqlite3-migrations";
import { migrations } from "./migrations/migrations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// Database connection (initialized by initializeDb)
let db;

// Export db for tests if needed (though using functions is better)
export { db };

// Generate a short random API key (for user identification, not security)
function generateApiKey() {
  // Generate 8 random bytes and convert to base64url-like string (12 characters)
  // Using alphanumeric characters for readability
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(8);
  let key = "";
  for (let i = 0; i < 8; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}

// Simple password hashing using SHA256 with salt
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

// Verify password against stored hash
function verifyPassword(password, storedHash) {
  // Handle plain text passwords (for backwards compatibility with existing users)
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }
  const [salt, hash] = storedHash.split(':');
  const inputHash = crypto.createHash('sha256').update(salt + password).digest('hex');
  return hash === inputHash;
}

// Initialize database: setup paths, run migrations
export function initializeDb(customDbPath = null) {
  // Get database file path from environment or use default
  // Default: data/local_notes_mcp.db
  let dbFilePath = customDbPath || process.env.DB_PATH || "data/local_notes_mcp.db";
  
  // If the path doesn't start with "data/" and is not absolute and is not :memory:, prepend it
  if (dbFilePath !== ":memory:" && !dbFilePath.startsWith("data/") && !path.isAbsolute(dbFilePath)) {
    dbFilePath = `data/${dbFilePath}`;
  }
  
  const dbPath = dbFilePath === ":memory:" ? ":memory:" : path.resolve(__dirname, "..", dbFilePath);

  if (dbFilePath !== ":memory:") {
    // Ensure directory exists for database file
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }



  // Open database (creates if it doesn't exist)
  db = new Database(dbPath);

  // Run migrations
  // The migrate function uses SQLite's user_version pragma to track schema version.
  // For existing databases that already have the schema, we need to set the user_version
  // to indicate that migration 1 has already been applied.
  const currentVersion = db.pragma("user_version", { simple: true });
  
  if (currentVersion === 0) {
    // Check if this is an existing database with tables already created
    // (Only relevant for non-memory databases)
    const tablesExist = dbFilePath !== ":memory:" && db.prepare(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name IN ('users', 'notes')"
    ).get().count === 2;
    
    if (tablesExist) {
      // Existing database - mark baseline migration as applied
      console.log("Existing database detected. Setting schema version to 1.");
      db.pragma("user_version = 1");
    } else {
      // New database - run all migrations
      console.log("New database. Running migrations...");
      migrate(db, migrations);
      console.log("Migrations complete.");
    }
  } else {
    // Database has a version set - run any new migrations
    const maxMigrationVersion = Math.max(...migrations.map(m => m.version));
    if (currentVersion < maxMigrationVersion) {
      console.log(`Upgrading database from version ${currentVersion} to ${maxMigrationVersion}...`);
      migrate(db, migrations);
      console.log("Migrations complete.");
    }
  }

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

function rowToNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    favorite: row.favorite ? true : false,
  };
}

function getUserFilter(userId) {
  if (userId == null) {
    return { sql: "user_id IS NULL", params: [] };
  }
  return { sql: "user_id = ?", params: [userId] };
}

export function listNotes(userId) {
  const { sql: userSql, params } = getUserFilter(userId);
  const rows = db
    .prepare(
      `SELECT id, title, content, created_at, updated_at, favorite FROM notes WHERE ${userSql} ORDER BY id ASC`
    )
    .all(...params);
  return rows.map(rowToNote);
}

export function listNotesByCreatedRange(userId, fromIso, toIso) {
  const clauses = [];
  const params = [];
  if (userId == null) {
    clauses.push("user_id IS NULL");
  } else {
    clauses.push("user_id = ?");
    params.push(userId);
  }
  if (fromIso) {
    clauses.push("created_at >= ?");
    params.push(fromIso);
  }
  if (toIso) {
    clauses.push("created_at < ?");
    params.push(toIso);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const sql = `SELECT id, title, content, created_at, updated_at, favorite FROM notes ${where} ORDER BY created_at DESC`;
  const rows = db.prepare(sql).all(...params);
  return rows.map(rowToNote);
}

export function listNotesUpdatedSince(userId, sinceIso) {
  const clauses = [];
  const params = [];
  if (userId == null) {
    clauses.push("user_id IS NULL");
  } else {
    clauses.push("user_id = ?");
    params.push(userId);
  }
  if (sinceIso) {
    clauses.push("updated_at > ?");
    params.push(sinceIso);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const sql = `SELECT id, title, content, created_at, updated_at, favorite FROM notes ${where} ORDER BY updated_at DESC`;
  const rows = db.prepare(sql).all(...params);
  return rows.map(rowToNote);
}

export function searchNotes(userId, keyword, limit = 10) {
  const clauses = [];
  const params = [];
  
  // User filter
  if (userId == null) {
    clauses.push("user_id IS NULL");
  } else {
    clauses.push("user_id = ?");
    params.push(userId);
  }
  
  // Keyword search (case-insensitive) - search in title, content, and note ID
  if (keyword && keyword.trim()) {
    const searchTerm = `%${keyword.trim()}%`;
    const keywordTrimmed = keyword.trim();
    
    // Check if keyword is a number (for ID matching)
    const isNumeric = /^\d+$/.test(keywordTrimmed);
    
    if (isNumeric) {
      // If keyword is numeric, also match against ID
      clauses.push("(title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE OR CAST(id AS TEXT) = ?)");
      params.push(searchTerm, searchTerm, keywordTrimmed);
    } else {
      // Otherwise just search title and content
      clauses.push("(title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE)");
      params.push(searchTerm, searchTerm);
    }
  }
  
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  // Order by most recent first, limit results
  const sql = `SELECT id, title, content, created_at, updated_at, favorite FROM notes ${where} ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);
  
  const rows = db.prepare(sql).all(...params);
  return rows.map(rowToNote);
}

export function getNote(id, userId) {
  const { sql: userSql, params: userParams } = getUserFilter(userId);
  const row = db
    .prepare(
      `SELECT id, title, content, created_at, updated_at, favorite FROM notes WHERE id = ? AND ${userSql}`
    )
    .get(id, ...userParams);
  return rowToNote(row);
}

export function createNote({ title, content }, userId) {
  const now = new Date().toISOString();
  // unify INSERT: if userId is null/undefined, passing it as param to user_id column works if column is nullable (it inserts NULL)
  // But we need to be handled careful if userId is undefined vs null. 
  // Code passed strict values.
  const userParam = userId ?? null;
  
  const stmt = db.prepare(
    "INSERT INTO notes (title, content, created_at, updated_at, user_id, favorite) VALUES (?, ?, ?, ?, ?, 0)"
  );
  const info = stmt.run(title, content, now, now, userParam);
  return getNote(info.lastInsertRowid, userId);
}

export function updateNote(id, { title, content, favorite }, userId) {
  const existing = getNote(id, userId);
  if (!existing) return null;
  const now = new Date().toISOString();
  const newTitle = title ?? existing.title;
  const newContent = content ?? existing.content;
  const newFavorite = favorite !== undefined ? (favorite ? 1 : 0) : (existing.favorite ? 1 : 0);
  
  const { sql: userSql, params: userParams } = getUserFilter(userId);

  const stmt = db.prepare(
    `UPDATE notes SET title = ?, content = ?, updated_at = ?, favorite = ? WHERE id = ? AND ${userSql}`
  );
  stmt.run(newTitle, newContent, now, newFavorite, id, ...userParams);

  return getNote(id, userId);
}

export function appendNote(id, text, userId) {
  const existing = getNote(id, userId);
  if (!existing) return null;
  
  if (!text) return existing;

  const now = new Date().toISOString();
  // Efficiently append: If existing content is not empty, add a newline before the new text
  const separator = existing.content && existing.content.length > 0 ? "\n\n" : "";
  const newContent = existing.content + separator + text;
  
  const { sql: userSql, params: userParams } = getUserFilter(userId);

  const stmt = db.prepare(
    `UPDATE notes SET content = ?, updated_at = ? WHERE id = ? AND ${userSql}`
  );
  stmt.run(newContent, now, id, ...userParams);

  return getNote(id, userId);
}

export function toggleFavorite(id, userId) {
  const existing = getNote(id, userId);
  if (!existing) return null;
  const newFavorite = existing.favorite ? 0 : 1;
  
  const { sql: userSql, params: userParams } = getUserFilter(userId);

  const stmt = db.prepare(
    `UPDATE notes SET favorite = ? WHERE id = ? AND ${userSql}`
  );
  stmt.run(newFavorite, id, ...userParams);
  
  return getNote(id, userId);
}

export function deleteNote(id, userId) {
  const existing = getNote(id, userId);
  if (!existing) return null;
  
  const { sql: userSql, params: userParams } = getUserFilter(userId);
  
  const stmt = db.prepare(`DELETE FROM notes WHERE id = ? AND ${userSql}`);
  stmt.run(id, ...userParams);
  
  return existing;
}

export function getSuperAdminId() {
  if (!db) return null;
  const row = db.prepare("SELECT id FROM users WHERE is_admin = 1 ORDER BY id ASC LIMIT 1").get();
  return row ? row.id : null;
}

export function createUser({ username, password }) {
  if (!username || !password) {
      throw new Error("Username and password are required.");
  }
  
  // Check for duplicate username
  const existing = db.prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE").get(username);
  if (existing) {
      throw new Error("Username already exists.");
  }

  // Check if this is the first user
  const userCount = getUserCount();
  const isAdmin = userCount === 0 ? 1 : 0;

  const now = new Date().toISOString();
  const apiKey = generateApiKey();
  // Hash password before storing
  const hashedPassword = hashPassword(password);
  const stmt = db.prepare(
    "INSERT INTO users (username, password, created_at, api_key, settings, is_admin) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const info = stmt.run(username, hashedPassword, now, apiKey, "{}", isAdmin);
  return getUserById(info.lastInsertRowid);
}

export function listUsers() {
  const superAdminId = getSuperAdminId();
  const users = db
    .prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.created_at, 
        u.api_key, 
        u.settings, 
        u.is_admin,
        COUNT(n.id) as note_count,
        MAX(n.created_at) as last_note_at
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id
      GROUP BY u.id
      ORDER BY u.id ASC
    `)
    .all();
    
  return users.map(u => ({
      ...u,
      is_super_admin: u.id === superAdminId
  }));
}

export function getUserCount() {
  return db.prepare("SELECT COUNT(*) as count FROM users").get().count;
}

export function getUserByCreds({ username, password }) {
  // First get user by username only
  const user = db
    .prepare(
      "SELECT id, username, password, created_at, api_key, settings, is_admin FROM users WHERE username = ?"
    )
    .get(username);
  
  if (!user) return null;
  
  // Verify password
  if (!verifyPassword(password, user.password)) {
    return null;
  }
  
  // Return user without password field
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function getUserById(id) {
  return db
    .prepare("SELECT id, username, created_at, api_key, settings, is_admin FROM users WHERE id = ?")
    .get(id);
}

export function getUserByApiKey(apiKey) {
  return db
    .prepare(
      "SELECT id, username, created_at, api_key, settings, is_admin FROM users WHERE api_key = ?"
    )
    .get(apiKey);
}

export function updateUser(id, updates) {
  const allowed = ["username", "password", "settings", "is_admin"];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  
  if (keys.length === 0) return getUserById(id);

  if (updates.username) {
    const existing = db.prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE").get(updates.username);
    if (existing && existing.id !== id) {
        throw new Error("Username already exists.");
    }
  }

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => {
    if (k === "settings" && typeof updates[k] === "object") {
        return JSON.stringify(updates[k]);
    }
    return updates[k];
  });

  const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
  stmt.run(...values, id);
  
  return getUserById(id);
}

export function deleteAllNotesForUser(userId) {
  if (userId == null) {
    const stmt = db.prepare("DELETE FROM notes WHERE user_id IS NULL");
    return stmt.run();
  } else {
    const stmt = db.prepare("DELETE FROM notes WHERE user_id = ?");
    return stmt.run(userId);
  }
}

export function deleteUser(userId) {
  if (!userId) return;
  // Transaction to ensure both notes and user are deleted
  const deleteUserTransaction = db.transaction((id) => {
    db.prepare("DELETE FROM notes WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  });
  deleteUserTransaction(userId);
}

export function mergeUserNotes(sourceUserId, targetUserId) {
  if (!sourceUserId || !targetUserId) return;
  const stmt = db.prepare("UPDATE notes SET user_id = ? WHERE user_id = ?");
  return stmt.run(targetUserId, sourceUserId);
}

export function importNote(userId, { title, content, createdAt, updatedAt, favorite }) {
  const now = new Date().toISOString();
  const created = createdAt || now;
  const updated = updatedAt || now;
  const fav = favorite === true ? 1 : 0;
  const userParam = userId ?? null;
  
  const stmt = db.prepare(
    "INSERT INTO notes (title, content, created_at, updated_at, user_id, favorite) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const info = stmt.run(title, content, created, updated, userParam, fav);
  return getNote(info.lastInsertRowid, userId);
}
