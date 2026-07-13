// Check-in modal: one question per screen (feel → intensity → body →
// resistance → note → stitch). All step logic lives in the pure reducer
// (utils/checkInFlow); this screen just renders the current step and dispatches
// transitions. 'name-it' check-ins (from a reminder) can finish early once
// something is named.

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Line } from 'react-native-svg';

import EmotionChip from '@/components/EmotionChip';
import IntensityDial from '@/components/IntensityDial';
import ModalHeader from '@/components/ModalHeader';
import { PatchPreview } from '@/components/QuiltPatch';
import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import SectionHeader from '@/components/SectionHeader';
import ThreadCard from '@/components/ThreadCard';
import { EMOTION_FAMILIES, findEmotionWord, MASKING_STATES } from '@/content/emotions';
import { RESISTANCE_TELLS } from '@/content/resistance';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useCheckInStore } from '@/store/checkInStore';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Intensity } from '@/types/models';
import {
  canFinishEarly,
  canProceed,
  finishEarly,
  initialFlowState,
  nextStep,
  prevStep,
  setIntensity,
  setNote,
  STEP_ORDER,
  toCheckInInput,
  toggleBody,
  toggleEmotion,
  toggleMasking,
  toggleResistance,
  type CheckInStep,
  type FlowState,
} from '@/utils/checkInFlow';

type CheckInRoute = RouteProp<RootStackParamList, 'CheckInFlow'>;

const BODY_PRESETS = [
  'tight chest',
  'warm face',
  'heavy limbs',
  'buzzing hands',
  'lump in throat',
  'hollow stomach',
  'clenched jaw',
  'light shoulders',
];

const STEP_TITLES: Record<CheckInStep, string> = {
  feel: "What's here right now?",
  intensity: 'How much of each?',
  body: 'Where do you feel it?',
  resistance: 'Any of these today?',
  note: 'A note to your future self',
  stitch: 'Stitch it in',
};

export default function CheckInFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<CheckInRoute>();
  const source = route.params?.source ?? 'manual';

  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const addCheckIn = useCheckInStore((s) => s.addCheckIn);

  const [state, setState] = React.useState<FlowState>(() => initialFlowState(source));

  const title = source === 'name-it' && state.step === 'feel' ? 'Can you name it?' : STEP_TITLES[state.step];
  const stepIndex = STEP_ORDER.indexOf(state.step);

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

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {state.step === 'feel' && <FeelStep state={state} setState={setState} />}
        {state.step === 'intensity' && <IntensityStep state={state} setState={setState} />}
        {state.step === 'body' && <BodyStep state={state} setState={setState} />}
        {state.step === 'resistance' && <ResistanceStep state={state} setState={setState} />}
        {state.step === 'note' && <NoteStep state={state} setState={setState} />}
        {state.step === 'stitch' && <StitchStep state={state} />}
      </ScrollView>

      {state.step === 'feel' && state.masking.length > 0 && state.selections.length === 0 ? (
        <Text style={styles.continueHint} testID="masking-continue-hint">
          Name what&apos;s underneath to continue.
        </Text>
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
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
            <Text style={styles.primaryText}>Stitch it in</Text>
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
    </View>
  );
}

interface StepProps {
  state: FlowState;
  setState: React.Dispatch<React.SetStateAction<FlowState>>;
}

function FeelStep({ state, setState }: StepProps) {
  const selectedMasking = MASKING_STATES.filter((m) => state.masking.includes(m.id));
  return (
    <View style={styles.stepGap}>
      {Object.values(EMOTION_FAMILIES).map((family) => (
        <View key={family.id} style={styles.familyGroup}>
          {/* Muted-layer treatment: each family group opens with its own
              tinted section glyph, teaching the family↔hue pairing the quilt
              uses. */}
          <SectionHeader family={family.id} label={family.label} />
          <View style={styles.chipWrap}>
            {family.gradient.map((word) => (
              <EmotionChip
                key={word.id}
                id={word.id}
                label={word.label}
                selected={state.selections.some((x) => x.emotionId === word.id)}
                onPress={() => setState((s) => toggleEmotion(s, word.id, family.id))}
              />
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.maskingIntro}>or, if it&apos;s more like…</Text>
      <View style={styles.chipWrap}>
        {MASKING_STATES.map((m) => (
          <EmotionChip
            key={m.id}
            id={m.id}
            label={m.label}
            dashed
            selected={state.masking.includes(m.id)}
            onPress={() => setState((s) => toggleMasking(s, m.id))}
          />
        ))}
      </View>

      {/* Look underneath: a surface word (stressed, fine, numb…) is a cover,
          not a feeling. Selecting one opens this panel — the prompt plus the
          emotions it usually hides — so someone still learning to name what
          they feel has a guided way in, instead of a dead-end Continue. */}
      {selectedMasking.map((m) => (
        <View key={m.id} style={styles.underneathPanel} testID={`underneath-${m.id}`}>
          <Text style={styles.underneathPrompt}>{m.prompt}</Text>
          {m.unpacksTo.map((familyId) => {
            const family = EMOTION_FAMILIES[familyId];
            return (
              <View key={familyId} style={styles.familyGroup}>
                <View style={styles.underneathHeader}>
                  <Text style={styles.overline}>{family.label}</Text>
                  <Pressable
                    testID={`underneath-learn-${familyId}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Learn about ${family.label}`}
                    hitSlop={8}
                    onPress={() => useHelperSheetStore.getState().open(familyId)}
                  >
                    <Text style={styles.learnLink}>learn →</Text>
                  </Pressable>
                </View>
                <View style={styles.chipWrap}>
                  {family.gradient.map((word) => (
                    <EmotionChip
                      key={word.id}
                      id={`under-${word.id}`}
                      label={word.label}
                      selected={state.selections.some((x) => x.emotionId === word.id)}
                      onPress={() => setState((s) => toggleEmotion(s, word.id, familyId))}
                    />
                  ))}
                </View>
              </View>
            );
          })}
          <Text style={styles.underneathHint}>
            Naming even one is enough — or open “learn” to feel your way in.
          </Text>
        </View>
      ))}
    </View>
  );
}

function IntensityStep({ state, setState }: StepProps) {
  return (
    <View style={styles.stepGap}>
      {state.selections.map((sel) => {
        const label = findEmotionWord(sel.emotionId)?.word.label ?? sel.emotionId;
        return (
          // The card wears its emotion's muted layer, so weighing an anger
          // word already happens on anger's hue.
          <ThreadCard key={sel.emotionId} family={sel.family} style={styles.intensityBody}>
            {/* Long-press the word to open its family's helper — an
                unobtrusive doorway to the "why" without cluttering the step. */}
            <Pressable
              testID={`intensity-label-${sel.emotionId}`}
              accessibilityRole="button"
              accessibilityLabel={`${label}. Long press to learn about ${sel.family}.`}
              onLongPress={() => useHelperSheetStore.getState().open(sel.family)}
            >
              <Text style={typography.heading}>{label}</Text>
            </Pressable>
            <IntensityDial
              wordId={sel.emotionId}
              label={label}
              family={sel.family}
              value={sel.intensity}
              onChange={(intensity: Intensity) => setState((s) => setIntensity(s, sel.emotionId, intensity))}
            />
          </ThreadCard>
        );
      })}
      {state.selections.length === 0 ? (
        <Text style={typography.body}>Nothing to weigh yet — go back and name a feeling first.</Text>
      ) : null}
    </View>
  );
}

function BodyStep({ state, setState }: StepProps) {
  const [draft, setDraft] = React.useState('');
  const options = [...BODY_PRESETS, ...state.bodySensations.filter((b) => !BODY_PRESETS.includes(b))];
  return (
    <View style={styles.stepGap}>
      <View style={styles.chipWrap}>
        {options.map((label) => (
          <EmotionChip
            key={label}
            id={label}
            label={label}
            selected={state.bodySensations.includes(label)}
            onPress={() => setState((s) => toggleBody(s, label))}
          />
        ))}
      </View>
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
  const words = state.selections
    .map((sel) => `${findEmotionWord(sel.emotionId)?.word.label ?? sel.emotionId} · ${sel.intensity}`)
    .join('    ');
  return (
    <View style={styles.stitchWrap}>
      <PatchPreview emotions={state.selections} size={160} a11yLabel="Your patch, ready to stitch in" />
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
  maskingIntro: {
    ...typography.caption,
    marginTop: spacing.sm,
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
  learnLink: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  underneathHint: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  continueHint: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingBottom: spacing.xs,
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
  intensityBody: {
    gap: spacing.md,
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
    ...typography.caption,
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
