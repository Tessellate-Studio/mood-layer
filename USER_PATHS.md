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

**Uncovered (known, accepted):**
- Note placement is static per screen (no target measuring); extreme font
  scaling may drift the pointer off its anchor. Tuned on device, tracked via
  the device-test queue.
- The note floats over content until dismissed; on very small screens it can
  briefly overlap the weekly summary card on Layers.
