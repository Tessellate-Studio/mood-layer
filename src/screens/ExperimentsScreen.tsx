// Experiments tab, structured by KIND so the page reads calmly (user,
// 2026-07-17: a person with real emotional needs shouldn't feel their brain
// tangling in a disorganized mess):
//   Practices        — the four exercises (Under the judgment + three
//                      perspective practices), one uniform card each.
//   Past reflections — what practising left behind (judgment reflections +
//                      archived practice sittings), right under the practices
//                      that write them.
//   Learn            — the field guide (education, not practice).
//   Reminders        — Name it, which is a SCHEDULE, not an exercise — so it
//                      sits last as quiet configuration.
// Muted-layer treatment throughout (2026-07-13): tinted section glyphs,
// ThreadCards, the three-band mark as the closing divider.

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { borderRadius, colors, hitTarget, mutedPalette, spacing, typography } from '@/constants/theme';
import LogoDivider from '@/components/LogoDivider';
import PaperTexture from '@/components/PaperTexture';
import SectionHeader from '@/components/SectionHeader';
import ThreadCard from '@/components/ThreadCard';
import { findVocabularyWord } from '@/content/vocabulary';
import { findPractice, PRACTICE_FAMILY, PRACTICES } from '@/content/practices';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore, type PracticeSession } from '@/store/experimentStore';
import type { EmotionFamilyId, JudgmentEntry } from '@/types/models';
import { sessionLines } from '@/utils/practiceWork';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Layer hues per the settled design: Practices section = sadness blue with
// anger rose for Under the judgment and per-practice hues (PRACTICE_FAMILY,
// content/practices.ts); Past reflections = contempt mauve; Learn =
// anticipation teal; Reminders = trust rose.
const PRACTICES_FAMILY: EmotionFamilyId = 'sadness';
const JUDGMENT_FAMILY: EmotionFamilyId = 'anger';
const BREATHING_FAMILY: EmotionFamilyId = 'anticipation';
const REFLECTIONS_FAMILY: EmotionFamilyId = 'contempt';
const LEARN_FAMILY: EmotionFamilyId = 'anticipation';
const REMINDERS_FAMILY: EmotionFamilyId = 'trust';

/** The circled → marking a card that leads somewhere (opens a flow). Drawn
 *  as SVG lines — the monospace '→' glyph sat visibly off-centre inside the
 *  ring (device feedback 2026-07-17). */
function ArrowRing({ family }: { family: EmotionFamilyId }) {
  const palette = mutedPalette[family];
  return (
    <View style={[styles.arrowRing, { borderColor: palette.thread }]}>
      <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
        <Line x1={1.5} y1={7} x2={12} y2={7} stroke={palette.accent} strokeWidth={1.6} strokeLinecap="round" />
        <Line x1={7.5} y1={2.5} x2={12} y2={7} stroke={palette.accent} strokeWidth={1.6} strokeLinecap="round" />
        <Line x1={7.5} y1={11.5} x2={12} y2={7} stroke={palette.accent} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export default function ExperimentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const nameIt = useExperimentStore((s) => s.nameIt);
  const judgmentEntries = useExperimentStore((s) => s.judgmentEntries);
  const practiceSessions = useExperimentStore((s) => s.practiceSessions);

  const [expanded, setExpanded] = React.useState<string | null>(null);

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

        {/* Practices: the four exercises, one uniform card each. A ringed
            arrow marks a card that leads into a flow. */}
        <View style={styles.section}>
          <SectionHeader family={PRACTICES_FAMILY} label="Practices" />
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
          {PRACTICES.map((practice) => (
            <ThreadCard
              key={practice.id}
              family={PRACTICE_FAMILY[practice.id]}
              testID={`practice-${practice.id}`}
              accessibilityLabel={`${practice.title}. ${practice.whenFor}`}
              onPress={() => navigation.navigate('PracticeFlow', { practiceId: practice.id })}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[typography.heading, styles.cardTitle]}>{practice.title}</Text>
                <ArrowRing family={PRACTICE_FAMILY[practice.id]} />
              </View>
              <Text style={styles.cardSub}>{practice.whenFor}</Text>
            </ThreadCard>
          ))}
          <ThreadCard
            family={BREATHING_FAMILY}
            testID="card-breathing"
            accessibilityLabel="Box breathing. For a nervous system that needs a minute."
            onPress={() => navigation.navigate('Breathing')}
          >
            <View style={styles.cardTitleRow}>
              <Text style={[typography.heading, styles.cardTitle]}>Box breathing</Text>
              <ArrowRing family={BREATHING_FAMILY} />
            </View>
            <Text style={styles.cardSub}>For a nervous system that needs a minute</Text>
          </ThreadCard>
          <Text style={styles.attribution}>
            Perspective practices adapted from Six Seconds&apos; Practicing EQ guide.
          </Text>
        </View>

        {/* Past reflections sit directly under the practices that write them:
            judgment reflections first, then archived practice sittings. */}
        {judgmentEntries.length > 0 || practiceSessions.length > 0 ? (
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
            {practiceSessions.map((session, index) => (
              <PracticeSessionRow
                key={session.id}
                session={session}
                index={index}
                expanded={expanded === session.id}
                onToggle={() => setExpanded((cur) => (cur === session.id ? null : session.id))}
              />
            ))}
          </View>
        ) : null}

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

        {/* Reminders: Name it is a schedule, not an exercise — quiet
            configuration at the end of the page (user, 2026-07-17). */}
        <View style={styles.section}>
          <SectionHeader family={REMINDERS_FAMILY} label="Reminders" />
          <ThreadCard
            family={REMINDERS_FAMILY}
            testID="card-name-it"
            accessibilityLabel="Name it. Gentle reminders to name what's here."
            onPress={() => navigation.navigate('NameItSetup')}
          >
            <View style={styles.cardTitleRow}>
              <Text style={[typography.heading, styles.cardTitle]}>Name it</Text>
              <ArrowRing family={REMINDERS_FAMILY} />
            </View>
            <Text style={styles.cardSub}>Gentle reminders to name what&apos;s here</Text>
            <Text style={[styles.statusPill, { color: mutedPalette[REMINDERS_FAMILY].accent, borderColor: mutedPalette[REMINDERS_FAMILY].border }]}>
              {nameIt.enabled ? `${nameIt.timesPerDay}× a day` : 'Off'}
            </Text>
          </ThreadCard>
        </View>

        <LogoDivider tip="Nothing here is a test. Come back to a practice whenever it calls; the rest can wait." />
      </ScrollView>
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
          .map((f) => findVocabularyWord(f.emotionId)?.word.label ?? f.emotionId)
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

/** One archived practice sitting in Past reflections: title + date collapsed,
 *  a per-step summary when expanded, swipe to remove. */
function PracticeSessionRow({
  session,
  index,
  expanded,
  onToggle,
}: {
  session: PracticeSession;
  index: number;
  expanded: boolean;
  onToggle(): void;
}) {
  const removePracticeSession = useExperimentStore((s) => s.removePracticeSession);
  const practice = findPractice(session.practiceId);
  if (!practice) return null;
  const when = new Date(session.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const lines = sessionLines(practice, session.work);

  const confirmRemove = () => {
    Alert.alert('Remove this sitting?', 'It will be gone from this phone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePracticeSession(session.id) },
    ]);
  };

  const renderActions = () => (
    <View style={styles.actionsRow}>
      <Pressable
        testID={`session-delete-${index}`}
        accessibilityRole="button"
        accessibilityLabel="Remove practice sitting"
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
        family={PRACTICE_FAMILY[practice.id]}
        testID={`practice-session-${index}`}
        accessibilityLabel={`${practice.title}, ${when}. Swipe to remove.`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.entryBody}
      >
        <Text style={styles.entryLine} numberOfLines={expanded ? undefined : 1}>
          {practice.title} — {when}
        </Text>
        {expanded ? (
          <View style={styles.entryDetail}>
            {lines.map((line) => (
              <View key={line.title}>
                <Text style={typography.caption}>{line.title}</Text>
                <Text style={typography.body}>{line.body}</Text>
              </View>
            ))}
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
