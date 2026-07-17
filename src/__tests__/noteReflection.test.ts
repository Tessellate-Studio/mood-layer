// The note step's carried-forward reflection — deliberately SHORT: only the
// resistance step's tells + the KCG open question (user, 2026-07-17: the
// everything-recap version was "too much").

import { noteReflection } from '@/content/noteReflection';

describe('noteReflection', () => {
  it('names the noticed tells and closes with the open question', () => {
    expect(noteReflection({ resistanceFlags: ['looping-thoughts'] })).toBe(
      'You noticed thoughts on a loop. Underneath it all — what do you truly want?'
    );
  });

  it('joins several tells plainly', () => {
    expect(
      noteReflection({ resistanceFlags: ['looping-thoughts', 'harsh-judgment', 'comparison'] })
    ).toBe(
      'You noticed thoughts on a loop, a harsh judge in the room and the ' +
        'comparing habit. Underneath it all — what do you truly want?'
    );
  });

  it('is just the question when nothing was flagged', () => {
    expect(noteReflection({ resistanceFlags: [] })).toBe(
      'Underneath it all — what do you truly want?'
    );
  });
});
