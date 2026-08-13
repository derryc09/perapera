import { and, eq, sql } from 'drizzle-orm';
import { StudyMode } from '../types';
import { getDb } from './client';
import { dailyRollup, sessionResults, studySessions, vocabProgress } from './schema';

export interface FilterSnapshot {
  lessons: number[];
  pos: string[];
  categories: string[];
  verbGroups: string[];
}

function todayKey(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}

async function bumpDailyRollup(
  date: string,
  activeSec: number,
  cardsAnswered: number,
  correctCount: number,
  isNewSession: boolean,
): Promise<void> {
  const db = getDb();
  await db.insert(dailyRollup)
    .values({
      date,
      studyTimeSec: activeSec,
      sessionsCount: isNewSession ? 1 : 0,
      cardsAnswered,
      correctCount,
    })
    .onConflictDoUpdate({
      target: dailyRollup.date,
      set: {
        studyTimeSec: sql`${dailyRollup.studyTimeSec} + ${activeSec}`,
        sessionsCount: isNewSession
          ? sql`${dailyRollup.sessionsCount} + 1`
          : dailyRollup.sessionsCount,
        cardsAnswered: sql`${dailyRollup.cardsAnswered} + ${cardsAnswered}`,
        correctCount: sql`${dailyRollup.correctCount} + ${correctCount}`,
      },
    });
}

export async function createStudySession(
  mode: StudyMode,
  cardCount: number,
  filters: FilterSnapshot,
): Promise<number> {
  const db = getDb();
  const inserted = await db.insert(studySessions).values({
    feature: 'vocab',
    mode,
    filterJson: JSON.stringify(filters),
    startedAt: Date.now(),
    cardCount,
  }).returning({ id: studySessions.id });
  return inserted[0]?.id ?? 0;
}

export async function recordCardAnswer(
  sessionId: number,
  vocabId: string,
  direction: string,
  correct: boolean,
  responseTimeMs?: number,
): Promise<void> {
  const db = getDb();
  const now = Date.now();

  await db.insert(sessionResults).values({
    sessionId,
    vocabId,
    direction,
    correct: correct ? 1 : 0,
    ts: now,
    responseTimeMs: responseTimeMs ?? null,
  });

  const existing = await db.select().from(vocabProgress)
    .where(and(eq(vocabProgress.vocabId, vocabId), eq(vocabProgress.direction, direction)))
    .limit(1);
  const row = existing[0];

  if (row) {
    await db.update(vocabProgress)
      .set({
        correctCount: row.correctCount + (correct ? 1 : 0),
        incorrectCount: row.incorrectCount + (correct ? 0 : 1),
        lastSeen: now,
        lastCorrect: correct ? now : row.lastCorrect,
      })
      .where(and(eq(vocabProgress.vocabId, vocabId), eq(vocabProgress.direction, direction)));
  } else {
    await db.insert(vocabProgress).values({
      vocabId,
      direction,
      correctCount: correct ? 1 : 0,
      incorrectCount: correct ? 0 : 1,
      firstSeen: now,
      lastSeen: now,
      lastCorrect: correct ? now : null,
    });
  }

  await db.update(studySessions)
    .set({
      cardsAnswered: sql`${studySessions.cardsAnswered} + 1`,
      correctCount: sql`${studySessions.correctCount} + ${correct ? 1 : 0}`,
    })
    .where(eq(studySessions.id, sessionId));
}

export async function finalizeStudySession(
  sessionId: number,
  opts: {
    completed: boolean;
    quitAtIndex?: number;
    activeDurationSec: number;
    cardsAnswered: number;
    correctCount: number;
  },
): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const rows = await db.select().from(studySessions)
    .where(eq(studySessions.id, sessionId)).limit(1);
  const session = rows[0];
  if (!session) return;

  const durationSec = Math.round((now - session.startedAt) / 1000);
  const alreadyEnded = session.endedAt != null;

  await db.update(studySessions)
    .set({
      endedAt: now,
      durationSec,
      activeDurationSec: opts.activeDurationSec,
      cardsAnswered: opts.cardsAnswered,
      correctCount: opts.correctCount,
      completed: opts.completed ? 1 : 0,
      quitAtIndex: opts.quitAtIndex ?? null,
    })
    .where(eq(studySessions.id, sessionId));

  if (!alreadyEnded && opts.cardsAnswered > 0) {
    const date = todayKey(session.startedAt);
    await bumpDailyRollup(
      date,
      opts.activeDurationSec,
      opts.cardsAnswered,
      opts.correctCount,
      true,
    );
  }
}
