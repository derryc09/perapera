// ---- Core data model -------------------------------------------------------

export type Pos =
  | 'noun' | 'verb' | 'i-adjective' | 'na-adjective' | 'adverb' | 'phrase'
  | 'pronoun' | 'conjunction' | 'particle' | 'suffix'
  | 'interjection' | 'prenominal';

export type Jlpt = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type VerbGroup = 'I' | 'II' | 'III';

export interface ConjForm { kana: string; kanji: string; }
export interface Conjugations {
  '動詞基本体': ConjForm; '辭書形': ConjForm;
  'ます形': ConjForm; '敬体': ConjForm;
  'ました形': ConjForm; 'ません形': ConjForm;
  'て形': ConjForm; 'た形': ConjForm;
  '否定形': ConjForm; 'なかった形': ConjForm; 'ない形stem': ConjForm;
  '仮定形': ConjForm; '可能形': ConjForm;
  '受身形': ConjForm; '使役形': ConjForm; '使役受身形': ConjForm;
  '命令形': ConjForm; '意向形': ConjForm;
}

export interface Vocab {
  id: string;
  japanese: string;
  reading: string;
  romaji?: string;
  meanings: Record<string, string>;
  partOfSpeech: Pos;
  category: string;
  lessonIds: number[];
  section?: string;
  jlptLevel?: Jlpt;
  verbGroup?: VerbGroup;
  conjugations?: Conjugations;
  conjugationFlag?: string;
  example?: { jp: string; translations: Record<string, string> };
}

// ---- Study session ---------------------------------------------------------

export type Direction = 'recognition' | 'production';
export type StudyMode = 'recognition' | 'production';

export interface SessionCard {
  vocabId: string;
  direction: Direction;
}

export interface SessionResult {
  vocabId: string;
  direction: Direction;
  correct: boolean;
}

export interface Session {
  dbId: number;
  queue: SessionCard[];
  index: number;
  results: SessionResult[];
  done: boolean;
  /** When the current card was shown (for response-time tracking). */
  cardShownAt: number;
}