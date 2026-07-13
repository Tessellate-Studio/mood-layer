// Insights tab — "the depth". On every focus it checks whether LAST ISO week
// has been generated yet (idempotent — the store marks the week) and, if not,
// aggregates that week's check-ins + judgment entries and asks the store for
// cards. Cards are gentle paper notes, each with a category overline; a
// resistance card also shows the four resistance tells, the ones that fired
// emphasised. Capped at two a week — an invitation, never a diagnosis.

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { borderRadius, colors, hitTarget, motion, spacing, typography } from '@/constants/theme';
import LogoDivider from '@/components/LogoDivider';
import PaperTexture from '@/components/PaperTexture';
import ThreadCard from '@/components/ThreadCard';
import { RESISTANCE_TELLS } from '@/content/resistance';
import { useMotion } from '@/hooks/useMotion';
import { useCheckInStore } from '@/store/checkInStore';
import { useExperimentStore } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import type { EmotionFamilyId, InsightCardState, WeekStats } from '@/types/models';
import { previousWeekKey, weekRangeLabel } from '@/utils/dates';
import { computeStatsForWeek } from '@/utils/insightEngine';

/** Stagger step between card entrances. */
const STAGGER_MS = 90;

const OVERLINE: Record<InsightCardState['kind'], string> = {
  pattern: 'This week · Pattern',
  resistance: 'Gentle notice · Resistance',
};

// Muted-layer treatment: each card kind is its own layer. Patterns wear the
// sadness blue (quiet observation); resistance wears the fear violet — the
// hue the app already uses to teach resisted fear.
const CARD_FAMILY: Record<InsightCardState['kind'], EmotionFamilyId> = {
  pattern: 'sadness',
  resistance: 'fear',
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The four resistance tells, shown as chips on a resistance card. */
function ResistanceTells({ fired }: { fired: Set<string> }) {
  return (
    <View style={styles.tellRow}>
      {Object.values(RESISTANCE_TELLS).map((tell) => {
        const on = fired.has(tell.id);
        return (
          <View
            key={tell.id}
            testID={`insight-tell-${tell.id}`}
            accessibilityRole="text"
            accessibilityState={{ selected: on }}
            style={[styles.tellChip, on ? styles.tellChipOn : styles.tellChipOff]}
          >
            <Text style={[styles.tellText, on ? styles.tellTextOn : styles.tellTextOff]}>
              {tell.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function InsightCard({
  card,
  stats,
  index,
  reduceMotion,
  onDismiss,
}: {
  card: InsightCardState;
  stats: WeekStats | undefined;
  index: number;
  reduceMotion: boolean;
  onDismiss: () => void;
}) {
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 10);

  React.useEffect(() => {
    if (reduceMotion) {
      // Hard rule (CLAUDE.md): animations disable cleanly — snap to rest.
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withDelay(index * STAGGER_MS, withTiming(1, { duration: motion.gentleMs }));
    translateY.value = withDelay(index * STAGGER_MS, withTiming(0, { duration: motion.gentleMs }));
  }, [index, opacity, reduceMotion, translateY]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const fired = React.useMemo(() => {
    if (!stats) return new Set<string>();
    return new Set(
      Object.entries(stats.resistanceCounts)
        .filter(([, count]) => count > 0)
        .map(([id]) => id)
    );
  }, [stats]);

  return (
    <Animated.View style={entryStyle}>
      <ThreadCard family={CARD_FAMILY[card.kind]} style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.overline}>{OVERLINE[card.kind]}</Text>
          <Pressable
            testID={`insight-dismiss-${card.id}`}
            accessibilityRole="button"
            accessibilityLabel="Dismiss insight"
            style={styles.dismiss}
            onPress={onDismiss}
          >
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Line x1={2} y1={2} x2={12} y2={12} stroke={colors.inkMuted} strokeWidth={1.5} strokeLinecap="round" />
              <Line x1={12} y1={2} x2={2} y2={12} stroke={colors.inkMuted} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
        <Text style={styles.cardTitle}>{card.title}</Text>
        {card.kind === 'resistance' ? <ResistanceTells fired={fired} /> : null}
        <Text style={styles.cardText}>{card.body}</Text>
      </ThreadCard>
    </Animated.View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const cards = useInsightStore((s) => s.cards);
  const dismissCard = useInsightStore((s) => s.dismissCard);
  const checkIns = useCheckInStore((s) => s.checkIns);
  const judgmentEntries = useExperimentStore((s) => s.judgmentEntries);

  const { reduced: reduceMotion } = useMotion();

  // Generate LAST week's cards the first time the tab is focused after the
  // week rolls over. getState() reads (not hook subscriptions) keep this
  // callback stable so useFocusEffect doesn't re-run on every store change.
  useFocusEffect(
    React.useCallback(() => {
      const lastWeek = previousWeekKey(new Date());
      if (useInsightStore.getState().lastGeneratedWeekKey === lastWeek) return;
      const stats = computeStatsForWeek(
        useCheckInStore.getState().checkIns,
        useExperimentStore.getState().judgmentEntries,
        lastWeek
      );
      useInsightStore.getState().generateForWeek(lastWeek, stats);
    }, [])
  );

  // Newest week first; ISO 'GGGG-Www' keys sort correctly as strings.
  const visible = cards
    .filter((card) => !card.dismissedAt)
    .sort((a, b) => b.weekKey.localeCompare(a.weekKey));

  // Stats for each week that has a visible card — the header summary reads the
  // newest, and resistance cards read theirs for the fired-tell emphasis.
  const statsByWeek = React.useMemo(() => {
    const weeks = new Set(visible.map((c) => c.weekKey));
    const map: Record<string, WeekStats> = {};
    for (const wk of weeks) map[wk] = computeStatsForWeek(checkIns, judgmentEntries, wk);
    return map;
  }, [visible, checkIns, judgmentEntries]);

  const newestWeek = visible[0]?.weekKey;
  const summaryStats = newestWeek ? statsByWeek[newestWeek] : undefined;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-insights">
      <PaperTexture />
      <Text style={typography.title}>This week</Text>
      {summaryStats ? (
        <Text style={styles.summary} testID="insights-summary">
          {weekRangeLabel(newestWeek!)} · {plural(summaryStats.checkInCount, 'check-in', 'check-ins')}{' '}
          across {plural(summaryStats.activeDayCount, 'day', 'days')}
        </Text>
      ) : null}

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Not enough stitches yet — check in a few more times this week.
          </Text>
          <Text style={styles.emptyCaption}>
            Patterns appear here once a week, when there is enough quilt to read.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <InsightCard
              card={item}
              stats={statsByWeek[item.weekKey]}
              index={index}
              reduceMotion={reduceMotion}
              onDismiss={() => dismissCard(item.id)}
            />
          )}
          ListFooterComponent={
            <View testID="insights-footer">
              <LogoDivider tip="Insights stay gentle. Two a week, at most — the rest is just your quilt, quietly growing." />
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  summary: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  emptyCaption: {
    ...typography.caption,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  cardBody: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    // Top-aligned, not centred: the overline wraps next to a fixed control
    // (elastic-layout rule, forge AP#22).
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
    flex: 1,
  },
  cardTitle: {
    ...typography.heading,
  },
  dismiss: {
    minWidth: hitTarget,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    // Pull the 44px target into the card's corner without inflating layout.
    marginTop: -spacing.sm,
    marginRight: -spacing.sm,
  },
  cardText: {
    ...typography.body,
  },
  tellRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tellChip: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tellChipOn: {
    borderColor: colors.ink,
    backgroundColor: colors.paperRaised,
  },
  tellChipOff: {
    borderColor: colors.inkFaint,
    borderStyle: 'dashed',
  },
  tellText: {
    ...typography.caption,
  },
  tellTextOn: {
    color: colors.ink,
  },
  tellTextOff: {
    color: colors.inkMuted,
  },
});
