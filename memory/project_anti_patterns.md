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
2. **No colour.** Monochrome ink/paper tokens only (`theme.ts`). A single
   accent-colour "just for the CTA" is the thin end of the wedge — intensity and
   hierarchy are expressed with shade, texture, and type size.
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
