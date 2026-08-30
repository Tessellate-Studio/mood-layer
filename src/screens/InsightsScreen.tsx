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
import LogoMark from '@/components/LogoMark';
import PaperTexture from '@/components/PaperTexture';
import CoachNote from '@/components/CoachNote';
import ThreadCard from '@/components/ThreadCard';
import { monthlyMoodDigest, monthlyPracticeReflection } from '@/content/monthlyDigest';
import { RESISTANCE_TELLS } from '@/content/resistance';
import { useMotion } from '@/hooks/useMotion';
import { useCheckInStore } from '@/store/checkInStore';
import { useExperimentStore } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import type { EmotionFamilyId, InsightCardState, WeekStats } from '@/types/models';
import { previousWeekKey, weekKey, weekRangeLabel } from '@/utils/dates';
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
            <Text style={styles.overline}>This month · Texture</Text>
            <View style={styles.monthlyHeader}>
              <LogoMark families={moodDigest.families} size={40} />
              <Text style={[styles.cardTitle, styles.monthlyTitle]}>{moodDigest.title}</Text>
            </View>
            <Text style={styles.cardText}>{moodDigest.body}</Text>
          </ThreadCard>
        ) : null}
        {practiceReflection ? (
          <ThreadCard family="contempt" style={styles.cardBody}>
            <Text style={styles.overline}>This month · Practices</Text>
            <Text style={styles.cardTitle}>{practiceReflection.title}</Text>
            <Text style={styles.cardText}>{practiceReflection.body}</Text>
            {practiceReflection.kept.length > 0 ? (
              <View style={styles.keptList}>
                {practiceReflection.kept.map((k, i) => (
                  <View key={i} style={styles.keptRow}>
                    <Text style={styles.keptPractice}>{k.practice}</Text>
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
  const emptyText =
    thisWeekCount === 0
      ? 'A quiet week so far — your first check-in starts this week’s layers.'
      : 'Checked in, but no clear pattern has surfaced yet — insights stay quiet until one does.';

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-insights">
      <PaperTexture />
      <View style={styles.headerRow}>
        {markFamilies ? <LogoMark families={markFamilies} size={44} /> : null}
        <View style={styles.headerText}>
          <Text style={typography.title}>This week</Text>
          {summaryStats ? (
            <Text style={styles.summary} testID="insights-summary">
              {weekRangeLabel(newestWeek!)} · {plural(summaryStats.checkInCount, 'check-in', 'check-ins')}{' '}
              across {plural(summaryStats.activeDayCount, 'day', 'days')}
            </Text>
          ) : null}
        </View>
      </View>

      {visible.length === 0 ? (
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
                Patterns appear here once a week, when there are enough layers to read.
                {monthlyBlock ? ' Your month is below.' : ''}
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
              stats={statsByWeek[item.weekKey]}
              index={index}
              reduceMotion={reduceMotion}
              onDismiss={() => dismissCard(item.id)}
            />
          )}
          ListFooterComponent={
            <View testID="insights-footer">
              {monthlyBlock}
              <LogoDivider tip="Insights stay gentle. Two a week, at most — the rest is just your layers, quietly building." />
            </View>
          }
        />
      )}

      {/* First-visit helper note — no pointer: there is nothing to do here
          yet, and the note says exactly that. */}
      <CoachNote
        id="note-insights"
        style={{
          position: 'absolute',
          top: insets.top + spacing.md + 64,
          left: spacing.md,
          right: spacing.md,
        }}
      />
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
  keptPractice: {
    ...typography.overline,
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
