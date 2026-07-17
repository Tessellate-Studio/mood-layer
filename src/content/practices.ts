// Perspective practices adapted from the Atlas of Emotions
// (atlasofemotions.org — Paul Ekman with the Dalai Lama), brought in at the
// user's request (2026-07-08). Typed data like all copy (hard rule); tone stays
// invitational — steps describe a practice to try, never homework to complete.
//
// Redesigned 2026-07-17 (user): each practice is now a guided multi-step flow
// (screens/PracticeFlowScreen) instead of an inline scratch pad. Steps are
// typed by KIND so the flow can lay each one out properly — a list step
// collects several points, a reflect step shows each earlier point side by
// side with its own writing space, a mark step compares two lists, a pick
// step chooses one point to keep.

import type { EmotionFamilyId } from '@/types/models';

interface PracticeStepBase {
  /** Unique within the practice; work is keyed by this id. */
  id: string;
  /** Short heading for the step. */
  title: string;
  /** The invitation — what to try on this step. */
  prompt: string;
}

export type PracticeStep =
  /** One prompt, one open writing space. */
  | (PracticeStepBase & { kind: 'write'; placeholder: string })
  /** One prompt, any number of noted points. */
  | (PracticeStepBase & { kind: 'list'; itemNoun: string; placeholder: string })
  /** Each point from an earlier list step, side by side with its own space. */
  | (PracticeStepBase & { kind: 'reflect'; sourceStepId: string; placeholder: string })
  /** Two earlier lists side by side; tap points that deserve the mark word. */
  | (PracticeStepBase & {
      kind: 'mark';
      sourceStepIds: [string, string];
      columnLabels: [string, string];
      markWord: string;
    })
  /** Choose one point from an earlier list step to keep. */
  | (PracticeStepBase & { kind: 'pick'; sourceStepId: string });

export interface Practice {
  id: string;
  title: string;
  /** One line on when this practice helps. */
  whenFor: string;
  steps: PracticeStep[];
  /** A soft closing thought — what practising this tends to open. */
  closing: string;
}

/** Layer hue per practice (muted-layer treatment) — shared by the Experiments
 *  cards and the flow screen so the card and its flow read as one layer. */
export const PRACTICE_FAMILY: Record<string, EmotionFamilyId> = {
  'five-year-flashback': 'enjoyment',
  'empathic-respect': 'disgust',
  'problem-solution': 'fear',
};

export const PRACTICES: Practice[] = [
  {
    id: 'five-year-flashback',
    title: 'Five year flashback',
    whenFor: 'For a decision that will not stop circling.',
    steps: [
      {
        kind: 'write',
        id: 'decision',
        title: 'The decision',
        prompt: 'What decision will not stop circling? Set it down in a line.',
        placeholder: 'the decision, in your words…',
      },
      {
        kind: 'list',
        id: 'options',
        title: 'The options',
        prompt: 'List the options you are weighing — as many as are on the table.',
        itemNoun: 'option',
        placeholder: 'one option…',
      },
      {
        kind: 'reflect',
        id: 'from-above',
        title: 'From five years up',
        prompt:
          'Look back on this moment from five years in the future. Walk through each option from up there — what can your future self see?',
        sourceStepId: 'options',
        placeholder: 'what the view from up there shows…',
      },
      {
        kind: 'reflect',
        id: 'who-it-touches',
        title: 'Who it touches',
        prompt:
          'Add the consequences for other people. Choices gain weight when you can see who they touch — and where a little more good could go.',
        sourceStepId: 'options',
        placeholder: 'who this option touches…',
      },
    ],
    closing:
      'Taking perspective like this builds the muscle of letting the small stuff stay small, so your attention can rest on what matters most.',
  },
  {
    id: 'empathic-respect',
    title: 'Empathic respect',
    whenFor: 'For when being right is winning over being close.',
    steps: [
      {
        kind: 'write',
        id: 'their-view',
        title: 'Their view',
        prompt:
          'Think about the other person and make a real effort to consider their view. What might this look like from where they stand?',
        placeholder: 'the situation, from their side…',
      },
      {
        kind: 'write',
        id: 'to-value',
        title: 'One thing to value',
        prompt: 'Look for one thing you could value or learn from them.',
        placeholder: 'one thing worth valuing…',
      },
      {
        kind: 'list',
        id: 'above',
        title: 'The small superiorities',
        prompt:
          'Notice even the small ways you might be holding yourself above them — name each one.',
        itemNoun: 'way',
        placeholder: 'one small way…',
      },
      {
        kind: 'reflect',
        id: 'as-equals',
        title: 'Standing as equals',
        prompt: 'Take each one you noticed. How would it look to stand as equals instead?',
        sourceStepId: 'above',
        placeholder: 'standing as equals would look like…',
      },
    ],
    closing:
      'Practised gently, other perspectives start to feel meaningful rather than opposing — and when people feel your respect, they tend to open.',
  },
  {
    id: 'problem-solution',
    title: 'Problem, then solution',
    whenFor: 'For a problem that feels impossible.',
    steps: [
      {
        kind: 'write',
        id: 'problem',
        title: 'The problem',
        prompt: 'State the problem in a line.',
        placeholder: 'the problem, plainly…',
      },
      {
        kind: 'list',
        id: 'cannot',
        title: 'Why it cannot be solved',
        prompt:
          'Give every reason it cannot be solved or will never get better — let them all out.',
        itemNoun: 'reason',
        placeholder: 'one reason it cannot…',
      },
      {
        kind: 'list',
        id: 'ideas',
        title: 'Ways it could improve',
        prompt:
          'Start with the solution someone with great skill and experience might try. Then imagine five to ten more ways it could improve — even unrealistic ones.',
        itemNoun: 'idea',
        placeholder: 'one way it could improve…',
      },
      {
        kind: 'mark',
        id: 'fantastical',
        title: 'Notice the fantastical',
        prompt:
          'Read the two sides next to each other. Tap the points that are fantastical — they live on both sides.',
        sourceStepIds: ['cannot', 'ideas'],
        columnLabels: ['Problem side', 'Solution side'],
        markWord: 'fantastical',
      },
      {
        kind: 'pick',
        id: 'one-step',
        title: 'One idea to keep',
        prompt: 'Pick one idea from the solution side that could help, even a little.',
        sourceStepId: 'ideas',
      },
    ],
    closing:
      'The seriousness of a problem and the possibility of movement can be held at the same time — that is the whole practice.',
  },
];

/** Look up a practice by id (route param → content). */
export function findPractice(practiceId: string): Practice | undefined {
  return PRACTICES.find((p) => p.id === practiceId);
}
