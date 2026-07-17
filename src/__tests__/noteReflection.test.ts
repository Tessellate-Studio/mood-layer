// The note step's carried-forward reflection — pure copy generator: weaves
// the earlier steps' selections into one line ending in the KCG question.

import { noteReflection } from '@/content/noteReflection';

describe('noteReflection', () => {
  it('weaves feelings, body, and resistance into one line + open question', () => {
    const line = noteReflection({
      selections: [
        { emotionId: 'worried', family: 'fear', intensity: 3 },
        { emotionId: 'hurt', family: 'sadness', intensity: 2 },
      ],
      bodySensations: ['lump in throat'],
      resistanceFlags: ['looping-thoughts'],
    });
    expect(line).toBe(
      'You named worried and hurt, felt it as lump in throat and noticed ' +
        'thoughts on a loop. Underneath it all — what do you truly want?'
    );
  });

  it('extended-vocabulary words resolve too', () => {
    const line = noteReflection({
      selections: [{ emotionId: 'heartbroken', family: 'sadness', intensity: 4 }],
      bodySensations: [],
      resistanceFlags: [],
    });
    expect(line).toBe('You named heartbroken. Underneath it all — what do you truly want?');
  });

  it('caps body and resistance clauses at two items each', () => {
    const line = noteReflection({
      selections: [{ emotionId: 'sad', family: 'sadness', intensity: 2 }],
      bodySensations: ['tight chest', 'heavy legs', 'cold hands'],
      resistanceFlags: ['looping-thoughts', 'harsh-judgment', 'comparison'],
    });
    expect(line).not.toContain('cold hands');
    expect(line).not.toContain('comparing');
    expect(line).toContain('tight chest and heavy legs');
    expect(line).toContain('thoughts on a loop and a harsh judge in the room');
  });

  it('falls back to just the question with nothing named', () => {
    expect(
      noteReflection({ selections: [], bodySensations: [], resistanceFlags: [] })
    ).toBe('Underneath it all — what do you truly want?');
  });
});
