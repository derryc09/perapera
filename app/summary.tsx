import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VOCAB } from '../src/data/vocab';
import { useT } from '../src/i18n';
import { useStore } from '../src/store';
import { fonts, theme } from '../src/theme';

export default function Summary() {
  const insets = useSafeAreaInsets();
  const session = useStore((s) => s.session);
  const nativeLang = useStore((s) => s.nativeLang);
  const endSession = useStore((s) => s.endSession);
  const tr = useT();

  useEffect(() => { if (!session) router.replace('/'); }, [session]);
  if (!session) return null;

  const results = session.results;
  const correct = results.filter((r) => r.correct).length;
  const incorrect = results.length - correct;
  const pct = results.length ? Math.round((correct / results.length) * 100) : 0;
  const missed = results.filter((r) => !r.correct);

  const finish = () => { endSession(); router.replace('/'); };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Text style={st.logo}>ぺらぺら</Text>
        <Text style={st.tag}>{tr.summary.tag}</Text>
      </View>

      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <View style={st.hero}>
          <Text style={st.heroNum}>{pct}%</Text>
          <Text style={st.heroCap}>{tr.summary.correctOf(correct, results.length)}</Text>
        </View>

        <View style={st.grid}>
          <Stat n={`${correct}`} label={tr.summary.knewIt} accent="correct" />
          <Stat n={`${incorrect}`} label={tr.summary.toReview} accent="wrong" />
        </View>

        {missed.length > 0 && (
          <View style={st.list}>
            <Text style={st.listH}>{tr.summary.wordsToReview}</Text>
            {missed.map((r, i) => {
              const w = VOCAB.find((v) => v.id === r.vocabId)!;
              return (
                <View key={i} style={[st.row, i > 0 && st.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.rowJp}>{w.japanese}</Text>
                    {w.japanese !== w.reading && <Text style={st.rowReading}>{w.reading}</Text>}
                  </View>
                  <Text style={st.rowMean}>{w.meanings[nativeLang] ?? Object.values(w.meanings)[0]}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[st.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable onPress={finish} style={st.btn}>
          <Text style={st.btnText}>{tr.summary.backToHome}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ n, label, accent }: { n: string; label: string; accent: 'correct' | 'wrong' }) {
  return (
    <View style={[st.stat, accent === 'correct' ? st.statCorrect : st.statWrong]}>
      <Text style={[st.statN, accent === 'correct' ? { color: theme.success } : { color: theme.accent }]}>{n}</Text>
      <Text style={st.statL}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  header: {
    paddingHorizontal: 22, paddingTop: 14, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: theme.line2,
  },
  logo: { fontFamily: fonts.jp, fontSize: 27, color: theme.accent, letterSpacing: 1 },
  tag: { fontSize: 9.5, letterSpacing: 1.6, color: theme.ink2, fontWeight: '700', marginTop: 3 },

  body: { padding: 22 },
  hero: { alignItems: 'center', paddingVertical: 18 },
  heroNum: { fontFamily: fonts.display, fontSize: 64, color: theme.accent },
  heroCap: { fontSize: 12, letterSpacing: 1.6, color: theme.ink2, fontWeight: '700', marginTop: 4 },

  grid: { flexDirection: 'row', gap: 9, marginBottom: 20 },
  stat: {
    flex: 1, borderWidth: 1, borderRadius: 14, padding: 14,
  },
  statCorrect: { backgroundColor: theme.successBg, borderColor: theme.successBorder },
  statWrong:   { backgroundColor: theme.accentSoft, borderColor: theme.accentSoftBorder },
  statN: { fontFamily: fonts.display, fontSize: 26 },
  statL: { fontSize: 11, color: theme.ink2, marginTop: 5, fontWeight: '500' },

  list: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 16, paddingHorizontal: 16 },
  listH: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.3, color: theme.ink2, paddingVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: theme.line2 },
  rowJp: { fontFamily: fonts.jp, fontSize: 18, color: theme.ink },
  rowReading: { fontSize: 12, color: theme.ink2, marginTop: 1 },
  rowMean: { fontSize: 13, color: theme.ink2, textAlign: 'right', maxWidth: '55%' },

  footer: {
    paddingHorizontal: 22, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: theme.line2, backgroundColor: theme.surface,
  },
  btn: { backgroundColor: theme.accent, borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: theme.white, fontSize: 14.5, fontWeight: '700' },
});