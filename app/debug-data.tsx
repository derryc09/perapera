import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTs, loadRawDataDump, RawDataDump } from '../src/db/debugDump';
import { fonts, theme } from '../src/theme';

/**
 * Temporary dev inspector — all SQLite raw tables + live session state.
 * Remove before production release.
 */
export default function DebugData() {
  const insets = useSafeAreaInsets();
  const [dump, setDump] = useState<RawDataDump | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setError(null);
    loadRawDataDump()
      .then(setDump)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={st.back} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={theme.ink} />
        </Pressable>
        <View style={st.headerTitle}>
          <Text style={st.title}>Raw metrics</Text>
          <Text style={st.tag}>DEV · TEMPORARY INSPECTOR</Text>
        </View>
        <Pressable onPress={refresh} style={st.refreshBtn} hitSlop={8}>
          <Ionicons name="refresh" size={20} color={theme.ink2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator>
        <Text style={st.banner}>
          All SQLite tables + in-memory session. Derived home stats shown for
          comparison — not stored as canonical truth.
        </Text>

        {error && (
          <Block title="Error">
            <Mono>{error}</Mono>
          </Block>
        )}

        {dump && (
          <>
            <Block title="Meta">
              <Row label="Exported" value={dump.exportedAt} />
              <Row label="Card time cap (sec)" value={String(dump.constants.cardStudyTimeCapSec)} />
            </Block>

            <Block title="Row counts">
              <Row label="user_settings" value={String(dump.counts.userSettings)} />
              <Row label="study_sessions" value={String(dump.counts.studySessions)} />
              <Row label="session_results (raw)" value={String(dump.counts.sessionResults)} />
              <Row label="vocab_progress (cache)" value={String(dump.counts.vocabProgress)} />
              <Row label="daily_rollup (cache)" value={String(dump.counts.dailyRollup)} />
              <Row label="Unfinalized sessions" value={String(dump.counts.orphanSessions)} />
            </Block>

            <Block title="Zustand (in-memory UI state)">
              <Mono>{JSON.stringify(dump.zustandSnapshot, null, 2)}</Mono>
            </Block>

            <Block title="Active session (in-memory)">
              <Mono>
                {dump.inMemorySession
                  ? JSON.stringify(dump.inMemorySession, null, 2)
                  : 'null'}
              </Mono>
            </Block>

            <Block title="user_settings">
              <Mono>{JSON.stringify(dump.userSettings, null, 2)}</Mono>
            </Block>

            <Block title={`study_sessions (${dump.studySessions.length})`}>
              {dump.studySessions.length === 0 ? (
                <Mono>[]</Mono>
              ) : (
                dump.studySessions.map((s) => (
                  <View key={s.id} style={st.record}>
                    <Text style={st.recordId}>#{s.id}</Text>
                    <Row label="feature" value={s.feature} />
                    <Row label="mode" value={s.mode} />
                    <Row label="started" value={formatTs(s.startedAt)} />
                    <Row label="ended" value={formatTs(s.endedAt)} />
                    <Row label="duration_sec (wall)" value={String(s.durationSec)} />
                    <Row label="active_duration_sec" value={String(s.activeDurationSec)} />
                    <Row label="card_count" value={String(s.cardCount)} />
                    <Row label="cards_answered" value={String(s.cardsAnswered)} />
                    <Row label="correct_count" value={String(s.correctCount)} />
                    <Row label="completed" value={String(s.completed)} />
                    <Row label="quit_at_index" value={s.quitAtIndex == null ? '—' : String(s.quitAtIndex)} />
                    <Row label="filter_json" value={s.filterJson ?? '—'} multiline />
                  </View>
                ))
              )}
            </Block>

            <Block title={`session_results — raw (${dump.sessionResults.length})`}>
              <Mono>
                {dump.sessionResults.length > 200
                  ? JSON.stringify(dump.sessionResults.slice(0, 200), null, 2)
                    + `\n\n… ${dump.sessionResults.length - 200} more rows (truncate in UI)`
                  : JSON.stringify(dump.sessionResults, null, 2)}
              </Mono>
            </Block>

            <Block title={`vocab_progress — cache (${dump.vocabProgress.length})`}>
              <Mono>
                {dump.vocabProgress.length > 150
                  ? JSON.stringify(dump.vocabProgress.slice(0, 150), null, 2)
                    + `\n\n… ${dump.vocabProgress.length - 150} more rows`
                  : JSON.stringify(dump.vocabProgress, null, 2)}
              </Mono>
            </Block>

            <Block title={`daily_rollup — cache (${dump.dailyRollup.length})`}>
              <Mono>{JSON.stringify(dump.dailyRollup, null, 2)}</Mono>
            </Block>

            <Block title="Derived — computeDashboardStats() (not stored)">
              <Mono>{JSON.stringify(dump.derivedDashboard, null, 2)}</Mono>
            </Block>
          </>
        )}

        {!dump && !error && (
          <Text style={st.loading}>Loading…</Text>
        )}
      </ScrollView>
    </View>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={st.block}>
      <Text style={st.blockTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  label, value, multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={st.row}>
      <Text style={st.rowLabel}>{label}</Text>
      <Text style={[st.rowValue, multiline && st.rowValueMulti]} selectable>
        {value}
      </Text>
    </View>
  );
}

function Mono({ children }: { children: string }) {
  return (
    <Text style={st.mono} selectable>
      {children}
    </Text>
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
  tag: { fontSize: 9.5, letterSpacing: 1.6, color: theme.accent, fontWeight: '700', marginTop: 3 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: theme.line2,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { padding: 16, paddingBottom: 40 },
  banner: {
    fontSize: 11.5, color: theme.ink2, lineHeight: 17, marginBottom: 16,
    fontStyle: 'italic',
  },
  loading: { fontSize: 14, color: theme.ink2, textAlign: 'center', marginTop: 24 },

  block: {
    backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.line,
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  blockTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', color: theme.accent, marginBottom: 10,
  },
  record: {
    borderTopWidth: 1, borderTopColor: theme.line2,
    paddingTop: 10, marginTop: 10,
  },
  recordId: {
    fontFamily: fonts.display, fontSize: 14, color: theme.ink, marginBottom: 6,
  },
  row: { marginBottom: 6 },
  rowLabel: { fontSize: 10, fontWeight: '700', color: theme.ink2, marginBottom: 2 },
  rowValue: { fontSize: 12, color: theme.ink },
  rowValueMulti: { fontFamily: 'Menlo', fontSize: 10, lineHeight: 14 },

  mono: {
    fontFamily: 'Menlo',
    fontSize: 10,
    lineHeight: 14,
    color: theme.ink,
  },
});
