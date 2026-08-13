import { VOCAB } from './data/vocab';
import { Jlpt } from './types';

export type { LastStudied, JlptBandProgress, DashboardStats } from './db/stats';
export { computeDashboardStats } from './db/stats';

export function formatStudyTime(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatLastStudiedLabel(
  lastStudied: import('./db/stats').LastStudied,
  tr: {
    neverStudied: string;
    today: string;
    yesterday: string;
    daysAgo: (n: number) => string;
    lastStudied: (label: string) => string;
  },
): string {
  switch (lastStudied.kind) {
    case 'never':
      return tr.neverStudied;
    case 'today':
      return tr.lastStudied(tr.today);
    case 'yesterday':
      return tr.lastStudied(tr.yesterday);
    case 'days':
      return tr.lastStudied(tr.daysAgo(lastStudied.count));
  }
}

function jlptTotal(level: Jlpt): number {
  return VOCAB.filter((w) => w.jlptLevel === level).length;
}

export const EMPTY_STATS: import('./db/stats').DashboardStats = {
  estimatedLevel: 'N5',
  readinessPct: 0,
  studyTimeMinutes: 0,
  wordsPracticed: 0,
  phrasesPracticed: 0,
  accuracyPct: 0,
  productionAccuracyPct: 0,
  sessionsThisWeek: 0,
  lastStudied: { kind: 'never' },
  jlptBands: [
    { level: 'N5', coveragePct: 0, accuracyPct: 0, practiced: 0, total: jlptTotal('N5') },
    { level: 'N4', coveragePct: 0, accuracyPct: 0, practiced: 0, total: jlptTotal('N4') },
  ],
  totalCardsAnswered: 0,
};
