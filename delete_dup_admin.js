import Database from "better-sqlite3";
const db = new Database("data/local_notes_mcp.db");

// Delete user 5
const stmt = db.prepare("DELETE FROM users WHERE id = ?");
const info = stmt.run(5);

console.log(`Deleted user with ID 5: ${info.changes} row(s) affected.`);

// Also list to confirm
const users = db.prepare("SELECT id, username, created_at FROM users").all();
console.table(users);
