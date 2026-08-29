// The app's one quiet caption-link affordance. CaptionLink is the primitive —
// caption-sized ink text padded to the 44px hit target, because caption text
// alone is too small to tap reliably (WCAG 2.1 AA, forge hard rule). LearnLink
// is its main use: "learn →" opens a family's helper sheet (host lives once in
// App.tsx) from any screen.

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, hitTarget, spacing, typography } from '@/constants/theme';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import type { EmotionFamilyId } from '@/types/models';

interface CaptionLinkProps {
  label: string;
  accessibilityLabel: string;
  onPress(): void;
  testID: string;
}

export function CaptionLink({ label, accessibilityLabel, onPress, testID }: CaptionLinkProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={styles.link}
      onPress={onPress}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

interface Props {
  family: EmotionFamilyId;
  testID: string;
}

export function LearnLink({ family, testID }: Props) {
  const label = EMOTION_FAMILIES[family].label;
  return (
    <CaptionLink
      testID={testID}
      accessibilityLabel={`Learn about ${label}`}
      label="learn →"
      onPress={() => useHelperSheetStore.getState().open(family)}
    />
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: hitTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
  },
  text: {
    ...typography.caption,
    color: colors.inkSoft,
  },
});

export default LearnLink;
