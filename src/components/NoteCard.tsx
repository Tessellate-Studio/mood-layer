// The one face every floating note wears — the first-visit CoachNote and the
// check-in's teaching hints alike. On a page of ink-on-cream words, a note
// that is ALSO ink-on-cream is just another paragraph (user, 2026-09-02:
// "hard to distinguish… add an appropriate highlight to all notes"), so a
// note is a tinted layer: the family's muted card fill, its border, and the
// floating lift. Opaque by contract (regression #24 — a translucent card
// veils what it crosses). Text on the tint stays ink tiers; every tier holds
// AA on every mutedPalette fill (designTreatment.test.tsx).

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderRadius, mutedPalette, shadows, spacing } from '@/constants/theme';
import type { EmotionFamilyId } from '@/types/models';

/** The note face as a style, for hosts that need their own touchable. */
export function noteCardStyle(family: EmotionFamilyId): ViewStyle {
  return {
    ...styles.card,
    backgroundColor: mutedPalette[family].fill,
    borderColor: mutedPalette[family].border,
  };
}

interface Props {
  family: EmotionFamilyId;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function NoteCard({ family, children, style, testID }: Props) {
  return (
    <View style={[noteCardStyle(family), style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.floating,
  },
});

export default NoteCard;
