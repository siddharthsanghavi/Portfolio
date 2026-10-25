CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  published INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS notes_published_created
  ON notes (published, created_at DESC);
