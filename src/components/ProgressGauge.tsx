import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing } from '../theme/theme';

type Props = { progress: number; }; // 0..1

export default function ProgressGauge({ progress }: Props) {
  const radius = 90;
  const stroke = 12;
  const cx = 120, cy = 120;
  const start = Math.PI;         // 180°
  const end = Math.PI * (1 + progress); // 180° .. 360°

  const arc = describeArc(cx, cy, radius, start, Math.PI * 2);
  const arcProgress = describeArc(cx, cy, radius, start, end);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Overall Progress</Text>
      <Svg width={240} height={140}>
        {/* background semi-circle */}
        <Path d={arc} stroke={colors.textSecondary + '55'} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {/* progress arc */}
        <Path d={arcProgress} stroke={colors.primary} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {/* center dot */}
        <Circle cx={cx} cy={cy} r={2} fill="transparent" />
      </Svg>
      <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}
function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const largeArc = end - start <= Math.PI ? '0' : '1';
  // Only top half (semi-circle), so clip with sweep flags
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  percent: { position: 'absolute', bottom: spacing.lg, fontSize: 22, fontWeight: '800', color: colors.primary },
});
