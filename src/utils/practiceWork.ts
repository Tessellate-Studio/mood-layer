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
  /** pick step id → chosen point keys. Multi-select (user, 2026-07-17):
   *  more than one option can still matter in five years. */
  picks: Record<string, string[]>;
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
  for (const [stepId, keys] of Object.entries(work.picks)) {
    picks[stepId] = keys.map(reindexKey).filter((k): k is string => k !== null);
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

/** Toggle a point on a pick step — several can be chosen; tapping again
 *  lets one go. */
export function togglePick(work: PracticeWork, pickStepId: string, key: string): PracticeWork {
  const current = work.picks[pickStepId] ?? [];
  const next = current.includes(key)
    ? current.filter((k) => k !== key)
    : [...current, key];
  return { ...work, picks: { ...work.picks, [pickStepId]: next } };
}

/** Resolve an item key ("stepId:index") back to its text, if any. */
function keyText(work: PracticeWork, key: string): string | undefined {
  const sep = key.lastIndexOf(':');
  const text = entriesFor(work, key.slice(0, sep))[Number(key.slice(sep + 1))]?.trim();
  return text && text.length > 0 ? text : undefined;
}

/**
 * A glance at what the sitting STARTED from and what it ARRIVED at — the
 * problem and the outcome, joined by " → ". When both are present the
 * collapsed subtitle reads as a journey; when only one exists it still
 * works as a standalone.
 */
export function sessionConclusion(practice: Practice, work: PracticeWork): string | null {
  const lines = sessionLines(practice, work);
  if (lines.length === 0) return null;

  const opening = lines[0].body.split('\n')[0].trim() || null;

  const closingIds = practice.steps
    .filter((s) => s.kind === 'pick' || (s.kind === 'write' && s !== practice.steps[0]))
    .map((s) => s.title);
  const closing = [...lines].reverse().find((l) => closingIds.includes(l.title));
  const chosen = closing ?? (lines.length > 1 ? lines[lines.length - 1] : null);
  const outcome = chosen?.body.split('\n')[0].trim() || null;

  if (opening && outcome && opening !== outcome) return `${opening} → ${outcome}`;
  return opening ?? outcome;
}

/**
 * A finished sitting, readable: one {title, body} line per step that holds
 * anything — used by the "Past reflections" list to show an archived
 * practice session without replaying the whole flow.
 */
export function sessionLines(
  practice: Practice,
  work: PracticeWork
): { title: string; body: string }[] {
  const lines: { title: string; body: string }[] = [];
  for (const step of practice.steps) {
    switch (step.kind) {
      case 'write': {
        const text = entriesFor(work, step.id)[0]?.trim();
        if (text) lines.push({ title: step.title, body: text });
        break;
      }
      case 'list': {
        const items = notedItems(work, step.id).map((i) => i.text);
        if (items.length > 0) lines.push({ title: step.title, body: items.join(' · ') });
        break;
      }
      case 'reflect': {
        const source = entriesFor(work, step.sourceStepId);
        const pairs = notedItems(work, step.id).map((r) => {
          const point = source[r.index]?.trim();
          return point ? `${point} → ${r.text}` : r.text;
        });
        if (pairs.length > 0) lines.push({ title: step.title, body: pairs.join('\n') });
        break;
      }
      case 'mark': {
        const marked = (work.marks[step.id] ?? [])
          .map((key) => keyText(work, key))
          .filter((t): t is string => t !== undefined);
        if (marked.length > 0) lines.push({ title: step.title, body: marked.join(' · ') });
        break;
      }
      case 'pick': {
        const texts = (work.picks[step.id] ?? [])
          .map((key) => keyText(work, key))
          .filter((t): t is string => t !== undefined);
        if (texts.length > 0) lines.push({ title: step.title, body: texts.join(' · ') });
        break;
      }
    }
  }
  return lines;
}
