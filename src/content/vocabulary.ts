// Extended feelings vocabulary for the field guide's word finder — adapted
// from a common feelings-vocabulary wheel (Plutchik-derived, user-supplied
// 2026-07-13). The wheel's eight columns map onto the app's nine families:
// JOY → enjoyment, and ANTICIPATION and TRUST are families of their own
// (user-chosen 2026-07-13); the wheel's fearful-anticipation words (jittery,
// nervous…) stay with fear, and contempt-flavoured disgust words live with
// contempt. 'Anxious' is deliberately absent everywhere — anxiety is
// resisted fear (see content/underneath.ts), not a flavour of fear.
//
// These words are education-only for now: the check-in keeps its short
// curated gradients so naming stays easy. Word ids are unique across
// gradients AND this list, so any word could become check-in-selectable
// later without a data migration.

import type { EmotionFamilyId, Intensity } from '@/types/models';
import {
  EMOTION_FAMILIES,
  findEmotionWord,
  type EmotionFamily,
  type EmotionWord,
} from '@/content/emotions';

/** Plain-words phrase for each intensity level (models.ts: 1 light → 4 hard). */
export const INTENSITY_PHRASES: Record<Intensity, string> = {
  1: 'a light touch',
  2: 'clearly present',
  3: 'strong',
  4: 'pressed hard',
};

/** Wheel words beyond each family's check-in gradient, mild → intense. */
export const EXTENDED_VOCABULARY: Record<EmotionFamilyId, EmotionWord[]> = {
  anger: [
    { id: 'peeved', label: 'Peeved', intensityHint: 1 },
    { id: 'miffed', label: 'Miffed', intensityHint: 1 },
    { id: 'critical', label: 'Critical', intensityHint: 2 },
    { id: 'hot-tempered', label: 'Hot-tempered', intensityHint: 3 },
    { id: 'fuming', label: 'Fuming', intensityHint: 3 },
    { id: 'outraged', label: 'Outraged', intensityHint: 3 },
    { id: 'vindictive', label: 'Vindictive', intensityHint: 3 },
    { id: 'boiling', label: 'Boiling', intensityHint: 4 },
    { id: 'livid', label: 'Livid', intensityHint: 4 },
    { id: 'infuriated', label: 'Infuriated', intensityHint: 4 },
    { id: 'explosive', label: 'Explosive', intensityHint: 4 },
  ],
  fear: [
    { id: 'insecure', label: 'Insecure', intensityHint: 1 },
    { id: 'timid', label: 'Timid', intensityHint: 1 },
    { id: 'hesitant', label: 'Hesitant', intensityHint: 1 },
    { id: 'unsettled', label: 'Unsettled', intensityHint: 2 },
    { id: 'uncertain', label: 'Uncertain', intensityHint: 2 },
    { id: 'troubled', label: 'Troubled', intensityHint: 2 },
    { id: 'lost', label: 'Lost', intensityHint: 2 },
    { id: 'jittery', label: 'Jittery', intensityHint: 2 },
    { id: 'frightened', label: 'Frightened', intensityHint: 3 },
    { id: 'horrified', label: 'Horrified', intensityHint: 4 },
    { id: 'terrified', label: 'Terrified', intensityHint: 4 },
    { id: 'petrified', label: 'Petrified', intensityHint: 4 },
  ],
  sadness: [
    { id: 'lonely', label: 'Lonely', intensityHint: 2 },
    { id: 'gloomy', label: 'Gloomy', intensityHint: 2 },
    { id: 'withdrawn', label: 'Withdrawn', intensityHint: 2 },
    { id: 'discouraged', label: 'Discouraged', intensityHint: 2 },
    { id: 'defeated', label: 'Defeated', intensityHint: 3 },
    { id: 'miserable', label: 'Miserable', intensityHint: 3 },
    { id: 'anguished', label: 'Anguished', intensityHint: 4 },
    { id: 'heartbroken', label: 'Heartbroken', intensityHint: 4 },
    { id: 'devastated', label: 'Devastated', intensityHint: 4 },
    { id: 'distraught', label: 'Distraught', intensityHint: 4 },
    { id: 'bereft', label: 'Bereft', intensityHint: 4 },
  ],
  disgust: [
    { id: 'offended', label: 'Offended', intensityHint: 2 },
    { id: 'queasy', label: 'Queasy', intensityHint: 2 },
    { id: 'revolted', label: 'Revolted', intensityHint: 3 },
    { id: 'loathing', label: 'Loathing', intensityHint: 4 },
  ],
  enjoyment: [
    { id: 'serene', label: 'Serene', intensityHint: 1 },
    { id: 'peaceful', label: 'Peaceful', intensityHint: 1 },
    { id: 'relieved', label: 'Relieved', intensityHint: 2 },
    { id: 'pleased', label: 'Pleased', intensityHint: 2 },
    { id: 'cheerful', label: 'Cheerful', intensityHint: 2 },
    { id: 'playful', label: 'Playful', intensityHint: 2 },
    { id: 'happy', label: 'Happy', intensityHint: 3 },
    { id: 'thrilled', label: 'Thrilled', intensityHint: 4 },
    { id: 'ecstatic', label: 'Ecstatic', intensityHint: 4 },
    { id: 'overjoyed', label: 'Overjoyed', intensityHint: 4 },
    { id: 'exuberant', label: 'Exuberant', intensityHint: 4 },
  ],
  surprise: [
    { id: 'bemused', label: 'Bemused', intensityHint: 1 },
    { id: 'taken-aback', label: 'Taken aback', intensityHint: 2 },
    { id: 'perplexed', label: 'Perplexed', intensityHint: 2 },
    { id: 'baffled', label: 'Baffled', intensityHint: 2 },
    { id: 'bewildered', label: 'Bewildered', intensityHint: 3 },
    { id: 'shocked', label: 'Shocked', intensityHint: 3 },
    { id: 'astounded', label: 'Astounded', intensityHint: 3 },
    { id: 'stunned', label: 'Stunned', intensityHint: 4 },
    { id: 'flabbergasted', label: 'Flabbergasted', intensityHint: 4 },
    { id: 'speechless', label: 'Speechless', intensityHint: 4 },
  ],
  // The wheel folds contempt into disgust; the app keeps it as its own family
  // (Ekman's later work) and its gradient already covers the wheel's words
  // (contempt, disdain → Disdainful/Scornful), so nothing new lands here.
  contempt: [],
  anticipation: [
    { id: 'vigilant', label: 'Vigilant', intensityHint: 2 },
    { id: 'hopeful', label: 'Hopeful', intensityHint: 2 },
  ],
  trust: [
    { id: 'reassured', label: 'Reassured', intensityHint: 1 },
    { id: 'confident', label: 'Confident', intensityHint: 2 },
    { id: 'assured', label: 'Assured', intensityHint: 2 },
    { id: 'loyal', label: 'Loyal', intensityHint: 3 },
    { id: 'admiring', label: 'Admiring', intensityHint: 3 },
  ],
};

// Both lookups below are precomputed once at module load — the inputs are
// frozen content, and the field-guide screen re-renders on every chip tap,
// so per-render merging/scanning would be pure waste.

const WORDS_BY_FAMILY = Object.fromEntries(
  Object.values(EMOTION_FAMILIES).map((family) => [
    family.id,
    [...family.gradient, ...EXTENDED_VOCABULARY[family.id]].sort(
      (a, b) => a.intensityHint - b.intensityHint
    ),
  ])
) as Record<EmotionFamilyId, EmotionWord[]>;

const WORD_INDEX = new Map<string, { word: EmotionWord; family: EmotionFamily }>();
for (const family of Object.values(EMOTION_FAMILIES)) {
  for (const word of WORDS_BY_FAMILY[family.id]) {
    WORD_INDEX.set(word.id, { word, family });
  }
}

/** Gradient + extended words for a family, sorted mild → intense. */
export function allWordsForFamily(family: EmotionFamilyId): EmotionWord[] {
  return WORDS_BY_FAMILY[family];
}

/** Like findEmotionWord, but also resolves the extended vocabulary. */
export function findVocabularyWord(
  wordId: string
): { word: EmotionWord; family: EmotionFamily } | undefined {
  return WORD_INDEX.get(wordId);
}
