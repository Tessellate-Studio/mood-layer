// Settings. Skeleton phase — real rows (haptics, reduce motion, reminders,
// clear data) land in P12; these are static placeholders.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { colors, hitTarget, spacing, typography } from '@/constants/theme';

const PLACEHOLDER_ROWS = ['Haptics', 'Reduce motion', 'Reminders', 'About'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-settings">
      <View style={styles.headerRow}>
        <Pressable
          testID="settings-back"
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Line x1={13} y1={3} x2={6} y2={10} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={6} y1={10} x2={13} y2={17} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Real settings rows land in P12. */}
      <View style={styles.rows}>
        {PLACEHOLDER_ROWS.map((label) => (
          <View key={label} style={styles.row}>
            <Text style={typography.label}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconButton: {
    minWidth: hitTarget,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    flex: 1,
    flexWrap: 'wrap',
  },
  rows: {
    marginTop: spacing.lg,
  },
  row: {
    minHeight: hitTarget,
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.inkFaint,
  },
});
