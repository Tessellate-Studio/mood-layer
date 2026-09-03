# User paths — happy, edge, and uncovered flows

Seeded 2026-08-30 with the first-time helper-notes path (the feature that made
this file exceed a BACKLOG entry). Add flows as they earn analysis; each path
lists happy → edges → what nothing covers yet.

## First-time helper notes (coach notes)

**Happy path:** fresh install → onboarding (4 slides) → lands on Layers, where
a soft floating note points up at the + ("Each layer here is a check-in…") →
each tab visited for the first time shows its own note (Experiments, Insights,
Circle), and the Field Guide shows one on first open → tapping a note dismisses
it for good (persisted in `tml-settings` → `dismissedTips`); on Layers and
Circle, taking the pointed-at action (+ / invite) retires the note too → no
note ever appears inside the check-in flow (it self-coaches with in-flow
hints).

**Edges:**
- **Reduce motion** (system or Settings override): the note appears instantly,
  no fade — snap to rest, per the app-wide motion rule.
- **Settings → Show the helper notes again** (`settings-show-helpers`): clears
  `dismissedTips`, so every note returns once each.
- **Settings → Delete everything** (`resetAll`): also clears `dismissedTips` —
  a factory-reset user meets the notes again, which is correct (the app is in
  its day-zero state).
- **Existing installs** (pre-notes): the retired inline ScreenTips used ids
  `home/experiments/insights/circle`; the notes use fresh `note-*` ids, so
  users who dismissed the old tips still meet each note once. The legacy ids
  stay in their `dismissedTips` harmlessly.
- **Day-zero vs returning Layers layout:** the note anchors to the header `+`
  (`checkin-fab`), which exists in both layouts — never to the conditional
  header field-guide icon.
- **Placement is one rule on every screen (2026-09-03):** the note sits
  directly under the screen's title row, whose height `ScreenFrame` measures
  with `onLayout` (`useMeasuredHeight`) — the same in empty and filled
  states, and it follows a wrapped title or a larger system font. Typed
  offsets are banned by `noHandTunedOffsets.test.ts`, and the frame owns the
  anchor so a page cannot mount a note without one (anti-patterns #9, #11).

**Uncovered (known, accepted):**
- The note floats over content until dismissed; on very small screens it can
  briefly overlap the weekly summary card on Layers.

## Every page screen (2026-09-03)

**The frame, from the three the user approved (Settings, Field guide,
Layers):** paper ground with the grain · side gutters of `spacing.md` · the
safe-area top plus `spacing.md` on the OUTER frame · a FIXED title row above
the body · the scroller ending on one bottom token, identical whether the
page is full or empty. `ScreenFrame` is that frame; all seven pages wear it
(Layers, Experiments, Insights, Circle, Field guide, Reflections, Settings).

**Edges:**
- **Circle and Experiments before this:** the safe-area top sat on the
  scroller's content, so their titles scrolled away under the status bar
  while the approved three kept theirs fixed. Both now match.
- **Empty states** get the same frame and the same bottom as full ones — the
  body centres in what is left, it does not re-space the page.
- **Flow screens** (check-in, judgment, practice, breathing, name-it,
  onboarding) are deliberately unframed: a footer-driven wizard is a
  different shape, with its own measured footer and floating hint.

**Uncovered (known, accepted):**
- The tab bar's own height is react-navigation's; the frame does not pad for
  it, matching the approved screens.

## Insights

**Happy path:** first open of the Insights tab on a Monday (any time from
00:00 local) → the app builds LAST week's cards from that week's check-ins
(needs ≥3; up to two cards, top templates by priority) and marks the week →
the page shows "Last week · <dates> · N check-ins across M days", the cards,
then last calendar month's two cards underneath ("June, in layers" — the month
that just ended, ≥8 check-ins; "What the practices surfaced" — that month's
judgment sittings and practice conclusions) → nothing is dismissable; the
next Monday's open replaces the cards, the 1st's open replaces the month.

**Edges:**
- **Quiet week** (<3 check-ins, or no template matched): the week is still
  marked, nothing is stored, and the page shows the honest empty state — "a
  quiet week so far" if nothing is logged THIS week yet, otherwise "checked
  in, but no clear pattern has surfaced yet". A card from an older week never
  shows under the "Last week" header (gated on the calendar, not on the newest
  stored card).
- **Missed weeks:** only the week immediately before now is ever generated;
  skip the app for a fortnight and the older missed week gets no cards.
- **First month of use:** the month cards wait for the first full calendar
  month to end, even if the current month is busy — a completed period, like
  the week.
- **Upgrade from a build with dismiss:** persist v2 strips the retired
  `dismissedAt`; a card dismissed on the old build shows again if it is still
  last week's.
- **Marks:** the header mark wears the prominent current mood — this week's
  top families, last week's while this week is empty, the brand stack when
  both are — the same rule as the Layers header and weekly-summary marks.

**Uncovered (known, accepted):**
- The tab left open across the Monday-midnight boundary shows the empty state
  until it is re-focused (generation runs on focus).
- Template variety: seven fixed skeletons, two a week — repeats are structural
  until the BACKLOG P1 variety pitch lands.
