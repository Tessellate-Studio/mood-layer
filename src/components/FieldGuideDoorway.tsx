// The field guide's doorway: four family swatches and a quiet caption link.
// Born on the empty home screen (where it teaches where the guide lives) and
// now shared with the check-in's feel step, so the guide is announced the
// same way from both places (user, 2026-09-02: the check-in's plain link
// "needs to be highlighted, possibly the same style the empty home has").

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, familyPalette, hitTarget, spacing, typography } from '@/constants/theme';
import type { EmotionFamilyId } from '@/types/models';

/** A hue from each corner of the atlas — the guide holds all nine. */
const SWATCH_FAMILIES: EmotionFamilyId[] = ['anger', 'enjoyment', 'sadness', 'anticipation'];

interface Props {
  label: string;
  accessibilityLabel: string;
  onPress(): void;
  testID: string;
}

export function FieldGuideDoorway({ label, accessibilityLabel, onPress, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.row}
      onPress={onPress}
    >
      <View style={styles.swatches} accessibilityElementsHidden>
        {SWATCH_FAMILIES.map((family) => (
          <View
            key={family}
            style={[styles.swatch, { backgroundColor: familyPalette[family].shades[3] }]}
          />
        ))}
      </View>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: hitTarget,
    paddingVertical: spacing.xs,
  },
  swatches: {
    flexDirection: 'row',
    gap: 3,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.sm,
  },
  text: {
    ...typography.caption,
    color: colors.inkSoft,
  },
});

export default FieldGuideDoorway;
