import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { CARD_STUDY_TIME_CAP_SEC } from '../studyTiming';

/**
 * Tracks study time as the sum of per-card foreground intervals, each capped
 * at CARD_STUDY_TIME_CAP_SEC. The clock for a card stops at the cap and only
 * resumes when cardIndex advances.
 */
export function usePerCardStudyTimer(enabled: boolean, cardIndex: number) {
  const cap = CARD_STUDY_TIME_CAP_SEC;
  const completedSec = useRef(0);
  const cardSec = useRef(0);
  const clockStart = useRef<number | null>(null);
  const prevCardIndex = useRef(-1);

  const addDelta = useCallback((deltaSec: number) => {
    if (cardSec.current >= cap) {
      clockStart.current = null;
      return;
    }
    const room = cap - cardSec.current;
    cardSec.current += Math.min(deltaSec, room);
    if (cardSec.current >= cap) clockStart.current = null;
  }, [cap]);

  const tick = useCallback(() => {
    if (clockStart.current !== null) {
      addDelta((Date.now() - clockStart.current) / 1000);
      clockStart.current = null;
    }
  }, [addDelta]);

  const resume = useCallback(() => {
    if (!enabled || cardSec.current >= cap) return;
    if (clockStart.current === null) clockStart.current = Date.now();
  }, [enabled, cap]);

  const sealCard = useCallback(() => {
    tick();
    completedSec.current += cardSec.current;
    cardSec.current = 0;
    clockStart.current = null;
  }, [tick]);

  // New card — seal the previous card's time, then start fresh.
  useEffect(() => {
    if (!enabled) return;
    if (prevCardIndex.current === cardIndex) return;
    if (prevCardIndex.current >= 0) sealCard();
    prevCardIndex.current = cardIndex;
    resume();
  }, [enabled, cardIndex, sealCard, resume]);

  // Foreground-only: pause on background, resume on active (unless capped).
  useEffect(() => {
    if (!enabled) return;
    resume();
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') resume();
      else tick();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      sub.remove();
      tick();
    };
  }, [enabled, resume, tick]);

  // Session ended — reset so a later session starts clean.
  useEffect(() => {
    if (enabled) return;
    tick();
    completedSec.current = 0;
    cardSec.current = 0;
    clockStart.current = null;
    prevCardIndex.current = -1;
  }, [enabled, tick]);

  return useCallback(() => {
    let current = cardSec.current;
    if (clockStart.current !== null && cardSec.current < cap) {
      const delta = (Date.now() - clockStart.current) / 1000;
      current = Math.min(cardSec.current + delta, cap);
    }
    return Math.round(completedSec.current + current);
  }, [cap]);
}
