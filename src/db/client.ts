import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS user_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  feature TEXT NOT NULL DEFAULT 'vocab',
  mode TEXT NOT NULL,
  filter_json TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  active_duration_sec INTEGER NOT NULL DEFAULT 0,
  card_count INTEGER NOT NULL,
  cards_answered INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  quit_at_index INTEGER
);

CREATE TABLE IF NOT EXISTS session_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  session_id INTEGER NOT NULL,
  vocab_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  correct INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  response_time_ms INTEGER
);

CREATE TABLE IF NOT EXISTS vocab_progress (
  vocab_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  first_seen INTEGER,
  last_seen INTEGER,
  last_correct INTEGER,
  PRIMARY KEY (vocab_id, direction)
);

CREATE TABLE IF NOT EXISTS daily_rollup (
  date TEXT PRIMARY KEY NOT NULL,
  study_time_sec INTEGER NOT NULL DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  cards_answered INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_session_results_session ON session_results(session_id);
CREATE INDEX IF NOT EXISTS idx_session_results_vocab ON session_results(vocab_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started ON study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_vocab_progress_vocab ON vocab_progress(vocab_id);
`;

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _initPromise: Promise<void> | null = null;

export function getDb() {
  if (!_db) throw new Error('Database not initialized — call initDb() first');
  return _db;
}

export function initDb(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = Promise.resolve().then(() => {
    const sqlite = openDatabaseSync('perapera.db');
    sqlite.execSync(MIGRATION_SQL);
    _db = drizzle(sqlite, { schema });
  });
  return _initPromise;
}
