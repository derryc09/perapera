import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VOCAB } from '../src/data/vocab';
import { flushStudySession } from '../src/db/flushSession';
import { recordCardAnswer } from '../src/db/sessions';
import { usePerCardStudyTimer } from '../src/hooks/usePerCardStudyTimer';
import { useT } from '../src/i18n';
import { useStore } from '../src/store';
import { fonts, theme } from '../src/theme';

type Stage = 'prompt' | 'reveal';

/**
 * Study screen.
 *
 * Layout:
 *   [ prompt header ]   ← always at the top, anchored, never moves
 *   ─── divider ───     ← appears on reveal
 *   [ answer block ]    ← appears on reveal; pieces NOT in the prompt
 *   [ tags ]
 *
 * Field assignment by mode:
 *   Production  (native → JP): prompt = meaning, answer = kanji+kana+romaji
 *   Recognition (JP → native): prompt = kanji+kana, answer = meaning(+romaji)
 *
 * Same field never appears in both prompt and answer — they're complements.
 */
export default function Study() {
  const insets = useSafeAreaInsets();
  const session = useStore((s) => s.session);
  const nativeLang = useStore((s) => s.nativeLang);
  const answer = useStore((s) => s.answer);
  const endSession = useStore((s) => s.endSession);
  const tr = useT();
  const getActiveSec = usePerCardStudyTimer(
    !!session && !session.done,
    session?.index ?? 0,
  );

  const [stage, setStage] = useState<Stage>('prompt');

  useEffect(() => { if (!session) router.replace('/'); }, [session]);
  useEffect(() => { if (session?.done) router.replace('/summary'); }, [session?.done]);

  if (!session || session.done) return null;
  const cur = session.queue[session.index];
  const w = VOCAB.find((v) => v.id === cur.vocabId)!;
  if (!w) return null;

  const isRecognition = cur.direction === 'recognition';   // JP → native
  const meaning = w.meanings[nativeLang] ?? Object.values(w.meanings)[0] ?? '';
  const hasKanji = w.japanese !== w.reading;
  // Progress = how many cards have been answered (committed) so far.
  // Advances once per commit and stays put through reveal -> next.
  const progress = (session.results.length / session.queue.length) * 100;
  const revealing = stage === 'reveal';

  const commit = (correct: boolean) => {
    const responseTimeMs = Date.now() - session.cardShownAt;
    const cur = session.queue[session.index];
    answer(correct);
    void recordCardAnswer(session.dbId, cur.vocabId, cur.direction, correct, responseTimeMs);
    setStage('reveal');
  };
  const next = async () => {
    const last = session.index >= session.queue.length - 1;
    setStage('prompt');
    if (last) {
      const snap = useStore.getState().session!;
      await flushStudySession(snap, { completed: true, activeDurationSec: getActiveSec() });
      useStore.setState({ session: { ...snap, done: true } });
    } else {
      useStore.setState({
        session: {
          ...session,
          index: session.index + 1,
          cardShownAt: Date.now(),
        },
      });
    }
  };
  const quit = async () => {
    const snap = useStore.getState().session;
    if (snap && snap.results.length > 0) {
      await flushStudySession(snap, {
        completed: false,
        quitAtIndex: snap.index,
        activeDurationSec: getActiveSec(),
      });
    } else if (snap) {
      await flushStudySession(snap, {
        completed: false,
        quitAtIndex: 0,
        activeDurationSec: getActiveSec(),
      });
    }
    endSession();
    router.replace('/');
  };

  const meaningLang = tr.native[nativeLang] ?? nativeLang;

  return (
    <View style={[s.root, { paddingTop: insets.top + 6 }]}>
      {/* top bar */}
      <View style={s.top}>
        <Pressable onPress={quit} style={s.close}>
          <Text style={s.closeText}>✕</Text>
        </Pressable>
        <View style={s.progress}>
          <View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={s.count}>
          {session.index + 1}<Text style={s.countTotal}>/{session.queue.length}</Text>
        </Text>
      </View>

      {/* meta row */}
      <View style={s.metaRow}>
        <Text style={s.dir}>
          {isRecognition ? `日本語 → ${meaningLang}` : `${meaningLang} → 日本語`}
        </Text>
      </View>

      <View style={s.body}>
        {/* ---- prompt header — always at the top, fixed position ---- */}
        <View style={s.promptBlock}>
          {isRecognition ? (
            <>
              <View style={s.promptKanjiSlot}>
                <Text style={s.promptKanji} numberOfLines={2}>
                  {hasKanji ? w.japanese : w.reading}
                </Text>
              </View>
              <View style={s.promptKanaSlot}>
                {hasKanji && (
                  <Text style={s.promptKana} numberOfLines={1}>
                    {w.reading}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <View style={s.promptMeaningSlot}>
              <Text
                style={s.promptMeaning}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {meaning}
              </Text>
            </View>
          )}
        </View>

        {/* ---- divider — appears on reveal ---- */}
        {revealing && <View style={s.divider} />}

        {/* ---- answer block — only the pieces not in the prompt ---- */}
        <View style={s.answerBlock}>
          {revealing && (
            <Animated.View entering={FadeIn.duration(220)} style={s.center}>
              <Text style={s.answerLabel}>{tr.study.answer}</Text>

              {isRecognition ? (
                <>
                  <View style={s.ansMeaningSlot}>
                    <Text style={s.ansMeaningText} numberOfLines={3} ellipsizeMode="tail">
                      {meaning}
                    </Text>
                  </View>
                  {!!w.romaji && (
                    <View style={s.ansRomajiSlot}>
                      <Text style={s.ansRomajiText}>{w.romaji}</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={s.ansKanjiSlot}>
                    <Text style={s.ansKanjiText} numberOfLines={2}>
                      {hasKanji ? w.japanese : w.reading}
                    </Text>
                  </View>
                  <View style={s.ansKanaSlot}>
                    {hasKanji && (
                      <Text style={s.ansKanaText} numberOfLines={1}>{w.reading}</Text>
                    )}
                  </View>
                  {!!w.romaji && (
                    <View style={s.ansRomajiSlot}>
                      <Text style={s.ansRomajiText}>{w.romaji}</Text>
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          )}
        </View>

        {/* ---- tags — fixed slot, only filled on reveal ---- */}
        <View style={s.tagsRow}>
          {revealing && (
            <View style={s.tags}>
              <Tag text={tr.study.lessonTag(w.lessonIds.join(', '))} />
            </View>
          )}
        </View>
      </View>

      {/* footer */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 14 }]}>
        {!revealing ? (
          <View style={s.commitRow}>
            <Pressable style={[s.commit, s.commitWrong]} onPress={() => commit(false)}>
              <Text style={s.commitText}>{tr.study.dontRecall}</Text>
            </Pressable>
            <Pressable style={[s.commit, s.commitRight]} onPress={() => commit(true)}>
              <Text style={s.commitText}>{tr.study.knowThis}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={s.next} onPress={next}>
            <Text style={s.nextText}>
              {session.index >= session.queue.length - 1 ? tr.study.finish : tr.study.nextQuestion}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={s.tag}>
      <Text style={s.tagText}>{text.toUpperCase()}</Text>
    </View>
  );
}

// ---- reserved slot heights ----------------------------------------------
const PROMPT_KANJI    = 80;
const PROMPT_KANA     = 36;
const PROMPT_MEANING  = 120;   // up to 3 lines

const ANS_KANJI       = 70;
const ANS_KANA        = 36;
const ANS_MEANING     = 110;   // up to 3 lines
const ANS_ROMAJI      = 22;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },

  top: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  close: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: theme.line2,
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: theme.ink2, fontSize: 13 },
  progress: { flex: 1, height: 7, backgroundColor: theme.line2, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 4 },
  count: { fontFamily: fonts.display, fontSize: 15, color: theme.ink },
  countTotal: { color: theme.ink2, fontSize: 12 },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingBottom: 6,
  },
  dir: { fontSize: 10.5, color: theme.ink2, fontWeight: '600' },

  body: { flex: 1, paddingHorizontal: 26, paddingTop: 18, alignItems: 'center' },

  // ---- prompt header ----
  promptBlock: { width: '100%', alignItems: 'center' },
  promptKanjiSlot:   { height: PROMPT_KANJI,   justifyContent: 'center', alignItems: 'center' },
  promptKanaSlot:    { height: PROMPT_KANA,    justifyContent: 'center', alignItems: 'center' },
  promptMeaningSlot: { height: PROMPT_MEANING, justifyContent: 'center', alignItems: 'center' },
  promptKanji:   { fontFamily: fonts.jp,      fontSize: 48, lineHeight: 62, textAlign: 'center', color: theme.ink },
  promptKana:    { fontFamily: fonts.jp,      fontSize: 22, lineHeight: 30, textAlign: 'center', color: theme.ink2 },
  promptMeaning: { fontFamily: fonts.display, fontSize: 26, lineHeight: 34, textAlign: 'center', color: theme.ink },

  // ---- divider ----
  divider: { width: '60%', height: 1, backgroundColor: theme.line, marginVertical: 16 },

  // ---- answer block ----
  answerBlock: { width: '100%', alignItems: 'center', minHeight: 180 },
  answerLabel: {
    fontSize: 9.5, letterSpacing: 1.8, fontWeight: '700',
    color: theme.accent, marginBottom: 10,
  },
  center: { alignItems: 'center', width: '100%' },

  ansKanjiSlot:   { height: ANS_KANJI,   justifyContent: 'center', alignItems: 'center' },
  ansKanaSlot:    { height: ANS_KANA,    justifyContent: 'center', alignItems: 'center' },
  ansMeaningSlot: { height: ANS_MEANING, justifyContent: 'center', alignItems: 'center' },
  ansRomajiSlot:  { height: ANS_ROMAJI,  justifyContent: 'center', alignItems: 'center' },

  ansKanjiText:   { fontFamily: fonts.jp,      fontSize: 44, lineHeight: 58, textAlign: 'center', color: theme.accent },
  ansKanaText:    { fontFamily: fonts.jp,      fontSize: 22, lineHeight: 30, textAlign: 'center', color: theme.accent },
  ansMeaningText: { fontFamily: fonts.display, fontSize: 24, lineHeight: 32, textAlign: 'center', color: theme.accent },
  ansRomajiText:  { fontSize: 14, fontStyle: 'italic', textAlign: 'center', color: theme.ink2 },

  tagsRow: { height: 32, marginTop: 14, alignItems: 'center', justifyContent: 'flex-start' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  tag:  { backgroundColor: theme.line2, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: theme.ink2 },

  // ---- footer ----
  footer: { paddingHorizontal: 22, paddingTop: 14 },
  commitRow: { flexDirection: 'row', gap: 10 },
  commit: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  commitWrong: { backgroundColor: theme.accent },
  commitRight: { backgroundColor: theme.success },
  commitText:  { color: theme.white, fontSize: 15, fontWeight: '700' },
  next: { backgroundColor: theme.ink, borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  nextText: { color: theme.paper, fontSize: 15, fontWeight: '700' },
});