// Insights tab — "the depth". On every focus it checks whether LAST ISO week
// has been generated yet (idempotent — the store marks the week) and, if not,
// aggregates that week's check-ins + judgment entries and asks the store for
// cards. Cards are gentle paper notes, each with a category overline; a
// resistance card also shows the four resistance tells, the ones that fired
// emphasised. Capped at two a week — an invitation, never a diagnosis.

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, motion, spacing, typography } from '@/constants/theme';
import LogoDivider from '@/components/LogoDivider';
import LogoMark from '@/components/LogoMark';
import PaperTexture from '@/components/PaperTexture';
import CoachNote from '@/components/CoachNote';
import ThreadCard from '@/components/ThreadCard';
import {
  INSIGHTS_EMPTY_CAPTION,
  INSIGHTS_EMPTY_MONTH_BELOW,
  INSIGHTS_EMPTY_NO_PATTERN,
  INSIGHTS_EMPTY_QUIET_WEEK,
  INSIGHTS_FOOTER,
  INSIGHTS_HEADER_TITLE,
  INSIGHTS_OVERLINE_PATTERN,
  INSIGHTS_OVERLINE_RESISTANCE,
} from '@/content/insights';
import { monthlyMoodDigest, monthlyPracticeReflection } from '@/content/monthlyDigest';
import { RESISTANCE_TELLS } from '@/content/resistance';
import { useMotion } from '@/hooks/useMotion';
import { useCheckInStore } from '@/store/checkInStore';
import { useExperimentStore } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import type { EmotionFamilyId, InsightCardState } from '@/types/models';
import { previousWeekKey, weekKey, weekRangeLabel } from '@/utils/dates';
import { computeStatsForWeek } from '@/utils/insightEngine';

/** Stagger step between card entrances. */
const STAGGER_MS = 90;

const OVERLINE: Record<InsightCardState['kind'], string> = {
  pattern: INSIGHTS_OVERLINE_PATTERN,
  resistance: INSIGHTS_OVERLINE_RESISTANCE,
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
  fired,
  index,
  reduceMotion,
}: {
  card: InsightCardState;
  /** Resistance tells that fired that week — a resistance card emphasises them. */
  fired: Set<string>;
  index: number;
  reduceMotion: boolean;
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

  return (
    <Animated.View style={entryStyle}>
      <ThreadCard family={CARD_FAMILY[card.kind]} style={styles.cardBody}>
        <Text style={typography.overline}>{OVERLINE[card.kind]}</Text>
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
  const checkIns = useCheckInStore((s) => s.checkIns);
  const judgmentEntries = useExperimentStore((s) => s.judgmentEntries);
  const practiceSessions = useExperimentStore((s) => s.practiceSessions);

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

  // Only LAST week's cards show — the header says "Last week", and cards are
  // not dismissable (user, 2026-09-03), so without this bound the list would
  // grow by two every week. Gate on the calendar, not on the newest stored
  // card: after a week too quiet to generate, the newest card is two weeks
  // old and must not sit under that header — the empty state shows instead.
  // Older cards stay in the store, unread here, for a later variety pass.
  const lastWeek = previousWeekKey(new Date());
  const visible = cards.filter((card) => card.weekKey === lastWeek);
  const hasCards = visible.length > 0;

  // Last week's stats: the header summary reads them, and a resistance card
  // reads them for the fired-tell emphasis. Undefined while nothing shows, so
  // the header stays bare in the empty state.
  const summaryStats = React.useMemo(
    () => (hasCards ? computeStatsForWeek(checkIns, judgmentEntries, lastWeek) : undefined),
    [hasCards, lastWeek, checkIns, judgmentEntries]
  );

  // Which resistance tells fired that week — derived once here, not per card.
  const firedTells = React.useMemo(
    () =>
      new Set(
        Object.entries(summaryStats?.resistanceCounts ?? {})
          .filter(([, count]) => count > 0)
          .map(([id]) => id)
      ),
    [summaryStats]
  );

  // The week's mood, worn by the same mark the home screen breathes — the two
  // screens read as one system (user, 2026-07-17).
  const markFamilies = React.useMemo(() => {
    if (!summaryStats) return undefined;
    const top = (Object.entries(summaryStats.familyCounts) as [EmotionFamilyId, number][])
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([family]) => family);
    return top.length > 0 ? top.slice(0, 3) : undefined;
  }, [summaryStats]);

  // Beyond the week: the month's texture + what the practices surfaced
  // (user, 2026-07-17/18). Computed live, never stored; hidden while thin.
  const moodDigest = React.useMemo(() => monthlyMoodDigest(checkIns), [checkIns]);
  const practiceReflection = React.useMemo(
    () => monthlyPracticeReflection(practiceSessions, judgmentEntries),
    [practiceSessions, judgmentEntries]
  );
  const monthlyBlock =
    moodDigest || practiceReflection ? (
      <View style={styles.monthly} testID="insights-monthly">
        {moodDigest ? (
          <ThreadCard family="enjoyment" style={styles.cardBody}>
            <Text style={typography.overline}>{moodDigest.overline}</Text>
            <View style={styles.monthlyHeader}>
              <LogoMark families={moodDigest.families} size={40} />
              <Text style={[styles.cardTitle, styles.monthlyTitle]}>{moodDigest.title}</Text>
            </View>
            <Text style={styles.cardText}>{moodDigest.body}</Text>
          </ThreadCard>
        ) : null}
        {practiceReflection ? (
          <ThreadCard family="contempt" style={styles.cardBody}>
            <Text style={typography.overline}>{practiceReflection.overline}</Text>
            <Text style={styles.cardTitle}>{practiceReflection.title}</Text>
            <Text style={styles.cardText}>{practiceReflection.body}</Text>
            {practiceReflection.kept.length > 0 ? (
              <View style={styles.keptList}>
                {practiceReflection.kept.map((k, i) => (
                  <View key={i} style={styles.keptRow}>
                    <Text style={typography.overline}>{k.practice}</Text>
                    <Text style={styles.cardText}>{k.conclusion}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ThreadCard>
        ) : null}
      </View>
    ) : null;

  // This ISO week's own count, so the empty state tells the TRUE reason:
  // "quiet week so far" vs "checked in, no pattern has surfaced yet" — the
  // old copy claimed "not enough layers" even with a full month behind it
  // (user, 2026-07-18).
  const thisWeekCount = React.useMemo(
    () => computeStatsForWeek(checkIns, judgmentEntries, weekKey(new Date().toISOString())).checkInCount,
    [checkIns, judgmentEntries]
  );
  const emptyText = thisWeekCount === 0 ? INSIGHTS_EMPTY_QUIET_WEEK : INSIGHTS_EMPTY_NO_PATTERN;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-insights">
      <PaperTexture />
      <View style={styles.headerRow}>
        {markFamilies ? <LogoMark families={markFamilies} size={44} /> : null}
        <View style={styles.headerText}>
          <Text style={typography.title}>{INSIGHTS_HEADER_TITLE}</Text>
          {summaryStats ? (
            <Text style={styles.summary} testID="insights-summary">
              {weekRangeLabel(lastWeek)} · {plural(summaryStats.checkInCount, 'check-in', 'check-ins')}{' '}
              across {plural(summaryStats.activeDayCount, 'day', 'days')}
            </Text>
          ) : null}
        </View>
      </View>

      {!hasCards ? (
        <FlatList
          data={[] as InsightCardState[]}
          renderItem={() => null}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText} testID="insights-empty">
                {emptyText}
              </Text>
              <Text style={styles.emptyCaption}>
                {INSIGHTS_EMPTY_CAPTION}
                {monthlyBlock ? ` ${INSIGHTS_EMPTY_MONTH_BELOW}` : ''}
              </Text>
            </View>
          }
          ListFooterComponent={monthlyBlock}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <InsightCard
              card={item}
              fired={firedTells}
              index={index}
              reduceMotion={reduceMotion}
            />
          )}
          ListFooterComponent={
            <View testID="insights-footer">
              {monthlyBlock}
              <LogoDivider tip={INSIGHTS_FOOTER} />
            </View>
          }
        />
      )}

      {/* First-visit helper note — there is nothing to do here yet, and the
          note says exactly that. topOffset clears the title at the post-bump
          scale. */}
      <CoachNote id="note-insights" topOffset={68} family="enjoyment" />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  monthly: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  monthlyTitle: {
    flex: 1,
    flexWrap: 'wrap',
  },
  keptList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  keptRow: {
    gap: 2,
  },
  cardBody: {
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.heading,
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
