// Check-in flow copy, as typed data (copy lives in src/content, never inline).
// Tone: gentle and invitational, never directive; layer language only.
// The feel hint says "one or several" on purpose — selection is deliberately
// uncapped (we always feel several things at once), and the old "even one
// word is plenty" phrasing quietly suggested stopping at one.
export const CHECK_IN_COPY = {
  feelHint:
    "Open whichever sounds close and take any words that fit — one or several. The swatches beside a chosen word set how strongly it's here.",
  /** The field-guide doorway under the feel hint — same doorway the empty
   *  home screen shows, so it reads as the same place from both. */
  fieldGuideLink: 'browse the field guide →',
  addAnotherInvitation: 'We rarely feel just one thing — add any others that are here too.',
  maskingIntro: "or, if it's more like…",
  maskingContinueHint: "Name what's underneath to continue.",
  temperatureContinueHint: "Tap a swatch beside each word to set how strongly it's here.",
  /** Floats up when a family unfolds, for the first few check-ins only: what
   *  a held word does, and where the rest of the family lives. Replaced the
   *  always-on "Hold any word…" line above the list (user, 2026-09-02). */
  exploreNote:
    'Hold any word to learn what it carries. “+ more words” opens the rest of the family.',
  underneathHint: 'Naming even one is enough — or open “learn” to feel your way in.',
} as const;

/** How many check-ins the teaching notes on the feel step keep appearing for
 *  before they're trusted to have landed (user, 2026-09-02: "show it for 3
 *  logs — until it registers as a memory"). */
export const FEEL_NOTE_LOG_LIMIT = 3;
