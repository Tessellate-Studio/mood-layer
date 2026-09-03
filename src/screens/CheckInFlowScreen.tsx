// Check-in modal: one question per screen (feel → body → resistance → note →
// stitch). Temperature lives ON the word in the feel step (chip + four-swatch
// dial) — no separate intensity screen. All step logic lives in the pure
// reducer (utils/checkInFlow); this screen just renders the current step and
// dispatches transitions. 'name-it' check-ins (from a reminder) can finish
// early once something is named.

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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Line } from 'react-native-svg';

import EmotionChip from '@/components/EmotionChip';
import FamilyGroup from '@/components/FamilyGroup';
import FieldGuideDoorway from '@/components/FieldGuideDoorway';
import LearnLink from '@/components/LearnLink';
import ModalHeader from '@/components/ModalHeader';
import NoteCard from '@/components/NoteCard';
import { PatchPreview } from '@/components/QuiltPatch';
import WordTemperatureRow from '@/components/WordTemperatureRow';
import { borderRadius, colors, familyPalette, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import { BODY_MAP } from '@/content/bodyMap';
import { CHECK_IN_COPY } from '@/content/checkInCopy';
import { useMeasuredHeight } from '@/hooks/useMeasuredHeight';
import { EMOTION_FAMILIES, MASKING_STATES, type EmotionWord } from '@/content/emotions';
import { noteReflection } from '@/content/noteReflection';
import { allWordsForFamily, findVocabularyWord } from '@/content/vocabulary';
import { useMotion } from '@/hooks/useMotion';
import { RESISTANCE_TELLS } from '@/content/resistance';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useCheckInStore } from '@/store/checkInStore';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { EmotionFamilyId } from '@/types/models';
import {
  canFinishEarly,
  canProceed,
  finishEarly,
  initialFlowState,
  nextStep,
  prevStep,
  setIntensity,
  feelStepHint,
  setNote,
  STEP_ORDER,
  type FeelHint,
  toCheckInInput,
  toggleBody,
  toggleEmotion,
  toggleMasking,
  toggleResistance,
  type CheckInStep,
  type FlowState,
} from '@/utils/checkInFlow';

type CheckInRoute = RouteProp<RootStackParamList, 'CheckInFlow'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

// One home for the hold-to-learn gesture: the feel hint promises holding ANY
// word teaches you about it, so every chip on the step routes through here.
const openFamilyHelper = (family: EmotionFamilyId) =>
  useHelperSheetStore.getState().open(family);

/** The feel step's single hint slot — which testID + copy each state renders. */
const FEEL_HINTS: Record<FeelHint, { testID: string; copy: string }> = {
  masking: { testID: 'masking-continue-hint', copy: CHECK_IN_COPY.maskingContinueHint },
  temperature: {
    testID: 'temperature-continue-hint',
    copy: CHECK_IN_COPY.temperatureContinueHint,
  },
  invite: { testID: 'add-another-hint', copy: CHECK_IN_COPY.addAnotherInvitation },
  explore: { testID: 'explore-note', copy: CHECK_IN_COPY.exploreNote },
};

/** The note's tint while nothing names a family yet. */
const NOTE_FAMILY_FALLBACK: EmotionFamilyId = 'anticipation';

const STEP_TITLES: Record<CheckInStep, string> = {
  feel: 'What are you feeling right now?',
  body: 'Where do you feel it?',
  resistance: 'Any of these today?',
  note: 'A note to your future self',
  stitch: 'Layer it in',
};

export default function CheckInFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<CheckInRoute>();
  const source = route.params?.source ?? 'manual';

  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const addCheckIn = useCheckInStore((s) => s.addCheckIn);
  // The teaching notes count logs so far — after a few they've done their job.
  const checkInCount = useCheckInStore((s) => s.checkIns.length);
  const { reduced } = useMotion();
  const scrollRef = React.useRef<ScrollView>(null);

  const [state, setState] = React.useState<FlowState>(() => initialFlowState(source));
  // Families start folded (one open at a time) so the step reads as a short,
  // calm list instead of ~50 chips at once. Lives here, not in FeelStep,
  // because the unfolding IS what raises the 'explore' note below.
  const [openFamily, setOpenFamily] = React.useState<EmotionFamilyId | null>(null);
  // Measured, not guessed: the floating hint sits on top of the footer's real
  // height, and the scroll pads by the hint's real height.
  // Measured, never typed (anti-pattern #9): the hint floats above the footer
  // and the scroll pads for the hint, both from real layout.
  const [footerHeight, onFooterLayout] = useMeasuredHeight();
  const [hintHeight, onHintLayout] = useMeasuredHeight();

  const title = source === 'name-it' && state.step === 'feel' ? 'Can you name it?' : STEP_TITLES[state.step];
  const stepIndex = STEP_ORDER.indexOf(state.step);
  // feelStepHint is priority-ordered, so at most one hint ever renders.
  const hintKey = feelStepHint(state, { familyOpen: openFamily !== null, checkInCount });
  const feelHint = hintKey ? FEEL_HINTS[hintKey] : null;
  // The note wears the family in play — the word just chosen, else the family
  // just unfolded — so it reads as part of what the user is doing.
  const noteFamily = state.selections[0]?.family ?? openFamily ?? NOTE_FAMILY_FALLBACK;

  // Each step is its own page — never inherit the previous step's scroll
  // position (app-wide bug, 2026-07-17).
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [state.step]);

  const goNext = () => setState((s) => nextStep(s));
  const goBack = () => setState((s) => prevStep(s));

  const stitchItIn = () => {
    addCheckIn(toCheckInInput(state));
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-checkin">
      <PaperTexture />
      {/* Edge-to-edge Android never resizes for the keyboard — without this
          the note input hides behind it (device feedback 2026-07-17). */}
      <KeyboardAvoidingView style={styles.avoider} behavior="padding">
      <ModalHeader title={title} closeTestID="checkin-close" onClose={() => navigation.goBack()} />

      {/* Stitched progress: one dash per step. */}
      <View style={styles.progress} accessibilityElementsHidden>
        <Svg width="100%" height={6}>
          {STEP_ORDER.map((_, i) => {
            const color = i < stepIndex ? colors.ink : i === stepIndex ? colors.inkSoft : colors.inkFaint;
            const segW = 100 / STEP_ORDER.length;
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
        contentContainerStyle={[
          styles.body,
          // The hint floats OVER the scroll — pad by its measured height so
          // the last chips can always be scrolled clear of it.
          feelHint ? { paddingBottom: spacing.xl + hintHeight } : null,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {state.step === 'feel' && (
          <FeelStep
            state={state}
            setState={setState}
            openFamily={openFamily}
            setOpenFamily={setOpenFamily}
            scrollTo={(y) => scrollRef.current?.scrollTo({ y, animated: !reduced })}
          />
        )}
        {state.step === 'body' && <BodyStep state={state} setState={setState} />}
        {state.step === 'resistance' && <ResistanceStep state={state} setState={setState} />}
        {state.step === 'note' && <NoteStep state={state} setState={setState} />}
        {state.step === 'stitch' && <StitchStep state={state} />}
      </ScrollView>

      {/* The feel step's one note — why Continue is grey, or what a held word
          does — floats just above the footer as a tinted NoteCard: in the
          flow it read as one more paragraph and stole height from the words
          (device feedback 2026-09-02). pointerEvents none: it must never
          swallow a tap meant for a chip underneath. Its offset is MEASURED
          from the footer, never hand-tuned (regression #24). */}
      {feelHint ? (
        <View
          testID="feel-hint-float"
          style={[styles.hintFloat, { bottom: footerHeight + spacing.xs }]}
          pointerEvents="none"
          onLayout={onHintLayout}
        >
          <NoteCard family={noteFamily}>
            <Text
              style={styles.continueHint}
              testID={feelHint.testID}
              accessibilityLiveRegion="polite"
            >
              {feelHint.copy}
            </Text>
          </NoteCard>
        </View>
      ) : null}

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        onLayout={onFooterLayout}
      >
        {stepIndex > 0 && state.step !== 'stitch' ? (
          <Pressable testID="flow-back" accessibilityRole="button" style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backText}>‹ back</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        {canFinishEarly(state) ? (
          <Pressable
            testID="flow-finish-early"
            accessibilityRole="button"
            style={styles.skipBtn}
            onPress={() => setState((s) => finishEarly(s))}
          >
            <Text style={styles.skipText}>Finish here</Text>
          </Pressable>
        ) : null}

        {(state.step === 'body' || state.step === 'resistance' || state.step === 'note') ? (
          <Pressable testID="flow-skip" accessibilityRole="button" style={styles.skipBtn} onPress={goNext}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : null}

        {state.step === 'stitch' ? (
          <Pressable
            testID="flow-stitch"
            accessibilityRole="button"
            style={styles.primaryBtn}
            onPress={stitchItIn}
          >
            <Text style={styles.primaryText}>Layer it in</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="flow-next"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed(state) }}
            disabled={!canProceed(state)}
            style={[styles.primaryBtn, !canProceed(state) && styles.primaryDisabled]}
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

interface StepProps {
  state: FlowState;
  setState: React.Dispatch<React.SetStateAction<FlowState>>;
}

function FeelStep({
  state,
  setState,
  openFamily,
  setOpenFamily,
  scrollTo,
}: StepProps & {
  openFamily: EmotionFamilyId | null;
  setOpenFamily: React.Dispatch<React.SetStateAction<EmotionFamilyId | null>>;
  scrollTo(y: number): void;
}) {
  const selectedMasking = MASKING_STATES.filter((m) => state.masking.includes(m.id));
  // Pushing keeps this modal (and the in-progress check-in) mounted
  // underneath — the field guide's back button returns straight here.
  const navigation = useNavigation<Nav>();
  // Chosen words stay pinned under their folded family — each with its
  // temperature dial right there, so naming and weighing happen in one place
  // (temperature-chip design, user-approved 2026-07-17).
  // Rebalance (user, 2026-07-17: the flow felt front-loaded): an unfolded
  // family shows its short curated gradient first; "+ more words" unfolds the
  // extended vocabulary for whoever wants the finer shades.
  const [moreWordsFor, setMoreWordsFor] = React.useState<Partial<Record<EmotionFamilyId, boolean>>>({});
  // Selecting a masking chip opens its "look underneath" panel BELOW the
  // fold — without a nudge it's easy to miss (device feedback 2026-07-17).
  // Remember which panel was just opened and scroll to it once it lays out.
  const pendingScrollId = React.useRef<string | null>(null);
  const toggleMaskingAndReveal = (id: string) => {
    if (!state.masking.includes(id)) pendingScrollId.current = id;
    setState((s) => toggleMasking(s, id));
  };
  return (
    <View style={styles.stepGap}>
      <Text style={styles.feelHint}>{CHECK_IN_COPY.feelHint}</Text>
      {/* "Hold any word…" no longer sits here as a permanent line — it floats
          up as the 'explore' note when a family unfolds (user, 2026-09-02).
          The guide's doorway is the same one the empty home screen shows. */}
      <FieldGuideDoorway
        testID="checkin-field-guide-link"
        accessibilityLabel="Open the field guide"
        label={CHECK_IN_COPY.fieldGuideLink}
        onPress={() => navigation.navigate('FieldGuide')}
      />
      {Object.values(EMOTION_FAMILIES).map((family) => {
        // Full vocabulary reachable, gradient shown first: the curated words
        // carry most check-ins; "+ more words" opens the extended list.
        // A selected extended word always stays visible.
        const allWords = allWordsForFamily(family.id);
        const showAll = moreWordsFor[family.id] === true;
        const words = showAll
          ? allWords
          : allWords.filter(
              (w) =>
                family.gradient.some((g) => g.id === w.id) ||
                state.selections.some((sel) => sel.emotionId === w.id)
            );
        const selectedInFamily = state.selections.filter((sel) =>
          allWords.some((w) => w.id === sel.emotionId)
        );
        const temperatureRows =
          selectedInFamily.length > 0 ? (
            <View style={styles.temperatureRows}>
              {selectedInFamily.map((sel) => (
                <WordTemperatureRow
                  key={sel.emotionId}
                  wordId={sel.emotionId}
                  label={findVocabularyWord(sel.emotionId)?.word.label ?? sel.emotionId}
                  family={sel.family}
                  intensity={sel.intensity}
                  onToggle={() => setState((s) => toggleEmotion(s, sel.emotionId, sel.family))}
                  onChangeIntensity={(intensity) =>
                    setState((s) => setIntensity(s, sel.emotionId, intensity))
                  }
                />
              ))}
            </View>
          ) : undefined;
        return (
          <FamilyGroup
            key={family.id}
            family={family}
            testID={`family-${family.id}`}
            expanded={openFamily === family.id}
            onToggle={() => setOpenFamily((cur) => (cur === family.id ? null : family.id))}
            pinned={temperatureRows}
          >
            <View style={styles.chipWrap}>
              {words.map((word) => {
                const sel = state.selections.find((x) => x.emotionId === word.id);
                return (
                  <EmotionChip
                    key={word.id}
                    id={word.id}
                    label={word.label}
                    selected={sel !== undefined}
                    fill={
                      sel && sel.intensity !== null
                        ? familyPalette[family.id].shades[sel.intensity]
                        : undefined
                    }
                    onPress={() => setState((s) => toggleEmotion(s, word.id, family.id))}
                    onLongPress={() => openFamilyHelper(family.id)}
                  />
                );
              })}
              {/* Only when there ARE more words — contempt's unfold used to
                  open onto nothing (user, 2026-07-18). */}
              {allWords.length > family.gradient.length ? (
                <EmotionChip
                  id={`more-${family.id}`}
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

      <Text style={styles.maskingIntro}>{CHECK_IN_COPY.maskingIntro}</Text>
      <View style={styles.chipWrap}>
        {MASKING_STATES.map((m) => (
          <EmotionChip
            key={m.id}
            id={m.id}
            label={m.label}
            quiet
            selected={state.masking.includes(m.id)}
            onPress={() => toggleMaskingAndReveal(m.id)}
            onLongPress={() => {
              // What a cover word "carries" is its own prompt + families, not
              // one family's sheet (holding 'Fine' → sadness would read as a
              // diagnosis). Hold reveals the underneath panel; never deselects.
              if (!state.masking.includes(m.id)) toggleMaskingAndReveal(m.id);
            }}
          />
        ))}
      </View>

      {/* Look underneath: a surface word (stressed, fine, numb…) is a cover,
          not a feeling. Selecting one opens this panel — the prompt plus the
          emotions it usually hides — so someone still learning to name what
          they feel has a guided way in, instead of a dead-end Continue. */}
      {selectedMasking.map((m) => (
        <View
          key={m.id}
          style={styles.underneathPanel}
          testID={`underneath-${m.id}`}
          onLayout={(e) => {
            if (pendingScrollId.current === m.id) {
              pendingScrollId.current = null;
              scrollTo(Math.max(0, e.nativeEvent.layout.y - spacing.md));
            }
          }}
        >
          <Text style={styles.underneathPrompt}>{m.prompt}</Text>
          {m.unpacksTo.map((familyId) => {
            const family = EMOTION_FAMILIES[familyId];
            const selectedHere = state.selections.filter((sel) =>
              family.gradient.some((w) => w.id === sel.emotionId)
            );
            return (
              <View key={familyId} style={styles.familyGroup}>
                <View style={styles.underneathHeader}>
                  <Text style={styles.overline}>{family.label}</Text>
                  <LearnLink family={familyId} testID={`underneath-learn-${familyId}`} />
                </View>
                {/* The short gradient only — the panel is a doorway, not the
                    library; the finer shades live in the family list above. */}
                <View style={styles.chipWrap}>
                  {family.gradient.map((word) => {
                    const sel = state.selections.find((x) => x.emotionId === word.id);
                    return (
                      <EmotionChip
                        key={word.id}
                        id={`under-${word.id}`}
                        label={word.label}
                        selected={sel !== undefined}
                        fill={
                          sel && sel.intensity !== null
                            ? familyPalette[familyId].shades[sel.intensity]
                            : undefined
                        }
                        onPress={() => setState((s) => toggleEmotion(s, word.id, familyId))}
                        onLongPress={() => openFamilyHelper(familyId)}
                      />
                    );
                  })}
                </View>
                {/* The dial appears RIGHT HERE for words chosen from the
                    panel — its twin under the folded family above is out of
                    sight at this point (device feedback 2026-07-17). */}
                {selectedHere.length > 0 ? (
                  <View style={styles.temperatureRows}>
                    {selectedHere.map((sel) => (
                      <WordTemperatureRow
                        key={sel.emotionId}
                        wordId={sel.emotionId}
                        chipId={`under-picked-${sel.emotionId}`}
                        label={findVocabularyWord(sel.emotionId)?.word.label ?? sel.emotionId}
                        family={sel.family}
                        intensity={sel.intensity}
                        onToggle={() =>
                          setState((s) => toggleEmotion(s, sel.emotionId, sel.family))
                        }
                        onChangeIntensity={(intensity) =>
                          setState((s) => setIntensity(s, sel.emotionId, intensity))
                        }
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
          <Text style={styles.underneathHint}>{CHECK_IN_COPY.underneathHint}</Text>
        </View>
      ))}
    </View>
  );
}

function BodyStep({ state, setState }: StepProps) {
  const [draft, setDraft] = React.useState('');
  // Sensations not on the map (typed in earlier, or from an older build) get
  // their own quiet group at the end so nothing chosen ever disappears.
  const mapped = new Set(BODY_MAP.flatMap((area) => area.sensations));
  const custom = state.bodySensations.filter((b) => !mapped.has(b));
  return (
    <View style={styles.stepGap}>
      <Text style={styles.feelHint}>
        Sensations are clues — scan slowly from head to feet and tap what you find.
      </Text>
      {BODY_MAP.map((area) => (
        <View key={area.id} style={styles.bodyArea} testID={`body-area-${area.id}`}>
          <Text style={typography.overline}>{area.label}</Text>
          <View style={styles.chipWrap}>
            {area.sensations.map((label) => (
              <EmotionChip
                key={label}
                id={label}
                label={label}
                selected={state.bodySensations.includes(label)}
                onPress={() => setState((s) => toggleBody(s, label))}
              />
            ))}
          </View>
        </View>
      ))}
      {custom.length > 0 ? (
        <View style={styles.bodyArea}>
          <Text style={typography.overline}>In your words</Text>
          <View style={styles.chipWrap}>
            {custom.map((label) => (
              <EmotionChip
                key={label}
                id={label}
                label={label}
                selected
                onPress={() => setState((s) => toggleBody(s, label))}
              />
            ))}
          </View>
        </View>
      ) : null}
      <TextInput
        style={styles.inlineInput}
        placeholder="somewhere else…"
        placeholderTextColor={colors.inkMuted}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={() => {
          const v = draft.trim();
          if (v.length > 0) {
            setState((s) => toggleBody(s, v));
            setDraft('');
          }
        }}
        returnKeyType="done"
      />
    </View>
  );
}

function ResistanceStep({ state, setState }: StepProps) {
  return (
    <View style={styles.stepGap}>
      {Object.values(RESISTANCE_TELLS).map((tell) => {
        const selected = state.resistanceFlags.includes(tell.id);
        return (
          <Pressable
            key={tell.id}
            testID={`tell-${tell.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={tell.checkInPrompt}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => setState((s) => toggleResistance(s, tell.id))}
          >
            <View style={styles.tellRow}>
              <Text style={[typography.body, styles.tellText]}>{tell.checkInPrompt}</Text>
              {selected ? (
                <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                  <Line x1={3} y1={9} x2={7} y2={13} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
                  <Line x1={7} y1={13} x2={15} y2={4} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
                </Svg>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function NoteStep({ state, setState }: StepProps) {
  return (
    <View style={styles.stepGap}>
      {/* Everything named so far, woven into one line that ends in an open
          question — the note probes what was actually selected instead of
          starting cold (user, 2026-07-17; KCG questions, Practicing EQ). */}
      <Text style={styles.noteReflection} testID="note-reflection">
        {noteReflection(state)}
      </Text>
      <TextInput
        style={styles.noteInput}
        multiline
        placeholder="Anything you want to remember about right now…"
        placeholderTextColor={colors.inkMuted}
        value={state.note}
        onChangeText={(text) => setState((s) => setNote(s, text))}
        textAlignVertical="top"
      />
    </View>
  );
}

function StitchStep({ state }: { state: FlowState }) {
  // The feel gate guarantees every temperature is set by now; the flatMap
  // narrows DraftSelection → EmotionSelection for the preview.
  const emotions = state.selections.flatMap((sel) =>
    sel.intensity === null
      ? []
      : [{ emotionId: sel.emotionId, family: sel.family, intensity: sel.intensity }]
  );
  const words = emotions
    .map((sel) => `${findVocabularyWord(sel.emotionId)?.word.label ?? sel.emotionId} · ${sel.intensity}`)
    .join('    ');
  return (
    <View style={styles.stitchWrap}>
      <PatchPreview emotions={emotions} size={160} a11yLabel="Your layers, ready to add" />
      <Text style={styles.stitchWords}>{words}</Text>
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
  familyGroup: {
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Reading text never below body (anti-pattern #10); body already reads in
  // inkSoft, which is all the quietness these need.
  maskingIntro: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  feelHint: {
    ...typography.body,
  },
  underneathPanel: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.md,
  },
  underneathPrompt: {
    ...typography.body,
    color: colors.inkSoft,
  },
  underneathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  underneathHint: {
    ...typography.body,
    color: colors.inkMuted,
  },
  hintFloat: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  continueHint: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardSelected: {
    borderWidth: 1,
    borderColor: colors.ink,
  },
  temperatureRows: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bodyArea: {
    gap: spacing.sm,
  },
  noteReflection: {
    ...typography.body,
    color: colors.inkSoft,
  },
  tellRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tellText: {
    flex: 1,
    flexWrap: 'wrap',
  },
  inlineInput: {
    ...typography.body,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
    paddingVertical: spacing.sm,
  },
  noteInput: {
    ...typography.body,
    minHeight: 120,
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
  },
  stitchWrap: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  stitchWords: {
    ...typography.body,
    textAlign: 'center',
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
  skipBtn: {
    minHeight: hitTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  skipText: {
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
