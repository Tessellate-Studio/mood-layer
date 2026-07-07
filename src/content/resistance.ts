// Joe Hudson's four resistance tells — the everyday signs that an emotion is
// being resisted rather than felt. Check-in prompts are gentle yes/no
// questions; descriptions explain why the tell points at an unfelt feeling.

import type { EmotionFamilyId, ResistanceTellId } from '@/types/models';

export interface ResistanceTell {
  id: ResistanceTellId;
  label: string;
  /** Gentle yes/no question asked during a check-in. */
  checkInPrompt: string;
  /** Why this pattern signals a resisted emotion. */
  description: string;
  /** The emotion families this tell most often points toward. */
  pointsToward: EmotionFamilyId[];
}

export const RESISTANCE_TELLS: Record<ResistanceTellId, ResistanceTell> = {
  'looping-thoughts': {
    id: 'looping-thoughts',
    label: 'Looping thoughts',
    checkInPrompt: 'Have thoughts been looping today?',
    description:
      'When the same thought circles without landing anywhere new, the mind is usually trying to solve a feeling instead of feeling it. Most often the feeling underneath is fear that has not been given a body to move through.',
    pointsToward: ['fear'],
  },
  'harsh-judgment': {
    id: 'harsh-judgment',
    label: 'Harsh judgment',
    checkInPrompt: 'Have you been hard on someone in your head today?',
    description:
      'Sharp judgments of other people tend to carry a feeling we have not let ourselves have, often anger about a crossed boundary, or hurt we would rather not touch. The judgment is the pressure valve; the feeling is underneath.',
    pointsToward: ['anger', 'sadness'],
  },
  'binary-stuckness': {
    id: 'binary-stuckness',
    label: 'Stuck between two options',
    checkInPrompt: 'Have you felt stuck between two choices today?',
    description:
      'When a decision collapses to two options and neither will resolve, it is rarely missing information. More often an emotion is waiting to be felt first, fear of getting it wrong, or anger about having to choose at all.',
    pointsToward: ['fear', 'anger'],
  },
  comparison: {
    id: 'comparison',
    label: 'Better-or-worse comparing',
    checkInPrompt: 'Have you been measuring yourself against others today?',
    description:
      'Ranking yourself above or below people is a way of not feeling what is actually here, often sadness about something missing, or contempt standing guard over it. The scorekeeping quiets when the feeling gets felt.',
    pointsToward: ['sadness', 'contempt'],
  },
};
