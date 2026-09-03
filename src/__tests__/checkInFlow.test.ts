import {
  canFinishEarly,
  canProceed,
  finishEarly,
  initialFlowState,
  nextStep,
  prevStep,
  setIntensity,
  feelStepHint,
  FEEL_NOTE_TIP_ID,
  setNote,
  toCheckInInput,
  toggleBody,
  toggleEmotion,
  toggleMasking,
  toggleResistance,
} from '@/utils/checkInFlow';
import { FEEL_NOTE_LOG_LIMIT } from '@/content/checkInCopy';

describe('checkInFlow reducer', () => {
  it('starts empty on the feel step', () => {
    const s = initialFlowState('manual');
    expect(s.step).toBe('feel');
    expect(s.selections).toEqual([]);
    expect(canProceed(s)).toBe(false);
  });

  it('walks steps forward and back, clamped at the ends', () => {
    let s = initialFlowState('manual');
    // No intensity step — temperature is set on the word in the feel step.
    const order = ['feel', 'body', 'resistance', 'note', 'stitch'];
    for (let i = 1; i < order.length; i++) {
      s = nextStep(s);
      expect(s.step).toBe(order[i]);
    }
    // Clamped at stitch.
    expect(nextStep(s).step).toBe('stitch');
    s = prevStep(s);
    expect(s.step).toBe('note');
    // Clamped at feel.
    let f = initialFlowState('manual');
    expect(prevStep(f).step).toBe('feel');
  });

  it('needs a named emotion to proceed — a masking state alone is a doorway', () => {
    let s = initialFlowState('manual');
    expect(canProceed(s)).toBe(false);
    s = setIntensity(toggleEmotion(s, 'sad', 'sadness'), 'sad', 2);
    expect(canProceed(s)).toBe(true);
    s = toggleEmotion(s, 'sad', 'sadness'); // toggle off
    expect(s.selections).toHaveLength(0);
    expect(canProceed(s)).toBe(false);
    // Masking alone does NOT unlock Continue — it opens the "look underneath"
    // panel so the user names the feeling beneath the surface word.
    s = toggleMasking(s, 'fine');
    expect(canProceed(s)).toBe(false);
    s = setIntensity(toggleEmotion(s, 'sad', 'sadness'), 'sad', 2);
    expect(canProceed(s)).toBe(true);
  });

  it('has NO selection cap — we always feel multiple feelings at a time', () => {
    // The old max-5 had no basis in the literature (Practicing EQ p.15);
    // removed at the user's direction 2026-07-17.
    let s = initialFlowState('manual');
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    for (const id of ids) s = toggleEmotion(s, id, 'fear');
    expect(s.selections).toHaveLength(ids.length);
  });

  it('a named word starts UNWEIGHED and blocks Continue until its dial is set', () => {
    let s = initialFlowState('manual');
    s = toggleEmotion(s, 'sad', 'sadness');
    // No default temperature — weighing is deliberate (user, 2026-07-17).
    expect(s.selections[0].intensity).toBeNull();
    expect(canProceed(s)).toBe(false);
    s = setIntensity(s, 'sad', 4);
    expect(s.selections[0].intensity).toBe(4);
    expect(canProceed(s)).toBe(true);
  });

  it('shows at most one feel-step hint, priority-ordered', () => {
    let s = initialFlowState('manual');
    // Empty feel step: nothing to say yet.
    expect(feelStepHint(s)).toBeNull();
    // A masking cover alone: point underneath.
    s = toggleMasking(s, 'fine');
    expect(feelStepHint(s)).toBe('masking');
    // Named but unweighed: the temperature hint owns the moment.
    s = toggleEmotion(s, 'sad', 'sadness');
    expect(feelStepHint(s)).toBe('temperature');
    // One weighed word while a masking panel is open: the panel's own hint
    // already says one is enough — no contradictory invitation.
    s = setIntensity(s, 'sad', 2);
    expect(feelStepHint(s)).toBeNull();
    // Panel closed, exactly one weighed word: the invitation appears.
    s = toggleMasking(s, 'fine');
    expect(feelStepHint(s)).toBe('invite');
    // A second word retires the invitation — and does NOT re-raise the
    // temperature lesson, which one word already taught (user, 2026-09-03).
    s = toggleEmotion(s, 'worried', 'fear');
    expect(feelStepHint(s)).toBeNull();
    s = setIntensity(s, 'worried', 2);
    expect(feelStepHint(s)).toBeNull();
    // And nothing fires off the feel step.
    expect(feelStepHint(nextStep(s))).toBeNull();
  });

  it('raises the explore note when a family unfolds, for the first few logs only', () => {
    const s = initialFlowState('manual');
    // Nothing unfolded: nothing to teach yet.
    expect(feelStepHint(s, { familyOpen: false, checkInCount: 0 })).toBeNull();
    // A family unfolds before any word is chosen: hold-to-learn + more words.
    expect(feelStepHint(s, { familyOpen: true, checkInCount: 0 })).toBe('explore');
    expect(feelStepHint(s, { familyOpen: true, checkInCount: FEEL_NOTE_LOG_LIMIT - 1 })).toBe('explore');
    // Once the lesson has had its chances, the slot stays quiet.
    expect(feelStepHint(s, { familyOpen: true, checkInCount: FEEL_NOTE_LOG_LIMIT })).toBeNull();
    // A masking cover still outranks it — that one explains a grey Continue.
    const covered = toggleMasking(s, 'fine');
    expect(feelStepHint(covered, { familyOpen: true, checkInCount: 0 })).toBe('masking');
  });

  it('retires the temperature note after the log limit, but never the masking gate', () => {
    let s = toggleEmotion(initialFlowState('manual'), 'sad', 'sadness');
    expect(feelStepHint(s, { familyOpen: true, checkInCount: 0 })).toBe('temperature');
    // The note has landed by now (user, 2026-09-02: "show it for 3 logs").
    expect(feelStepHint(s, { familyOpen: true, checkInCount: FEEL_NOTE_LOG_LIMIT })).toBeNull();
    // The invitation is not a lesson — it still appears once the word is weighed.
    s = setIntensity(s, 'sad', 2);
    expect(feelStepHint(s, { familyOpen: true, checkInCount: 99 })).toBe('invite');
    // Masking is a gate: it explains a grey Continue no matter how many logs.
    const covered = toggleMasking(initialFlowState('manual'), 'fine');
    expect(feelStepHint(covered, { familyOpen: false, checkInCount: 99 })).toBe('masking');
  });

  it('asks for a temperature ONCE per check-in, however many words are named', () => {
    // It used to fire for every newly named word: "shows up for each emotion
    // selected… which is too much" (user, 2026-09-03). One weighing teaches
    // the gesture; Continue stays grey either way.
    let s = toggleEmotion(initialFlowState('manual'), 'sad', 'sadness');
    expect(feelStepHint(s)).toBe('temperature');
    s = setIntensity(s, 'sad', 2);
    // Two more unweighed words, added after the lesson landed: silence.
    s = toggleEmotion(s, 'worried', 'fear');
    s = toggleEmotion(s, 'glad', 'enjoyment');
    expect(feelStepHint(s)).toBeNull();
    // Still gated, though — the note is a courtesy, not the rule.
    expect(canProceed(s)).toBe(false);
  });

  it('leaves the slot EMPTY for a note the user sent away, never a substitute', () => {
    // The ✕ on a note silences that note; the next candidate must not slide
    // into the gap, or dismissing would just swap one card for another.
    const s = toggleEmotion(initialFlowState('manual'), 'sad', 'sadness');
    expect(feelStepHint(s, { familyOpen: true, checkInCount: 0, silenced: ['temperature'] })).toBeNull();
    const weighed = setIntensity(s, 'sad', 2);
    expect(feelStepHint(weighed, { familyOpen: true, checkInCount: 0, silenced: ['temperature'] })).toBe('invite');
    expect(feelStepHint(weighed, { familyOpen: true, checkInCount: 0, silenced: ['invite'] })).toBeNull();
    // And the teaching notes each have a persisted id to be silenced under.
    expect(FEEL_NOTE_TIP_ID.temperature).toBeTruthy();
    expect(FEEL_NOTE_TIP_ID.explore).toBeTruthy();
    expect(FEEL_NOTE_TIP_ID.masking).toBeUndefined();
    expect(FEEL_NOTE_TIP_ID.invite).toBeUndefined();
  });

  it('only allows finish-early for name-it flows mid-stream', () => {
    let manual = initialFlowState('manual');
    manual = nextStep(manual); // body
    expect(canFinishEarly(manual)).toBe(false);
    expect(finishEarly(manual).step).toBe('body');

    let nameIt = initialFlowState('name-it');
    expect(canFinishEarly(nameIt)).toBe(false); // feel step
    nameIt = nextStep(nameIt); // body
    expect(canFinishEarly(nameIt)).toBe(true);
    expect(finishEarly(nameIt).step).toBe('stitch');
  });

  it('produces a check-in input, omitting empty optionals', () => {
    let s = initialFlowState('manual');
    s = toggleEmotion(s, 'sad', 'sadness');
    s = setIntensity(s, 'sad', 3);
    const bare = toCheckInInput(s);
    expect(bare).toEqual({
      emotions: [{ emotionId: 'sad', family: 'sadness', intensity: 3 }],
      resistanceFlags: [],
      source: 'manual',
    });
    expect('note' in bare).toBe(false);
    expect('bodySensations' in bare).toBe(false);
    expect('maskingUsed' in bare).toBe(false);
  });

  it('includes filled optionals', () => {
    let s = initialFlowState('name-it');
    s = setIntensity(toggleEmotion(s, 'afraid', 'fear'), 'afraid', 2);
    s = toggleMasking(s, 'stressed');
    s = toggleBody(s, 'tight chest');
    s = toggleResistance(s, 'looping-thoughts');
    s = setNote(s, '  a note  ');
    const input = toCheckInInput(s);
    expect(input.bodySensations).toEqual(['tight chest']);
    expect(input.maskingUsed).toEqual(['stressed']);
    expect(input.resistanceFlags).toEqual(['looping-thoughts']);
    expect(input.note).toBe('a note');
    expect(input.source).toBe('name-it');
  });

  it('drops a whitespace-only note', () => {
    let s = initialFlowState('manual');
    s = toggleEmotion(s, 'sad', 'sadness');
    s = setNote(s, '   ');
    expect('note' in toCheckInInput(s)).toBe(false);
  });
});
