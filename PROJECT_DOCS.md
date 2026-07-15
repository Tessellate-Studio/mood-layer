# Project Docs — The Mood Layer

Documentation structure and placement guide for this repo. All planning, shipping decisions, and operational knowledge live here. Start with the most relevant section.

## Quick links

- **How to work here?** → `CLAUDE.md`
- **What's out of scope?** → `BACKLOG.md` (P0–P4 sections)
- **What happened this week?** → `WEEKLY_DIGEST.md` (newest section on top)
- **What broke before?** → `memory/project_regression_log.md` (bug record; read before fixing)
- **Where's the external setup I started?** → `docs/user-actions-tracker.md` (decided paths only)

## Documentation by purpose

### Root-level docs

**`README.md`** — Product vision + tech stack. Product language (emotional quilt, fluidity), design language (ink-on-paper, no colour), stack (Expo SDK 55, RN 0.83, React 19). Read this first if you're new to the app. *Kept concise; tech detail stays in CLAUDE.md.*

**`CLAUDE.md`** — Claude Code instructions: communication style, authority-not-assumption rule, anti-patterns, branch placement, concurrent-session isolation, TDD, testing, error boundaries. First half is shared forge policy (summarized here for speed); second half is app-specific (emotional quilt hard rules, local-only stance, typewriter voice, Reanimated + Jest mocking, reduce-motion requirement, versioned Expo docs). Change the shared rules in forge, not here.

### Planning & shipping

**`BACKLOG.md`** — Durable record of out-of-scope and not-yet-started work. Sections: P0 (this week) → P4 (someday). Holds the *what + why*. **Decision:** does this go in the app? Its answer lives here first (before code). External-tool decisions get copied to `docs/user-actions-tracker.md` once decided.

**`WEEKLY_DIGEST.md`** — Append-only history of weekly priority decisions, produced by `forge:roadmap-pulse` skill. Newest section on top. Each item cites the source (`file:line` or commit SHA) that justifies its status. Scoring via `@tessellate-studio/rubric-sdk` (Impact / Complexity / Reusability / Strategic). Dependencies tracked (e.g. "item #2 gates #4"). Run the pulse manually with "run roadmap pulse" or "what should I focus on this week?" if the cron misses.

### Operational knowledge

**`memory/project_anti_patterns.md`** — App-specific build guardrails. Numbered 1–N as they're earned. Covers: no emotional data leaves the device, no colour (monochrome only), never gamify, gentle tone, Reanimated/Jest mocking, SVG pattern generation. Cross-app rules live in `forge/standards/anti-patterns.md` (TDD, hardcoded colours/fonts, hooks discipline, WCAG 2.1 AA, concurrent-session isolation, etc.) — read both before a feature or fix in their areas.

**`memory/project_regression_log.md`** — Tabulated record of bugs (symptom → root cause → fix → test → lesson). Read end-to-end before fixing anything with matching symptoms. 3+ rows on one theme get promoted to an anti-pattern. **Bug-fix pre-flight rule:** read the log first. Never assume a bug is new.

**`docs/SECURITY.md`** — Dependency-alert disposition log (triaged per `forge/standards/security-triage.md`). Date → alert → disposition (fix / accept / not-applicable) → why. Context: local-only app, so any network-capable dependency or data-leaving-device is a security/privacy finding by definition. Currently empty (no alerts yet); rows land here as they arise.

### External-tool setup

**`docs/user-actions-tracker.md`** — Single place to look when "where did I leave that setup?" comes up. **Decided** external setups only (Play Console, EAS, Auth, DNS, Stripe, etc.); unevaluated options stay in BACKLOG. Holds actual providers, actual values, numbered copy-pasteable steps, verification commands, and "where to look" diagnostics for recovery. Status legend: ✅ done · 🟡 in progress · 🔲 not started. Cross-linked to BACKLOG entries that reference the same decision.

**`docs/_USER_DOC_TEMPLATE.md`** — Template for runbooks / how-to docs meant for the user. Structure: plain-language "what this is" → numbered "what you need to do" (with real links) → "how to verify it worked". No jargon. Use this for any user-facing guide (device setup, Play install, etc.).

### Version & reference

**`docs/user-actions-tracker.md` (Device testing section)** — Quick reference for Expo Go on this PC: LAN IP changes between sessions (DHCP), firewall is Public. Always read the current IP (`npx expo start`); don't reuse yesterday's URL. Regression-log #6 for the failure mode.

## When to create a new doc

- **`USER_PATHS.md`** — if happy-path / edge / uncovered-flow analysis gets longer than a BACKLOG entry (not yet needed).
- **`RELEASE_V2.md`** — if a V2 / major scope decision is afoot (not yet needed; today's scope is maintenance + v0.2.0 shipped).
- **`backlog/`** — long-form planning docs for parked items, cross-linked from BACKLOG entries (not yet needed; today's items fit in BACKLOG).
- **`memory/project_<topic>.md`** — app-specific knowledge that doesn't fit anti-patterns or the log (e.g. design vision, font plans, architecture decisions). Cross-link from CLAUDE.md's app-specific section or from the entry that references it.

## Maintenance

**Regression log + anti-patterns:** updated after every bug fix and every 3-bug-on-one-theme promotion. Read-first rule enforces this — if a fix isn't logged, the next person reimplements it.

**BACKLOG:** reviewed at every roadmap-pulse run (weekly, Sunday 16:00 IST). Honesty pass confirms shipped claims, dependency inference cross-checks related repos' state, rubric scoring ranks open work.

**WEEKLY_DIGEST:** appended automatically by roadmap-pulse. Trigger it manually if a decision is urgent and can't wait for Sunday.

**BACKLOG → user-actions-tracker:** when a decision is made (not evaluated, decided), copy its *exactly-how* steps to the tracker. BACKLOG evolves; the tracker is stable and indexed. Once a setup is done, mark the tracker row ✅ — that closes the BACKLOG entry too.

**Shared rules (forge):** CLAUDE.md summarizes them. When forge changes the rule, update the summary here on the next session. The source of truth is `forge/standards/anti-patterns.md` + `forge/references/CLAUDE.base.md`, not this copy.
