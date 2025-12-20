const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/local_notes_mcp.db');
const db = new Database(dbPath);

const users = db.prepare("SELECT * FROM users").all();
console.log("Users:", JSON.stringify(users, null, 2));

const notes = db.prepare("SELECT user_id, COUNT(*) as count FROM notes GROUP BY user_id").all();
console.log("Note Counts per User:", JSON.stringify(notes, null, 2));
