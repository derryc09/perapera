import { sql } from 'drizzle-orm';
import { VOCAB } from '../data/vocab';
import { Jlpt } from '../types';
import { getDb } from './client';
import { studySessions, vocabProgress } from './schema';

export type LastStudied =
  | { kind: 'never' }
  | { kind: 'today' }
  | { kind: 'yesterday' }
  | { kind: 'days'; count: number };

export interface JlptBandProgress {
  level: Jlpt;
  coveragePct: number;
  accuracyPct: number;
  practiced: number;
  total: number;
}

export interface DashboardStats {
  estimatedLevel: Jlpt;
  readinessPct: number;
  studyTimeMinutes: number;
  wordsPracticed: number;
  phrasesPracticed: number;
  accuracyPct: number;
  productionAccuracyPct: number;
  sessionsThisWeek: number;
  lastStudied: LastStudied;
  jlptBands: JlptBandProgress[];
  totalCardsAnswered: number;
}

const JLPT_LEVELS: Jlpt[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const VOCAB_BY_JLPT = JLPT_LEVELS.reduce((acc, level) => {
  acc[level] = VOCAB.filter((w) => w.jlptLevel === level);
  return acc;
}, {} as Record<Jlpt, typeof VOCAB>);

const VOCAB_BY_ID = new Map(VOCAB.map((w) => [w.id, w]));

/** Practiced = seen at least once in either direction. */
function buildPracticedSet(rows: { vocabId: string }[]): Set<string> {
  return new Set(rows.map((r) => r.vocabId));
}

function startOfWeekMs(now = Date.now()): number {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

function computeLastStudied(lastEndedAt: number | null): LastStudied {
  if (!lastEndedAt) return { kind: 'never' };
  const now = new Date();
  const then = new Date(lastEndedAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThen) / 86_400_000);
  if (dayDiff === 0) return { kind: 'today' };
  if (dayDiff === 1) return { kind: 'yesterday' };
  return { kind: 'days', count: dayDiff };
}

function bandStats(
  level: Jlpt,
  practiced: Set<string>,
  progressRows: { vocabId: string; direction: string; correctCount: number; incorrectCount: number }[],
): JlptBandProgress {
  const bandVocab = VOCAB_BY_JLPT[level] ?? [];
  const total = bandVocab.length;
  const bandIds = new Set(bandVocab.map((w) => w.id));
  const practicedInBand = [...practiced].filter((id) => bandIds.has(id)).length;
  const coveragePct = total ? Math.round((practicedInBand / total) * 100) : 0;

  let prodCorrect = 0;
  let prodTotal = 0;
  for (const row of progressRows) {
    if (!bandIds.has(row.vocabId) || row.direction !== 'production') continue;
    prodCorrect += row.correctCount;
    prodTotal += row.correctCount + row.incorrectCount;
  }
  const accuracyPct = prodTotal ? Math.round((prodCorrect / prodTotal) * 100) : 0;

  return { level, coveragePct, accuracyPct, practiced: practicedInBand, total };
}

/**
 * Estimated level: highest JLPT band where coverage ≥ 50% AND production
 * accuracy ≥ 60% with at least 20 cards answered in that band; else N5.
 */
function estimateLevel(bands: JlptBandProgress[]): { level: Jlpt; readinessPct: number } {
  const ordered: Jlpt[] = ['N4', 'N3', 'N2', 'N1'];
  for (const level of ordered) {
    const b = bands.find((x) => x.level === level);
    if (!b || b.total === 0) continue;
    const ready = b.coveragePct >= 50 && b.accuracyPct >= 60 && b.practiced >= 20;
    if (ready) {
      return { level, readinessPct: Math.round((b.coveragePct + b.accuracyPct) / 2) };
    }
  }
  const n5 = bands.find((x) => x.level === 'N5');
  if (!n5 || n5.practiced === 0) return { level: 'N5', readinessPct: 0 };
  return {
    level: 'N5',
    readinessPct: Math.round((n5.coveragePct + n5.accuracyPct) / 2),
  };
}

export async function computeDashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const weekStart = startOfWeekMs();

  const [timeRow] = await db.select({
    totalSec: sql<number>`coalesce(sum(${studySessions.activeDurationSec}), 0)`,
  }).from(studySessions);

  const [weekRow] = await db.select({
    count: sql<number>`count(*)`,
  }).from(studySessions).where(sql`${studySessions.startedAt} >= ${weekStart}`);

  const [lastRow] = await db.select({
    endedAt: sql<number | null>`max(${studySessions.endedAt})`,
  }).from(studySessions);

  const progressRows = await db.select({
    vocabId: vocabProgress.vocabId,
    direction: vocabProgress.direction,
    correctCount: vocabProgress.correctCount,
    incorrectCount: vocabProgress.incorrectCount,
  }).from(vocabProgress);

  const practiced = buildPracticedSet(progressRows);

  let wordsPracticed = 0;
  let phrasesPracticed = 0;
  for (const id of practiced) {
    const w = VOCAB_BY_ID.get(id);
    if (!w) continue;
    if (w.partOfSpeech === 'phrase') phrasesPracticed++;
    else wordsPracticed++;
  }

  let totalCorrect = 0;
  let totalAnswered = 0;
  let prodCorrect = 0;
  let prodAnswered = 0;
  for (const row of progressRows) {
    const c = row.correctCount;
    const t = row.correctCount + row.incorrectCount;
    totalCorrect += c;
    totalAnswered += t;
    if (row.direction === 'production') {
      prodCorrect += c;
      prodAnswered += t;
    }
  }

  const jlptBands = (['N5', 'N4'] as Jlpt[]).map((level) =>
    bandStats(level, practiced, progressRows),
  );

  const { level: estimatedLevel, readinessPct } = estimateLevel(jlptBands);

  return {
    estimatedLevel,
    readinessPct,
    studyTimeMinutes: Math.round((timeRow?.totalSec ?? 0) / 60),
    wordsPracticed,
    phrasesPracticed,
    accuracyPct: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    productionAccuracyPct: prodAnswered ? Math.round((prodCorrect / prodAnswered) * 100) : 0,
    sessionsThisWeek: weekRow?.count ?? 0,
    lastStudied: computeLastStudied(lastRow?.endedAt ?? null),
    jlptBands,
    totalCardsAnswered: totalAnswered,
  };
}
