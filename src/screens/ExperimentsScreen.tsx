// Experiments tab: the two interactive practices (Name it, Under the
// judgment), then the Atlas of Emotions perspective practices as sibling
// cards (tap to unfold the steps in place), then "Past reflections" — saved
// judgment entries that expand on tap and swipe open to edit or remove.

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import { findEmotionWord } from '@/content/emotions';
import { PRACTICES, type Practice } from '@/content/practices';
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
  const [openPractice, setOpenPractice] = React.useState<string | null>(null);

  return (
    // ScrollView sits inside a plain container so the paper grain stays fixed
    // behind the content instead of scrolling with it.
    <View style={styles.container}>
      <PaperTexture />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        keyboardShouldPersistTaps="handled"
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

        {/* Perspective practices from the Atlas of Emotions — same card
            language as the two above; they unfold in place. */}
        {PRACTICES.map((practice) => (
          <PracticeCard
            key={practice.id}
            practice={practice}
            open={openPractice === practice.id}
            onToggle={() =>
              setOpenPractice((cur) => (cur === practice.id ? null : practice.id))
            }
          />
        ))}
        <Text style={styles.attribution}>
          Practices adapted from the Atlas of Emotions.
        </Text>

        {judgmentEntries.length > 0 ? (
          <View style={styles.reflections}>
            <Text style={styles.overline}>Past reflections</Text>
            <Text style={styles.swipeHint}>Swipe a reflection to edit or remove it.</Text>
            {judgmentEntries.map((entry, index) => (
              <ReflectionRow
                key={entry.id}
                entry={entry}
                index={index}
                expanded={expanded === entry.id}
                onToggle={() => setExpanded((cur) => (cur === entry.id ? null : entry.id))}
                onEdit={() => navigation.navigate('JudgmentFlow', { editId: entry.id })}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function PracticeCard({
  practice,
  open,
  onToggle,
}: {
  practice: Practice;
  open: boolean;
  onToggle(): void;
}) {
  // Scratch pad: each step gets a place to actually write, saved locally so a
  // practice is something you work through, not just read (device feedback).
  const notes = useExperimentStore((s) => s.practiceNotes[practice.id]);
  const setPracticeNote = useExperimentStore((s) => s.setPracticeNote);

  return (
    // Only the header toggles — the steps hold text inputs, so wrapping the
    // whole card in a Pressable would collapse it every time you tapped to type.
    <View style={styles.card}>
      <Pressable
        testID={`practice-${practice.id}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${practice.title}. ${practice.whenFor}`}
        onPress={onToggle}
      >
        <Text style={typography.heading}>{practice.title}</Text>
        <Text style={styles.cardSub}>{practice.whenFor}</Text>
      </Pressable>
      {open ? (
        <View style={styles.practiceSteps}>
          {practice.steps.map((step, i) => (
            <View key={i} style={styles.stepBlock}>
              <View style={styles.stepRow}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
                <Text style={[typography.body, styles.stepText]}>{step}</Text>
              </View>
              <TextInput
                testID={`practice-${practice.id}-note-${i}`}
                style={styles.stepInput}
                multiline
                placeholder="write here…"
                placeholderTextColor={colors.inkMuted}
                value={notes?.[i] ?? ''}
                onChangeText={(text) => setPracticeNote(practice.id, i, text)}
                textAlignVertical="top"
                accessibilityLabel={`Your notes for step ${i + 1}`}
              />
            </View>
          ))}
          <Text style={styles.practiceClosing}>{practice.closing}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReflectionRow({
  entry,
  index,
  expanded,
  onToggle,
  onEdit,
}: {
  entry: JudgmentEntry;
  index: number;
  expanded: boolean;
  onToggle(): void;
  onEdit(): void;
}) {
  const removeJudgmentEntry = useExperimentStore((s) => s.removeJudgmentEntry);
  const feelingLabel =
    entry.uncoveredFeelings.length > 0
      ? entry.uncoveredFeelings
          .map((f) => findEmotionWord(f.emotionId)?.word.label ?? f.emotionId)
          .join(', ')
      : null;

  const confirmRemove = () => {
    Alert.alert('Remove this reflection?', 'It will be gone from this phone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeJudgmentEntry(entry.id) },
    ]);
  };

  // Swipe-open actions: quiet paper buttons, no colour — chrome stays ink.
  const renderActions = () => (
    <View style={styles.actionsRow}>
      <Pressable
        testID={`judgment-edit-${index}`}
        accessibilityRole="button"
        accessibilityLabel="Edit reflection"
        style={styles.actionBtn}
        onPress={onEdit}
      >
        <Text style={styles.actionText}>Edit</Text>
      </Pressable>
      <Pressable
        testID={`judgment-delete-${index}`}
        accessibilityRole="button"
        accessibilityLabel="Remove reflection"
        style={[styles.actionBtn, styles.actionDelete]}
        onPress={confirmRemove}
      >
        <Text style={[styles.actionText, styles.actionDeleteText]}>Remove</Text>
      </Pressable>
    </View>
  );

  return (
    <ReanimatedSwipeable renderRightActions={renderActions} overshootRight={false}>
      <Pressable
        testID={`judgment-entry-${index}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${entry.target}, for ${entry.judgment}. Swipe for edit and remove.`}
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
    </ReanimatedSwipeable>
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
  attribution: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  practiceSteps: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  stepBlock: {
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepInput: {
    ...typography.body,
    color: colors.ink,
    minHeight: 64,
    backgroundColor: colors.paper,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.sm,
    // Indent the writing box under the step text, clear of the number gutter.
    marginLeft: spacing.md + 22,
  },
  stepNumber: {
    ...typography.title,
    color: colors.inkMuted,
    width: 22,
  },
  stepText: {
    flex: 1,
    flexWrap: 'wrap',
  },
  practiceClosing: {
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
  swipeHint: {
    ...typography.caption,
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginLeft: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    minWidth: hitTarget + 16,
    minHeight: hitTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.paperRaised,
    paddingHorizontal: spacing.sm,
  },
  actionDelete: {
    borderColor: colors.ink,
  },
  actionText: {
    ...typography.label,
  },
  actionDeleteText: {
    color: colors.ink,
  },
});
