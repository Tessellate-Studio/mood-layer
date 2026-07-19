// Perspective practices adapted from Six Seconds' "Practicing EQ" guide
// (Freedman, Miller & Freedman, 6sec.org) — the user-supplied source PDF
// (2026-07-17), which is also where the feelings quilt and name-it-to-tame-it
// come from. Steps follow the guide's worksheets, not just its practice
// blurbs. Typed data like all copy (hard rule); tone stays invitational —
// steps describe a practice to try, never homework to complete.
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
  'five-year-flashback': 'anticipation',
  'empathic-respect': 'trust',
  'problem-solution': 'surprise',
};

export const PRACTICES: Practice[] = [
  // Worksheet (guide p.42): per option, ONE question — "How am I and others
  // changed?" — then "Which option will contribute to something that still
  // matters in five years?" The earlier two-reflect version split that one
  // question ambiguously (user feedback 2026-07-17).
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
        title: 'The options, from five years up',
        prompt:
          'Imagine you are looking back on today from five years in the future. What are the options your future self can see? List them all.',
        itemNoun: 'option',
        placeholder: 'one option…',
      },
      {
        kind: 'reflect',
        id: 'changed',
        title: 'How am I — and others — changed?',
        prompt:
          'Take each option in turn. If you chose it, how are you changed in five years — and who else is changed by it? Adding the consequences for other people gives an option its real weight.',
        sourceStepId: 'options',
        placeholder: 'how this changes me, and who else it changes…',
      },
      {
        kind: 'pick',
        id: 'still-matters',
        title: 'What still matters',
        prompt:
          'Which options contribute to something that will still matter in five years? Choose any that do.',
        sourceStepId: 'options',
      },
    ],
    closing:
      'Practising this builds the muscle of taking perspective — the small stuff gets easier to let go. When you feel uncertain, ask: what will create the most value for all of us?',
  },
  // Worksheet (guide p.38): respect → dignity & worth → their viewpoint →
  // something to learn; the practice text (p.37) adds noticing the small ways
  // of holding yourself above, and choosing to stand as equals.
  {
    id: 'empathic-respect',
    title: 'Empathic respect',
    whenFor: 'For when being right is winning over being close.',
    steps: [
      {
        kind: 'write',
        id: 'respect',
        title: 'Something to respect',
        prompt: 'Bring the person to mind. What is something you respect about them?',
        placeholder: 'one thing you respect…',
      },
      {
        kind: 'write',
        id: 'dignity',
        title: 'Their dignity and worth',
        prompt:
          'How does this person have dignity and worth? Consider their family, their community, their relationships, what they contribute.',
        placeholder: 'where their dignity lives…',
      },
      {
        kind: 'write',
        id: 'their-view',
        title: 'Their view',
        prompt:
          'Consider their viewpoint. What beliefs do they hold that make their ideas true or valid — from where they stand?',
        placeholder: 'the situation, from their side…',
      },
      {
        kind: 'write',
        id: 'to-learn',
        title: 'Something to learn',
        prompt: 'What is something you could learn from them?',
        placeholder: 'one thing worth learning…',
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
      // Worksheet (guide p.35) closes with: how could it help, even a little,
      // and what small step can you take to implement it.
      {
        kind: 'write',
        id: 'small-step',
        title: 'A small step',
        prompt:
          'How could the idea you kept help, even just a little — and what small step could you take toward it?',
        placeholder: 'the small step…',
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
