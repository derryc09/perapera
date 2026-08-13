import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_LANGS, useT } from '../src/i18n';
import { NATIVE } from '../src/meta';
import { useStore } from '../src/store';
import { fonts, theme } from '../src/theme';
import { SectionHeader } from '../src/ui';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const tr = useT();
  const appLang = useStore((s) => s.appLang);
  const nativeLang = useStore((s) => s.nativeLang);
  const setAppLang = useStore((s) => s.setAppLang);
  const setNativeLang = useStore((s) => s.setNativeLang);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={st.back} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={theme.ink} />
        </Pressable>
        <View style={st.headerTitle}>
          <Text style={st.title}>{tr.settings.title}</Text>
          <Text style={st.tag}>{tr.settings.tag}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <View style={st.section}>
          <SectionHeader en={tr.settings.appLanguage} jp="言語" />
          <Text style={st.note}>{tr.settings.appLanguageNote}</Text>
          <View style={st.langList}>
            {APP_LANGS.map((opt) => (
              <LangOption
                key={opt.id}
                label={opt.label}
                selected={appLang === opt.id}
                onPress={() => setAppLang(opt.id)}
              />
            ))}
          </View>
        </View>

        <View style={st.section}>
          <SectionHeader en={tr.settings.studyLanguage} jp="釈義" />
          <Text style={st.note}>{tr.settings.studyLanguageNote}</Text>
          <View style={st.langList}>
            {Object.keys(NATIVE).map((k) => (
              <LangOption
                key={k}
                label={tr.native[k] ?? NATIVE[k]}
                selected={nativeLang === k}
                onPress={() => setNativeLang(k)}
              />
            ))}
          </View>
        </View>
        <View style={st.section}>
          <SectionHeader en="Developer" jp="開発" />
          <Text style={st.note}>
            Temporary inspector for all SQLite tables and live session state.
          </Text>
          <Pressable
            onPress={() => router.push('/debug-data')}
            style={({ pressed }) => [st.navRow, pressed && st.navRowPressed]}
          >
            <View style={st.navText}>
              <Text style={st.navTitle}>Raw metrics log</Text>
              <Text style={st.navSub}>study_sessions · session_results · caches</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.ink2} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function LangOption({
  label, selected, onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.langRow, selected && st.langRowOn]}
    >
      <Text style={[st.langLabel, selected && st.langLabelOn]}>{label}</Text>
      {selected && (
        <Ionicons name="checkmark" size={18} color={theme.accent} />
      )}
    </Pressable>
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

  body: { padding: 22, paddingBottom: 30 },
  section: { marginBottom: 28 },
  note: { fontSize: 11.5, color: theme.ink2, lineHeight: 17, marginBottom: 12 },

  langList: { gap: 8 },
  langRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  langRowOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  langLabel: { fontSize: 15, fontWeight: '600', color: theme.ink },
  langLabelOn: { color: theme.ink, fontWeight: '700' },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  navRowPressed: { backgroundColor: theme.accentSoft, borderColor: theme.accentSoftBorder },
  navText: { flex: 1 },
  navTitle: { fontSize: 15, fontWeight: '700', color: theme.ink },
  navSub: { fontSize: 11, color: theme.ink2, marginTop: 3 },
});
