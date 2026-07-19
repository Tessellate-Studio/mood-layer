// Contextual screen tip — a dismissible card that appears once when a user
// first lands on a screen, explaining its unique features. Dismissed tips
// are persisted in settingsStore so they never reappear.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';

interface Props {
  tipId: string;
  text: string;
}

export default function ScreenTip({ tipId, text }: Props) {
  const dismissed = useSettingsStore((s) => s.dismissedTips.includes(tipId));
  const dismissTip = useSettingsStore((s) => s.dismissTip);

  if (dismissed) return null;

  return (
    <View style={styles.card} testID={`screen-tip-${tipId}`}>
      <Text style={styles.text}>{text}</Text>
      <Pressable
        testID={`screen-tip-dismiss-${tipId}`}
        accessibilityRole="button"
        accessibilityLabel="Dismiss tip"
        style={styles.close}
        onPress={() => dismissTip(tipId)}
      >
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Line x1={7} y1={7} x2={17} y2={17} stroke={colors.inkMuted} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={17} y1={7} x2={7} y2={17} stroke={colors.inkMuted} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
  },
  text: {
    ...typography.body,
    flex: 1,
  },
  close: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
