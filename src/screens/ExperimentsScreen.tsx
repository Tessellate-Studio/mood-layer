// Experiments tab, structured by KIND so the page reads calmly (user,
// 2026-07-17: a person with real emotional needs shouldn't feel their brain
// tangling in a disorganized mess):
//   Practices        — the five exercises (Explore avoided emotions, three
//                      perspective practices, box breathing), one card each.
//   Past reflections — ONE quiet doorway into the week-by-week Reflections
//                      catalog (a twenty-sitting wall belongs on its own
//                      screen, not here).
//   Learn            — the field guide (education, not practice).
//   Reminders        — Name it, which is a SCHEDULE, not an exercise — so it
//                      sits last as quiet configuration.
// Muted-layer treatment throughout (2026-07-13): tinted section glyphs,
// ThreadCards, the three-band mark as the closing divider.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { colors, mutedPalette, spacing, typography } from '@/constants/theme';
import LogoDivider from '@/components/LogoDivider';
import PaperTexture from '@/components/PaperTexture';
import CoachNote from '@/components/CoachNote';
import SectionHeader from '@/components/SectionHeader';
import { useMeasuredHeight } from '@/hooks/useMeasuredHeight';
import ThreadCard from '@/components/ThreadCard';
import { JUDGMENT_FAMILY, PRACTICE_FAMILY, PRACTICES } from '@/content/practices';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore } from '@/store/experimentStore';
import { groupSittings } from '@/utils/sittings';
import type { EmotionFamilyId } from '@/types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// A hue per card (mockup mapping, user 2026-08-31): judgment anger rose,
// per-practice hues in PRACTICE_FAMILY (enjoyment/disgust/fear), breathing
// anticipation teal, reflections contempt mauve, field guide surprise tan,
// Name it sadness blue — no family repeats anywhere on the page. Each
// section header takes its (first) card's hue.
const PERSPECTIVE_FAMILY: EmotionFamilyId = 'enjoyment';
const BREATHING_FAMILY: EmotionFamilyId = 'anticipation';
const REFLECTIONS_FAMILY: EmotionFamilyId = 'contempt';
const LEARN_FAMILY: EmotionFamilyId = 'surprise';
const REMINDERS_FAMILY: EmotionFamilyId = 'sadness';

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
  const reflectionCount = groupSittings(judgmentEntries).length + practiceSessions.length;
  const [headerHeight, onHeaderLayout] = useMeasuredHeight();

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
        <View testID="experiments-header" onLayout={onHeaderLayout}>
          <Text style={typography.title}>Experiments</Text>
        </View>
        <Text style={styles.intro}>
          Small practices for meeting what&apos;s here. Take one when it calls — none are homework.
        </Text>

        {/* Deep work: the sit-down exercises that ask something of you. Box
            breathing is NOT one of these — it regulates rather than
            excavates, so it has its own section below (user, 2026-07-18). */}
        <View style={styles.section}>
          <SectionHeader family={JUDGMENT_FAMILY} label="Deep work" />
          <ThreadCard
            family={JUDGMENT_FAMILY}
            testID="card-judgment"
            accessibilityLabel="Explore avoided emotions. What would you feel if you couldn't judge?"
            onPress={() => navigation.navigate('JudgmentFlow')}
          >
            <View style={styles.cardTitleRow}>
              <Text style={[typography.heading, styles.cardTitle]}>Explore avoided emotions</Text>
              <ArrowRing family={JUDGMENT_FAMILY} />
            </View>
            <Text style={styles.cardSub}>What would you feel if you couldn&apos;t judge?</Text>
          </ThreadCard>
        </View>

        {/* Perspective practices get their own header (mockup, 2026-08-31) —
            three ways of standing somewhere else, distinct from the judgment
            excavation above. */}
        <View style={styles.section}>
          <SectionHeader family={PERSPECTIVE_FAMILY} label="Perspective practices" />
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
          <Text style={styles.attribution}>
            Perspective practices adapted from Six Seconds&apos; Practicing EQ guide.
          </Text>
        </View>

        {/* Breath work: regulation, not excavation — reachable in a minute
            when the nervous system needs settling first. */}
        <View style={styles.section}>
          <SectionHeader family={BREATHING_FAMILY} label="Breath work" />
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
        </View>

        {/* Reflections live in their own catalog screen (week-by-week, like
            the home quilt) — twenty sittings shouldn't be a wall on this page
            (user, 2026-07-17). One quiet doorway is enough. */}
        {reflectionCount > 0 ? (
          <View style={styles.section}>
            <SectionHeader family={REFLECTIONS_FAMILY} label="Past reflections" />
            <ThreadCard
              family={REFLECTIONS_FAMILY}
              testID="card-reflections"
              accessibilityLabel={`Reflections. ${reflectionCount} saved.`}
              onPress={() => navigation.navigate('Reflections')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[typography.heading, styles.cardTitle]}>Reflections</Text>
                <ArrowRing family={REFLECTIONS_FAMILY} />
              </View>
              <Text style={styles.cardSub}>
                {reflectionCount === 1 ? 'One sitting, kept' : `${reflectionCount} sittings, kept`}{' '}
                — week by week
              </Text>
            </ThreadCard>
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

      {/* First-visit helper note, floating under the measured title row. */}
      <CoachNote id="note-experiments" topOffset={headerHeight} family={JUDGMENT_FAMILY} />
    </View>
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
    marginTop: spacing.xl,
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
});
