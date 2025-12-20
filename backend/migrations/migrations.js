/**
 * Database migrations for local-notes-mcp
 * 
 * Each migration has:
 * - version: sequential integer starting from 1
 * - up: SQL string or function to apply the migration
 * - down: SQL string or function to revert the migration
 * 
 * The library uses SQLite's user_version pragma to track the current schema version.
 */

export const migrations = [
  {
    version: 1,
    up: `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL,
        api_key TEXT,
        settings TEXT DEFAULT '{}',
        is_admin INTEGER DEFAULT 0
      );

      -- Unique index on api_key for fast lookups
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

      -- Notes table
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        user_id INTEGER,
        favorite INTEGER DEFAULT 0
      );
    `,
    down: `
      DROP INDEX IF EXISTS idx_users_api_key;
      DROP TABLE IF EXISTS notes;
      DROP TABLE IF EXISTS users;
    `
  }
];

// For future migrations, add new entries with incrementing version numbers:
// {
//   version: 2,
//   up: `ALTER TABLE notes ADD COLUMN some_new_column TEXT;`,
//   down: `ALTER TABLE notes DROP COLUMN some_new_column;`
// }
