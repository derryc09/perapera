import raw from './vocab.json';
import { Vocab } from '../types';

/**
 * Real vocabulary — 2,189 entries, all 50 Minna no Nihongo lessons.
 * Generated from Vocabulary_final.csv by scripts/import_vocab.py.
 * To regenerate after editing the CSV, re-run that script.
 */
export const VOCAB: Vocab[] = raw as Vocab[];
