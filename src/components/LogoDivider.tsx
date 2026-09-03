// Closing divider: the four-band logo mark, stacked ink-fading bands, above
// an optional centred closing tip. Lifts a screen's last line out of grey
// body text and gives the page a deliberate full stop. Same geometry as the
// launcher icon and LogoMark (four bands since 2026-09-02).

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { LOGO_BANDS } from '@/components/LogoMark';
import { colors, spacing, typography } from '@/constants/theme';

/** Ink fading down the stack, top band first — the mark in one colour. */
const BAND_INK = [colors.ink, colors.inkSoft, colors.inkMuted, colors.inkFaint] as const;

interface Props {
  /** Closing line rendered under the mark; omitted → the mark stands alone. */
  tip?: string;
}

export function LogoDivider({ tip }: Props) {
  return (
    <View style={styles.wrap} testID="logo-divider">
      {/* Decorative mark — hidden from screen readers; the tip is real text. */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={34} height={34} viewBox="0 0 240 240" opacity={0.9}>
          {LOGO_BANDS.map((band, i) => (
            <Rect
              key={i}
              x={band.x}
              y={band.y}
              width={band.w}
              height={band.h}
              rx={band.h / 2}
              fill="none"
              stroke={BAND_INK[i]}
              strokeWidth={8}
            />
          ))}
        </Svg>
      </View>
      {tip ? <Text style={styles.tip}>{tip}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  tip: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 25,
    color: colors.inkSoft,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default LogoDivider;
