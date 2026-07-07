// Experiments tab: entry cards for the two practices, plus a "Past reflections"
// list of saved judgment entries (collapsed; tap to expand the feeling +
// free-writing). Scrolls so the list can grow.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import { findEmotionWord } from '@/content/emotions';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore } from '@/store/experimentStore';
import type { JudgmentEntry } from '@/types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ExperimentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const nameIt = useExperimentStore((s) => s.nameIt);
  const judgmentEntries = useExperimentStore((s) => s.judgmentEntries);

  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    // ScrollView sits inside a plain container so the paper grain stays fixed
    // behind the content instead of scrolling with it.
    <View style={styles.container}>
      <PaperTexture />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
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

      {judgmentEntries.length > 0 ? (
        <View style={styles.reflections}>
          <Text style={styles.overline}>Past reflections</Text>
          {judgmentEntries.map((entry, index) => (
            <ReflectionRow
              key={entry.id}
              entry={entry}
              index={index}
              expanded={expanded === entry.id}
              onToggle={() => setExpanded((cur) => (cur === entry.id ? null : entry.id))}
            />
          ))}
        </View>
      ) : null}
      </ScrollView>
    </View>
  );
}

function ReflectionRow({
  entry,
  index,
  expanded,
  onToggle,
}: {
  entry: JudgmentEntry;
  index: number;
  expanded: boolean;
  onToggle(): void;
}) {
  const feelingLabel = entry.uncoveredFeeling
    ? findEmotionWord(entry.uncoveredFeeling.emotionId)?.word.label ??
      entry.uncoveredFeeling.emotionId
    : null;

  return (
    <Pressable
      testID={`judgment-entry-${index}`}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${entry.target}, for ${entry.judgment}`}
      style={styles.entry}
      onPress={onToggle}
    >
      <Text style={styles.entryLine} numberOfLines={expanded ? undefined : 1}>
        {entry.target} — {entry.judgment}
      </Text>
      {expanded ? (
        <View style={styles.entryDetail}>
          {feelingLabel ? (
            // Just the word — a bare intensity digit reads as noise here
            // (device feedback); the quilt is where intensity lives.
            <Text style={typography.caption}>Underneath: {feelingLabel}</Text>
          ) : null}
          {entry.freeWriting ? <Text style={typography.body}>{entry.freeWriting}</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
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
  reflections: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
  },
  entry: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.sm,
  },
  entryLine: {
    ...typography.body,
    color: colors.ink,
  },
  entryDetail: {
    gap: spacing.xs,
  },
});
