// Section header for the muted-layer treatment: a two-band logo glyph tinted
// to the section's family hue, an uppercase overline label, and a trailing
// solid rule (dashed until 2026-08-31 — the stitch-line language is retired). The glyph is a derived subset of the three-band mark (see
// LogoDivider) — the logo doing navigational work, not decoration for its
// own sake.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { glyphBandOpacity, mutedPalette, spacing, typography } from '@/constants/theme';
import type { EmotionFamilyId } from '@/types/models';

interface Props {
  /** Muted family hue that names this section's layer. */
  family: EmotionFamilyId;
  label: string;
}

/** Two overlapping rounded bands — the top two bands of the logo mark. */
function TwoBandGlyph({ family }: { family: EmotionFamilyId }) {
  const { thread } = mutedPalette[family];
  return (
    <Svg width={26} height={20} viewBox="0 0 26 20">
      <Rect x={1} y={6} width={17} height={9} rx={4.5} fill={thread} fillOpacity={glyphBandOpacity} />
      <Rect x={1} y={6} width={17} height={9} rx={4.5} fill="none" stroke={thread} strokeWidth={1.3} />
      <Rect x={8} y={3} width={17} height={9} rx={4.5} fill={thread} fillOpacity={glyphBandOpacity} />
      <Rect x={8} y={3} width={17} height={9} rx={4.5} fill="none" stroke={thread} strokeWidth={1.3} />
    </Svg>
  );
}

export function SectionHeader({ family, label }: Props) {
  return (
    <View style={styles.row}>
      {/* Decorative glyph — the label carries the meaning for screen readers. */}
      <View
        testID={`section-glyph-${family}`}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <TwoBandGlyph family={family} />
      </View>
      <Text style={styles.label} accessibilityRole="header">
        {label}
      </Text>
      <View style={[styles.rule, { borderColor: mutedPalette[family].border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.overline,
    flexShrink: 1,
  },
  rule: {
    flex: 1,
    height: 0,
    borderTopWidth: 1.5,
  },
});

export default SectionHeader;
