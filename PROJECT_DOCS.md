# Project Docs — The Mood Layer

Quick reference for where every doc lives and what it contains.

---

## Root-level docs — rules, status, and planning

| Doc | Path | Holds |
|-----|------|-------|
| **Project rules** | [`CLAUDE.md`](./CLAUDE.md) | Shared forge policy (TDD, WCAG, isolation) + app-specific rules (emotional quilt, local-only, typewriter voice, Reanimated, versioned Expo docs) |
| **README** | [`README.md`](./README.md) | Product vision + tech stack. Emotional quilt, ink-on-paper design, Expo 55/RN 0.83 |
| **Backlog** | [`BACKLOG.md`](./BACKLOG.md) | Out-of-scope work (P0–P4). Shipping decisions live here first |
| **Weekly digest** | [`WEEKLY_DIGEST.md`](./WEEKLY_DIGEST.md) | Weekly priority decisions (roadmap-pulse, rubric-sdk scoring, dependencies). Newest on top |
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
- **Before shipping:** walk `BACKLOG.md` for each feature, confirm all paths work end-to-end.
- **Before deployment:** check `docs/SECURITY.md` (open alerts) + `docs/manual-runbook.md` (verified steps).

---

## What's NOT here (yet)

- **User paths** — no `USER_PATHS.md` (add if happy/edge/uncovered-flow analysis exceeds a BACKLOG entry). `CLAUDE.md` still lists it as a planning doc; that is aspirational, not a claim it exists.
- **Release roadmap** — no `RELEASE_V2.md` (add if major scope is in flight; today's scope: v0.2.0 shipped).
- **Long-form planning** — no `backlog/` subdirectory (add when parked items need detail; today's items fit in BACKLOG.md).

---

## Maintaining this guide

- When you add a new doc, update this guide to list it.
- When a doc's purpose shifts, update the "Holds" column.
- When you archive a doc, move it to `docs/archive/` and note the reason.
- Keep this structure in sync with `CLAUDE.md` — the two are the canonical maps.

## Maintenance

**Regression log + anti-patterns:** updated after every bug fix and every 3-bug-on-one-theme promotion. Read-first rule enforces this — if a fix isn't logged, the next person reimplements it.

**BACKLOG:** reviewed at every roadmap-pulse run (weekly, Sunday 16:00 IST). Honesty pass confirms shipped claims, dependency inference cross-checks related repos' state, rubric scoring ranks open work.

**WEEKLY_DIGEST:** appended automatically by roadmap-pulse. Trigger it manually if a decision is urgent and can't wait for Sunday.

**BACKLOG → manual runbook:** when a decision is made (not evaluated, decided), copy its *exactly-how* steps to the runbook. BACKLOG evolves; the runbook is stable and indexed. Once a setup is done, delete its section, collapse it to a `## Done` one-liner and repoint its table row at `#done` — that closes the BACKLOG entry too. A finished setup left as a full section is how the runbook rots.

**Shared rules (forge):** CLAUDE.md summarizes them. When forge changes the rule, update the summary here on the next session. The source of truth is `forge/standards/anti-patterns.md` + `forge/references/CLAUDE.base.md`, not this copy.
