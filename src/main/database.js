/**
 * FlowNote — Local Database
 *
 * We use SQLite — a file-based database that lives on the user's Mac.
 * No server, no cloud, no accounts. Just a single .db file.
 *
 * Library: better-sqlite3 (synchronous, fast, perfect for desktop apps)
 * Location: ~/Library/Application Support/FlowNote/flownote.db
 */

const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db = null;

// ─── Initialize Database ──────────────────────────────────────────────────────
function initDatabase() {
  const userDataPath = app.getPath('userData'); // ~/Library/Application Support/FlowNote
  const dbPath = path.join(userDataPath, 'flownote.db');

  db = new Database(dbPath);

  // Enable WAL mode for better performance
  // WAL = Write-Ahead Logging — allows reads while writing
  db.pragma('journal_mode = WAL');

  // Run migrations to create/update tables
  runMigrations();

  console.log(`[DB] Database initialized at: ${dbPath}`);
  return db;
}

// ─── Migrations ───────────────────────────────────────────────────────────────
// Migrations are versioned database changes. We run them in order.
// If you add a new column or table later, add a new migration — never edit old ones.
function runMigrations() {
  // Create migrations table to track which have run
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      run_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrations = [
    {
      name: '001_create_notes',
      sql: `
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,           -- UUID, generated in JS
          title TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL,         -- Markdown content
          transcript TEXT,               -- Original voice transcript
          duration_seconds INTEGER,      -- Recording length
          tags TEXT DEFAULT '[]',        -- JSON array of strings
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: '002_create_settings',
      sql: `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: '003_notes_search_index',
      sql: `
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
        USING fts5(id, title, content, content=notes, content_rowid=rowid)
      `
    }
  ];

  for (const migration of migrations) {
    const alreadyRun = db.prepare('SELECT id FROM migrations WHERE name = ?').get(migration.name);
    if (!alreadyRun) {
      db.exec(migration.sql);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
      console.log(`[DB] Migration run: ${migration.name}`);
    }
  }
}

// ─── Note Queries ─────────────────────────────────────────────────────────────
const noteQueries = {
  getAll: () => {
    return db.prepare(`
      SELECT * FROM notes ORDER BY created_at DESC
    `).all();
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  },

  save: (note) => {
    const stmt = db.prepare(`
      INSERT INTO notes (id, title, content, transcript, duration_seconds, tags)
      VALUES (@id, @title, @content, @transcript, @duration_seconds, @tags)
    `);
    return stmt.run(note);
  },

  update: (id, data) => {
    const stmt = db.prepare(`
      UPDATE notes
      SET title = @title, content = @content, tags = @tags, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    return stmt.run({ ...data, id });
  },

  delete: (id) => {
    return db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  },

  search: (query) => {
    // Full-text search across title and content
    return db.prepare(`
      SELECT notes.* FROM notes
      INNER JOIN notes_fts ON notes.id = notes_fts.id
      WHERE notes_fts MATCH ?
      ORDER BY rank
    `).all(query);
  }
};

module.exports = { initDatabase, noteQueries };
