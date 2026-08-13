import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const userSettings = sqliteTable('user_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const studySessions = sqliteTable('study_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  feature: text('feature').notNull().default('vocab'),
  mode: text('mode').notNull(),
  filterJson: text('filter_json'),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
  durationSec: integer('duration_sec').notNull().default(0),
  activeDurationSec: integer('active_duration_sec').notNull().default(0),
  cardCount: integer('card_count').notNull(),
  cardsAnswered: integer('cards_answered').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  completed: integer('completed').notNull().default(0),
  quitAtIndex: integer('quit_at_index'),
});

export const sessionResults = sqliteTable('session_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(),
  vocabId: text('vocab_id').notNull(),
  direction: text('direction').notNull(),
  correct: integer('correct').notNull(),
  ts: integer('ts').notNull(),
  responseTimeMs: integer('response_time_ms'),
});

export const vocabProgress = sqliteTable('vocab_progress', {
  vocabId: text('vocab_id').notNull(),
  direction: text('direction').notNull(),
  correctCount: integer('correct_count').notNull().default(0),
  incorrectCount: integer('incorrect_count').notNull().default(0),
  firstSeen: integer('first_seen'),
  lastSeen: integer('last_seen'),
  lastCorrect: integer('last_correct'),
}, (t) => [primaryKey({ columns: [t.vocabId, t.direction] })]);

export const dailyRollup = sqliteTable('daily_rollup', {
  date: text('date').primaryKey(),
  studyTimeSec: integer('study_time_sec').notNull().default(0),
  sessionsCount: integer('sessions_count').notNull().default(0),
  cardsAnswered: integer('cards_answered').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
});
