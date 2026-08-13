import { Session } from '../types';
import { finalizeStudySession } from './sessions';

export async function flushStudySession(
  session: Session,
  opts: { completed: boolean; quitAtIndex?: number; activeDurationSec: number },
): Promise<void> {
  const correctCount = session.results.filter((r) => r.correct).length;
  await finalizeStudySession(session.dbId, {
    completed: opts.completed,
    quitAtIndex: opts.quitAtIndex,
    activeDurationSec: opts.activeDurationSec,
    cardsAnswered: session.results.length,
    correctCount,
  });
}
