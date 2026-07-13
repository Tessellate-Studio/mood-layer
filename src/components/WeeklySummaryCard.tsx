// Home screen's "This week, mostly ___" card: a small cluster of translucent
// cloth pieces (same layering idea as a quilt patch) tinted with the top 1-2
// families, next to the gentle sentence naming them. Hidden entirely for a
// quiet week — see homeWeeklySummary.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors, familyPalette, spacing, typography } from '@/constants/theme';
import { WEEKLY_SUMMARY_OVERLINE, type HomeWeeklySummary } from '@/content/circle';

const MARK_SIZE = 56;

interface Props {
  summary: HomeWeeklySummary | null;
}

export default function WeeklySummaryCard({ summary }: Props) {
  if (!summary) return null;

  return (
    <View style={styles.row} testID="weekly-summary">
      <Svg width={MARK_SIZE} height={MARK_SIZE} viewBox="0 0 56 56">
        {summary.families.map((family, i) => (
          <Rect
            key={family}
            x={i === 0 ? 4 : 16}
            y={i === 0 ? 4 : 16}
            width={36}
            height={36}
            rx={18}
            fill={familyPalette[family].shades[3]}
            fillOpacity={0.85}
          />
        ))}
      </Svg>
      <View style={styles.text}>
        <Text style={styles.overline}>{WEEKLY_SUMMARY_OVERLINE}</Text>
        <Text style={styles.headline}>{summary.headline}</Text>
        <Text style={styles.body}>{summary.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.inkFaint,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  overline: {
    ...typography.overline,
  },
  headline: {
    ...typography.heading,
    fontSize: 20,
  },
  body: {
    ...typography.body,
  },
});
