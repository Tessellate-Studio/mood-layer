// First-visit helper notes — one soft floating card per screen, shown once
// per install (settingsStore.dismissedTips; ids are namespaced 'note-*' so
// the retired inline ScreenTip ids — home/experiments/insights/circle —
// never suppress these, and users who dismissed those still meet the notes
// once). CheckInFlow has no note: it coaches itself in-flow.
// Tone: gentle, invitational, layer language. Settings offers "Show the
// helper notes again" (restoreTips) to bring them all back.

export type CoachMarkId =
  | 'note-quilt'
  | 'note-experiments'
  | 'note-insights'
  | 'note-circle'
  | 'note-field-guide';

export interface CoachMark {
  id: CoachMarkId;
  /** One gentle line pointing at what this screen offers — never a directive. */
  text: string;
}

export const COACH_MARKS: Record<CoachMarkId, CoachMark> = {
  'note-quilt': {
    id: 'note-quilt',
    text:
      'Each layer here is a check-in — a moment you noticed. Whenever a feeling seems worth naming, the + above adds a new one.',
  },
  'note-experiments': {
    id: 'note-experiments',
    text:
      'These practices are for meeting a feeling with a little company. Each one leaves a reflection you can come back to.',
  },
  'note-insights': {
    id: 'note-insights',
    text:
      'Nothing to ask of you here — as your layers gather, gentle patterns tend to surface on their own, a couple a week at most.',
  },
  'note-circle': {
    id: 'note-circle',
    text:
      'If company sounds good, you can invite someone you trust. You choose what they see, and nothing is shared until you say so.',
  },
  'note-field-guide': {
    id: 'note-field-guide',
    text:
      'Every word here belongs to one of nine families. Tapping a family opens a little more about it — and the closest word is always close enough.',
  },
} as const;
