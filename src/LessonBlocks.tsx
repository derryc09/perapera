import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VOCAB } from './data/vocab';
import { theme } from './theme';

const LESSONS = [...new Set(VOCAB.flatMap((v) => v.lessonIds))].sort((a, b) => a - b);
const MIN = LESSONS[0];
const MAX = LESSONS[LESSONS.length - 1];
const PER = 5;
const BLOCKS = Math.ceil((MAX - MIN + 1) / PER);

// words per lesson — for the live count in the summary line
const WORDS = VOCAB.reduce<Record<number, number>>((m, w) => {
  w.lessonIds.forEach((l) => { m[l] = (m[l] || 0) + 1; });
  return m;
}, {});

const CARET_COLOR: Record<'off' | 'partial' | 'full', string> = {
  off: theme.ink2,
  partial: theme.accent,
  full: theme.white,
};

const lessonsOf = (b: number) => {
  const out: number[] = [];
  for (let i = 0; i < PER; i++) {
    const l = MIN + b * PER + i;
    if (l <= MAX) out.push(l);
  }
  return out;
};

/** Collapse a sorted lesson list into range strings: [1,2,3,7] -> ["1–3","7"] */
function ranges(sorted: number[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    out.push(sorted[i] === sorted[j] ? `${sorted[i]}` : `${sorted[i]}\u2013${sorted[j]}`);
    i = j + 1;
  }
  return out;
}

interface Props {
  value: number[];                          // [] = all lessons
  onChange: (lessons: number[]) => void;
  expanded: number | null;                  // which block is drilled into
  onExpandedChange: (b: number | null) => void;
}

/**
 * Lesson picker. Ten block chips (5 lessons each): tap a block to select all
 * five, tap its caret to drill down and pick individual lessons. Accordion;
 * `expanded` is owned by the parent so it can be closed on scroll / clear.
 */
export function LessonBlocks({ value, onChange, expanded, onExpandedChange }: Props) {
  const sel = new Set(value);
  const selInBlock = (b: number) => lessonsOf(b).filter((l) => sel.has(l)).length;

  const emit = (next: Set<number>) => {
    if (typeof onChange !== 'function') return;
    onChange(next.size === LESSONS.length ? [] : [...next].sort((a, b) => a - b));
  };

  const toggleBlock = (b: number) => {
    const ls = lessonsOf(b);
    const full = selInBlock(b) === ls.length;
    const next = new Set(sel);
    ls.forEach((l) => (full ? next.delete(l) : next.add(l)));   // partial -> fill
    emit(next);
    onExpandedChange(null);                                     // moving on closes drill-down
  };

  const toggleLesson = (l: number) => {
    const next = new Set(sel);
    next.has(l) ? next.delete(l) : next.add(l);
    emit(next);
  };

  const sorted = [...sel].sort((a, b) => a - b);
  const isAll = sel.size === 0;
  const words = isAll
    ? VOCAB.length
    : sorted.reduce((a, l) => a + (WORDS[l] || 0), 0);
  const summary = isAll
    ? `All ${MAX} lessons · ${VOCAB.length.toLocaleString()} words`
    : `${ranges(sorted).join(', ')}  ·  ${sel.size} lesson${sel.size > 1 ? 's' : ''}`
      + `  ·  ${words.toLocaleString()} words`;

  return (
    <View>
      {/* block chips */}
      <View style={s.blocks}>
        {Array.from({ length: BLOCKS }, (_, b) => {
          const ls = lessonsOf(b);
          const c = selInBlock(b);
          const state = c === ls.length ? 'full' : c > 0 ? 'partial' : 'off';
          const open = expanded === b;
          return (
            <View key={b} style={[s.block, s[`block_${state}`]]}>
              <Pressable onPress={() => toggleBlock(b)} style={s.blockBody}>
                <Text style={[s.blockLabel, s[`txt_${state}`]]}>
                  {ls[0]}–{ls[ls.length - 1]}
                </Text>
                {state === 'partial' && (
                  <Text style={s.frac}>{c}/{ls.length}</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => onExpandedChange(open ? null : b)}
                style={[s.caret, s[`caret_${state}`]]}
                hitSlop={8}
              >
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color={CARET_COLOR[state]}
                  style={open ? s.caretOpen : undefined}
                />
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* summary — quiet caption, pinned under the grid (never reflows) */}
      <Text style={s.summary}>{summary}</Text>

      {/* drill-down panel */}
      {expanded !== null && (
        <View style={s.drill}>
          <Text style={s.drillHead}>
            Lessons in {lessonsOf(expanded)[0]}–
            {lessonsOf(expanded)[lessonsOf(expanded).length - 1]}
          </Text>
          <View style={s.drillRow}>
            {lessonsOf(expanded).map((l) => {
              const on = sel.has(l);
              return (
                <Pressable key={l} onPress={() => toggleLesson(l)}
                  style={[s.lchip, on && s.lchipOn]}>
                  <Text style={[s.lchipText, on && s.lchipTextOn]}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  blocks: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  block: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 9,
    borderColor: theme.line, backgroundColor: theme.surface, overflow: 'hidden',
  },
  block_off: {},
  block_partial: { backgroundColor: '#fbeee9', borderColor: theme.accent },
  block_full: { backgroundColor: theme.accent, borderColor: theme.accent },

  blockBody: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  blockLabel: { fontSize: 13, fontWeight: '600' },
  frac: { fontSize: 11, fontWeight: '700', color: theme.accentD, marginLeft: 6 },

  caret: {
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 9,
    borderLeftWidth: 1, borderLeftColor: theme.line,
  },
  caret_off: {},
  caret_partial: { borderLeftColor: '#e9b9ad' },
  caret_full: { borderLeftColor: 'rgba(255,255,255,0.32)' },
  caretOpen: { transform: [{ rotate: '180deg' }] },

  txt_off: { color: theme.ink },
  txt_partial: { color: theme.accentD },
  txt_full: { color: theme.white },

  summary: { fontSize: 12, color: theme.ink2, lineHeight: 17, marginTop: 11 },

  drill: {
    marginTop: 11, backgroundColor: '#fbeee9',
    borderWidth: 1, borderColor: '#e9b9ad', borderRadius: 12, padding: 13,
  },
  drillHead: { fontSize: 11, fontWeight: '700', color: theme.accentD, marginBottom: 9 },
  drillRow: { flexDirection: 'row', gap: 7 },
  lchip: {
    width: 42, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface,
  },
  lchipOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  lchipText: { fontSize: 13, fontWeight: '600', color: theme.ink },
  lchipTextOn: { color: theme.white },
});