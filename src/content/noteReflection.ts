// The note step's carried-forward reflection. First cut wove EVERYTHING named
// on the earlier steps into the line — with a dozen emotions it became a wall
// (user, 2026-07-17: "too much — limit to step 4 alone"). It now reflects
// ONLY the resistance step's tells, plus the open question. The question is
// the third KCG question from the Six Seconds model — Know Yourself ("What am
// I feeling?", done on the feel step), Choose Yourself, Give Yourself: "What
// do I truly want?" (Practicing EQ pp.29–31). Tone rule: an invitation,
// never an instruction.

import type { ResistanceTellId } from '@/types/models';

/** Short, plain phrase per resistance tell for the woven sentence. */
const TELL_PHRASES: Record<ResistanceTellId, string> = {
  'looping-thoughts': 'thoughts on a loop',
  'harsh-judgment': 'a harsh judge in the room',
  'binary-stuckness': 'an either/or squeeze',
  comparison: 'the comparing habit',
};

function joinPlain(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * One short line for the note step. Pure: same input → same string.
 * With tells:   "You noticed thoughts on a loop. Underneath it all — what do
 *                you truly want?"
 * Without any:  just the question.
 */
export function noteReflection(input: { resistanceFlags: ResistanceTellId[] }): string {
  const question = 'Underneath it all — what do you truly want?';
  if (input.resistanceFlags.length === 0) return question;
  const phrases = input.resistanceFlags.map((t) => TELL_PHRASES[t]);
  return `You noticed ${joinPlain(phrases)}. ${question}`;
}
