// The quilt's key, on the quilt: one small swatch + name per emotion family,
// in a single quiet horizontal line under the weekly summary. Every glance at
// the home screen becomes a vocabulary rep — tap a family to open its helper
// sheet (the "why" behind the hue). Audit recommendation implemented at the
// user's request, 2026-07-17.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { borderRadius, familyPalette, spacing, typography } from '@/constants/theme';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { useHelperSheetStore } from '@/store/helperSheetStore';

export default function FamilyLegend() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="family-legend"
    >
      {Object.values(EMOTION_FAMILIES).map((family) => (
        <Pressable
          key={family.id}
          testID={`legend-${family.id}`}
          accessibilityRole="button"
          accessibilityLabel={`About ${family.label}`}
          style={styles.item}
          onPress={() => useHelperSheetStore.getState().open(family.id)}
        >
          <View
            style={[styles.swatch, { backgroundColor: familyPalette[family.id].shades[3] }]}
          />
          <Text style={styles.label}>{family.label.toLowerCase()}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    // Slim by design: the legend is a whisper, not a toolbar — the row's
    // ~36px total keeps the quilt the star of the screen.
    minHeight: 28,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.sm,
  },
  label: {
    ...typography.caption,
  },
});
