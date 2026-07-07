// Four shade swatches for setting one emotion's intensity (1 light → 4 pressed
// hard). The chosen swatch gets a dashed ink ring. The ramp uses the emotion
// family's Atlas-of-Emotions pastel — the same colour the patch will be sewn
// in, so the dial doubles as a preview.

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { borderRadius, colors, familyPalette, hitTarget, spacing } from '@/constants/theme';
import type { EmotionFamilyId, Intensity } from '@/types/models';

interface Props {
  wordId: string;
  label: string;
  family: EmotionFamilyId;
  value: Intensity;
  onChange(intensity: Intensity): void;
}

const LEVELS: Intensity[] = [1, 2, 3, 4];

export function IntensityDial({ wordId, label, family, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {LEVELS.map((level) => {
        const selected = value === level;
        return (
          <Pressable
            key={level}
            testID={`dial-${wordId}-${level}`}
            accessibilityRole="button"
            accessibilityLabel={`${label} intensity ${level} of 4`}
            accessibilityState={{ selected }}
            style={styles.cell}
            onPress={() => onChange(level)}
          >
            <View
              style={[styles.swatch, { backgroundColor: familyPalette[family].shades[level] }]}
            />
            {selected ? <View style={styles.ring} pointerEvents="none" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    width: hitTarget,
    height: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: hitTarget,
    height: hitTarget,
    borderRadius: borderRadius.sm,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    borderStyle: 'dashed',
  },
});

export default IntensityDial;
