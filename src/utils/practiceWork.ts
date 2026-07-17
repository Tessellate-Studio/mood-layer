// Pure state helpers for a perspective practice's saved work — no React, no
// store. A PracticeWork holds everything typed into one practice's flow, keyed
// by step id, so PracticeFlowScreen stays a dumb renderer and the alignment
// rules (reflections stay glued to the point they reflect, even when a point
// is removed) are unit-tested exactly.

import type { Practice } from '@/content/practices';

export interface PracticeWork {
  /** step id → texts. 'write' uses [0]; 'list' one per point; 'reflect' is
   *  index-ALIGNED to its source list (reflection i belongs to point i). */
  entries: Record<string, string[]>;
  /** mark step id → point keys ("sourceStepId:index") currently marked. */
  marks: Record<string, string[]>;
  /** pick step id → the one chosen point key, if any. */
  picks: Record<string, string>;
}

export function emptyWork(): PracticeWork {
  return { entries: {}, marks: {}, picks: {} };
}

/** Texts for a step ([] when untouched). */
export function entriesFor(work: PracticeWork, stepId: string): string[] {
  return work.entries[stepId] ?? [];
}

/** The stable key mark/pick steps use to reference one noted point. */
export function itemKey(stepId: string, index: number): string {
  return `${stepId}:${index}`;
}

/** Non-empty points of a step, keeping their original index (reflect/mark/
 *  pick steps show these — blanks are skipped but alignment survives). */
export function notedItems(
  work: PracticeWork,
  stepId: string
): { index: number; text: string }[] {
  return entriesFor(work, stepId)
    .map((text, index) => ({ index, text: text.trim() }))
    .filter((item) => item.text.length > 0);
}

/** Write text at an index, padding any gap with '' so alignment holds. */
export function setEntry(
  work: PracticeWork,
  stepId: string,
  index: number,
  text: string
): PracticeWork {
  const current = entriesFor(work, stepId).slice();
  while (current.length <= index) current.push('');
  current[index] = text;
  return { ...work, entries: { ...work.entries, [stepId]: current } };
}

/** Append an empty point to a list step (the screen's "+ add" row). */
export function addEntry(work: PracticeWork, stepId: string): PracticeWork {
  const current = entriesFor(work, stepId);
  return { ...work, entries: { ...work.entries, [stepId]: [...current, ''] } };
}

/**
 * Remove one point from a list step AND cascade so nothing dangles:
 * reflections aligned to it are spliced at the same index, marks on it are
 * dropped (later indexes shift down), and a pick of it is cleared.
 */
export function removeListItem(
  practice: Practice,
  work: PracticeWork,
  listStepId: string,
  index: number
): PracticeWork {
  const spliced = (texts: string[] | undefined): string[] | undefined => {
    if (!texts || index >= texts.length) return texts;
    return [...texts.slice(0, index), ...texts.slice(index + 1)];
  };
  const reindexKey = (key: string): string | null => {
    const sep = key.lastIndexOf(':');
    const stepId = key.slice(0, sep);
    const i = Number(key.slice(sep + 1));
    if (stepId !== listStepId) return key;
    if (i === index) return null; // the removed point itself
    return i > index ? itemKey(stepId, i - 1) : key;
  };

  const entries = { ...work.entries };
  entries[listStepId] = spliced(entries[listStepId]) ?? [];
  for (const step of practice.steps) {
    if (step.kind === 'reflect' && step.sourceStepId === listStepId) {
      const next = spliced(entries[step.id]);
      if (next) entries[step.id] = next;
    }
  }

  const marks: PracticeWork['marks'] = {};
  for (const [stepId, keys] of Object.entries(work.marks)) {
    marks[stepId] = keys.map(reindexKey).filter((k): k is string => k !== null);
  }

  const picks: PracticeWork['picks'] = {};
  for (const [stepId, key] of Object.entries(work.picks)) {
    const next = reindexKey(key);
    if (next !== null) picks[stepId] = next;
  }

  return { entries, marks, picks };
}

/** Toggle a point's mark on a mark step. */
export function toggleMark(work: PracticeWork, markStepId: string, key: string): PracticeWork {
  const current = work.marks[markStepId] ?? [];
  const next = current.includes(key)
    ? current.filter((k) => k !== key)
    : [...current, key];
  return { ...work, marks: { ...work.marks, [markStepId]: next } };
}

/** Choose a point on a pick step; choosing it again lets it go. */
export function setPick(work: PracticeWork, pickStepId: string, key: string): PracticeWork {
  const picks = { ...work.picks };
  if (picks[pickStepId] === key) {
    delete picks[pickStepId];
  } else {
    picks[pickStepId] = key;
  }
  return { ...work, picks };
}
