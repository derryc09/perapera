import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardStats } from '../src/db/stats';
import { useT } from '../src/i18n';
import {
  computeDashboardStats,
  EMPTY_STATS,
  formatLastStudiedLabel,
  formatStudyTime,
  JlptBandProgress,
} from '../src/stats';
import { fonts, theme } from '../src/theme';
import { Pill, Ring, SectionHeader } from '../src/ui';

const PRACTICE_MODE_IDS = [
  { id: 'vocab', route: '/vocab' as const, available: true, jp: '語彙' },
  { id: 'conj', route: null, available: false, jp: '動詞活用' },
  { id: 'grammar', route: null, available: false, jp: '文法' },
] as const;

export default function Home() {
  const insets = useSafeAreaInsets();
  const tr = useT();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      computeDashboardStats()
        .then((s) => { if (active) setStats(s); })
        .catch(() => { if (active) setStats(EMPTY_STATS); });
      return () => { active = false; };
    }, []),
  );

  const practiceModes = PRACTICE_MODE_IDS.map((m) => ({
    ...m,
    title:
      m.id === 'vocab' ? tr.home.vocabulary
      : m.id === 'conj' ? tr.home.conjugation
      : tr.home.grammar,
  }));

  const isEmpty = stats.totalCardsAnswered === 0;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={st.logo}>ぺらぺら</Text>
          <Text style={st.tag}>{tr.home.tag}</Text>
        </View>
        <View style={st.headerRight}>
          <Text style={st.lastStudied}>
            {formatLastStudiedLabel(stats.lastStudied, tr.home)}
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={st.settingsBtn}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={22} color={theme.ink2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={st.body}
        showsVerticalScrollIndicator={false}
      >
        <LevelHero stats={stats} tr={tr} />

        <View style={st.statGrid}>
          <StatCard
            value={formatStudyTime(stats.studyTimeMinutes)}
            label={tr.home.studyTime}
            sub={tr.home.sessionsThisWeek(stats.sessionsThisWeek)}
          />
          <StatCard
            value={`${stats.wordsPracticed + stats.phrasesPracticed}`}
            label={tr.home.practiced}
            sub={tr.home.practicedSub(stats.wordsPracticed, stats.phrasesPracticed)}
          />
          <StatCard
            value={`${stats.accuracyPct}%`}
            label={tr.home.accuracy}
            sub={tr.home.accuracySub}
            accent="success"
          />
        </View>

        <View style={st.section}>
          <SectionHeader en={tr.home.jlptProgress} jp="進捗" />
          {stats.jlptBands.map((band) => (
            <JlptBandRow key={band.level} band={band} tr={tr} />
          ))}
        </View>

        <View style={st.section}>
          <SectionHeader en={tr.home.practice} jp="練習" />
          {practiceModes.map((mode) => (
            <PracticeRow key={mode.id} mode={mode} soonLabel={tr.common.soon} />
          ))}
        </View>

        <View style={st.section}>
          <SectionHeader en={tr.home.social} jp="ソーシャル" />
          <View style={st.lockedCard}>
            <View style={st.lockedIcon}>
              <Ionicons name="people-outline" size={20} color={theme.ink2} />
            </View>
            <View style={st.lockedBody}>
              <Text style={st.lockedTitle}>{tr.home.friendsRanking}</Text>
              <Text style={st.lockedSub}>{tr.home.friendsRankingSub}</Text>
            </View>
            <View style={st.soonBadge}>
              <Text style={st.soonText}>{tr.common.soon}</Text>
            </View>
          </View>
        </View>

        {isEmpty && (
          <Text style={st.placeholderNote}>{tr.home.placeholderNote}</Text>
        )}
      </ScrollView>

      <View style={[st.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable onPress={() => router.push('/vocab')} style={st.cta}>
          <Text style={st.ctaText}>{tr.home.studyVocabulary}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LevelHero({ stats, tr }: { stats: DashboardStats; tr: ReturnType<typeof useT> }) {
  return (
    <View style={st.hero}>
      <View style={st.heroLeft}>
        <Text style={st.heroLabel}>{tr.home.estimatedLevel}</Text>
        <Text style={st.heroLevel}>{stats.estimatedLevel}</Text>
        <Pill label={tr.home.ready(stats.readinessPct)} color={theme.accent} />
        <Text style={st.heroCap}>{tr.home.levelCaption}</Text>
      </View>
      <View style={st.ringWrap}>
        <Ring value={stats.readinessPct} size={88} stroke={7} color={theme.accent} />
        <Text style={st.ringPct}>{stats.readinessPct}%</Text>
      </View>
    </View>
  );
}

function StatCard({
  value, label, sub, accent,
}: {
  value: string;
  label: string;
  sub: string;
  accent?: 'success';
}) {
  return (
    <View style={st.statCard}>
      <Text style={[st.statValue, accent === 'success' && { color: theme.success }]}>
        {value}
      </Text>
      <Text style={st.statLabel}>{label}</Text>
      <Text style={st.statSub}>{sub}</Text>
    </View>
  );
}

function JlptBandRow({
  band, tr,
}: {
  band: JlptBandProgress;
  tr: ReturnType<typeof useT>;
}) {
  return (
    <View style={st.bandRow}>
      <View style={st.bandHead}>
        <Text style={st.bandLevel}>{band.level}</Text>
        <Text style={st.bandMeta}>
          {tr.home.bandMeta(band.practiced, band.total, band.accuracyPct)}
        </Text>
      </View>
      <View style={st.barTrack}>
        <View style={[st.barFill, { width: `${band.coveragePct}%` }]} />
      </View>
      <Text style={st.bandPct}>{tr.home.coverage(band.coveragePct)}</Text>
    </View>
  );
}

function PracticeRow({
  mode, soonLabel,
}: {
  mode: {
    id: string;
    title: string;
    jp: string;
    route: '/vocab' | null;
    available: boolean;
  };
  soonLabel: string;
}) {
  const inner = (
    <>
      <View style={st.practiceText}>
        <Text style={[st.practiceTitle, !mode.available && st.practiceTitleOff]}>
          {mode.title}
        </Text>
        <Text style={st.practiceJp}>{mode.jp}</Text>
      </View>
      {mode.available ? (
        <Ionicons name="chevron-forward" size={18} color={theme.ink2} />
      ) : (
        <View style={st.soonBadge}>
          <Text style={st.soonText}>{soonLabel}</Text>
        </View>
      )}
    </>
  );

  if (!mode.available) {
    return <View style={[st.practiceRow, st.practiceRowOff]}>{inner}</View>;
  }

  return (
    <Pressable
      onPress={() => router.push(mode.route!)}
      style={({ pressed }) => [st.practiceRow, pressed && st.practiceRowPressed]}
    >
      {inner}
    </Pressable>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 22, paddingTop: 14, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: theme.line2,
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  logo: { fontFamily: fonts.jp, fontSize: 27, color: theme.accent, letterSpacing: 1 },
  tag: { fontSize: 9.5, letterSpacing: 1.8, color: theme.ink2, fontWeight: '700', marginTop: 3 },
  lastStudied: { fontSize: 11, color: theme.ink2, fontWeight: '600' },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: theme.line2,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { padding: 22, paddingBottom: 30 },

  hero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 18, padding: 20, marginBottom: 16,
  },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroLabel: {
    fontSize: 9.5, letterSpacing: 1.6, fontWeight: '700', color: theme.ink2,
  },
  heroLevel: {
    fontFamily: fonts.display, fontSize: 52, color: theme.ink, marginTop: 2, lineHeight: 58,
  },
  heroCap: { fontSize: 11, color: theme.ink2, marginTop: 10, lineHeight: 16 },

  ringWrap: { alignItems: 'center', justifyContent: 'center', width: 88, height: 88 },
  ringPct: {
    position: 'absolute', fontSize: 15, fontWeight: '700', fontFamily: fonts.display,
    color: theme.ink,
  },

  statGrid: { flexDirection: 'row', gap: 9, marginBottom: 22 },
  statCard: {
    flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 14, padding: 12,
  },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: theme.ink },
  statLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', color: theme.ink2, marginTop: 4,
  },
  statSub: { fontSize: 10, color: theme.ink2, marginTop: 5, lineHeight: 14 },

  section: { marginBottom: 22 },

  bandRow: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  bandHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  bandLevel: { fontFamily: fonts.display, fontSize: 20, color: theme.ink },
  bandMeta: { fontSize: 11, color: theme.ink2, fontWeight: '600' },
  barTrack: {
    height: 6, backgroundColor: theme.line2, borderRadius: 3,
    marginTop: 10, overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 3 },
  bandPct: { fontSize: 10.5, color: theme.ink2, marginTop: 6, fontWeight: '600' },

  practiceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
  },
  practiceRowPressed: { backgroundColor: theme.accentSoft, borderColor: theme.accentSoftBorder },
  practiceRowOff: { opacity: 0.72 },
  practiceText: { flex: 1 },
  practiceTitle: { fontSize: 15, fontWeight: '700', color: theme.ink },
  practiceTitleOff: { color: theme.ink2 },
  practiceJp: { fontSize: 11.5, color: theme.accent, marginTop: 2, fontWeight: '600' },

  lockedCard: {
    flexDirection: 'row', alignItems: 'center', minHeight: 72,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  lockedIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.line2,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  lockedBody: { flex: 1 },
  lockedTitle: { fontSize: 15, fontWeight: '700', color: theme.ink2 },
  lockedSub: { fontSize: 11.5, color: theme.ink2, marginTop: 2 },

  soonBadge: {
    backgroundColor: theme.line2, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  soonText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: theme.ink2 },

  placeholderNote: {
    fontSize: 10.5, color: theme.ink2, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 16, paddingHorizontal: 8,
  },

  footer: {
    paddingHorizontal: 22, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: theme.line2, backgroundColor: theme.surface,
  },
  cta: { backgroundColor: theme.accent, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  ctaText: { color: theme.white, fontSize: 15, fontWeight: '700' },
});
