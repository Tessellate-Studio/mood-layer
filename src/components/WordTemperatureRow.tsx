// A chosen emotion word with its temperature beside it: the chip wears the
// family pastel at the chosen intensity, and the four-swatch dial sits right
// there — so naming and weighing happen in ONE place instead of a separate
// intensity step (user-approved temperature-chip design, 2026-07-17).

import React from 'react';
import { StyleSheet, View } from 'react-native';

import EmotionChip from '@/components/EmotionChip';
import IntensityDial from '@/components/IntensityDial';
import { familyPalette, spacing } from '@/constants/theme';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import type { EmotionFamilyId, Intensity } from '@/types/models';

interface Props {
  wordId: string;
  label: string;
  family: EmotionFamilyId;
  /** null until the user weighs the word — the chip stays uncoloured. */
  intensity: Intensity | null;
  /** Tap the chip to let the word go. */
  onToggle(): void;
  onChangeIntensity(intensity: Intensity): void;
  /** Long-press doorway. Defaults to this word's own helper sheet, so every
   *  surface that shows a weighed word teaches on hold without wiring. */
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
          fill={intensity !== null ? familyPalette[family].shades[intensity] : undefined}
          onPress={onToggle}
          onLongPress={onLongPress ?? (() => useHelperSheetStore.getState().openWord(wordId))}
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
