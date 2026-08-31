// Closing divider: the three-band logo mark, stacked ink-fading bands, above
// an optional centred closing tip. Lifts a screen's last line out of grey
// body text and gives the page a deliberate full stop.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors, spacing, typography } from '@/constants/theme';

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
          <Rect x={58} y={127} width={124} height={46} rx={23} fill="none" stroke={colors.inkFaint} strokeWidth={8} />
          <Rect x={66} y={89} width={108} height={46} rx={23} fill="none" stroke={colors.inkMuted} strokeWidth={8} />
          <Rect x={75} y={51} width={90} height={46} rx={23} fill="none" stroke={colors.ink} strokeWidth={8} />
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
