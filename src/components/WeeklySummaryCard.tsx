// Home screen's "This week, mostly ___" card: the app mark mood-tinted with
// the week's top families (per the logo handoff, variants swap which families
// are stacked), next to the gentle sentence naming them. Hidden entirely for
// a quiet week — see homeWeeklySummary.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';
import { WEEKLY_SUMMARY_OVERLINE, type HomeWeeklySummary } from '@/content/circle';
import LogoMark from '@/components/LogoMark';

const MARK_SIZE = 56;

interface Props {
  summary: HomeWeeklySummary | null;
}

export default function WeeklySummaryCard({ summary }: Props) {
  if (!summary) return null;

  return (
    <View style={styles.row} testID="weekly-summary">
      <LogoMark families={summary.families} size={MARK_SIZE} />
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
