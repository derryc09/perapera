export type AppLang = 'en' | 'zh-Hant' | 'ko';

export interface AppLangOption {
  id: AppLang;
  label: string;
}

export const APP_LANGS: AppLangOption[] = [
  { id: 'en', label: 'English' },
  { id: 'zh-Hant', label: '繁體中文' },
  { id: 'ko', label: '한국어' },
];

export interface Translations {
  common: {
    clear: string;
    soon: string;
    words: string;
    match: string;
    clearAll: string;
    cards: string;
    card: string;
    lesson: string;
  };
  home: {
    tag: string;
    neverStudied: string;
    today: string;
    yesterday: string;
    daysAgo: (n: number) => string;
    lastStudied: (label: string) => string;
    estimatedLevel: string;
    ready: (pct: number) => string;
    levelCaption: string;
    studyTime: string;
    sessionsThisWeek: (n: number) => string;
    practiced: string;
    practicedSub: (words: number, phrases: number) => string;
    accuracy: string;
    accuracySub: string;
    jlptProgress: string;
    practice: string;
    social: string;
    friendsRanking: string;
    friendsRankingSub: string;
    placeholderNote: string;
    studyVocabulary: string;
    vocabulary: string;
    conjugation: string;
    grammar: string;
    bandMeta: (practiced: number, total: number, acc: number) => string;
    coverage: (pct: number) => string;
  };
  settings: {
    title: string;
    tag: string;
    appLanguage: string;
    appLanguageNote: string;
    studyLanguage: string;
    studyLanguageNote: string;
  };
  vocab: {
    title: string;
    tag: string;
    inCollection: string;
    lessons: string;
    wordType: string;
    studyMode: string;
    sessionSize: string;
    all: string;
    moreOptions: string;
    verbGroup: string;
    verbGroupNote: string;
    categories: string;
    adjectives: string;
    other: string;
    productionNote: string;
    recognitionNote: string;
    studyCards: (n: number) => string;
  };
  study: {
    answer: string;
    dontRecall: string;
    knowThis: string;
    nextQuestion: string;
    finish: string;
    lessonTag: (n: string) => string;
  };
  summary: {
    tag: string;
    correctOf: (correct: number, total: number) => string;
    knewIt: string;
    toReview: string;
    wordsToReview: string;
    backToHome: string;
  };
  pos: Record<string, string>;
  posGroups: Record<string, string>;
  categories: Record<string, string>;
  verbGroups: Record<string, string>;
  native: Record<string, string>;
}
