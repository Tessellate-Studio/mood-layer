import {
  canFinishEarly,
  canProceed,
  finishEarly,
  initialFlowState,
  MAX_EMOTIONS,
  nextStep,
  prevStep,
  setIntensity,
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
    const order = ['feel', 'intensity', 'body', 'resistance', 'note', 'stitch'];
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

  it('lets you proceed from feel once an emotion or masking state is chosen', () => {
    let s = initialFlowState('manual');
    expect(canProceed(s)).toBe(false);
    s = toggleEmotion(s, 'sad', 'sadness');
    expect(canProceed(s)).toBe(true);
    s = toggleEmotion(s, 'sad', 'sadness'); // toggle off
    expect(s.selections).toHaveLength(0);
    expect(canProceed(s)).toBe(false);
    s = toggleMasking(s, 'fine');
    expect(canProceed(s)).toBe(true);
  });

  it('caps selections at MAX_EMOTIONS', () => {
    let s = initialFlowState('manual');
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (const id of ids) s = toggleEmotion(s, id, 'fear');
    expect(s.selections).toHaveLength(MAX_EMOTIONS);
    expect(s.selections.map((x) => x.emotionId)).not.toContain('f');
  });

  it('sets a default intensity that can be changed', () => {
    let s = initialFlowState('manual');
    s = toggleEmotion(s, 'sad', 'sadness');
    expect(s.selections[0].intensity).toBe(2);
    s = setIntensity(s, 'sad', 4);
    expect(s.selections[0].intensity).toBe(4);
  });

  it('only allows finish-early for name-it flows mid-stream', () => {
    let manual = initialFlowState('manual');
    manual = nextStep(nextStep(manual)); // body
    expect(canFinishEarly(manual)).toBe(false);
    expect(finishEarly(manual).step).toBe('body');

    let nameIt = initialFlowState('name-it');
    expect(canFinishEarly(nameIt)).toBe(false); // feel step
    nameIt = nextStep(nextStep(nameIt)); // body
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
    s = toggleEmotion(s, 'afraid', 'fear');
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
