import { desc } from 'drizzle-orm';
import { useStore } from '../store';
import { CARD_STUDY_TIME_CAP_SEC } from '../studyTiming';
import { computeDashboardStats } from './stats';
import { getDb } from './client';
import {
  dailyRollup,
  sessionResults,
  studySessions,
  userSettings,
  vocabProgress,
} from './schema';

export interface RawDataDump {
  exportedAt: string;
  constants: { cardStudyTimeCapSec: number };
  inMemorySession: ReturnType<typeof useStore.getState>['session'];
  zustandSnapshot: {
    appLang: string;
    nativeLang: string;
    mode: string;
    length: number;
    filters: ReturnType<typeof useStore.getState>['filters'];
  };
  userSettings: Awaited<ReturnType<typeof fetchUserSettings>>;
  studySessions: Awaited<ReturnType<typeof fetchStudySessions>>;
  sessionResults: Awaited<ReturnType<typeof fetchSessionResults>>;
  vocabProgress: Awaited<ReturnType<typeof fetchVocabProgress>>;
  dailyRollup: Awaited<ReturnType<typeof fetchDailyRollup>>;
  derivedDashboard: Awaited<ReturnType<typeof computeDashboardStats>>;
  counts: {
    userSettings: number;
    studySessions: number;
    sessionResults: number;
    vocabProgress: number;
    dailyRollup: number;
    orphanSessions: number;
  };
}

async function fetchUserSettings() {
  const db = getDb();
  return db.select().from(userSettings);
}

async function fetchStudySessions() {
  const db = getDb();
  return db.select().from(studySessions).orderBy(desc(studySessions.startedAt));
}

async function fetchSessionResults() {
  const db = getDb();
  return db.select().from(sessionResults).orderBy(desc(sessionResults.ts));
}

async function fetchVocabProgress() {
  const db = getDb();
  return db.select().from(vocabProgress).orderBy(desc(vocabProgress.lastSeen));
}

async function fetchDailyRollup() {
  const db = getDb();
  return db.select().from(dailyRollup).orderBy(desc(dailyRollup.date));
}

/** Load every persisted table plus live store state for the dev inspector. */
export async function loadRawDataDump(): Promise<RawDataDump> {
  const state = useStore.getState();
  const [
    settings,
    sessions,
    results,
    progress,
    rollup,
    derivedDashboard,
  ] = await Promise.all([
    fetchUserSettings(),
    fetchStudySessions(),
    fetchSessionResults(),
    fetchVocabProgress(),
    fetchDailyRollup(),
    computeDashboardStats(),
  ]);

  const orphanSessions = sessions.filter((s) => s.endedAt == null).length;

  return {
    exportedAt: new Date().toISOString(),
    constants: { cardStudyTimeCapSec: CARD_STUDY_TIME_CAP_SEC },
    inMemorySession: state.session,
    zustandSnapshot: {
      appLang: state.appLang,
      nativeLang: state.nativeLang,
      mode: state.mode,
      length: state.length,
      filters: state.filters,
    },
    userSettings: settings,
    studySessions: sessions,
    sessionResults: results,
    vocabProgress: progress,
    dailyRollup: rollup,
    derivedDashboard,
    counts: {
      userSettings: settings.length,
      studySessions: sessions.length,
      sessionResults: results.length,
      vocabProgress: progress.length,
      dailyRollup: rollup.length,
      orphanSessions,
    },
  };
}

export function formatTs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  return new Date(ms).toLocaleString();
}
