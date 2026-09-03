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

/** Shared chrome copy for the floating note card. "First visit" was wrong on
 *  its face — Settings → "Show the helper notes again" brings these back on
 *  any visit, and on the page it read as a heading for the SCREEN rather than
 *  a label for the card (user, 2026-09-03). The overline names what the card
 *  is, and stays true however often it is shown. */
export const COACH_NOTE_OVERLINE = 'A note';
export const COACH_NOTE_DISMISS_HINT = 'Tap to dismiss';

/** One gentle line per screen, pointing at what it offers — never a directive. */
export const COACH_MARKS: Record<CoachMarkId, string> = {
  'note-quilt':
    'Each layer here is a check-in — a moment you noticed. Whenever a feeling seems worth naming, the + above adds a new one.',
  'note-experiments':
    'These practices are for meeting a feeling with a little company. Each one leaves a reflection you can come back to.',
  'note-insights':
    'Nothing to ask of you here — as your layers gather, gentle patterns tend to surface on their own, a couple a week at most.',
  'note-circle':
    'If company sounds good, you can invite someone you trust. You choose what they see, and nothing is shared until you say so.',
  'note-field-guide':
    'Every word here belongs to one of nine families. Tapping a family opens a little more about it — and the closest word is always close enough.',
};
