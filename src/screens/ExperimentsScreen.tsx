// Experiments tab: small practices for meeting what's here. Redesigned to the
// muted-layer treatment (2026-07-13): each section opens with a two-band logo
// glyph tinted to its hue, every card is a ThreadCard — whisper-tint fill plus
// a coloured thread spine — and the page closes with the three-band mark as a
// divider over the tip. Two "Guided" practices (Name it, Under the judgment)
// open a flow; three "Perspective" practices (Atlas of Emotions) unfold in
// place with a scratch pad; "Past reflections" holds saved judgment entries
// (expand on tap, swipe to edit or remove).

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, hitTarget, mutedPalette, spacing, typography } from '@/constants/theme';
import LogoDivider from '@/components/LogoDivider';
import PaperTexture from '@/components/PaperTexture';
import SectionHeader from '@/components/SectionHeader';
import ThreadCard from '@/components/ThreadCard';
import { findEmotionWord } from '@/content/emotions';
import { PRACTICES, type Practice } from '@/content/practices';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore } from '@/store/experimentStore';
import type { EmotionFamilyId, JudgmentEntry } from '@/types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Layer hues per the settled design: Guided = sadness blue (section + Name
// it), anger rose for Under the judgment; Perspective = enjoyment amber with
// its cards cycling amber → green → violet; Past reflections = contempt mauve.
const GUIDED_FAMILY: EmotionFamilyId = 'sadness';
const JUDGMENT_FAMILY: EmotionFamilyId = 'anger';
const PERSPECTIVE_FAMILY: EmotionFamilyId = 'enjoyment';
const PRACTICE_FAMILIES: EmotionFamilyId[] = ['enjoyment', 'disgust', 'fear'];
const REFLECTIONS_FAMILY: EmotionFamilyId = 'contempt';
const LEARN_FAMILY: EmotionFamilyId = 'anticipation';

/** The circled → marking a card that leads somewhere (opens a flow). */
function ArrowRing({ family }: { family: EmotionFamilyId }) {
  const palette = mutedPalette[family];
  return (
    <View style={[styles.arrowRing, { borderColor: palette.thread }]}>
      <Text style={[styles.arrowGlyph, { color: palette.accent }]}>→</Text>
    </View>
  );
}

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

        {/* Guided: these open a flow. A ringed arrow marks that they lead
            somewhere, unlike the perspective cards that unfold in place. */}
        <View style={styles.section}>
          <SectionHeader family={GUIDED_FAMILY} label="Guided practices" />
          <ThreadCard
            family={GUIDED_FAMILY}
            testID="card-name-it"
            accessibilityLabel="Name it. Gentle reminders to name what's here."
            onPress={() => navigation.navigate('NameItSetup')}
          >
            <View style={styles.cardTitleRow}>
              <Text style={[typography.heading, styles.cardTitle]}>Name it</Text>
              <ArrowRing family={GUIDED_FAMILY} />
            </View>
            <Text style={styles.cardSub}>Gentle reminders to name what&apos;s here</Text>
            <Text style={[styles.statusPill, { color: mutedPalette[GUIDED_FAMILY].accent, borderColor: mutedPalette[GUIDED_FAMILY].border }]}>
              {nameIt.enabled ? `${nameIt.timesPerDay}× a day` : 'Off'}
            </Text>
          </ThreadCard>

          <ThreadCard
            family={JUDGMENT_FAMILY}
            testID="card-judgment"
            accessibilityLabel="Under the judgment. What would you feel if you couldn't judge?"
            onPress={() => navigation.navigate('JudgmentFlow')}
          >
            <View style={styles.cardTitleRow}>
              <Text style={[typography.heading, styles.cardTitle]}>Under the judgment</Text>
              <ArrowRing family={JUDGMENT_FAMILY} />
            </View>
            <Text style={styles.cardSub}>What would you feel if you couldn&apos;t judge?</Text>
          </ThreadCard>
        </View>

        {/* Learn: the field guide — emotional education rather than practice.
            Word finder + the underneath map (surface state → resisted feeling).
            Anticipation teal — the layer hue for leaning toward what's new. */}
        <View style={styles.section}>
          <SectionHeader family={LEARN_FAMILY} label="Learn" />
          <ThreadCard
            family={LEARN_FAMILY}
            testID="card-field-guide"
            accessibilityLabel="Field guide. Find the right word, and what an old mood might be carrying."
            onPress={() => navigation.navigate('FieldGuide')}
          >
            <View style={styles.cardTitleRow}>
              <Text style={[typography.heading, styles.cardTitle]}>Field guide</Text>
              <ArrowRing family={LEARN_FAMILY} />
            </View>
            <Text style={styles.cardSub}>
              Find the right word — and what an old mood might be carrying
            </Text>
          </ThreadCard>
        </View>

        {/* Perspective practices from the Atlas of Emotions — they unfold in
            place with a scratch pad rather than opening a flow. */}
        <View style={styles.section}>
          <SectionHeader family={PERSPECTIVE_FAMILY} label="Perspective practices" />
          {PRACTICES.map((practice, index) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              family={PRACTICE_FAMILIES[index % PRACTICE_FAMILIES.length]}
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
            <SectionHeader family={REFLECTIONS_FAMILY} label="Past reflections" />
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

        <LogoDivider tip="Nothing here is a test. Come back to a practice whenever it calls; the rest can wait." />
      </ScrollView>
    </View>
  );
}

function PracticeCard({
  practice,
  family,
  open,
  onToggle,
}: {
  practice: Practice;
  family: EmotionFamilyId;
  open: boolean;
  onToggle(): void;
}) {
  // Scratch pad: each step gets a place to actually write, saved locally so a
  // practice is something you work through, not just read (device feedback).
  const notes = useExperimentStore((s) => s.practiceNotes[practice.id]);
  const setPracticeNote = useExperimentStore((s) => s.setPracticeNote);

  return (
    // Only the header toggles — the steps hold text inputs, so making the
    // whole card pressable would collapse it every time you tapped to type.
    <ThreadCard family={family}>
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
    </ThreadCard>
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
      <ThreadCard
        family={REFLECTIONS_FAMILY}
        testID={`judgment-entry-${index}`}
        accessibilityLabel={`${entry.target}, for ${entry.judgment}. Swipe for edit and remove.`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.entryBody}
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
      </ThreadCard>
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
  cardTitleRow: {
    flexDirection: 'row',
    // Top-aligned so a wrapping title never centres against the fixed ring
    // (elastic-layout rule, forge AP#22).
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    flexWrap: 'wrap',
  },
  arrowRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowGlyph: {
    ...typography.label,
  },
  cardSub: {
    ...typography.body,
  },
  statusPill: {
    ...typography.caption,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: colors.paperRaised,
    paddingHorizontal: spacing.md - spacing.xs,
    paddingVertical: spacing.xs - 1,
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
    // Raised paper so the writing box reads as a page laid on the tinted card.
    backgroundColor: colors.paperRaised,
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
  swipeHint: {
    ...typography.caption,
  },
  entryBody: {
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
