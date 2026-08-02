import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/theme';

type Props = { icon: keyof typeof Ionicons.glyphMap; title: string; value: string | number; };

export default function StatCard({ icon, title, value }: Props) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginRight: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  value: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: spacing.xs },
  title: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
