const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/local_notes_mcp.db');
const db = new Database(dbPath);

console.log("Fixing database...");

// 1. Move notes from ID 4 to ID 1
const moveInfo = db.prepare("UPDATE notes SET user_id = 1 WHERE user_id = 4").run();
console.log(`Moved ${moveInfo.changes} notes from User 4 to User 1.`);

// 2. Delete duplicate users (ID 3 and 4)
const delInfo = db.prepare("DELETE FROM users WHERE id IN (3, 4)").run();
console.log(`Deleted ${delInfo.changes} duplicate users.`);

// 3. Update User 1 password to 'adminpassword' so the credentials I gave the user work
const updateInfo = db.prepare("UPDATE users SET password = 'adminpassword' WHERE id = 1").run();
console.log(`Updated User 1 password: ${updateInfo.changes}`);

console.log("Database fix complete.");
