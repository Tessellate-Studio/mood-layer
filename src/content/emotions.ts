// Emotion taxonomy: Ekman's seven families plus Plutchik's anticipation and
// trust (user-added 2026-07-13), each with a mild-to-intense gradient of
// plain human words. Copy lives here as typed data (hard rule, CLAUDE.md) so
// tone changes happen in one reviewed place, never inline.

import type { EmotionFamilyId, Intensity } from '@/types/models';

export interface EmotionWord {
  id: string;
  label: string;
  /** Where this word sits on the family's mild→intense gradient. */
  intensityHint: Intensity;
}

export interface EmotionFamily {
  id: EmotionFamilyId;
  label: string;
  /** One line on what this family is about — messenger framing. */
  essence: string;
  /** Mild → intense. Word ids are unique across ALL families. */
  gradient: EmotionWord[];
}

// NOTE: 'anxious' is deliberately absent from fear's gradient — anxiety is
// what resisted fear becomes (see helpers.ts), not a flavour of fear itself.
export const EMOTION_FAMILIES: Record<EmotionFamilyId, EmotionFamily> = {
  anger: {
    id: 'anger',
    label: 'Anger',
    essence: 'Something you care about is being stepped on.',
    gradient: [
      { id: 'irritated', label: 'Irritated', intensityHint: 1 },
      { id: 'annoyed', label: 'Annoyed', intensityHint: 1 },
      { id: 'frustrated', label: 'Frustrated', intensityHint: 2 },
      { id: 'resentful', label: 'Resentful', intensityHint: 3 },
      { id: 'angry', label: 'Angry', intensityHint: 3 },
      { id: 'furious', label: 'Furious', intensityHint: 4 },
    ],
  },
  fear: {
    id: 'fear',
    label: 'Fear',
    essence: 'Something matters to you and its outcome is uncertain.',
    gradient: [
      { id: 'uneasy', label: 'Uneasy', intensityHint: 1 },
      { id: 'nervous', label: 'Nervous', intensityHint: 2 },
      { id: 'worried', label: 'Worried', intensityHint: 2 },
      { id: 'afraid', label: 'Afraid', intensityHint: 3 },
      { id: 'dreading', label: 'Dreading', intensityHint: 3 },
      { id: 'panicked', label: 'Panicked', intensityHint: 4 },
    ],
  },
  sadness: {
    id: 'sadness',
    label: 'Sadness',
    essence: 'Something you love is missing, lost, or out of reach.',
    gradient: [
      { id: 'wistful', label: 'Wistful', intensityHint: 1 },
      { id: 'down', label: 'Down', intensityHint: 2 },
      { id: 'disappointed', label: 'Disappointed', intensityHint: 2 },
      { id: 'hurt', label: 'Hurt', intensityHint: 3 },
      { id: 'sad', label: 'Sad', intensityHint: 3 },
      { id: 'grieving', label: 'Grieving', intensityHint: 4 },
    ],
  },
  disgust: {
    id: 'disgust',
    label: 'Disgust',
    essence: 'Something does not sit right with you, and your body knows it.',
    gradient: [
      { id: 'put-off', label: 'Put off', intensityHint: 1 },
      { id: 'squeamish', label: 'Squeamish', intensityHint: 2 },
      { id: 'averse', label: 'Averse', intensityHint: 3 },
      { id: 'repulsed', label: 'Repulsed', intensityHint: 4 },
    ],
  },
  enjoyment: {
    id: 'enjoyment',
    label: 'Enjoyment',
    essence: 'Something is nourishing you, right here, right now.',
    gradient: [
      { id: 'content', label: 'Content', intensityHint: 1 },
      { id: 'glad', label: 'Glad', intensityHint: 2 },
      { id: 'amused', label: 'Amused', intensityHint: 2 },
      { id: 'warm', label: 'Warm', intensityHint: 2 },
      { id: 'delighted', label: 'Delighted', intensityHint: 3 },
      { id: 'joyful', label: 'Joyful', intensityHint: 4 },
    ],
  },
  surprise: {
    id: 'surprise',
    label: 'Surprise',
    essence: 'Something new just landed, and you have not sorted it yet.',
    gradient: [
      { id: 'curious', label: 'Curious', intensityHint: 1 },
      { id: 'intrigued', label: 'Intrigued', intensityHint: 2 },
      { id: 'startled', label: 'Startled', intensityHint: 3 },
      { id: 'amazed', label: 'Amazed', intensityHint: 4 },
    ],
  },
  contempt: {
    id: 'contempt',
    label: 'Contempt',
    essence: 'You have placed yourself above someone — often to protect something tender.',
    gradient: [
      { id: 'dismissive', label: 'Dismissive', intensityHint: 1 },
      { id: 'judgy', label: 'Judgy', intensityHint: 2 },
      { id: 'disdainful', label: 'Disdainful', intensityHint: 3 },
      { id: 'scornful', label: 'Scornful', intensityHint: 4 },
    ],
  },
  anticipation: {
    id: 'anticipation',
    label: 'Anticipation',
    essence: 'Something is on its way, and you are leaning toward it.',
    gradient: [
      { id: 'interested', label: 'Interested', intensityHint: 1 },
      { id: 'expectant', label: 'Expectant', intensityHint: 2 },
      { id: 'eager', label: 'Eager', intensityHint: 2 },
      { id: 'excited', label: 'Excited', intensityHint: 3 },
      { id: 'enthusiastic', label: 'Enthusiastic', intensityHint: 3 },
      { id: 'elated', label: 'Elated', intensityHint: 4 },
    ],
  },
  trust: {
    id: 'trust',
    label: 'Trust',
    essence: 'You can rest your weight on this — a person, a place, yourself.',
    gradient: [
      { id: 'open', label: 'Open', intensityHint: 1 },
      { id: 'comfortable', label: 'Comfortable', intensityHint: 1 },
      { id: 'accepting', label: 'Accepting', intensityHint: 2 },
      { id: 'secure', label: 'Secure', intensityHint: 2 },
      { id: 'faithful', label: 'Faithful', intensityHint: 3 },
      { id: 'devoted', label: 'Devoted', intensityHint: 4 },
    ],
  },
};

/**
 * Masking states: the words we reach for when we would rather not name the
 * feeling underneath. Not emotions — covers. Selecting one gently offers the
 * families it usually hides.
 */
export interface MaskingState {
  id: 'stressed' | 'overwhelmed' | 'numb' | 'fine' | 'busy';
  label: string;
  /** Gentle invitation to look underneath — never a correction. */
  prompt: string;
  unpacksTo: EmotionFamilyId[];
}

export const MASKING_STATES: MaskingState[] = [
  {
    id: 'stressed',
    label: 'Stressed',
    prompt: "'Stressed' is often fear or anger wearing a coat — want to look underneath?",
    unpacksTo: ['fear', 'anger'],
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    prompt:
      "'Overwhelmed' can be a few feelings arriving at once — want to meet them one at a time?",
    unpacksTo: ['fear', 'sadness', 'anger'],
  },
  {
    id: 'numb',
    label: 'Numb',
    prompt:
      "Numbness is usually a feeling on pause, often sadness — want to see what's waiting?",
    unpacksTo: ['sadness', 'fear'],
  },
  {
    id: 'fine',
    label: 'Fine',
    prompt: "'Fine' can be true — and it can be a lid. Anything quietly underneath?",
    unpacksTo: ['sadness', 'anger', 'fear'],
  },
  {
    id: 'busy',
    label: 'Busy',
    prompt: "Busyness can be a way of outrunning a feeling — want to pause and check?",
    unpacksTo: ['fear', 'sadness'],
  },
];

/** Look up any gradient word by id, returning the word and its family. */
export function findEmotionWord(
  emotionId: string
): { word: EmotionWord; family: EmotionFamily } | undefined {
  for (const family of Object.values(EMOTION_FAMILIES)) {
    const word = family.gradient.find((w) => w.id === emotionId);
    if (word) return { word, family };
  }
  return undefined;
}
