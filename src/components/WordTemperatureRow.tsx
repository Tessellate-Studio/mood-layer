// A chosen emotion word with its temperature beside it: the chip wears the
// family pastel at the chosen intensity, and the four-swatch dial sits right
// there — so naming and weighing happen in ONE place instead of a separate
// intensity step (user-approved temperature-chip design, 2026-07-17).

import React from 'react';
import { StyleSheet, View } from 'react-native';

import EmotionChip from '@/components/EmotionChip';
import IntensityDial from '@/components/IntensityDial';
import { familyPalette, spacing } from '@/constants/theme';
import type { EmotionFamilyId, Intensity } from '@/types/models';

interface Props {
  wordId: string;
  label: string;
  family: EmotionFamilyId;
  intensity: Intensity;
  /** Tap the chip to let the word go. */
  onToggle(): void;
  onChangeIntensity(intensity: Intensity): void;
  /** Long-press doorway to the family helper (optional). */
  onLongPress?(): void;
  /** Chip id (testID `chip-${chipId}`). Defaults to `picked-${wordId}` so the
   *  row never collides with the word-cloud chip for the same word. */
  chipId?: string;
}

export function WordTemperatureRow({
  wordId,
  label,
  family,
  intensity,
  onToggle,
  onChangeIntensity,
  onLongPress,
  chipId,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.chipHolder}>
        <EmotionChip
          id={chipId ?? `picked-${wordId}`}
          label={label}
          selected
          fill={familyPalette[family].shades[intensity]}
          onPress={onToggle}
          onLongPress={onLongPress}
        />
      </View>
      <IntensityDial
        wordId={wordId}
        label={label}
        family={family}
        value={intensity}
        onChange={onChangeIntensity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chipHolder: {
    // The chip may wrap a long word; the dial keeps its fixed footprint.
    flexShrink: 1,
    alignItems: 'flex-start',
  },
});

export default WordTemperatureRow;
