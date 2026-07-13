// The app's one "learn →" affordance: opens a family's helper sheet (host
// lives once in App.tsx) from any screen. A quiet caption visually, but
// padded to the 44px hit target — caption-sized text alone is too small to
// tap reliably (WCAG 2.1 AA, forge hard rule).

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, hitTarget, spacing, typography } from '@/constants/theme';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import type { EmotionFamilyId } from '@/types/models';

interface Props {
  family: EmotionFamilyId;
  testID: string;
}

export function LearnLink({ family, testID }: Props) {
  const label = EMOTION_FAMILIES[family].label;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Learn about ${label}`}
      hitSlop={8}
      style={styles.link}
      onPress={() => useHelperSheetStore.getState().open(family)}
    >
      <Text style={styles.text}>learn →</Text>
    </Pressable>
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
