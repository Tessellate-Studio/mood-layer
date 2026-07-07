// Experiments tab: entry cards for the two practices. Skeleton phase — the
// flows themselves are modal routes built in later phases.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore } from '@/store/experimentStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ExperimentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const nameIt = useExperimentStore((s) => s.nameIt);
  const judgmentCount = useExperimentStore((s) => s.judgmentEntries.length);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
      testID="screen-experiments"
    >
      <Text style={typography.title}>Experiments</Text>

      <Pressable
        testID="card-name-it"
        accessibilityRole="button"
        accessibilityLabel="Name it. Gentle reminders to name what's here."
        style={styles.card}
        onPress={() => navigation.navigate('NameItSetup')}
      >
        <Text style={typography.heading}>Name it</Text>
        <Text style={styles.cardSub}>Gentle reminders to name what&apos;s here</Text>
        <Text style={styles.cardStatus}>
          {nameIt.enabled ? `${nameIt.timesPerDay}× a day` : 'Off'}
        </Text>
      </Pressable>

      <Pressable
        testID="card-judgment"
        accessibilityRole="button"
        accessibilityLabel="Under the judgment. What would you feel if you couldn't judge?"
        style={styles.card}
        onPress={() => navigation.navigate('JudgmentFlow')}
      >
        <Text style={typography.heading}>Under the judgment</Text>
        <Text style={styles.cardSub}>What would you feel if you couldn&apos;t judge?</Text>
      </Pressable>

      {judgmentCount > 0 && (
        <Text style={styles.entryCount}>
          {judgmentCount === 1 ? '1 entry' : `${judgmentCount} entries`}
        </Text>
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
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardSub: {
    ...typography.body,
  },
  cardStatus: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  entryCount: {
    ...typography.caption,
    marginTop: spacing.md,
  },
});
