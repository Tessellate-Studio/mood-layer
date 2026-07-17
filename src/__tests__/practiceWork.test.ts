// Pure practice-work helpers — the alignment contract for the perspective
// practice flows: reflections stay glued to the point they reflect, marks and
// picks survive (or clear) when points are removed.

import { findPractice, PRACTICE_FAMILY, PRACTICES } from '@/content/practices';
import {
  addEntry,
  emptyWork,
  entriesFor,
  itemKey,
  notedItems,
  removeListItem,
  sessionLines,
  setEntry,
  setPick,
  toggleMark,
} from '@/utils/practiceWork';

const flashback = findPractice('five-year-flashback')!;
const problem = findPractice('problem-solution')!;

describe('practice content shape', () => {
  it('step ids are unique within each practice', () => {
    for (const practice of PRACTICES) {
      const ids = practice.steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('reflect, mark, and pick steps reference an EARLIER list step', () => {
    for (const practice of PRACTICES) {
      practice.steps.forEach((step, i) => {
        const sources =
          step.kind === 'reflect' || step.kind === 'pick'
            ? [step.sourceStepId]
            : step.kind === 'mark'
              ? step.sourceStepIds
              : [];
        for (const sourceId of sources) {
          const sourceIndex = practice.steps.findIndex((s) => s.id === sourceId);
          expect(sourceIndex).toBeGreaterThanOrEqual(0);
          expect(sourceIndex).toBeLessThan(i);
          expect(practice.steps[sourceIndex].kind).toBe('list');
        }
      });
    }
  });

  it('every practice has a layer hue', () => {
    for (const practice of PRACTICES) {
      expect(PRACTICE_FAMILY[practice.id]).toBeTruthy();
    }
  });
});

describe('setEntry / addEntry / notedItems', () => {
  it('setEntry pads gaps so indexes stay aligned', () => {
    const work = setEntry(emptyWork(), 'options', 2, 'move cities');
    expect(entriesFor(work, 'options')).toEqual(['', '', 'move cities']);
  });

  it('addEntry appends an empty point', () => {
    const work = addEntry(setEntry(emptyWork(), 'options', 0, 'stay'), 'options');
    expect(entriesFor(work, 'options')).toEqual(['stay', '']);
  });

  it('notedItems skips blanks but keeps original indexes', () => {
    let work = setEntry(emptyWork(), 'options', 0, 'stay');
    work = setEntry(work, 'options', 1, '   ');
    work = setEntry(work, 'options', 2, 'go');
    expect(notedItems(work, 'options')).toEqual([
      { index: 0, text: 'stay' },
      { index: 2, text: 'go' },
    ]);
  });
});

describe('removeListItem cascade', () => {
  it('splices aligned reflections at the same index', () => {
    let work = emptyWork();
    work = setEntry(work, 'options', 0, 'stay');
    work = setEntry(work, 'options', 1, 'go');
    work = setEntry(work, 'changed', 0, 'staying looks small');
    work = setEntry(work, 'changed', 1, 'going looks brave');

    work = removeListItem(flashback, work, 'options', 0);
    expect(entriesFor(work, 'options')).toEqual(['go']);
    // The reflection for 'go' is still the one written for 'go'.
    expect(entriesFor(work, 'changed')).toEqual(['going looks brave']);
  });

  it('drops marks on the removed point and reindexes later ones', () => {
    let work = emptyWork();
    work = setEntry(work, 'ideas', 0, 'ask for help');
    work = setEntry(work, 'ideas', 1, 'a wizard fixes it');
    work = setEntry(work, 'ideas', 2, 'small daily step');
    work = toggleMark(work, 'fantastical', itemKey('ideas', 1));
    work = toggleMark(work, 'fantastical', itemKey('ideas', 2));

    work = removeListItem(problem, work, 'ideas', 1);
    // Mark on the removed point is gone; the mark on index 2 followed its
    // point down to index 1.
    expect(work.marks.fantastical).toEqual([itemKey('ideas', 1)]);
  });

  it('leaves marks on the OTHER source list untouched', () => {
    let work = emptyWork();
    work = setEntry(work, 'cannot', 0, 'no budget');
    work = setEntry(work, 'ideas', 0, 'ask for help');
    work = toggleMark(work, 'fantastical', itemKey('cannot', 0));

    work = removeListItem(problem, work, 'ideas', 0);
    expect(work.marks.fantastical).toEqual([itemKey('cannot', 0)]);
  });

  it('clears a pick of the removed point, reindexes a later pick', () => {
    let work = emptyWork();
    work = setEntry(work, 'ideas', 0, 'a');
    work = setEntry(work, 'ideas', 1, 'b');
    work = setPick(work, 'one-step', itemKey('ideas', 1));

    // Removing an earlier point shifts the pick down with its point.
    let shifted = removeListItem(problem, work, 'ideas', 0);
    expect(shifted.picks['one-step']).toBe(itemKey('ideas', 0));

    // Removing the picked point clears the pick.
    let cleared = removeListItem(problem, work, 'ideas', 1);
    expect(cleared.picks['one-step']).toBeUndefined();
  });
});

describe('sessionLines', () => {
  it('summarises a sitting: one line per touched step, keys resolved to text', () => {
    let work = emptyWork();
    work = setEntry(work, 'problem', 0, 'no time');
    work = setEntry(work, 'cannot', 0, 'days are full');
    work = setEntry(work, 'ideas', 0, 'ask for help');
    work = setEntry(work, 'ideas', 1, 'a wizard fixes it');
    work = toggleMark(work, 'fantastical', itemKey('ideas', 1));
    work = setPick(work, 'one-step', itemKey('ideas', 0));

    const lines = sessionLines(problem, work);
    expect(lines.map((l) => l.title)).toEqual([
      'The problem',
      'Why it cannot be solved',
      'Ways it could improve',
      'Notice the fantastical',
      'One idea to keep',
    ]);
    expect(lines.find((l) => l.title === 'Notice the fantastical')?.body).toBe(
      'a wizard fixes it'
    );
    expect(lines.find((l) => l.title === 'One idea to keep')?.body).toBe('ask for help');
  });

  it('pairs reflections with their source point', () => {
    let work = emptyWork();
    work = setEntry(work, 'options', 0, 'stay');
    work = setEntry(work, 'changed', 0, 'settled but far away');
    const lines = sessionLines(flashback, work);
    expect(lines.find((l) => l.title === 'How am I — and others — changed?')?.body).toBe(
      'stay → settled but far away'
    );
  });
});

describe('toggleMark / setPick', () => {
  it('toggleMark flips a key on and off', () => {
    const on = toggleMark(emptyWork(), 'fantastical', itemKey('ideas', 0));
    expect(on.marks.fantastical).toEqual([itemKey('ideas', 0)]);
    const off = toggleMark(on, 'fantastical', itemKey('ideas', 0));
    expect(off.marks.fantastical).toEqual([]);
  });

  it('setPick chooses one, re-choosing lets it go', () => {
    const picked = setPick(emptyWork(), 'one-step', itemKey('ideas', 2));
    expect(picked.picks['one-step']).toBe(itemKey('ideas', 2));
    const other = setPick(picked, 'one-step', itemKey('ideas', 0));
    expect(other.picks['one-step']).toBe(itemKey('ideas', 0));
    const released = setPick(other, 'one-step', itemKey('ideas', 0));
    expect(released.picks['one-step']).toBeUndefined();
  });
});
