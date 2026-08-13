import { create } from 'zustand';
import { AppLang } from './i18n';
import { persistAppLang, persistNativeLang } from './db/settings';
import { Session, SessionCard, StudyMode } from './types';

interface Filters {
  lessons: number[];
  pos: string[];
  categories: string[];
  verbGroups: string[];
}

interface Store {
  appLang: AppLang;
  nativeLang: string;
  filters: Filters;
  mode: StudyMode;
  length: number;

  session: Session | null;

  setAppLang: (l: AppLang) => void;
  setNativeLang: (l: string) => void;
  toggleFilter: (key: keyof Filters, value: number | string) => void;
  setLessons: (lessons: number[]) => void;
  clearFilters: () => void;
  setMode: (m: StudyMode) => void;
  setLength: (n: number) => void;

  startSession: (queue: SessionCard[], dbId: number) => void;
  answer: (correct: boolean) => void;
  endSession: () => void;
}

const EMPTY: Filters = { lessons: [], pos: [], categories: [], verbGroups: [] };

export const useStore = create<Store>((set) => ({
  appLang: 'en',
  nativeLang: 'zh',
  filters: EMPTY,
  mode: 'production',
  length: 25,

  session: null,

  setAppLang: (l) => {
    set({ appLang: l });
    persistAppLang(l);
  },

  setNativeLang: (l) => {
    set({ nativeLang: l });
    persistNativeLang(l);
  },

  toggleFilter: (key, value) =>
    set((s) => {
      const list = s.filters[key] as (number | string)[];
      const has = list.includes(value);
      return {
        filters: {
          ...s.filters,
          [key]: has ? list.filter((x) => x !== value) : [...list, value],
        },
      };
    }),

  setLessons: (lessons) =>
    set((s) => ({ filters: { ...s.filters, lessons } })),

  clearFilters: () => set({ filters: EMPTY }),

  setMode: (mode) => set({ mode }),
  setLength: (length) => set({ length }),

  startSession: (queue, dbId) =>
    set({
      session: {
        dbId,
        queue,
        index: 0,
        results: [],
        done: false,
        cardShownAt: Date.now(),
      },
    }),

  answer: (correct) =>
    set((s) => {
      if (!s.session || s.session.done) return s;
      const cur = s.session.queue[s.session.index];
      const results = [
        ...s.session.results,
        { vocabId: cur.vocabId, direction: cur.direction, correct },
      ];
      return { session: { ...s.session, results } };
    }),

  endSession: () => set({ session: null }),
}));
