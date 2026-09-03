# Anti-patterns — The Mood Layer (app-specific)

The cross-app guardrails live in `forge/standards/anti-patterns.md` (forge
plugin) — TDD-first, no hardcoded colours, hooks discipline, font family names,
WCAG 2.1 AA, concurrent-session isolation, and the rest. This file holds only
what is specific to this app. Seeded from the requirements brief (2026-07-07);
numbered entries get added as they're earned.

1. **No emotional data leaves the device.** No analytics, crash reporting,
   accounts, or sync until the user explicitly decides otherwise — and then only
   through a privacy review + user-actions-tracker entry. A "harmless" telemetry
   dep is how this gets violated by accident; treat any network-capable
   dependency addition as a trigger to re-read this rule.
2. **No colour outside the two Atlas registers.** (Amended 2026-07-13 with the
   muted-layer treatment; originally "no colour at all".) Hue exists only as
   `familyPalette` (quilt pastels — patch fills/swatches/dials) and
   `mutedPalette` (desaturated layer hues — card fills, thread spines, section
   glyphs, AA-checked accents), both in `theme.ts` and both keyed to an emotion
   family. A free-floating accent colour "just for the CTA" is still the thin
   end of the wedge — buttons, plain text, and lines stay ink; hierarchy is
   expressed with shade, texture, and type size.
3. **Never gamify feelings.** No streaks, badges, scores, or guilt copy for
   missed days (empty quilt days render as quiet batting strips, not red gaps).
   Pressure to check in contradicts the fluidity concept the app teaches.
4. **Gentle, non-clinical tone everywhere.** The app never diagnoses, never
   prescribes, and caps insights at 2/week. It invites ("want to look
   underneath?"), it does not instruct ("you should…"). All user-facing copy
   lives in `src/content/` as typed data so tone review happens in one place.
5. **Reanimated 4's real module must never load under Jest** — keep the
   hand-rolled mock in `jest.setup.js` (copied from alate; worklets crash Node).
6. **SVG quilt patterns are generated primitives, not `<Pattern>` defs** —
   rn-svg pattern support is quirky and untestable; pure generator functions
   with unit tests only.
7. **Every `Gesture.*` callback is UI-thread worklet code** (earned 2026-08-29,
   regression #23). Any plain JS function it touches — a prop, a store action,
   a setState — goes through `runOnJS`, no exceptions: a direct call is a
   fatal UI-runtime error that kills the app outside every JS error boundary
   and, with `enableNativeCrashHandling: false`, leaves no Sentry event. Jest
   can't reproduce the crash, so pin the wiring instead: drive the recorded
   handlers (gesture mock in `jest.setup.js`) and assert the callback was
   handed to `runOnJS`, as `sheet.test.tsx` does. If gesture code multiplies,
   consider `eslint-plugin-reanimated`'s `js-function-in-worklet` — declined
   for now with a single call site (a dep for one lint of one file).
8. **A gesture the app teaches anywhere must be wired everywhere it plausibly
   applies** (earned 2026-08-30). Identical-looking controls with divergent
   gesture behaviour are a bug, not a styling nuance: the hold-to-learn
   long-press shipped on the check-in flow's word chips while
   JudgmentFlowScreen's visually identical chips stayed dead (PR #81; fixed in
   PR #82). Wire the gesture at the component's own depth and default it from
   props the component already has — `WordTemperatureRow` defaults
   `onLongPress` to opening the family helper sheet — so every new surface
   that reuses the component is correct by default instead of by someone
   remembering.
9. **A floating element's position is measured, never typed** (earned
   2026-09-03; third row on one theme — regression #24, #27, and the
   Insights/Circle coach-note mismatch). A number that happens to equal the
   header's height at today's type scale is a drift waiting for the next +1px
   commit, a wrapped title, or a bigger system font — and it drifts per
   screen, which is how the same note sat above the header on one tab and
   below it on another. The thing a float sits under reports its own height
   through `onLayout` (`useMeasuredHeight`), and the float positions from
   that. `noHandTunedOffsets.test.ts` bans a numeric `topOffset` in any
   screen at the source level, the way `noStitchLines.test.ts` bans dashes.
   Since 2026-09-03 the seam is structural too: `ScreenFrame` measures its
   own header and hands the note the offset, so a page screen cannot mount a
   note against an unmeasured anchor (anti-pattern #11).
10. **Reading text is never below `body`** (earned 2026-09-03; user: the
    check-in flow "looks too tiny", the field guide "slightly less so").
    The type tokens are a hierarchy, not a size menu: `caption` (13) is for
    metadata — timestamps, counts, a colophon — `label` (15) for controls and
    legends the eye scans, `body` (16) and up for anything the reader has to
    read to understand or proceed. A hint that gates Continue, a family's
    essence, a folded preview line are reading text; setting them in
    `caption` because they are "secondary" makes the page's most-used words
    its smallest. Quietness is expressed with `inkSoft`/`inkMuted` colour at
    body size, not with a smaller face. `checkInFlowScreen.test.tsx` and
    `fieldGuideScreen.test.tsx` pin the sizes on the elements that prompted
    this.
11. **A page screen wears `ScreenFrame`; it does not roll its own frame**
    (earned 2026-09-03, from the user's "Settings, field guide and Home page
    … look perfect. You need to extend this rule to others, in both empty and
    filled states"). Every page had hand-assembled the same four things —
    paper ground, side gutters, safe-area top, a title row — and they had
    drifted: Circle and Experiments put the safe-area top on their scroller's
    *content*, so their titles scrolled up under the status bar while the
    approved three kept theirs fixed, and the bottom breathing room arrived
    in four different tokens across the seven (xl, xxl, a bare md, and
    `insets.bottom + xxl`). `ScreenFrame` owns the frame and
    the first-visit note; a screen supplies a title row, a body, and
    `screenContent` for its scroller's bottom. Hand-assembling the frame is
    how it drifts again, one screen at a time. Flow screens (check-in,
    judgment, practice, breathing, name-it, onboarding) are deliberately out:
    a footer-driven wizard is a different shape, not a page.
