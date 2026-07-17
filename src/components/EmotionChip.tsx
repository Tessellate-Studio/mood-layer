// A selectable pill for an emotion word or masking state. Selected = ink fill,
// paper label — unless a `fill` colour is given, in which case the selected
// chip wears that family pastel with ink text (the chip doubling as its own
// temperature swatch — user-approved 2026-07-17). Dashed variant marks
// masking states (covers, not feelings).

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
  /** Family-pastel background for the selected state (label stays ink —
   *  every familyPalette shade holds AA under ink text). */
  fill?: string;
  /** Optional quiet doorway (e.g. open the family helper). */
  onLongPress?(): void;
}

const HIT_SLOP = { top: 6, bottom: 6, left: 4, right: 4 };

export function EmotionChip({ id, label, selected, onPress, dashed, fill, onLongPress }: Props) {
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
        selected && (fill ? { backgroundColor: fill, borderColor: fill } : styles.selected),
      ]}
      onPress={() => {
        if (hapticsEnabled) Haptics.selectionAsync();
        onPress();
      }}
      onLongPress={onLongPress}
    >
      <Text style={[styles.label, selected && !fill && styles.labelSelected]}>{label}</Text>
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
