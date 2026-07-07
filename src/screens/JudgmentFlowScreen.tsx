// "Under the judgment" — a judgment, followed home to the feeling it carries.
// Four gentle steps: who/what you're judging → what the judgment is → what you
// would feel underneath (single-select emotion + intensity) → optional
// free-writing. Saves a JudgmentEntry locally, then closes. Tone: kind to the
// judge, never a correction.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import EmotionChip from '@/components/EmotionChip';
import IntensityDial from '@/components/IntensityDial';
import ModalHeader from '@/components/ModalHeader';
import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import { EMOTION_FAMILIES, findEmotionWord } from '@/content/emotions';
import { JUDGMENT_EXAMPLES } from '@/content/judgmentExamples';
import { useExperimentStore } from '@/store/experimentStore';
import type { EmotionSelection, Intensity } from '@/types/models';

const STEP_COUNT = 4;
// A rotating example seed so the placeholders + inline examples feel fresh but
// stay deterministic within a session.
const EXAMPLES = JUDGMENT_EXAMPLES.slice(0, 4);

export default function JudgmentFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const addJudgmentEntry = useExperimentStore((s) => s.addJudgmentEntry);

  const [step, setStep] = React.useState(0);
  const [target, setTarget] = React.useState('');
  const [judgment, setJudgment] = React.useState('');
  const [feeling, setFeeling] = React.useState<EmotionSelection | null>(null);
  const [freeWriting, setFreeWriting] = React.useState('');

  const example = EXAMPLES[0];

  const canProceed =
    step === 0 ? target.trim().length > 0 : step === 1 ? judgment.trim().length > 0 : true;

  const goNext = () => {
    if (!canProceed) return;
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const save = () => {
    addJudgmentEntry({
      target: target.trim(),
      judgment: judgment.trim(),
      uncoveredFeeling: feeling,
      freeWriting: freeWriting.trim() || undefined,
    });
    navigation.goBack();
  };

  const pickFeeling = (emotionId: string, family: EmotionSelection['family']) => {
    // Single-select: tapping the chosen one again clears it.
    setFeeling((prev) =>
      prev?.emotionId === emotionId ? null : { emotionId, family, intensity: prev?.intensity ?? 2 }
    );
  };

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
            <Text style={typography.heading}>…I would feel…</Text>
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
                      selected={feeling?.emotionId === word.id}
                      onPress={() => pickFeeling(word.id, family.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
            {feeling ? (
              <View style={styles.card}>
                <Text style={typography.heading}>
                  {findEmotionWord(feeling.emotionId)?.word.label ?? feeling.emotionId}
                </Text>
                <IntensityDial
                  wordId={feeling.emotionId}
                  label={findEmotionWord(feeling.emotionId)?.word.label ?? feeling.emotionId}
                  family={feeling.family}
                  value={feeling.intensity}
                  onChange={(intensity: Intensity) =>
                    setFeeling((prev) => (prev ? { ...prev, intensity } : prev))
                  }
                />
              </View>
            ) : (
              <Text style={typography.caption}>
                Pick the one that fits — or move on if nothing does.
              </Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepGap}>
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
