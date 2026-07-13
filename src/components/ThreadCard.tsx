// The treatment's core card: a whisper-tint fill with a coloured thread spine
// down the left edge — built exactly how a quilt patch is built, so a card
// reads as a layer of its section's hue. Text inside stays ink tiers; only
// the fill, border, and spine carry the family colour.

import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { borderRadius, mutedPalette, spacing } from '@/constants/theme';
import type { EmotionFamilyId } from '@/types/models';

/** Width of the thread spine strip. */
const SPINE_WIDTH = 5;

interface Props {
  /** Muted family hue this card belongs to. */
  family: EmotionFamilyId;
  children: React.ReactNode;
  /** When set, the card body becomes a Pressable (role defaults to button). */
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  /** Extra style for the card body (padding overrides, gaps…). */
  style?: StyleProp<ViewStyle>;
}

export function ThreadCard({
  family,
  children,
  onPress,
  onLongPress,
  testID,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  style,
}: Props) {
  const palette = mutedPalette[family];
  const body = [styles.body, style];

  const inner = onPress ? (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={body}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {children}
    </Pressable>
  ) : (
    <View testID={testID} style={body}>
      {children}
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: palette.fill, borderColor: palette.border }]}>
      <View
        testID={testID ? `${testID}-spine` : undefined}
        style={[styles.spine, { backgroundColor: palette.thread }]}
      />
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    // Clip the spine into the rounded corners.
    overflow: 'hidden',
  },
  spine: {
    width: SPINE_WIDTH,
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
});

export default ThreadCard;
