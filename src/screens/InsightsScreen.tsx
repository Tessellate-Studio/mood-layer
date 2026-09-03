// Insights tab — "the depth". On every focus it checks whether LAST ISO week
// has been generated yet (idempotent — the store marks the week) and, if not,
// aggregates that week's check-ins + judgment entries and asks the store for
// cards. Cards are gentle paper notes, each with a category overline; a
// resistance card also shows the four resistance tells, the ones that fired
// emphasised. Capped at two a week — an invitation, never a diagnosis.

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { borderRadius, colors, motion, spacing, typography } from '@/constants/theme';
import LogoDivider from '@/components/LogoDivider';
import LogoMark from '@/components/LogoMark';
import ScreenFrame, { screenContent } from '@/components/ScreenFrame';
import ThreadCard from '@/components/ThreadCard';
import { useMoodFamilies } from '@/hooks/useMoodFamilies';
import { useNowOnFocus } from '@/hooks/useNowOnFocus';
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
import { selectMoodFamilies, selectWeekStats, useCheckInStore } from '@/store/checkInStore';
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
  const cards = useInsightStore((s) => s.cards);
  const checkIns = useCheckInStore((s) => s.checkIns);
  const judgmentEntries = useExperimentStore((s) => s.judgmentEntries);
  const practiceSessions = useExperimentStore((s) => s.practiceSessions);

  const { reduced: reduceMotion } = useMotion();
  // One clock for every date-keyed view below — last week's cards, last
  // month's cards, the mood mark, the empty-state reason — advancing on each
  // focus, so they roll over on the first open after a Monday or a 1st even
  // when the app stayed in memory across the boundary.
  const now = useNowOnFocus();
  const lastWeek = previousWeekKey(now);

  // Generate LAST week's cards once per rollover — the store marks the week,
  // so a repeat is a no-op. Watching the MARKER (not just the week key) is
  // what makes "Preview a sample month" work while this tab is already
  // mounted: seeding clears the marker, and the bottom tabs keep this screen
  // alive, so an effect keyed on the week alone would never re-run and the
  // page stayed empty until an app restart (device feedback, 2026-09-03).
  const generatedWeekKey = useInsightStore((s) => s.lastGeneratedWeekKey);
  React.useEffect(() => {
    if (generatedWeekKey === lastWeek) return;
    const stats = computeStatsForWeek(
      useCheckInStore.getState().checkIns,
      useExperimentStore.getState().judgmentEntries,
      lastWeek
    );
    useInsightStore.getState().generateForWeek(lastWeek, stats);
  }, [generatedWeekKey, lastWeek]);

  // Only LAST week's cards show — the header says "Last week", and cards are
  // not dismissable (user, 2026-09-03), so without this bound the list would
  // grow by two every week. Gate on the calendar, not on the newest stored
  // card: after a week too quiet to generate, the newest card is two weeks
  // old and must not sit under that header — the empty state shows instead.
  // Older cards stay in the store, unread here, for a later variety pass.
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

  // The prominent CURRENT mood, worn by the same mark the home screen breathes
  // — one rule for every mark (user, 2026-07-17; 2026-09-03). Not last week's,
  // even though the cards are: the mark is the app's mood, the cards a report.
  const moodFamilies = useMoodFamilies(now);

  // Beyond the week: last calendar month's texture + what the practices
  // surfaced (user, 2026-07-17/18; calendar month, not rolling, 2026-09-03).
  // Computed live — a finished month's data cannot change — never stored;
  // hidden while thin.
  const moodDigest = React.useMemo(() => monthlyMoodDigest(checkIns, now), [checkIns, now]);
  const practiceReflection = React.useMemo(
    () => monthlyPracticeReflection(practiceSessions, judgmentEntries, now),
    [practiceSessions, judgmentEntries, now]
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
    () => selectWeekStats(checkIns, 0, weekKey(now.toISOString())).checkInCount,
    [checkIns, now]
  );
  const emptyText = thisWeekCount === 0 ? INSIGHTS_EMPTY_QUIET_WEEK : INSIGHTS_EMPTY_NO_PATTERN;

  // One footer for both states: the closing line belongs to the PAGE, not to
  // the card list — the empty state was shipping without it (device feedback,
  // 2026-09-03).
  const footer = (
    <View testID="insights-footer">
      {monthlyBlock}
      <LogoDivider tip={INSIGHTS_FOOTER} />
    </View>
  );

  return (
    <ScreenFrame
      testID="screen-insights"
      note={{ id: 'note-insights', family: 'enjoyment' }}
      header={
      <View style={styles.headerRow}>
        <LogoMark families={moodFamilies} size={44} />
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
      }
    >
      {!hasCards ? (
        <FlatList
          data={[] as InsightCardState[]}
          renderItem={() => null}
          contentContainerStyle={[styles.listContent, screenContent]}
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
          ListFooterComponent={footer}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, screenContent]}
          renderItem={({ item, index }) => (
            <InsightCard
              card={item}
              fired={firedTells}
              index={index}
              reduceMotion={reduceMotion}
            />
          )}
          ListFooterComponent={footer}
        />
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
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
