// Pure state machine for the multi-step check-in. No React — the screen holds
// one FlowState and calls these transitions, so the whole flow is unit-tested
// without rendering. One question per screen keeps the UI calm (CLAUDE.md
// tone), and 'name-it' check-ins (from a reminder) may finish early once
// something is named.

import type { EmotionFamilyId, EmotionSelection, Intensity, ResistanceTellId } from '@/types/models';

// No 'intensity' step: temperature is set on the word itself in the feel step
// (chip + four-swatch dial), so weighing never needs its own screen
// (user-approved temperature-chip design, 2026-07-17).
export type CheckInStep = 'feel' | 'body' | 'resistance' | 'note' | 'stitch';

/** Ordered steps; index drives next/prev and the progress dashes. */
export const STEP_ORDER: CheckInStep[] = ['feel', 'body', 'resistance', 'note', 'stitch'];

/** Steps a 'name-it' flow is allowed to finish early from. */
const FINISH_EARLY_STEPS: CheckInStep[] = ['body', 'resistance', 'note'];

// NOTE: deliberately NO cap on how many emotions a check-in holds. The old
// max of 5 had no basis in the literature — "on some level, we are always
// feeling multiple feelings at a time" (Six Seconds, Practicing EQ p.15) —
// and the quilt cluster scales to any count (user, 2026-07-17).

/** A named word mid-flow: temperature starts UNSET — the user weighs it
 *  deliberately, never by default (user, 2026-07-17). */
export interface DraftSelection {
  emotionId: string;
  family: EmotionFamilyId;
  intensity: Intensity | null;
}

export interface FlowState {
  step: CheckInStep;
  source: 'manual' | 'name-it';
  selections: DraftSelection[];
  masking: string[];
  bodySensations: string[];
  resistanceFlags: ResistanceTellId[];
  note: string;
}

export function initialFlowState(source: 'manual' | 'name-it'): FlowState {
  return {
    step: 'feel',
    source,
    selections: [],
    masking: [],
    bodySensations: [],
    resistanceFlags: [],
    note: '',
  };
}

/**
 * The feel step needs at least one NAMED emotion — a masking state alone is a
 * doorway, not a destination (picking one opens the "look underneath" panel so
 * the surface word can be unpacked into a real feeling) — AND every named
 * word must have its temperature set: weighing is a deliberate act, never a
 * default (user, 2026-07-17). The rest of the steps are optional, so
 * proceeding is always allowed past feel.
 */
export function canProceed(s: FlowState): boolean {
  if (s.step === 'feel') {
    return s.selections.length >= 1 && s.selections.every((x) => x.intensity !== null);
  }
  return true;
}

/**
 * After the first word is named AND weighed, gently invite company — we
 * rarely feel just one thing (the no-cap note above). Exactly one weighed
 * selection, so this never stacks with the temperature or masking hints,
 * and it retires the moment a second word arrives: invitation, not nag.
 */
export function shouldInviteAnother(s: FlowState): boolean {
  return s.step === 'feel' && s.selections.length === 1 && s.selections[0].intensity !== null;
}

export function nextStep(s: FlowState): FlowState {
  const i = STEP_ORDER.indexOf(s.step);
  if (i >= STEP_ORDER.length - 1) return s;
  return { ...s, step: STEP_ORDER[i + 1] };
}

export function prevStep(s: FlowState): FlowState {
  const i = STEP_ORDER.indexOf(s.step);
  if (i <= 0) return s;
  return { ...s, step: STEP_ORDER[i - 1] };
}

export function canFinishEarly(s: FlowState): boolean {
  return s.source === 'name-it' && FINISH_EARLY_STEPS.includes(s.step);
}

export function finishEarly(s: FlowState): FlowState {
  if (!canFinishEarly(s)) return s;
  return { ...s, step: 'stitch' };
}

export function toggleEmotion(s: FlowState, emotionId: string, family: EmotionFamilyId): FlowState {
  const existing = s.selections.find((x) => x.emotionId === emotionId);
  if (existing) {
    return { ...s, selections: s.selections.filter((x) => x.emotionId !== emotionId) };
  }
  return {
    ...s,
    selections: [...s.selections, { emotionId, family, intensity: null }],
  };
}

export function setIntensity(s: FlowState, emotionId: string, intensity: Intensity): FlowState {
  return {
    ...s,
    selections: s.selections.map((x) => (x.emotionId === emotionId ? { ...x, intensity } : x)),
  };
}

export function toggleMasking(s: FlowState, id: string): FlowState {
  const on = s.masking.includes(id);
  return {
    ...s,
    masking: on ? s.masking.filter((x) => x !== id) : [...s.masking, id],
  };
}

export function toggleBody(s: FlowState, label: string): FlowState {
  const on = s.bodySensations.includes(label);
  return {
    ...s,
    bodySensations: on
      ? s.bodySensations.filter((x) => x !== label)
      : [...s.bodySensations, label],
  };
}

export function toggleResistance(s: FlowState, id: ResistanceTellId): FlowState {
  const on = s.resistanceFlags.includes(id);
  return {
    ...s,
    resistanceFlags: on ? s.resistanceFlags.filter((x) => x !== id) : [...s.resistanceFlags, id],
  };
}

export function setNote(s: FlowState, note: string): FlowState {
  return { ...s, note };
}

/** Shape the store's addCheckIn expects — empty optionals omitted. */
export function toCheckInInput(s: FlowState): {
  emotions: EmotionSelection[];
  bodySensations?: string[];
  resistanceFlags: ResistanceTellId[];
  maskingUsed?: string[];
  note?: string;
  source: 'manual' | 'name-it';
} {
  const trimmedNote = s.note.trim();
  // canProceed gates the feel step on every temperature being set, so nulls
  // cannot reach here; the flatMap narrows the type (and would drop, not
  // invent, a value if that invariant ever broke).
  const emotions: EmotionSelection[] = s.selections.flatMap((sel) =>
    sel.intensity === null ? [] : [{ emotionId: sel.emotionId, family: sel.family, intensity: sel.intensity }]
  );
  return {
    emotions,
    resistanceFlags: s.resistanceFlags,
    source: s.source,
    ...(s.bodySensations.length > 0 ? { bodySensations: s.bodySensations } : {}),
    ...(s.masking.length > 0 ? { maskingUsed: s.masking } : {}),
    ...(trimmedNote.length > 0 ? { note: trimmedNote } : {}),
  };
}
