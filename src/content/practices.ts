// Perspective practices adapted from the Atlas of Emotions
// (atlasofemotions.org — Paul Ekman with the Dalai Lama), brought in at the
// user's request (2026-07-08). Typed data like all copy (hard rule); tone stays
// invitational — steps describe a practice to try, never homework to complete.

export interface Practice {
  id: string;
  title: string;
  /** One line on when this practice helps. */
  whenFor: string;
  steps: string[];
  /** A soft closing thought — what practising this tends to open. */
  closing: string;
}

export const PRACTICES: Practice[] = [
  {
    id: 'five-year-flashback',
    title: 'Five year flashback',
    whenFor: 'For a decision that will not stop circling.',
    steps: [
      'Look back on this moment from five years in the future. What options can your future self see, and who will be changed by the choice?',
      'Walk through each option you are weighing from up there, one at a time.',
      'Add the consequences for other people. Choices gain weight when you can see who they touch — and where a little more good could go.',
    ],
    closing:
      'Taking perspective like this builds the muscle of letting the small stuff stay small, so your attention can rest on what matters most.',
  },
  {
    id: 'empathic-respect',
    title: 'Empathic respect',
    whenFor: 'For when being right is winning over being close.',
    steps: [
      'Think about the other person and make a real effort to consider their view.',
      'Look for one thing you could value or learn from them.',
      'Notice even the small ways you might be holding yourself above them, and choose to stand as equals instead.',
    ],
    closing:
      'Practised gently, other perspectives start to feel meaningful rather than opposing — and when people feel your respect, they tend to open.',
  },
  {
    id: 'problem-solution',
    title: 'Problem, then solution',
    whenFor: 'For a problem that feels impossible.',
    steps: [
      'State the problem, with every reason it cannot be solved or will never get better.',
      'Write the solution someone with great skill and experience might try.',
      'Imagine five to ten more ways it could improve, even unrealistic ones.',
      'Notice which ideas on both sides are fantastical.',
      'Pick one idea from the solution side that could help, even a little.',
    ],
    closing:
      'The seriousness of a problem and the possibility of movement can be held at the same time — that is the whole practice.',
  },
];
