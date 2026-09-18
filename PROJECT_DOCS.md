# Project Docs — The Mood Layer

Quick reference for where every doc lives and what it contains.

---

## Root-level docs — rules, status, and planning

| Doc | Path | Holds |
|-----|------|-------|
| **Project rules** | [`CLAUDE.md`](./CLAUDE.md) | Shared forge policy (TDD, WCAG, isolation) + app-specific rules (emotional quilt, local-only, typewriter voice, Reanimated, versioned Expo docs) |
| **README** | [`README.md`](./README.md) | Product vision + tech stack. Emotional quilt, ink-on-paper design, Expo 55/RN 0.83 |
| **Work items** | [GitHub issues, P0–P3](https://github.com/Tessellate-Studio/mood-layer/issues?q=is%3Aissue+is%3Aopen+label%3AP0%2CP1%2CP2%2CP3+sort%3Acreated-asc) | Open work, one issue per item, scored weekly by roadmap-pulse. `BACKLOG.md` is a retired pointer (RFD 004) |
| **Weekly digest** | The roadmap Artifact | Weekly priorities, refreshed by roadmap-pulse. [`WEEKLY_DIGEST.md`](./WEEKLY_DIGEST.md) is retired history, no longer appended |
| **User paths** | [`USER_PATHS.md`](./USER_PATHS.md) | Happy / edge / uncovered flows per feature. Seeded 2026-08-30 with the first-time helper-notes path |
| **Anti-patterns** | [`memory/project_anti_patterns.md`](./memory/project_anti_patterns.md) | Build guardrails (no data leaves device, no colour, no gamify, Reanimated mocking, SVG generation). Cross-link to forge/standards/anti-patterns.md |
| **Regression log** | [`memory/project_regression_log.md`](./memory/project_regression_log.md) | Every bug (symptom → root → fix → test → lesson). Read before fixing anything familiar |
| **Decisions** | [`memory/decisions/`](./memory/decisions/) | ADR / pitch / RFD records from `/forge:plan`, numbered by type (`adr-001-…`). Started 2026-08-13 with the crash-reporting decision |

---

## `docs/` — Operations & Setup

| Doc | Path | Holds |
|-----|------|-------|
| **Security policy** | [`SECURITY.md`](./docs/SECURITY.md) | Dependency-alert triage (fix / accept / N/A) + why. Local-only context: any network-capable or data-leaving dep is a finding |
| **External-tool setup** | [`manual-runbook.md`](./docs/manual-runbook.md) | **Decided** setups only (Play, EAS, Auth, DNS, Stripe). Actual values, copy-pasteable steps, verification commands. Status: ✅ / 🟡 / 🚧 / 📖 / 🔲. **Renamed** from `user-actions-tracker.md` (2026-08-11) |
| **User doc template** | [`_USER_DOC_TEMPLATE.md`](./_USER_DOC_TEMPLATE.md) | Runbook template: plain-language "what" → numbered "how" (real links) → "verify" |
| **Device testing quick ref** | [`manual-runbook.md` (Expo section)](./docs/manual-runbook.md) | LAN IP changes per session; verify with `npx expo start`. Regression-log #6 for failures |

---

## How to read this guide

- **Before coding:** skim `CLAUDE.md` (rules + isolation checklist) + `memory/project_anti_patterns.md` (why each rule matters).
- **Before fixing a bug:** scan `memory/project_regression_log.md` for a matching symptom.
- **Before shipping:** walk each feature's issue, confirm all paths work end-to-end.
- **Before deployment:** check `docs/SECURITY.md` (open alerts) + `docs/manual-runbook.md` (verified steps).

---

## What's NOT here (yet)

- **Release roadmap** — no `RELEASE_V2.md` (add if major scope is in flight; today's scope: v0.2.0 shipped).
- **Long-form planning** — no `docs/briefs/` yet (add a brief there, linked from its issue, when an item outgrows its issue body).

---

## Maintaining this guide

- When you add a new doc, update this guide to list it.
- When a doc's purpose shifts, update the "Holds" column.
- When you archive a doc, move it to `docs/archive/` and note the reason.
- Keep this structure in sync with `CLAUDE.md` — the two are the canonical maps.

## Maintenance

**Regression log + anti-patterns:** updated after every bug fix and every 3-bug-on-one-theme promotion. Read-first rule enforces this — if a fix isn't logged, the next person reimplements it.

**Work items (issues):** reviewed at every roadmap-pulse run (weekly, Sunday 16:00 IST). Honesty pass confirms shipped claims, dependency inference cross-checks related repos' state, rubric scoring ranks open work.

**Digest:** the roadmap Artifact, refreshed in place by each roadmap-pulse run. Trigger it manually if a decision is urgent and can't wait for Sunday. `WEEKLY_DIGEST.md` is retired history.

**Issue → manual runbook:** when a decision is made (not evaluated, decided), copy its *exactly-how* steps to the runbook. The issue evolves; the runbook is stable and indexed. Once a setup is done, delete its section AND its table row, and close the issue. The runbook carries outstanding work only; the decision stays in the issue (or `memory/decisions/`) and the steps stay in git. Keep a residual action, never a finished setup.

**Shared rules (forge):** CLAUDE.md summarizes them. When forge changes the rule, update the summary here on the next session. The source of truth is `forge/standards/anti-patterns.md` + `forge/references/CLAUDE.base.md`, not this copy.
