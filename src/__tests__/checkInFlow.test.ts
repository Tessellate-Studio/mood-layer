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
  toCheckInInput,
  toggleBody,
  toggleEmotion,
  toggleMasking,
  toggleResistance,
} from '@/utils/checkInFlow';

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
    // A second word retires it (unweighed → temperature owns the slot again).
    s = toggleEmotion(s, 'worried', 'fear');
    expect(feelStepHint(s)).toBe('temperature');
    s = setIntensity(s, 'worried', 2);
    expect(feelStepHint(s)).toBeNull();
    // And nothing fires off the feel step.
    expect(feelStepHint(nextStep(s))).toBeNull();
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
