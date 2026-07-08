// "Under the judgment" — a judgment, followed home to the feeling it carries.
// Four gentle steps: who/what you're judging → what the judgment is → what you
// would feel underneath (multi-select emotions, each with its own intensity) →
// optional free-writing. Saves a JudgmentEntry locally, then closes. Tone: kind
// to the judge, never a correction.
//
// The feeling step carries the previous two answers forward as a live sentence
// ("If I couldn't judge X for Y, I would feel…") so you don't have to hold who
// + why in your head across screens (device feedback, 2026-07-08).

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import EmotionChip from '@/components/EmotionChip';
import IntensityDial from '@/components/IntensityDial';
import ModalHeader from '@/components/ModalHeader';
import { borderRadius, colors, fonts, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import { EMOTION_FAMILIES, findEmotionWord } from '@/content/emotions';
import { JUDGMENT_EXAMPLES } from '@/content/judgmentExamples';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore } from '@/store/experimentStore';
import type { EmotionSelection, Intensity } from '@/types/models';

const STEP_COUNT = 4;
// A judgment usually hides more than one feeling, but a wall of intensity dials
// is its own kind of noise — cap the naming at four so the step stays light.
const MAX_FEELINGS = 4;
const DEFAULT_INTENSITY: Intensity = 2;
// A rotating example seed so the placeholders + inline examples feel fresh but
// stay deterministic within a session.
const EXAMPLES = JUDGMENT_EXAMPLES.slice(0, 4);

// Join named feelings into a lowercase phrase ("worried and hurt") for the
// closing stitch line.
function feelingSummary(feelings: EmotionSelection[]): string {
  const labels = feelings.map(
    (f) => (findEmotionWord(f.emotionId)?.word.label ?? f.emotionId).toLowerCase()
  );
  if (labels.length <= 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

export default function JudgmentFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'JudgmentFlow'>>();
  const addJudgmentEntry = useExperimentStore((s) => s.addJudgmentEntry);
  const updateJudgmentEntry = useExperimentStore((s) => s.updateJudgmentEntry);

  // Edit mode: opened from a reflection's swipe action — prefill from the
  // entry and update it on save instead of adding a new one.
  const editId = route.params?.editId;
  const editing = editId
    ? useExperimentStore.getState().judgmentEntries.find((e) => e.id === editId)
    : undefined;

  const [step, setStep] = React.useState(0);
  const [target, setTarget] = React.useState(editing?.target ?? '');
  const [judgment, setJudgment] = React.useState(editing?.judgment ?? '');
  const [feelings, setFeelings] = React.useState<EmotionSelection[]>(
    editing?.uncoveredFeelings ?? []
  );
  const [freeWriting, setFreeWriting] = React.useState(editing?.freeWriting ?? '');

  const example = EXAMPLES[0];

  const canProceed =
    step === 0 ? target.trim().length > 0 : step === 1 ? judgment.trim().length > 0 : true;

  const goNext = () => {
    if (!canProceed) return;
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const save = () => {
    const input = {
      target: target.trim(),
      judgment: judgment.trim(),
      uncoveredFeelings: feelings,
      freeWriting: freeWriting.trim() || undefined,
    };
    if (editId) {
      updateJudgmentEntry(editId, input);
    } else {
      addJudgmentEntry(input);
    }
    navigation.goBack();
  };

  const toggleFeeling = (emotionId: string, family: EmotionSelection['family']) => {
    // Multi-select: tap to add, tap again to clear. Capped at MAX_FEELINGS —
    // extra taps beyond the cap are a no-op (the chip just won't select).
    setFeelings((prev) => {
      if (prev.some((f) => f.emotionId === emotionId)) {
        return prev.filter((f) => f.emotionId !== emotionId);
      }
      if (prev.length >= MAX_FEELINGS) return prev;
      return [...prev, { emotionId, family, intensity: DEFAULT_INTENSITY }];
    });
  };

  const setFeelingIntensity = (emotionId: string, intensity: Intensity) =>
    setFeelings((prev) =>
      prev.map((f) => (f.emotionId === emotionId ? { ...f, intensity } : f))
    );

  // The sentence built so far — shown on the feeling + note steps so the two
  // earlier answers stay in view instead of living only in memory.
  const stitchTarget = target.trim();
  const stitchJudgment = judgment.trim();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-judgment">
      <PaperTexture />
      <ModalHeader
        title="Under the judgment"
        closeTestID="judgment-close"
        onClose={() => navigation.goBack()}
      />

      {/* Progress dashes — one per step. */}
      <View style={styles.progress} accessibilityElementsHidden>
        <Svg width="100%" height={6}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => {
            const color = i < step ? colors.ink : i === step ? colors.inkSoft : colors.inkFaint;
            const segW = 100 / STEP_COUNT;
            return (
              <Line
                key={i}
                x1={`${i * segW + 1}%`}
                y1={3}
                x2={`${(i + 1) * segW - 1}%`}
                y2={3}
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={styles.stepGap}>
            <Text style={typography.heading}>If I couldn&apos;t judge…</Text>
            <TextInput
              testID="judgment-target"
              style={styles.input}
              placeholder={example.target}
              placeholderTextColor={colors.inkMuted}
              value={target}
              onChangeText={setTarget}
              accessibilityLabel="Who or what you're judging"
            />
            {/* Show the pattern with a few worked examples. */}
            <View style={styles.examplesBlock}>
              <Text style={styles.overline}>For instance</Text>
              {EXAMPLES.map((ex, i) => (
                <Text key={i} style={styles.exampleLine}>
                  If I couldn&apos;t judge {ex.target} for {ex.judgment}, I would feel {ex.feeling}.
                </Text>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepGap}>
            <Text style={typography.heading}>…for…</Text>
            <TextInput
              testID="judgment-judgment"
              style={styles.input}
              placeholder={example.judgment}
              placeholderTextColor={colors.inkMuted}
              value={judgment}
              onChangeText={setJudgment}
              accessibilityLabel="What the judgment is"
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepGap}>
            {/* Stitch the previous two answers into a living sentence so the
                "who" and "why" don't have to be held in memory. */}
            <Text style={styles.stitch} testID="judgment-stitch">
              If I couldn&apos;t judge <Text style={styles.stitchStrong}>{stitchTarget}</Text> for{' '}
              <Text style={styles.stitchStrong}>{stitchJudgment}</Text>, I would feel…
            </Text>
            {Object.values(EMOTION_FAMILIES).map((family) => (
              <View key={family.id} style={styles.familyGroup}>
                <Text style={styles.overline}>{family.label}</Text>
                <View style={styles.chipWrap}>
                  {family.gradient.map((word) => (
                    // EmotionChip stamps its own testID `chip-${id}`; passing a
                    // composite id yields the contract testID
                    // `chip-judgment-feeling-{wordId}`.
                    <EmotionChip
                      key={word.id}
                      id={`judgment-feeling-${word.id}`}
                      label={word.label}
                      selected={feelings.some((f) => f.emotionId === word.id)}
                      onPress={() => toggleFeeling(word.id, family.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
            {feelings.length > 0 ? (
              // One card per named feeling — the same word-plus-shade-dial the
              // check-in uses, so several feelings read as a set, not a count.
              feelings.map((feeling) => {
                const label = findEmotionWord(feeling.emotionId)?.word.label ?? feeling.emotionId;
                return (
                  <View key={feeling.emotionId} style={styles.card}>
                    <Text style={typography.heading}>{label}</Text>
                    <IntensityDial
                      wordId={feeling.emotionId}
                      label={label}
                      family={feeling.family}
                      value={feeling.intensity}
                      onChange={(intensity: Intensity) =>
                        setFeelingIntensity(feeling.emotionId, intensity)
                      }
                    />
                  </View>
                );
              })
            ) : (
              <Text style={typography.caption}>
                Name as many as fit — or move on if nothing does.
              </Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepGap}>
            <Text style={styles.stitch}>
              Under judging <Text style={styles.stitchStrong}>{stitchTarget}</Text>
              {feelings.length > 0 ? (
                <>
                  {' '}
                  you found{' '}
                  <Text style={styles.stitchStrong}>{feelingSummary(feelings)}</Text>.
                </>
              ) : (
                '.'
              )}
            </Text>
            <Text style={typography.heading}>Anything else? (optional)</Text>
            <TextInput
              testID="judgment-freewriting"
              style={styles.noteInput}
              multiline
              placeholder="Whatever wants to be said…"
              placeholderTextColor={colors.inkMuted}
              value={freeWriting}
              onChangeText={setFreeWriting}
              textAlignVertical="top"
              accessibilityLabel="Free writing"
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {step > 0 ? (
          <Pressable testID="judgment-back" accessibilityRole="button" style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backText}>‹ back</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        {step === STEP_COUNT - 1 ? (
          <Pressable
            testID="judgment-save"
            accessibilityRole="button"
            style={styles.primaryBtn}
            onPress={save}
          >
            <Text style={styles.primaryText}>Save</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="judgment-next"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed }}
            disabled={!canProceed}
            style={[styles.primaryBtn, !canProceed && styles.primaryDisabled]}
            onPress={goNext}
          >
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  progress: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  body: {
    paddingBottom: spacing.xl,
  },
  stepGap: {
    gap: spacing.lg,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
    paddingVertical: spacing.sm,
  },
  examplesBlock: {
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
  },
  exampleLine: {
    ...typography.caption,
  },
  stitch: {
    ...typography.body,
    color: colors.inkSoft,
  },
  stitchStrong: {
    // Emphasis is the bold Courier family, never a synthetic weight — asking
    // Android for 600 on the regular face silently falls back (anti-pattern #12).
    fontFamily: fonts.displayEmphasis,
    color: colors.ink,
  },
  familyGroup: {
    gap: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.md,
  },
  noteInput: {
    ...typography.body,
    color: colors.ink,
    minHeight: 120,
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  backBtn: {
    minHeight: hitTarget,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  backSpacer: {
    flex: 0,
  },
  backText: {
    ...typography.label,
    color: colors.inkSoft,
  },
  primaryBtn: {
    flex: 1,
    minHeight: hitTarget,
    backgroundColor: colors.ink,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: {
    backgroundColor: colors.inkFaint,
  },
  primaryText: {
    ...typography.label,
    color: colors.paper,
  },
});
