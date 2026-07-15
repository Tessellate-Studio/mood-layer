# The Mood Layer — Claude Code Instructions

<!-- Derived from forge/references/CLAUDE.base.md (2026-07-07, forge
     78a70679bd3f1553582db60332fa4c4fa836b9a8). The shared rules live in forge
     and are summarized here; when a working-with-me rule changes, change it in
     forge and bump the plugin — don't fork here. -->

## How to communicate with me — ALWAYS (unless I say otherwise)

Lead with the bottom line, then only the lists that apply. Scale the shape to the
size of the task. Plain words — no technical jargon (that goes in the PR
description or a doc I ask for). **A gist with the important info is plenty; all
tech detail goes in the PR, not in chat.**

**Small task** (one-file fix, quick answer, single command): just the bottom line
— one or two sentences on what's done and whether I need to do anything. No
headers, no lists.

**Bigger task** (multi-step, several files, or has follow-up): a one-line
**Done:** headline, then only the sections that have real content:
- **You:** — actions only I can take. Omit if none.
- **Me next:** — what you can take off my hands next. Omit if none.
- **Docs:** — one line on docs touched and why. Omit if none.

Rules: empty sections are dropped entirely (never "You: nothing needed"); each
fact appears once; the headline IS the summary — no separate recap.

## Speak from authority, not assumption — cite the source

Every statement, suggestion, status claim, or "done / not done" verdict lands on
a verified source — not an inference, a stale memory note, or a previous
session's word. Cite inline: `file:line`, commit SHA, MCP tool, CLI command.

- Before asserting "X is done / live / merged / shipped": `git branch --contains
  <sha>` should include the default branch; for DB state prefer reading the schema
  (`list_tables`) over a migrations ledger.
- Before asserting "X is broken / pending": verify current state — a memory/log
  claim is a starting point, not a conclusion.
- When the source can't be cheaply checked, label it: "unverified — best guess is
  X; would need Y to confirm." Never let an inference wear the costume of a fact.
- **The tell:** if the sentence still works with "probably / should be / I think"
  inserted, you're inferring — verify, delete, or relabel as a hypothesis.

This is enforced platform-wide via `forge/standards/authoritative-claims.md`.

## Security — OWASP is non-negotiable

Follow OWASP guidance at all times. Any OWASP violation is, by definition, an
anti-pattern. Dependency alerts are triaged per
`forge/standards/security-triage.md`; this app's disposition log lives in
`docs/SECURITY.md`.

## Anti-patterns — read before building

The cross-app build guardrails live in `forge/standards/anti-patterns.md` (TDD-
first for data-flow, no hardcoded colours/fonts/alphas, no hooks below a
conditional return, custom-font family names, comment-the-why, diagnose-from-
source, WCAG 2.1 AA, CI secret hygiene, authority-not-assumption, end-to-end
shipping, elastic layouts, concurrent-session isolation). App-specific
anti-patterns live in
`memory/project_anti_patterns.md`. Read both before a feature that touches their
areas.

## Documentation Structure — Reference

All docs follow [`PROJECT_DOCS.md`](./PROJECT_DOCS.md): maps every doc type to 
its location (root, `docs/`, `memory/`, `backlog/`, subsystems). Check it 
before creating or moving any doc. Reflects platform standard 
[`forge/standards/doc-placement.md`](https://github.com/Tessellate-Studio/forge/blob/main/standards/doc-placement.md).

## User-facing docs — use the template

Any runbook / how-to for me follows `docs/_USER_DOC_TEMPLATE.md`: plain-language
"what this is" → numbered "what you need to do" with real links → "how to verify
it worked". No jargon in the instructions.

## Branch placement — AUTOMATIC, do not ask

When a task's changes don't belong on the current branch, cut a new branch off
the default branch automatically. Signals: current branch name implies a
different scope (`ci/…`, `docs/…`, `chore/…`); unrelated uncommitted edits in
flight; the fix would mix concerns across PR boundaries. Naming:
`fix/<slug>`, `feat/<slug>`, `docs/<slug>`, `chore/<slug>`. Use `git worktree
add` when the current branch has uncommitted work to preserve. Separate code
commits from doc commits. Run the full test suite before either commit.

## Merged branches — rename to `done/<original>` AUTOMATICALLY

When a PR merges, rename the local source branch to `done/<original-name>` instead
of deleting it (drop `--delete-branch`, then `git branch -m <original>
done/<original>`). The `done/` prefix flags it as safe-to-prune. This trumps
"delete on merge".

## Orphan-branch fixes — port AUTOMATICALLY, do not ask

If a fix already exists as a commit on an unmerged/orphan branch and the current
task needs it, port it to a fresh branch off the default branch without asking.
Verify the fix's SHA is reachable from the default branch before marking any
log/BACKLOG entry shipped.

## Concurrent sessions — isolate the checkout, trust SHAs not HEAD

Several agents (and you) may drive one repo at once. In a shared working copy,
`HEAD` moves between commands — a commit lands on a stranger's branch, a branch
forks off a stray commit, a push carries an extra commit.

- **Hand each task to a worktree-isolated session** — check the "new worktree"
  box on handoff, or launch subagents with `isolation: "worktree"`. That session
  gets its own working dir + HEAD; the contention is gone. Don't do committable
  work in the shared main checkout when other sessions may be active.
- **A fresh worktree has no `node_modules`** — run `npm ci` (each package) before
  committing so the local gate (tsc / tests) can run; the pre-commit hook says so
  if they're missing. Don't junction deps into a harness-managed worktree — its
  automatic cleanup can follow the junction and delete the main checkout's deps.
- **SHA-explicit git — never trust "current branch".** Verify `git rev-parse
  --abbrev-ref HEAD` is the branch you intend before the first edit and before
  every commit/push; if it drifted, stop and surface. Push by refspec
  (`git push origin <sha>:refs/heads/<branch>`); prefer `git branch -f` /
  `git branch -m` over checkout-then-act.
- **Subagents:** the `Edit` tool resolves ABSOLUTE paths to the MAIN checkout, not
  an isolated worktree — use worktree-relative paths inside isolated subagents.

## External-tool actions — log DECIDED steps in `docs/user-actions-tracker.md`

When a session decides which external tool to use for a setup (DNS, email, OAuth
app, a CI secret, etc.), an entry lands in `docs/user-actions-tracker.md` before
the session ends — actual provider, actual values, numbered copy-pasteable steps,
verification command(s), and a "where to look" diagnostic. Not an evaluation of
options (that's BACKLOG); only the decided outcome. BACKLOG holds what+why; the
tracker holds exactly-how. Cross-link, don't copy.

## Planning docs

- `BACKLOG.md` — durable record of out-of-scope work (P0–P4); check before
  proposing "should we build X?" (created when there's real out-of-scope work)
- `USER_PATHS.md` — happy + edge + uncovered user flows; update when a flow drifts.
- `WEEKLY_DIGEST.md` — append-only weekly priority history (produced by
  roadmap-pulse; created on its first run).
- `memory/` — app-specific regression log, anti-patterns, design vision.

## Bug-fix pre-flight — read the regression log first

Before writing code for a reported bug: read `memory/project_regression_log.md`
end to end, skim for matching symptoms. Match → link it, check whether the prior
fix regressed (run its test), patch from there. No match → TDD loop below, then
add a new entry (symptom → root cause → fix → test → lesson). 3+ entries on one
theme → promote to an anti-pattern.

## TDD — write tests first

New feature or bug fix: (1) write the test describing expected behaviour, (2) run
it, confirm it fails for the right reason, (3) write the code, (4) full suite
green before commit. New screen → render smoke test. New store action → unit
test. New API function → error-path test. Bug fix → regression test reproducing
the bug first.

## Error boundaries

Every screen is wrapped in a screen-level error boundary. New screen: create the
`Safe{ScreenName}` wrapper, use it in the navigator, add a smoke test.

## Testing

Unit/component tests run locally and must stay green before any commit
(`npx jest --no-coverage` + `npx tsc --noEmit`).

## Builds — cloud ONLY, never compile natively on the laptop

Set 2026-07-14 (user rule, all projects): native compilation (Gradle /
CMake / `expo prebuild`+`gradlew`) must NOT run on the user's machine —
local builds consumed it to breaking point, and Windows' 260-char path
limit breaks CMake object paths anyway. To produce an APK:

1. `gh workflow run build-android-apk.yml --ref master`
2. `gh run download <run-id> --name mood-layer-apk`
3. `adb install -r app-release.apk`

Diagnose build failures from `gh run view <run-id> --log-failed` — never
"reproduce locally" as the first step. Metro / Expo Go dev serving, jest,
and tsc stay local-OK (JS-only, and the pre-commit gate needs them).

## Code style

Use theme tokens (colours, spacing, typography, alphas) — never hardcoded
literals (see the no-hardcoded-values anti-pattern). Package id:
`com.tessellate.moodlayer`.

---

## App-specific

<!-- Everything below is THIS app's delta. The rules above come from forge and
     should not be edited here — change them in forge/references/CLAUDE.base.md. -->

### What this app is

**The Mood Layer — track your emotional quilt.** Consumer emotion-tracking
Android app (Expo SDK 55, RN 0.83, React 19, portrait). Two grounding concepts:

- **Emotional quilt (Paul Ekman):** we always feel several emotions at once. A
  check-in captures 1–5 co-occurring emotions, each with intensity 1–4; the home
  screen renders them as a growing monochrome quilt (one patch per check-in,
  subdivided per emotion).
- **Emotional fluidity (Joe Hudson):** resilience comes from feeling emotions in
  the body instead of resisting them. Four resistance tells (looping thoughts,
  harsh judgment, binary stuckness, better/worse-than comparison); resisted
  fear→anxiety, resisted sadness→numbness, resisted anger→stuckness→depression.

**Naming note:** this repo took the `mood-layer` name on 2026-07-07. The
brand-side Shopify app that previously held it is now **Loom**
(`Tessellate-Studio/loom`). The two are unrelated — never port code or docs
between them.

### Hard rules (this app)

- **Local-only data.** All user data lives on-device (zustand persist →
  AsyncStorage). No accounts, no server, no analytics, no crash-reporting SDKs.
  Sending emotional data anywhere is an anti-pattern until the user explicitly
  decides otherwise (then it goes through the tracker + a privacy review).
- **Typewriter ink, Atlas hues in two registers (user-locked 2026-07-08,
  extended 2026-07-13 — "layers you can tell apart").** Every colour comes from
  `src/constants/theme.ts`. Text, lines, buttons, and backgrounds stay
  ink/paper greys on warm cream, with the `PaperTexture` grain on screen
  surfaces. Hue follows the Atlas of Emotions families (anger red, fear
  violet, sadness blue, disgust green, enjoyment amber, plus harmonised
  surprise tan / contempt mauve, and anticipation teal / trust rose for the
  two Plutchik families user-added 2026-07-13) in exactly two
  registers: `familyPalette` — soft pastels, solely for quilt patch
  fills/swatches/dials — and `mutedPalette` — the same hues desaturated
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
