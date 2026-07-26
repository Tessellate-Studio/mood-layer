# The Mood Layer — Claude Code Instructions

<!-- Derived from forge/references/CLAUDE.base.md (slim-index format,
     2026-07-16). This file is a ONE-PAGE INDEX: full rule text lives once in
     forge/standards/ and loads at the moment it applies. Don't paste rule text
     back in here — change it in forge and let the plugin propagate. If a rule
     keeps getting missed, move it DOWN a layer (prose → skill → hook). -->

## How to communicate with me — ALWAYS

Lead with the bottom line, then only the lists that apply. Plain words — no
jargon (that goes in the PR description). **Small task:** one or two sentences,
no headers. **Bigger task:** a one-line **Done:** headline, then only sections
with real content — **You:** (actions only I can take) / **Me next:** /
**Docs:** — empty sections dropped entirely, each fact appears once, the
headline IS the summary.

## The two always-on rules

- **Speak from authority, not assumption.** Every claim cites a verified source
  (`file:line`, SHA, MCP tool, CLI output) or is labelled a hypothesis. Full
  standard: `forge/standards/authoritative-claims.md`.
- **OWASP is non-negotiable.** Any OWASP violation is an anti-pattern.
  Triage policy: `forge/standards/security-triage.md`; disposition log:
  `docs/SECURITY.md`.

## Working rules — one line each, full text in `forge/standards/workflows.md`

Read the standard **at the moment the rule applies** (branching, committing,
merging, bug-fixing), not just at session start:

- **Branch placement** — task doesn't fit the current branch → cut
  `fix|feat|docs|chore/<slug>` off `master` automatically; don't ask.
- **Merged branches** — rename to `done/<original>` after merge; never delete-on-merge.
- **Merge on green** — PRs open ready (not draft), merge when CI passes
  (carve-outs in `forge/standards/anti-patterns.md`).
- **Orphan-branch fixes** — port to a fresh branch off `master` automatically.
- **Concurrent sessions** — worktree-isolate every task; SHA-explicit git;
  verify `HEAD` before every commit/push.
- **Bug-fix pre-flight** — read `memory/project_regression_log.md` BEFORE any
  code; log new fixes there after (symptom → root cause → fix → test → lesson).
- **TDD** — failing test first; `npx jest --no-coverage` + `npx tsc --noEmit`
  green before commit. New screen → smoke test + `Safe{ScreenName}` error
  boundary in the navigator.
- **Quality pass** — before committing any non-trivial diff (UI or not):
  `/code-review`, then `/simplify`, re-run tests, commit cleanups separately.
- **Status update** — change came from a BACKLOG / regression-log / tracker
  entry? Update that entry (status, PR, SHA) in the same PR.
- **External-tool decisions** — decided setups get numbered, copy-pasteable
  steps in `docs/user-actions-tracker.md` before the session ends.
- **Doc placement** — [`PROJECT_DOCS.md`](./PROJECT_DOCS.md) maps every doc
  type to its location. Platform rule: `forge/standards/doc-placement.md`.
- **User-facing runbooks** — follow `docs/_USER_DOC_TEMPLATE.md`.

## Build workflows — let the skills carry the process

- `/forge:build-feature` — implement + verify a change end-to-end (acceptance
  criteria → TDD → on-device verification → quality pass → status update → retro).
- `/forge:plan` — research-backed planning before building. Auto-sizes into
  **ADR** (tactical), **Shape Up Pitch** (feature scope), or **RFD**
  (architecture/cross-repo); Pitch and RFD run a cited web-research pass first.
  Docs persist in `memory/decisions/` (`adr-001-…`, `pitch-002-…`, `rfd-003-…`)
  as context for later sessions. Fires from build-feature Step 0, or standalone.
- `/forge:roadmap-pulse` — weekly honesty pass + scored priorities (own cron).
- Before building: read `forge/standards/anti-patterns.md` +
  `memory/project_anti_patterns.md` when touching their areas.

**Multi-agent builds — Pitch/RFD tier only.** When the planning gate sizes a
change as Pitch or RFD, `build-feature` delegates to the `researched-build`
workflow: **researcher** (cited prior art) → **tester** (writes FAILING tests
from the acceptance criteria, never sees implementation) → **implementer**
(makes them pass in an isolated worktree) → **reviewer** (fresh eyes on a diff
it didn't write) → **verifier** (on-device measurement). Findings loop back to
the implementer. Large diffs from single-agent builds get `adversarial-review`
at the quality pass instead. Scripts ship with the forge plugin
(`${CLAUDE_PLUGIN_ROOT}/references/workflows/`) — nothing to install; pass
`args` as a JSON **object**, never a stringified one. Degrades to single-agent
when unreachable, and ADR/tactical changes stay single-agent by design.
Separation is enforced by prompt instruction, not tool grants. Design +
caveats: `forge` → `memory/decisions/rfd-001-multi-agent-workflow.md`. Not yet
exercised end-to-end — treat its worktree hand-off as unproven.

## Planning docs

- `BACKLOG.md` — durable out-of-scope record (P0–P4)
- `USER_PATHS.md` — happy + edge + uncovered flows
- `WEEKLY_DIGEST.md` — append-only weekly priorities (roadmap-pulse)
- `memory/` — regression log, anti-patterns, design vision

## Builds — cloud ONLY, never compile natively on the laptop

Set 2026-07-14 (user rule, all projects): no Gradle / CMake / prebuild on this
machine. APK: `gh workflow run build-android-apk.yml --ref master` →
`gh run download <run-id> --name mood-layer-apk` → `adb install -r`. Diagnose
failures from `gh run view <run-id> --log-failed`, never "reproduce locally".
Metro / Expo Go / jest / tsc stay local-OK.

## Code style

Theme tokens only — never hardcoded literals (`forge/standards/anti-patterns.md`).
Package id: `com.tessellate.moodlayer`.

---

## App-specific

<!-- Everything below is THIS app's delta. The rules above come from forge and
     should not be edited here — change them in forge/references/CLAUDE.base.md. -->

### What this app is

**The Mood Layer — your feelings, in layers.** Consumer emotion-tracking
Android app (Expo SDK 55, RN 0.83, React 19, portrait). Two grounding concepts:

- **Emotional quilt (Paul Ekman):** we always feel several emotions at once. A
  check-in captures the co-occurring emotions — deliberately NO cap (the old
  max-5 had no basis in the literature; user removed it 2026-07-17) — each
  with intensity 1–4, set ON the word itself (chip + four-swatch dial; no
  separate intensity step). The home screen renders them as translucent
  overlapping layers (one cluster per check-in, one cloth piece per emotion).
  **Copy rule (user, 2026-07-17): the app SPEAKS in layer language** —
  "Layer it in", "Your mood layers", never stitch/quilt/sew in user-facing
  strings. The quilt stays named exactly one place: Settings → About the
  ideas, as the Ekman inspiration.
- **Emotional fluidity (Joe Hudson):** resilience comes from feeling emotions in
  the body instead of resisting them. Four resistance tells (looping thoughts,
  harsh judgment, binary stuckness, better/worse-than comparison); resisted
  fear→anxiety, resisted sadness→numbness, resisted anger→stuckness→depression.

**Naming note:** this repo took the `mood-layer` name on 2026-07-07. The
brand-side Shopify app that previously held it is now **Alate (for Brands)**
(`Tessellate-Studio/loom`). The two are unrelated — never port code or docs
between them.

### Hard rules (this app)

- **Local-only data.** All user data lives on-device (zustand persist →
  AsyncStorage). No accounts, no server, no analytics, no crash-reporting SDKs.
  Sending emotional data anywhere is an anti-pattern until the user explicitly
  decides otherwise (then it goes through the tracker + a privacy review).
  **ONE sanctioned exception (user-decided 2026-07-18): the circle relay** —
  the gated weekly summary (only), sealed on-device with nacl.box to a paired
  peer's key, through the send-and-forget `moodlayer-relay` edge function.
  Trust boundary + residual risks: `docs/SECURITY.md` → "Circle relay".
- **Typewriter ink, Atlas hues in two registers (user-locked 2026-07-08,
  extended 2026-07-13 — "layers you can tell apart").** Every colour comes from
  `src/constants/theme.ts`. Text, lines, buttons, and backgrounds stay
  ink/paper greys on warm cream, with the `PaperTexture` grain on screen
  surfaces. Hue follows the Atlas of Emotions families (anger red, fear
  violet, sadness blue, disgust green, enjoyment amber, plus harmonised
  surprise tan / contempt mauve, and anticipation teal / trust rose for the
  two Plutchik families user-added 2026-07-13) in exactly two
  registers: `familyPalette` — soft pastels, solely for quilt patch
  fills/swatches/dials and the SELECTED emotion-word chip's fill (the chip
  doubles as its temperature swatch, ink text on top — user-approved
  2026-07-17) — and `mutedPalette` — the same hues desaturated
  toward grey, solely for card fills, thread spines, section glyphs, and
  same-hue accents (via `ThreadCard` / `SectionHeader` / `LogoDivider`), so
  sections and cards read as distinct layers. Body text on a tinted fill
  stays ink tiers; per-family `accent` is the only coloured text and must
  hold WCAG AA (enforced in `designTreatment.test.tsx`). No hardcoded hex
  anywhere else; never colour plain text, lines, or buttons.
- **Typewriter voice — Courier Prime everywhere.** The app reads like a page
  typed onto paper; monospace is the design, not a placeholder. Regular + Bold
  ship as separate families (`CourierPrime-Regular` / `CourierPrime-Bold`), each
  registered under its own `fontFamily` with `fontWeight: '400'` (synthetic bold
  on Android silently falls back to a system font — forge AP#12).
- **Reanimated 4 + Jest:** the hand-rolled mock in `jest.setup.js` (copied from
  alate, known-good) is load-bearing — v4 worklets crash Node if the real module
  loads in tests. Don't replace it with the package's own mock.
- **Reduce-motion is a requirement.** Every animation consults `useMotion()`
  (system `useReducedMotion()` + settings override). Breathing pulses and stitch
  animations must disable cleanly.
- **Tone is gentle, never clinical or directive.** Insight cards cap at 2 per
  week, always end with an invitation, never a diagnosis or instruction. Copy
  changes go through `src/content/` (typed TS data), not inline strings.
- **SVG quilt patterns are generated primitives**, not `<Pattern>` defs (rnsvg
  quirks; untestable). Pattern generators are pure functions with unit tests.
- **Use versioned Expo documentation.** Read the docs for the exact version we're
  on: `https://docs.expo.dev/versions/v55.0.0/` (or update the version when the
  SDK upgrades). Expo's latest docs may describe features or APIs that don't
  exist in SDK 55; referencing an older major version is a common source of
  confusing "this API doesn't exist" errors.
