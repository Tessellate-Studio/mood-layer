// Word-level content shape (P10). Runs against the data itself, like
// content.shape.test.ts and fieldGuideContent.test.ts. The completeness
// check here is what keeps wordDefinitions.ts honest against every word in
// the app — a new vocabulary word ships with a definition or this fails.

import type { EmotionFamilyId } from '@/types/models';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { allWordsForFamily } from '@/content/vocabulary';
import { findWordDefinition, WORD_DEFINITIONS } from '@/content/wordDefinitions';

const FAMILY_IDS = Object.keys(EMOTION_FAMILIES) as EmotionFamilyId[];
const ALL_WORD_IDS = FAMILY_IDS.flatMap((f) => allWordsForFamily(f).map((w) => w.id));

describe('word definitions', () => {
  it('has at least 100 words covered', () => {
    // Every word across every family's gradient + extended vocabulary,
    // as of 2026-09-03: 121.
    expect(ALL_WORD_IDS.length).toBeGreaterThanOrEqual(100);
  });

  it.each(ALL_WORD_IDS)('%s has a definition and all three actions', (wordId) => {
    const entry = WORD_DEFINITIONS[wordId];
    expect(entry).toBeDefined();
    expect(entry.definition.length).toBeGreaterThan(0);
    expect(entry.actions.constructive.length).toBeGreaterThan(0);
    expect(entry.actions.ambiguous.length).toBeGreaterThan(0);
    expect(entry.actions.destructive.length).toBeGreaterThan(0);
  });

  it('has no orphaned entries — every key resolves to a real word', () => {
    for (const wordId of Object.keys(WORD_DEFINITIONS)) {
      expect(ALL_WORD_IDS).toContain(wordId);
    }
  });

  it('findWordDefinition resolves a known word and returns undefined for an unknown one', () => {
    expect(findWordDefinition('wistful')).toBeDefined();
    expect(findWordDefinition('not-a-word')).toBeUndefined();
  });

  it('definitions are situational, never a bare strength label (the thing this replaced)', () => {
    // The flaw this content replaced: the SAME phrase reused across many
    // words regardless of which one it is. A definition may legitimately
    // share a few words with a couple of siblings, but not be identical to
    // more than one other entry in the whole set.
    const definitions = Object.values(WORD_DEFINITIONS).map((e) => e.definition);
    const counts = new Map<string, number>();
    for (const d of definitions) counts.set(d, (counts.get(d) ?? 0) + 1);
    for (const [text, count] of counts) {
      expect(count).toBeLessThanOrEqual(1);
      expect(text.length).toBeGreaterThan(10);
    }
  });

  it('actions are never identical across constructive/ambiguous/destructive for the same word', () => {
    // A word whose three actions are the same value would mean the bucket
    // is decorative, not meaningful.
    for (const [wordId, entry] of Object.entries(WORD_DEFINITIONS)) {
      const { constructive, ambiguous, destructive } = entry.actions;
      expect(new Set([constructive, ambiguous, destructive]).size).toBe(3);
      // Sanity label for a failing case — jest doesn't print wordId otherwise.
      if (constructive === ambiguous || ambiguous === destructive || constructive === destructive) {
        throw new Error(`${wordId} has a duplicate action`);
      }
    }
  });

  it('copy stays gentle: no exclamations, never "you should"/"you must"', () => {
    for (const entry of Object.values(WORD_DEFINITIONS)) {
      const strings = [entry.definition, entry.actions.constructive, entry.actions.ambiguous, entry.actions.destructive];
      for (const text of strings) {
        expect(text).not.toContain('!');
        expect(text.toLowerCase()).not.toContain('you should');
        expect(text.toLowerCase()).not.toContain('you must');
      }
    }
  });
});
