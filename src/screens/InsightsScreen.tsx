// Insights tab: weekly pattern cards. On every focus it checks whether LAST
// ISO week has been generated yet (idempotent — the store marks the week) and,
// if not, aggregates that week's check-ins + judgment entries and asks the
// store for cards. Cards are paper notes with a dashed stitch border; each can
// be dismissed. Entry is a staggered fade/slide — static under reduce-motion.

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { borderRadius, colors, hitTarget, motion, spacing, typography } from '@/constants/theme';
import { useCheckInStore } from '@/store/checkInStore';
import { useExperimentStore } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { InsightCardState } from '@/types/models';
import { previousWeekKey } from '@/utils/dates';
import { computeStatsForWeek } from '@/utils/insightEngine';

/** Stagger step between card entrances. */
const STAGGER_MS = 90;

function InsightCard({
  card,
  index,
  reduceMotion,
  onDismiss,
}: {
  card: InsightCardState;
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

  return (
    <Animated.View style={[styles.card, entryStyle]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{card.title}</Text>
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
      <Text style={styles.cardBody}>{card.body}</Text>
    </Animated.View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const cards = useInsightStore((s) => s.cards);
  const dismissCard = useInsightStore((s) => s.dismissCard);

  const systemReduced = useReducedMotion();
  const override = useSettingsStore((s) => s.reduceMotionOverride);
  const reduceMotion = override ?? systemReduced;

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-insights">
      <Text style={typography.title}>Patterns</Text>

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
              index={index}
              reduceMotion={reduceMotion}
              onDismiss={() => dismissCard(item.id)}
            />
          )}
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
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    // Dashed hairline = the stitch border of a paper note.
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkFaint,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    // Top-aligned, not centred: the title wraps next to a fixed control
    // (elastic-layout rule, forge AP#22).
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.heading,
    flex: 1,
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
  cardBody: {
    ...typography.body,
  },
});
