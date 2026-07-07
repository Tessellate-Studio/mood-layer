// A selectable pill for an emotion word or masking state. Selected = ink fill,
// paper label. Dashed variant marks masking states (covers, not feelings).

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';

interface Props {
  id: string;
  label: string;
  selected: boolean;
  onPress(): void;
  /** Masking states render with a dashed border to read as tentative. */
  dashed?: boolean;
}

const HIT_SLOP = { top: 6, bottom: 6, left: 4, right: 4 };

export function EmotionChip({ id, label, selected, onPress, dashed }: Props) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  return (
    <Pressable
      testID={`chip-${id}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      style={[
        styles.chip,
        dashed && styles.dashed,
        selected && styles.selected,
      ]}
      onPress={() => {
        if (hapticsEnabled) Haptics.selectionAsync();
        onPress();
      }}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  dashed: {
    borderStyle: 'dashed',
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    ...typography.label,
  },
  labelSelected: {
    color: colors.paper,
  },
});

export default EmotionChip;
