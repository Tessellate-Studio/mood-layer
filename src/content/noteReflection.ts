// The note step's carried-forward reflection: stitch what was named on the
// earlier steps into one gentle sentence, then close with an open question so
// the note probes what was actually selected instead of starting cold
// (user, 2026-07-17). The closing question is the third KCG question from
// the Six Seconds model — Know Yourself ("What am I feeling?" — done on the
// feel step), Choose Yourself, Give Yourself: "What do I truly want?"
// (Practicing EQ pp.29–31). Tone rule: an invitation, never an instruction.

import { findVocabularyWord } from '@/content/vocabulary';
import type { EmotionSelection, ResistanceTellId } from '@/types/models';

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
 * One woven paragraph for the note step. Pure: same inputs → same string.
 * Examples:
 *   "You named worried and hurt, felt it as a lump in throat, and noticed
 *    thoughts on a loop. Underneath it all — what do you truly want?"
 */
export function noteReflection(input: {
  selections: EmotionSelection[];
  bodySensations: string[];
  resistanceFlags: ResistanceTellId[];
}): string {
  const words = input.selections.map(
    (sel) => (findVocabularyWord(sel.emotionId)?.word.label ?? sel.emotionId).toLowerCase()
  );

  const clauses: string[] = [];
  if (words.length > 0) clauses.push(`You named ${joinPlain(words)}`);
  if (input.bodySensations.length > 0) {
    clauses.push(`felt it as ${joinPlain(input.bodySensations.slice(0, 2))}`);
  }
  if (input.resistanceFlags.length > 0) {
    clauses.push(
      `noticed ${joinPlain(input.resistanceFlags.slice(0, 2).map((t) => TELL_PHRASES[t]))}`
    );
  }

  const question = 'Underneath it all — what do you truly want?';
  if (clauses.length === 0) return question;
  return `${joinPlain(clauses)}. ${question}`;
}
