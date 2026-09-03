// Pure state machine for the multi-step check-in. No React — the screen holds
// one FlowState and calls these transitions, so the whole flow is unit-tested
// without rendering. One question per screen keeps the UI calm (CLAUDE.md
// tone), and 'name-it' check-ins (from a reminder) may finish early once
// something is named.

import { FEEL_NOTE_LOG_LIMIT } from '@/content/checkInCopy';
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

export type FeelHint = 'masking' | 'temperature' | 'invite' | 'explore';

/**
 * The two hints that TEACH rather than gate, and the persisted id each one
 * retires under. Only these carry a permanent dismissal: the ✕ on a teaching
 * note means "I have this" and it never comes back (user, 2026-09-03), while
 * the ✕ on a gate note only clears it for the check-in in hand. Settings →
 * "Show the helper notes again" clears these ids like any other tip.
 */
export const FEEL_NOTE_TIP_ID: Partial<Record<FeelHint, string>> = {
  explore: 'note-checkin-explore',
  temperature: 'note-checkin-temperature',
};

/** What the feel step knows beyond its own state: whether a family is
 *  unfolded (screen UI state, not flow state), how many check-ins exist, and
 *  which notes the user has already sent away. */
export interface FeelHintContext {
  familyOpen: boolean;
  checkInCount: number;
  /** Notes the user dismissed — for this check-in, or for good. */
  silenced?: readonly FeelHint[];
}

const NO_CONTEXT: FeelHintContext = { familyOpen: false, checkInCount: 0 };

/**
 * The one gentle hint allowed above the footer on the feel step —
 * priority-ordered here so hints can never stack. 'invite' asks for company
 * after the first word is named AND weighed (we rarely feel just one thing —
 * the no-cap note above) and retires the moment a second word arrives:
 * invitation, not nag. It also stays quiet while a masking panel is open,
 * whose own hint says one is enough.
 *
 * Two of these are TEACHING notes and retire once the lesson has had its
 * chances: 'explore' (a family just unfolded — words can be held, "+ more
 * words" opens the rest) and 'temperature' (weigh the word to continue) show
 * only while fewer than FEEL_NOTE_LOG_LIMIT check-ins exist (user,
 * 2026-09-02). 'masking' is a gate, not a lesson — it always explains why
 * Continue is grey.
 */
export function feelStepHint(s: FlowState, ctx: FeelHintContext = NO_CONTEXT): FeelHint | null {
  const hint = candidateHint(s, ctx);
  // A note the user has sent away leaves the slot EMPTY rather than handing
  // it to the next candidate: one quiet slot, never a queue of substitutes.
  return hint && (ctx.silenced ?? []).includes(hint) ? null : hint;
}

function candidateHint(s: FlowState, ctx: FeelHintContext): FeelHint | null {
  if (s.step !== 'feel') return null;
  const teaching = ctx.checkInCount < FEEL_NOTE_LOG_LIMIT;
  if (s.selections.length === 0) {
    if (s.masking.length > 0) return 'masking';
    return teaching && ctx.familyOpen ? 'explore' : null;
  }
  if (s.selections.some((x) => x.intensity === null)) {
    // Once ONE word has been weighed the lesson has landed — a second, third,
    // fourth word must not ask again (user, 2026-09-03: "shows up for each
    // emotion selected… which is too much"). Continue stays grey either way,
    // and the dial the hint points at sits right under the word.
    const alreadyWeighed = s.selections.some((x) => x.intensity !== null);
    return teaching && !alreadyWeighed ? 'temperature' : null;
  }
  if (s.selections.length === 1 && s.masking.length === 0) return 'invite';
  return null;
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
