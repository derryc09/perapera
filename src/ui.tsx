import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from './theme';

// ---- Familiarity ring ------------------------------------------------------
export function Ring({
  value, size = 46, stroke = 5, color,
}: { value: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={theme.line} strokeWidth={stroke} />
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
    </Svg>
  );
}

// ---- Filter chip -----------------------------------------------------------
export function Chip({
  label, sub, active, onPress,
}: { label: string; sub?: number | string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipOn]}>
      <Text style={[s.chipText, active && s.chipTextOn]}>{label}</Text>
      {sub != null && (
        <View style={[s.chipSub, active && s.chipSubOn]}>
          <Text style={[s.chipSubText, active && s.chipTextOn]}>{sub}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---- Section header (optional right slot) ----------------------------------
export function SectionHeader({
  en, jp, right,
}: { en: string; jp: string; right?: React.ReactNode }) {
  return (
    <View style={s.sectionH}>
      <View style={s.sectionTitle}>
        <Text style={s.sectionEn}>{en}</Text>
        <Text style={s.sectionJp}>{jp}</Text>
      </View>
      {right}
    </View>
  );
}

// ---- Level pill ------------------------------------------------------------
export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.pill, { borderColor: color }]}>
      <View style={[s.pillDot, { backgroundColor: color }]} />
      <Text style={[s.pillText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 11,
  },
  chipOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText: { fontSize: 12.5, fontWeight: '600', color: theme.ink },
  chipTextOn: { color: theme.white },
  chipSub: { backgroundColor: theme.line2, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  chipSubOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  chipSubText: { fontSize: 10, fontWeight: '700', color: theme.ink2 },

  sectionH: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: 11,
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionEn: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.4,
    textTransform: 'uppercase', color: theme.ink,
  },
  sectionJp: { fontSize: 12, color: theme.accent },

  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
});