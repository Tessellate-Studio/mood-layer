// Field-guide content shape: the "what's underneath" map (surface state →
// the resisted emotion it tends to carry) and the extended word-finder
// vocabulary (feelings-wheel words mapped into the app's seven Ekman
// families). Runs against the data itself, like content.shape.test.ts.

import type { EmotionFamilyId } from '@/types/models';
import { EMOTION_FAMILIES, MASKING_STATES } from '@/content/emotions';
import { UNDERNEATH_MAP } from '@/content/underneath';
import {
  allWordsForFamily,
  EXTENDED_VOCABULARY,
  findVocabularyWord,
  INTENSITY_PHRASES,
} from '@/content/vocabulary';

// Derived from the data so a new family can never silently skip these checks
// (the canonical family-set assertion lives in content.shape.test.ts).
const FAMILY_IDS = Object.keys(EMOTION_FAMILIES) as EmotionFamilyId[];

const gradientIds = FAMILY_IDS.flatMap((f) => EMOTION_FAMILIES[f].gradient.map((w) => w.id));
const extendedIds = FAMILY_IDS.flatMap((f) => EXTENDED_VOCABULARY[f].map((w) => w.id));
const maskingIds = MASKING_STATES.map((m) => m.id);

describe('the underneath map', () => {
  it('has at least ten surface states with unique ids', () => {
    expect(UNDERNEATH_MAP.length).toBeGreaterThanOrEqual(10);
    const ids = UNDERNEATH_MAP.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every state has a label, description, invitation, and valid families', () => {
    for (const state of UNDERNEATH_MAP) {
      expect(state.label.length).toBeGreaterThan(0);
      expect(state.description.length).toBeGreaterThan(0);
      expect(state.invitation.length).toBeGreaterThan(0);
      expect(state.underneath.length).toBeGreaterThan(0);
      for (const family of state.underneath) {
        expect(FAMILY_IDS).toContain(family);
      }
    }
  });

  it("keeps the app's founding mapping: anxious → fear", () => {
    const anxious = UNDERNEATH_MAP.find((s) => s.id === 'anxious');
    expect(anxious).toBeDefined();
    expect(anxious?.underneath).toContain('fear');
  });

  it('covers the Hudson trio plus foreboding joy', () => {
    // numb → sadness, stuck → anger, guarded/bracing → enjoyment.
    expect(UNDERNEATH_MAP.find((s) => s.id === 'numb')?.underneath).toContain('sadness');
    expect(UNDERNEATH_MAP.find((s) => s.id === 'stuck')?.underneath).toContain('anger');
    const guarded = UNDERNEATH_MAP.find((s) => s.underneath.includes('enjoyment'));
    expect(guarded).toBeDefined();
  });

  it('copy stays gentle: hedged, invitational, never a verdict', () => {
    for (const state of UNDERNEATH_MAP) {
      const copy = `${state.description} ${state.invitation}`;
      expect(copy).not.toContain('!');
      expect(copy.toLowerCase()).not.toContain('you should');
      expect(copy.toLowerCase()).not.toContain('you must');
      // Descriptions hedge ("often", "usually", "tends", "can") — the map
      // offers a place to look, never a diagnosis.
      expect(
        /often|usually|tends|can |sometimes|may /.test(state.description.toLowerCase())
      ).toBe(true);
      // Invitations end as questions, matching the helper-sheet voice.
      expect(state.invitation.trim().endsWith('?')).toBe(true);
    }
  });

  it.each(['numb', 'guilty'])("'%s' stays in sync with its masking-state twin", (id) => {
    // The same state is deliberately reachable from the check-in (masking
    // chip) and the field guide — their family mappings must not drift.
    const masking = MASKING_STATES.find((m) => m.id === id)!;
    const state = UNDERNEATH_MAP.find((s) => s.id === id)!;
    expect(state).toBeDefined();
    expect(state.underneath).toEqual(masking.unpacksTo);
  });

  it('masking ids never collide with emotion word ids', () => {
    // A masking id doubling as a word id would render duplicate chips on the
    // feel step and let one stored id mean two different things.
    for (const id of maskingIds) {
      expect(gradientIds).not.toContain(id);
      expect(extendedIds).not.toContain(id);
    }
  });

  it('state ids never collide with emotion word ids', () => {
    // Word ids are stored in check-ins, so a collision would corrupt lookups.
    // Masking overlap is allowed — 'numb' and 'guilty' are deliberately both
    // check-in covers and underneath entries (two doors into the same room).
    for (const state of UNDERNEATH_MAP) {
      expect(gradientIds).not.toContain(state.id);
      expect(extendedIds).not.toContain(state.id);
      if (state.id !== 'numb' && state.id !== 'guilty') {
        expect(maskingIds).not.toContain(state.id);
      }
    }
  });
});

describe('extended vocabulary (word finder)', () => {
  it('every family has an entry and the wheel adds at least 50 new words', () => {
    for (const family of FAMILY_IDS) {
      expect(EXTENDED_VOCABULARY[family]).toBeDefined();
    }
    expect(extendedIds.length).toBeGreaterThanOrEqual(50);
  });

  it('word ids are unique across gradient + extended vocabulary', () => {
    const all = [...gradientIds, ...extendedIds];
    expect(new Set(all).size).toBe(all.length);
  });

  it('every word has a non-empty label and a valid intensity hint', () => {
    for (const family of FAMILY_IDS) {
      for (const word of EXTENDED_VOCABULARY[family]) {
        expect(word.label.length).toBeGreaterThan(0);
        expect([1, 2, 3, 4]).toContain(word.intensityHint);
      }
    }
  });

  it("keeps 'anxious' out of every family (it lives in the underneath map)", () => {
    expect(extendedIds).not.toContain('anxious');
    expect(gradientIds).not.toContain('anxious');
  });

  it('files the guilt cluster under sadness (guilt = anger at self braided with sadness)', () => {
    for (const id of ['ashamed', 'regretful', 'remorseful', 'embarrassed']) {
      expect(findVocabularyWord(id)?.family.id).toBe('sadness');
    }
  });

  it('allWordsForFamily merges gradient + extended, sorted mild → intense', () => {
    for (const family of FAMILY_IDS) {
      const words = allWordsForFamily(family);
      expect(words.length).toBe(
        EMOTION_FAMILIES[family].gradient.length + EXTENDED_VOCABULARY[family].length
      );
      for (let i = 1; i < words.length; i += 1) {
        expect(words[i].intensityHint).toBeGreaterThanOrEqual(words[i - 1].intensityHint);
      }
    }
  });

  it('findVocabularyWord resolves extended AND gradient words to their family', () => {
    // A gradient word still resolves…
    expect(findVocabularyWord('irritated')?.family.id).toBe('anger');
    // …and at least one extended word per family resolves too.
    for (const family of FAMILY_IDS.filter((f) => EXTENDED_VOCABULARY[f].length > 0)) {
      const first = EXTENDED_VOCABULARY[family][0];
      const hit = findVocabularyWord(first.id);
      expect(hit?.word.id).toBe(first.id);
      expect(hit?.family.id).toBe(family);
    }
    expect(findVocabularyWord('not-a-word')).toBeUndefined();
  });

  it('has a phrase for each intensity level', () => {
    for (const level of [1, 2, 3, 4] as const) {
      expect(INTENSITY_PHRASES[level].length).toBeGreaterThan(0);
    }
  });
});
