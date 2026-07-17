// Body map for the check-in's "Where do you feel it?" step — areas of the
// body, each with natural sensation phrases, so the step teaches WHERE to
// look, not just what to tap (user, 2026-07-17). Grounded in the Body-Mind-
// Heart scan (Six Seconds, Practicing EQ p.8): "Is your jaw tight? Is your
// back sore? Are your fists clenched? … Physical sensations could be clues."
// Typed data like all copy (hard rule). Sensations are stored as their plain
// phrase, so each reads naturally on its own in the check-in detail sheet.

export interface BodyArea {
  id: string;
  label: string;
  /** Each phrase must stand alone ('tight jaw', not just 'tight'). */
  sensations: string[];
}

export const BODY_MAP: BodyArea[] = [
  {
    id: 'head-face',
    label: 'Head & face',
    sensations: ['tight jaw', 'warm face', 'furrowed brow', 'foggy head', 'hot behind the eyes'],
  },
  {
    id: 'throat',
    label: 'Throat',
    sensations: ['lump in throat', 'tight throat', 'hard to swallow', 'words stuck'],
  },
  {
    id: 'shoulders-neck',
    label: 'Shoulders & neck',
    sensations: ['raised shoulders', 'stiff neck', 'heavy shoulders', 'light shoulders'],
  },
  {
    id: 'chest',
    label: 'Chest & breath',
    sensations: ['tight chest', 'racing heart', 'shallow breath', 'warm chest', 'hollow chest'],
  },
  {
    id: 'stomach',
    label: 'Stomach',
    sensations: ['knotted stomach', 'butterflies', 'hollow stomach', 'queasy stomach'],
  },
  {
    id: 'hands-arms',
    label: 'Hands & arms',
    sensations: ['clenched fists', 'buzzing hands', 'cold hands', 'restless arms'],
  },
  {
    id: 'legs-feet',
    label: 'Legs & feet',
    sensations: ['heavy legs', 'restless legs', 'tapping feet', 'rooted and steady'],
  },
  {
    id: 'whole-body',
    label: 'Whole body',
    sensations: ['heavy limbs', 'buzzing all over', 'numb all over', 'drained', 'settled'],
  },
];
