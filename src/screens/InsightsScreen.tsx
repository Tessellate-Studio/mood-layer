// Insights tab: weekly pattern cards. Skeleton phase — renders whatever the
// insight store already holds; the weekly generation wiring lands in a later
// phase (P11).

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useInsightStore } from '@/store/insightStore';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const cards = useInsightStore((s) => s.cards);
  const visible = cards.filter((card) => !card.dismissedAt);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-insights">
      <Text style={typography.title}>Patterns</Text>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Not enough stitches yet — check in a few more times this week.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={typography.heading}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
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
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardBody: {
    ...typography.body,
  },
});
