// Experiments tab: small practices for meeting what's here. Grouped into
// sections that echo the redesigned Quilt/Insights/Circle language — a gentle
// intro line, overline-labelled sections, and a soft closing footer. Two
// "Guided" practices (Name it, Under the judgment) open a flow; three
// "Perspective" practices (Atlas of Emotions) unfold in place with a scratch
// pad; "Past reflections" holds saved judgment entries (expand on tap, swipe to
// edit or remove).

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
        <Text style={styles.intro}>
          Small practices for meeting what&apos;s here. Take one when it calls — none are homework.
        </Text>

        {/* Guided: these open a flow. A chevron marks that they lead somewhere,
            unlike the perspective cards that unfold in place. */}
        <View style={styles.section}>
          <Text style={styles.overline}>Guided practices</Text>
          <NavCard
            testID="card-name-it"
            title="Name it"
            sub="Gentle reminders to name what's here"
            status={nameIt.enabled ? `${nameIt.timesPerDay}× a day` : 'Off'}
            onPress={() => navigation.navigate('NameItSetup')}
          />
          <NavCard
            testID="card-judgment"
            title="Under the judgment"
            sub="What would you feel if you couldn't judge?"
            onPress={() => navigation.navigate('JudgmentFlow')}
          />
        </View>

        {/* Learn: the field guide — emotional education rather than practice.
            Word finder + the underneath map (surface state → resisted feeling). */}
        <View style={styles.section}>
          <Text style={styles.overline}>Learn</Text>
          <NavCard
            testID="card-field-guide"
            title="Field guide"
            sub="Find the right word — and what an old mood might be carrying"
            onPress={() => navigation.navigate('FieldGuide')}
          />
        </View>

        {/* Perspective practices from the Atlas of Emotions — they unfold in
            place with a scratch pad rather than opening a flow. */}
        <View style={styles.section}>
          <Text style={styles.overline}>Perspective practices</Text>
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
        </View>

        {judgmentEntries.length > 0 ? (
          <View style={styles.section}>
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

        <Text style={styles.footer}>
          Nothing here is a test. Come back to a practice whenever it calls; the rest can wait.
        </Text>
      </ScrollView>
    </View>
  );
}

/** A card that leads somewhere: title + chevron, one-line sub, optional status. */
function NavCard({
  testID,
  title,
  sub,
  status,
  onPress,
}: {
  testID: string;
  title: string;
  sub: string;
  status?: string;
  onPress(): void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.cardTitleRow}>
        <Text style={[typography.heading, styles.cardTitle]}>{title}</Text>
        <Text style={styles.chevron}>→</Text>
      </View>
      <Text style={styles.cardSub}>{sub}</Text>
      {status ? <Text style={styles.cardStatus}>{status}</Text> : null}
    </Pressable>
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
  intro: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    flexWrap: 'wrap',
  },
  chevron: {
    ...typography.heading,
    color: colors.inkSoft,
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
  overline: {
    ...typography.overline,
  },
  swipeHint: {
    ...typography.caption,
  },
  footer: {
    ...typography.caption,
    marginTop: spacing.xl,
    textAlign: 'center',
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
