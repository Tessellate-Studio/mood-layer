// "Explore avoided emotions" — judgments, followed home to the feelings they
// carry. Rebuilt 2026-07-17 to the user's source worksheet ("Learning to spot
// avoided emotions"): 1) think of ~5 recent judgments of someone or yourself;
// 2) complete, for EACH one, "If I couldn't judge ___ for ___, I would feel
// ___" (one page per judgment, feelings weighed on the word); 3) optionally
// notice what came up and write freely. One sitting saves one entry per
// judgment, grouped by sittingId (store). Tone: kind to the judge, never a
// correction.

import React from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import EmotionChip from '@/components/EmotionChip';
import FamilyGroup from '@/components/FamilyGroup';
import ModalHeader from '@/components/ModalHeader';
import WordTemperatureRow from '@/components/WordTemperatureRow';
import { borderRadius, colors, familyPalette, fonts, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { JUDGMENT_EXAMPLES } from '@/content/judgmentExamples';
import { allWordsForFamily, findVocabularyWord } from '@/content/vocabulary';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore } from '@/store/experimentStore';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import type { EmotionFamilyId, EmotionSelection } from '@/types/models';
import type { DraftSelection } from '@/utils/checkInFlow';

// The worksheet suggests around five judgments; the list is soft-capped only
// by the person's patience — no hard limit.
const EXAMPLES = JUDGMENT_EXAMPLES.slice(0, 3);

interface JudgmentItem {
  target: string;
  judgment: string;
  feelings: DraftSelection[];
}

const blankItem = (): JudgmentItem => ({ target: '', judgment: '', feelings: [] });

const isComplete = (item: JudgmentItem) =>
  item.target.trim().length > 0 && item.judgment.trim().length > 0;

// Join named feelings into a lowercase phrase ("worried and hurt").
function feelingSummary(feelings: { emotionId: string }[]): string {
  const labels = feelings.map(
    (f) => (findVocabularyWord(f.emotionId)?.word.label ?? f.emotionId).toLowerCase()
  );
  if (labels.length <= 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

export default function JudgmentFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'JudgmentFlow'>>();
  const saveJudgmentSitting = useExperimentStore((s) => s.saveJudgmentSitting);

  // Edit mode: editId names a sitting (or a lone pre-multi entry). Prefill
  // every judgment of that sitting and replace it on save.
  const editId = route.params?.editId;
  const [initial] = React.useState(() => {
    if (!editId) return { items: [blankItem()], freeWriting: '' };
    const entries = useExperimentStore
      .getState()
      .judgmentEntries.filter((e) => (e.sittingId ?? e.id) === editId);
    if (entries.length === 0) return { items: [blankItem()], freeWriting: '' };
    return {
      items: entries.map((e) => ({
        target: e.target,
        judgment: e.judgment,
        feelings: e.uncoveredFeelings as DraftSelection[],
      })),
      freeWriting: entries.find((e) => e.freeWriting)?.freeWriting ?? '',
    };
  });

  const [step, setStep] = React.useState(0);
  const [items, setItems] = React.useState<JudgmentItem[]>(initial.items);
  const [freeWriting, setFreeWriting] = React.useState(initial.freeWriting);
  // Feeling pages: families start folded — same calm treatment as check-in,
  // with the curated gradient first and "+ more words" for the finer shades.
  const [openFamily, setOpenFamily] = React.useState<EmotionFamilyId | null>(null);
  const [moreWordsFor, setMoreWordsFor] = React.useState<Partial<Record<EmotionFamilyId, boolean>>>({});

  // Steps: 0 = the judgments list; 1..k = one feelings page per COMPLETE
  // judgment; k+1 = free writing. Indexes of complete items are frozen per
  // render so a feelings page always edits the row it belongs to.
  const completeIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isComplete(item))
    .map(({ index }) => index);
  const stepCount = 2 + completeIndexes.length;
  const feelingsPage = step >= 1 && step <= completeIndexes.length;
  const itemIndex = feelingsPage ? completeIndexes[step - 1] : -1;
  const current = feelingsPage ? items[itemIndex] : null;

  // Each step is its own page — never inherit the previous step's scroll
  // position (app-wide bug, 2026-07-17).
  const scrollRef = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setOpenFamily(null);
  }, [step]);

  const canProceed =
    step === 0
      ? completeIndexes.length >= 1
      : current
        ? current.feelings.every((f) => f.intensity !== null)
        : true;

  const goNext = () => {
    if (!canProceed) return;
    setStep((s) => Math.min(stepCount - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const save = () => {
    saveJudgmentSitting({
      items: items.filter(isComplete).map((item) => ({
        target: item.target.trim(),
        judgment: item.judgment.trim(),
        // The feelings pages gate Continue on every temperature being set.
        uncoveredFeelings: item.feelings.flatMap((f) =>
          f.intensity === null
            ? []
            : [{ emotionId: f.emotionId, family: f.family, intensity: f.intensity }]
        ) as EmotionSelection[],
      })),
      freeWriting: freeWriting.trim() || undefined,
      ...(editId ? { sittingId: editId } : {}),
    });
    navigation.goBack();
  };

  const patchItem = (index: number, patch: Partial<JudgmentItem>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const toggleFeeling = (index: number, emotionId: string, family: EmotionFamilyId) =>
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const has = item.feelings.some((f) => f.emotionId === emotionId);
        return {
          ...item,
          feelings: has
            ? item.feelings.filter((f) => f.emotionId !== emotionId)
            : [...item.feelings, { emotionId, family, intensity: null }],
        };
      })
    );

  const setFeelingIntensity = (index: number, emotionId: string, intensity: 1 | 2 | 3 | 4) =>
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              feelings: item.feelings.map((f) =>
                f.emotionId === emotionId ? { ...f, intensity } : f
              ),
            }
          : item
      )
    );

  // "+ another judgment" drops the cursor straight into the new row.
  const targetRefs = React.useRef<(TextInput | null)[]>([]);
  const addItem = () => {
    const nextIndex = items.length;
    setItems((prev) => [...prev, blankItem()]);
    setTimeout(() => targetRefs.current[nextIndex]?.focus(), 80);
  };
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-judgment">
      <PaperTexture />
      {/* Edge-to-edge Android never resizes for the keyboard (2026-07-17). */}
      <KeyboardAvoidingView style={styles.avoider} behavior="padding">
      <ModalHeader
        title="Explore avoided emotions"
        closeTestID="judgment-close"
        onClose={() => navigation.goBack()}
      />

      {/* Progress dashes — one per step (the middle grows with judgments). */}
      <View style={styles.progress} accessibilityElementsHidden>
        <Svg width="100%" height={6}>
          {Array.from({ length: stepCount }).map((_, i) => {
            const color = i < step ? colors.ink : i === step ? colors.inkSoft : colors.inkFaint;
            const segW = 100 / stepCount;
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

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <View style={styles.stepGap}>
            <Text style={typography.heading}>Recent judgments</Text>
            <Text style={typography.body}>
              Think of recent judgments you&apos;ve had — of someone else, or of
              yourself. Around five is plenty; even one is a start.
            </Text>
            {items.map((item, i) => (
              <View key={i} style={styles.itemCard} testID={`judgment-item-${i}`}>
                <View style={styles.itemHeader}>
                  <Text style={styles.overline}>Judgment {i + 1}</Text>
                  {items.length > 1 ? (
                    <Pressable
                      testID={`judgment-remove-${i}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove judgment ${i + 1}`}
                      style={styles.removeBtn}
                      onPress={() => removeItem(i)}
                    >
                      <Text style={styles.removeGlyph}>×</Text>
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  ref={(el) => {
                    targetRefs.current[i] = el;
                  }}
                  testID={`judgment-target-${i}`}
                  style={styles.input}
                  placeholder={`who or what — e.g. ${EXAMPLES[i % EXAMPLES.length].target}`}
                  placeholderTextColor={colors.inkMuted}
                  value={item.target}
                  onChangeText={(t) => patchItem(i, { target: t })}
                  accessibilityLabel={`Judgment ${i + 1}: who or what`}
                />
                <TextInput
                  testID={`judgment-for-${i}`}
                  style={styles.input}
                  placeholder={`for — e.g. ${EXAMPLES[i % EXAMPLES.length].judgment}`}
                  placeholderTextColor={colors.inkMuted}
                  value={item.judgment}
                  onChangeText={(t) => patchItem(i, { judgment: t })}
                  accessibilityLabel={`Judgment ${i + 1}: what for`}
                />
              </View>
            ))}
            <Pressable
              testID="judgment-add"
              accessibilityRole="button"
              accessibilityLabel="Add another judgment"
              style={styles.addBtn}
              onPress={addItem}
            >
              <Text style={styles.addText}>+ another judgment</Text>
            </Pressable>
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

        {current && (
          <View style={styles.stepGap}>
            {/* The judgment being followed home, as a living sentence. */}
            <Text style={styles.stitch} testID="judgment-stitch">
              If I couldn&apos;t judge{' '}
              <Text style={styles.stitchStrong}>{current.target.trim()}</Text> for{' '}
              <Text style={styles.stitchStrong}>{current.judgment.trim()}</Text>, I would feel…
            </Text>
            {Object.values(EMOTION_FAMILIES).map((family) => {
              const allWords = allWordsForFamily(family.id);
              const showAll = moreWordsFor[family.id] === true;
              const words = showAll
                ? allWords
                : allWords.filter(
                    (w) =>
                      family.gradient.some((g) => g.id === w.id) ||
                      current.feelings.some((f) => f.emotionId === w.id)
                  );
              const selectedInFamily = current.feelings.filter((f) =>
                allWords.some((w) => w.id === f.emotionId)
              );
              const temperatureRows =
                selectedInFamily.length > 0 ? (
                  <View style={styles.temperatureRows}>
                    {selectedInFamily.map((feeling) => (
                      <WordTemperatureRow
                        key={feeling.emotionId}
                        wordId={feeling.emotionId}
                        chipId={`judgment-picked-${feeling.emotionId}`}
                        label={
                          findVocabularyWord(feeling.emotionId)?.word.label ?? feeling.emotionId
                        }
                        family={feeling.family}
                        intensity={feeling.intensity}
                        onToggle={() => toggleFeeling(itemIndex, feeling.emotionId, feeling.family)}
                        onChangeIntensity={(intensity) =>
                          setFeelingIntensity(itemIndex, feeling.emotionId, intensity)
                        }
                      />
                    ))}
                  </View>
                ) : undefined;
              return (
                <FamilyGroup
                  key={family.id}
                  family={family}
                  testID={`judgment-family-${family.id}`}
                  expanded={openFamily === family.id}
                  onToggle={() =>
                    setOpenFamily((cur) => (cur === family.id ? null : family.id))
                  }
                  pinned={temperatureRows}
                >
                  <View style={styles.chipWrap}>
                    {words.map((word) => {
                      const sel = current.feelings.find((f) => f.emotionId === word.id);
                      return (
                        <EmotionChip
                          key={word.id}
                          id={`judgment-feeling-${word.id}`}
                          label={word.label}
                          selected={sel !== undefined}
                          fill={
                            sel && sel.intensity !== null
                              ? familyPalette[family.id].shades[sel.intensity]
                              : undefined
                          }
                          onPress={() => toggleFeeling(itemIndex, word.id, family.id)}
                          onLongPress={() => useHelperSheetStore.getState().openWord(word.id)}
                        />
                      );
                    })}
                    {allWords.length > family.gradient.length ? (
                      <EmotionChip
                        id={`judgment-more-${family.id}`}
                        label={showAll ? '– fewer words' : '+ more words'}
                        quiet
                        selected={false}
                        onPress={() =>
                          setMoreWordsFor((cur) => ({ ...cur, [family.id]: !showAll }))
                        }
                      />
                    ) : null}
                  </View>
                  {temperatureRows}
                </FamilyGroup>
              );
            })}
            {current.feelings.length === 0 ? (
              <Text style={typography.caption}>
                Name as many as fit — or move on if nothing does.
              </Text>
            ) : null}
          </View>
        )}

        {step === stepCount - 1 && (
          <View style={styles.stepGap}>
            {/* Worksheet step 3: notice what came up across the whole sitting. */}
            <Text style={styles.stitch}>
              {items.filter(isComplete).map((item, i) => {
                const named = feelingSummary(item.feelings);
                return (
                  <Text key={i}>
                    Under judging <Text style={styles.stitchStrong}>{item.target.trim()}</Text>
                    {named ? (
                      <>
                        {' '}
                        you found <Text style={styles.stitchStrong}>{named}</Text>
                      </>
                    ) : null}
                    {'.\n'}
                  </Text>
                );
              })}
            </Text>
            <Text style={typography.heading}>What came up? (optional)</Text>
            <Text style={typography.body}>
              Notice any thoughts, feelings, or sensations that arrived while you
              did this — and write freely about them.
            </Text>
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

        {step === stepCount - 1 ? (
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  avoider: {
    flex: 1,
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
  itemCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
    paddingVertical: spacing.sm,
  },
  removeBtn: {
    minWidth: hitTarget,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeGlyph: {
    ...typography.title,
    color: colors.inkMuted,
  },
  addBtn: {
    minHeight: hitTarget,
    justifyContent: 'center',
  },
  addText: {
    ...typography.label,
    color: colors.inkSoft,
  },
  examplesBlock: {
    gap: spacing.sm,
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  temperatureRows: {
    gap: spacing.sm,
    marginTop: spacing.xs,
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
