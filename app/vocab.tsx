import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VOCAB } from '../src/data/vocab';
import { LessonBlocks } from '../src/LessonBlocks';
import {
  HAS_RICH_CATEGORIES, NATIVE, POS_GROUPS, POS_META, POS_ORDER,
  SESSION_ALL, VERB_GROUPS,
} from '../src/meta';
import { createStudySession } from '../src/db/sessions';
import { categoryLabel, posLabel, useT } from '../src/i18n';
import { shuffle } from '../src/srs';
import { useStore } from '../src/store';
import { fonts, theme } from '../src/theme';
import { Direction, Pos, SessionCard } from '../src/types';
import { Chip, SectionHeader } from '../src/ui';

const SCROLL_CLOSE_PX = 36;

export default function DeckBuilder() {
  const insets = useSafeAreaInsets();
  const tr = useT();
  const {
    nativeLang, filters, mode, length,
    setNativeLang, toggleFilter, setLessons, clearFilters, setMode,
    setLength, startSession,
  } = useStore();

  const [showMore, setShowMore] = useState(false);
  const [lessonExpanded, setLessonExpanded] = useState<number | null>(null);

  const scrollY = useRef(0);
  const openY = useRef(0);
  const setExpanded = (b: number | null) => {
    if (b !== null) openY.current = scrollY.current;
    setLessonExpanded(b);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollY.current = y;
    if (lessonExpanded !== null && Math.abs(y - openY.current) > SCROLL_CLOSE_PX) {
      setLessonExpanded(null);
    }
  };

  const deck = useMemo(
    () =>
      VOCAB.filter((w) => {
        if (filters.lessons.length && !w.lessonIds.some((l) => filters.lessons.includes(l))) return false;
        if (filters.pos.length && !filters.pos.includes(w.partOfSpeech)) return false;
        if (filters.categories.length && !filters.categories.includes(w.category)) return false;
        if (filters.verbGroups.length &&
          !(w.partOfSpeech === 'verb' && w.verbGroup &&
            filters.verbGroups.includes(w.verbGroup))) return false;
        return true;
      }),
    [filters],
  );

  const dir: Direction = mode === 'production' ? 'production' : 'recognition';

  const sessionCount = Math.min(length, deck.length);

  const count = (fn: (w: typeof VOCAB[number]) => boolean) => VOCAB.filter(fn).length;

  const visiblePos: Pos[] = filters.pos.length ? (filters.pos as Pos[]) : POS_ORDER;
  const catsOf = (pos: Pos) =>
    [...new Set(VOCAB.filter((w) => w.partOfSpeech === pos).map((w) => w.category))];

  const groupState = (members: Pos[]): 'on' | 'partial' | 'off' => {
    const on = members.filter((m) => filters.pos.includes(m)).length;
    if (on === 0) return 'off';
    if (on === members.length) return 'on';
    return 'partial';
  };

  const toggleGroup = (members: Pos[]) => {
    const state = groupState(members);
    const others = filters.pos.filter((p) => !members.includes(p as Pos));
    const next = state === 'off' ? [...others, ...members] : others;
    const target = new Set(next);
    const current = new Set(filters.pos);
    members.forEach((m) => {
      if (target.has(m) !== current.has(m)) toggleFilter('pos', m);
    });
  };

  const advancedActive = filters.categories.length + filters.verbGroups.length;
  const filtersActive =
    filters.lessons.length + filters.pos.length + advancedActive > 0;
  const showVerbGroups = !filters.pos.length || filters.pos.includes('verb');
  const lessonsSelected = filters.lessons.length > 0;
  const clearLessons = () => { setLessons([]); setLessonExpanded(null); };

  const onStart = async () => {
    const picked = shuffle(deck).slice(0, sessionCount);
    const queue: SessionCard[] = picked.map((w) => ({ vocabId: w.id, direction: dir }));
    const dbId = await createStudySession(mode, queue.length, filters);
    startSession(queue, dbId);
    router.push('/study');
  };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={st.back} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={theme.ink} />
        </Pressable>
        <View style={st.headerTitle}>
          <Text style={st.title}>{tr.vocab.title}</Text>
          <Text style={st.tag}>{tr.vocab.tag}</Text>
        </View>
        <View style={st.langToggle}>
          {Object.keys(NATIVE).map((k) => (
            <Pressable key={k} onPress={() => setNativeLang(k)}
              style={[st.langBtn, nativeLang === k && st.langBtnOn]}>
              <Text style={[st.langText, nativeLang === k && st.langTextOn]}>
                {tr.native[k] ?? NATIVE[k]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={st.body}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={st.collection}>
          <View>
            <Text style={st.collNum}>
              {VOCAB.length}<Text style={st.collNumUnit}>  {tr.common.words}</Text>
            </Text>
            <Text style={st.collSub}>{tr.vocab.inCollection}</Text>
          </View>
        </View>

        <View style={st.section}>
          <SectionHeader
            en={tr.vocab.lessons} jp="課"
            right={
              <Pressable onPress={clearLessons} disabled={!lessonsSelected} hitSlop={8}>
                <Text style={[st.headerClear, !lessonsSelected && st.headerClearOff]}>
                  {tr.common.clear}
                </Text>
              </Pressable>
            }
          />
          <LessonBlocks
            value={filters.lessons}
            onChange={setLessons}
            expanded={lessonExpanded}
            onExpandedChange={setExpanded}
          />
        </View>

        <View style={st.section}>
          <SectionHeader en={tr.vocab.wordType} jp="品詞" />
          <View style={st.chips}>
            {POS_GROUPS.map((g) => {
              const n = count((w) => g.members.includes(w.partOfSpeech as Pos));
              if (!n) return null;
              const state = groupState(g.members);
              return (
                <Chip
                  key={g.id}
                  label={tr.posGroups[g.id] ?? g.label}
                  sub={n}
                  active={state !== 'off'}
                  onPress={() => toggleGroup(g.members)}
                />
              );
            })}
          </View>
        </View>

        <View style={st.section}>
          <SectionHeader en={tr.vocab.studyMode} jp="モード" />
          {([
            {
              id: 'production' as const,
              a: tr.native[nativeLang] ?? NATIVE[nativeLang],
              b: '日本語',
              note: tr.vocab.productionNote,
            },
            {
              id: 'recognition' as const,
              a: '日本語',
              b: tr.native[nativeLang] ?? NATIVE[nativeLang],
              note: tr.vocab.recognitionNote,
            },
          ]).map((m) => (
            <Pressable key={m.id} onPress={() => setMode(m.id)}
              style={[st.mode, mode === m.id && st.modeOn]}>
              <View style={st.modeFlow}>
                <Text style={st.modeWord}>{m.a}</Text>
                <Text style={st.modeArrow}>→</Text>
                <Text style={st.modeWord}>{m.b}</Text>
              </View>
              <Text style={st.modeNote}>{m.note}</Text>
            </Pressable>
          ))}
        </View>

        <View style={st.section}>
          <SectionHeader en={tr.vocab.sessionSize} jp="セッション" />
          <View style={st.seg}>
            {[10, 25, 50, SESSION_ALL].map((n) => (
              <Pressable key={n} onPress={() => setLength(n)}
                style={[st.segBtn, length === n && st.segBtnOn]}>
                <Text style={[st.segText, length === n && st.segTextOn]}>
                  {n === SESSION_ALL ? tr.vocab.all : n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={st.more} onPress={() => setShowMore((v) => !v)}>
          <Text style={st.moreText}>{tr.vocab.moreOptions}</Text>
          {advancedActive > 0 && (
            <View style={st.moreBadge}>
              <Text style={st.moreBadgeText}>{advancedActive}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Ionicons
            name="chevron-down" size={15} color={theme.ink2}
            style={showMore ? st.chevronOpen : undefined}
          />
        </Pressable>

        {showMore && (
          <View>
            {showVerbGroups && (
              <View style={st.section}>
                <SectionHeader en={tr.vocab.verbGroup} jp="動詞のグループ" />
                <View style={st.chips}>
                  {VERB_GROUPS.map((g) => (
                    <Chip key={g.id} label={tr.verbGroups[g.id] ?? g.label}
                      sub={count((w) => w.verbGroup === g.id)}
                      active={filters.verbGroups.includes(g.id)}
                      onPress={() => toggleFilter('verbGroups', g.id)} />
                  ))}
                </View>
                <Text style={st.note}>{tr.vocab.verbGroupNote}</Text>
              </View>
            )}

            <View style={st.section}>
              <SectionHeader en={tr.vocab.categories} jp="カテゴリー" />

              {visiblePos
                .filter((pos) => HAS_RICH_CATEGORIES.includes(pos))
                .map((pos) => {
                  const cats = catsOf(pos);
                  if (!cats.length) return null;
                  return (
                    <View key={pos} style={st.catGroup}>
                      <Text style={st.catGroupH}>
                        {posLabel(tr, pos)}  <Text style={st.catGroupJp}>{POS_META[pos].jp}</Text>
                      </Text>
                      <View style={st.chips}>
                        {cats.map((c) => (
                          <Chip key={c} label={categoryLabel(tr, c)}
                            sub={count((w) => w.category === c)}
                            active={filters.categories.includes(c)}
                            onPress={() => toggleFilter('categories', c)} />
                        ))}
                      </View>
                    </View>
                  );
                })}

              {(['i-adjective', 'na-adjective'] as Pos[])
                .some((p) => visiblePos.includes(p)) && (
                <View style={st.catGroup}>
                  <Text style={st.catGroupH}>
                    {tr.vocab.adjectives}  <Text style={st.catGroupJp}>形容詞</Text>
                  </Text>
                  <View style={st.chips}>
                    {(['i-adjective', 'na-adjective'] as Pos[]).map((p) => {
                      const n = count((w) => w.partOfSpeech === p);
                      if (!n) return null;
                      return (
                        <Chip key={p}
                          label={posLabel(tr, p)}
                          sub={n}
                          active={filters.pos.includes(p)}
                          onPress={() => toggleFilter('pos', p)} />
                      );
                    })}
                  </View>
                </View>
              )}

              {(() => {
                const otherLeafs = visiblePos.filter(
                  (p) => !HAS_RICH_CATEGORIES.includes(p)
                      && p !== 'i-adjective' && p !== 'na-adjective',
                );
                if (otherLeafs.length === 0) return null;
                return (
                  <View style={st.catGroup}>
                    <Text style={st.catGroupH}>
                      {tr.vocab.other}  <Text style={st.catGroupJp}>その他</Text>
                    </Text>
                    <View style={st.chips}>
                      {otherLeafs.map((p) => {
                        const n = count((w) => w.partOfSpeech === p);
                        if (!n) return null;
                        return (
                          <Chip key={p}
                            label={posLabel(tr, p)}
                            sub={n}
                            active={filters.pos.includes(p)}
                            onPress={() => toggleFilter('pos', p)} />
                        );
                      })}
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[st.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={st.footInfo}>
          <Text style={st.footCount}>{deck.length}</Text>
          <Text style={st.footLabel}>
            {' '}{tr.common.match}
          </Text>
          {filtersActive && (
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Text style={st.clear}>  {tr.common.clearAll}</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={onStart} disabled={sessionCount === 0}
          style={[st.start, sessionCount === 0 && st.startOff]}>
          <Text style={[st.startText, sessionCount === 0 && st.startTextOff]}>
            {tr.vocab.studyCards(sessionCount)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: theme.line2, gap: 6,
  },
  back: { paddingTop: 4, paddingRight: 2, width: 28 },
  headerTitle: { flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 22, color: theme.ink },
  tag: { fontSize: 9.5, letterSpacing: 1.8, color: theme.ink2, fontWeight: '700', marginTop: 3 },
  langToggle: { flexDirection: 'row', backgroundColor: theme.line2, borderRadius: 10, padding: 3 },
  langBtn: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 8 },
  langBtnOn: { backgroundColor: theme.surface },
  langText: { fontSize: 12, fontWeight: '600', color: theme.ink2 },
  langTextOn: { color: theme.ink },

  body: { padding: 22, paddingBottom: 30 },

  collection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 18, padding: 18, marginBottom: 22,
  },
  collNum: { fontFamily: fonts.display, fontSize: 34, color: theme.ink },
  collNumUnit: { fontSize: 15, color: theme.ink2, fontWeight: '500' },
  collSub: { fontSize: 11.5, color: theme.ink2, marginTop: 5 },

  section: { marginBottom: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  note: { fontSize: 10.5, color: theme.ink2, fontStyle: 'italic', marginTop: 8 },

  headerClear: { fontSize: 12, fontWeight: '700', color: theme.accent },
  headerClearOff: { color: theme.ink2, opacity: 0.4 },

  catGroup: { marginBottom: 13 },
  catGroupH: { fontSize: 11, fontWeight: '700', color: theme.ink2, marginBottom: 8 },
  catGroupJp: { color: theme.accent, fontSize: 10.5 },

  mode: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 14, padding: 13, marginBottom: 8,
  },
  modeOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  modeFlow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeWord: { fontSize: 15, fontWeight: '700', color: theme.ink },
  modeArrow: { color: theme.accent, fontSize: 13, fontWeight: '700' },
  modeNote: { fontSize: 11.5, color: theme.ink2, marginTop: 3 },

  more: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 15, marginBottom: 22,
  },
  moreText: { fontSize: 13, fontWeight: '700', color: theme.ink, letterSpacing: 0.3 },
  moreBadge: {
    marginLeft: 8, backgroundColor: theme.accent, borderRadius: 9,
    minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center',
  },
  moreBadgeText: { fontSize: 11, fontWeight: '700', color: theme.white },
  chevronOpen: { transform: [{ rotate: '180deg' }] },

  seg: { flexDirection: 'row', backgroundColor: theme.line2, borderRadius: 11, padding: 3, marginBottom: 11 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segBtnOn: { backgroundColor: theme.surface },
  segText: { fontSize: 13, fontWeight: '700', color: theme.ink2 },
  segTextOn: { color: theme.ink },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 22, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: theme.line2, backgroundColor: theme.surface,
  },
  footInfo: { flexDirection: 'row', alignItems: 'baseline' },
  footCount: { fontFamily: fonts.display, fontSize: 17, color: theme.ink },
  footLabel: { fontSize: 12, color: theme.ink2, fontWeight: '500' },
  clear: { fontSize: 12, color: theme.accent, fontWeight: '700' },
  start: {
    flex: 1, backgroundColor: theme.accent, borderRadius: 13,
    paddingVertical: 14, alignItems: 'center',
  },
  startOff: { backgroundColor: theme.line },
  startText: { color: theme.white, fontSize: 14.5, fontWeight: '700' },
  startTextOff: { color: theme.ink2 },
});
