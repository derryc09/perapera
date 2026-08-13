/**
 * Previously the home of the spaced-repetition engine. The study session was
 * simplified to a binary correct/incorrect model, so the SRS state machine
 * was removed. Only the deck-shuffle helper remains.
 *
 * If/when the SRS engine returns (e.g. backed by ts-fsrs), restore this file
 * and reintroduce the CardState/WordStates types in src/types.ts.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}