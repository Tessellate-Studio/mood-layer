// Home screen's "This week, mostly ___" card: the app mark mood-tinted with
// the week's top families (per the logo handoff, variants swap which families
// are stacked), next to the gentle sentence naming them. The mark breathes in
// the box rhythm — in 4, hold 4, out 4, hold 4 (user, 2026-07-17) — dipping
// DOWN from its laid-out size so it never overflows the row. Hidden entirely
// for a quiet week — see homeWeeklySummary.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, spacing, typography } from '@/constants/theme';
import { WEEKLY_SUMMARY_OVERLINE, type HomeWeeklySummary } from '@/content/circle';
import LogoMark from '@/components/LogoMark';
import { useMotion } from '@/hooks/useMotion';

const MARK_SIZE = 56;

interface Props {
  summary: HomeWeeklySummary | null;
}

export default function WeeklySummaryCard({ summary }: Props) {
  const { reduced } = useMotion();
  const scale = useSharedValue(1);
  const hasSummary = summary !== null;

  React.useEffect(() => {
    if (reduced || !hasSummary) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.boxBreathePhaseMs }),
        withTiming(1, { duration: motion.boxBreathePhaseMs }),
        withTiming(motion.boxBreatheMarkScale, { duration: motion.boxBreathePhaseMs }),
        withTiming(motion.boxBreatheMarkScale, { duration: motion.boxBreathePhaseMs })
      ),
      -1
    );
    return () => cancelAnimation(scale);
    // scale is a stable shared-value ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, hasSummary]);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!summary) return null;

  return (
    <View style={styles.row} testID="weekly-summary">
      <Animated.View style={breatheStyle}>
        <LogoMark families={summary.families} size={MARK_SIZE} />
      </Animated.View>
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
    fontSize: 21,
    lineHeight: 28, // >= 21 x 1.318 — keeps descenders inside the line box
  },
  body: {
    ...typography.body,
  },
});
