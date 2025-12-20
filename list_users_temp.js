import Database from "better-sqlite3";
const db = new Database("data/local_notes_mcp.db");

const users = db.prepare("SELECT id, username, created_at FROM users").all();
console.table(users);
