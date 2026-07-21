# Weekly Digest — The Mood Layer

Append-only history of weekly priority decisions, produced by the
`forge:roadmap-pulse` skill. Newest section on top. Each item cites the source
(`file:line` or commit SHA) that justifies its status.

---

## 2026-07-19 — second pulse

> **Caveat on sourcing:** git was unavailable during the pulse itself (the Bash
> tool was gated by a model-availability classifier), so the analysis below was
> sourced from `BACKLOG.md` and `docs/user-actions-tracker.md` rather than
> verified against `origin/master`. Git recovered at commit time and
> `origin/master` had moved 5 commits ahead — the "Reopened" note below is the
> one correction that surfaced. The rest is still doc-sourced; **next run should
> re-verify against git.**

**Bottom line:** a big week — the Circle relay went from "five open decisions"
to **built, deployed and curl-verified** (2026-07-18), and the Play Store route
was **re-decided away from DUNS/org to an indie account**. Net effect: almost
everything now converges on one action — **the EAS dev build**, which is the
single gate on four separate unverified things. That's #1 and it isn't close.

**Honesty pass — two corrections, both in `BACKLOG.md`:**
1. P0 "Circle: true auto-deliver — *blocked on five decisions*" was stale. The
   tracker (§"Circle relay", 2026-07-18) shows all five settled, the
   `moodlayer` schema + `moodlayer-relay` v2 edge function deployed, and a curl
   round-trip verified. Rewritten as shipped, with the five resolutions recorded.
2. P2 "Play Store under Tessellate org, DUNS applied" was superseded. Tracker
   row (2026-07-18) re-decides to the **indie** route — personal account, 12
   testers / 14 days closed testing. Rewritten; the old decision is marked
   superseded rather than deleted.
   Also fixed: BACKLOG + tracker still credited **rubric-sdk** for scoring;
   it was merged into `@tessellate-studio/forge` on 2026-07-17 (PR #21,
   `07e84af`), which is what `package.json:40` actually carries.

**Scoring:** existing forge/rubric totals carried forward where an item already
had one; new/changed items ranked by judgment this run (the scorer couldn't be
executed — no shell). Flagged inline.

### Prioritized list

| Rank | Item | Score | Why now | Who | Source |
|---|---|---|---|---|---|
| 1 | **EAS dev build** | **8/12** | Was one gate, is now **four**: "Name it" reminders, Circle share reminders (`c547258`), the Phase-2 background relay wake + "week arrived" notification, and an on-device look at the icons (`e862632`). Nothing else unblocks this much. `eas.json` scaffolded, EAS login done — it's one command. | **User** | tracker EAS row; regression-log #4 |
| 2 | **Two-phone Circle relay test** | *judgment — high* | The relay is deployed and curl-verified but **never run on real hardware**. Highest-risk shipped surface: encryption + pairing + delete-on-read across two devices. Needs the #1 build first. | **User** (2 phones) | tracker §"Circle relay" 5 |
| 3 | **Clean device pass of v0.2.0** | **7/12** | Still never completed — the last attempt died on a dev-server connectivity error before a clean walkthrough. Gates the Play submission. | **User** (device) | BACKLOG P1; regression-log #6 |
| 4 | **Open the personal Play developer account** | **6/12** | Newly unblocked: the DUNS wait is gone, so this is now just a $25 signup — but it starts a **14-day** closed-test clock with 12 testers, so the calendar cost is front-loaded. Starting it early costs little and buys two weeks. | **User** | tracker Play row (2026-07-18) |
| 5 | **De-overwhelm the word pickers** | *judgment — medium* | The only substantive product work left in the open backlog; folded families shipped (`f7cb894`) but the follow-ups (recent-words row, family-first two-step, type-to-find) are unstarted. Do after the device checks clear. | Agent + user | BACKLOG P3 |

**Closed since last pulse:** Circle scheduled-share reminders (PR #13,
`c547258`); app icons (PR #14, `e862632`); folded word families (PR #12,
`f7cb894`); forge migration (PR #21, `07e84af`); Circle relay backend
(2026-07-18).

**Reopened — org billing.** The 2026-07-18 "go public for free Actions minutes"
stopgap was **reversed 2026-07-20** (`65145a0`): upcoming features are IP the
user wants closed, and only private visibility prevents on-platform viewing and
forking. That un-dodges the billing problem — the org's 2,000 included minutes
were exhausted 2026-07-18 and reset Aug 1, so **billing must be fixed before the
visibility flip** or this repo's CI dies the moment it goes private. Two
dashboard actions, ordered, in the tracker's "Repo visibility" section. Treat
this as a peer of #1 on the list above — it isn't scored because it's an
account/billing chore, not project work, but it gates all CI.

**Dependencies:** #1 gates #2 *and* the reminder/icon verifications; #3 gates
#4's production promotion; #4's 14-day test window is the long pole on launch.

**Next pulse:** 2026-07-26 — and **re-verify this section against git**, which
this run could not reach.

---

## 2026-07-12 — first pulse (rescored with rubric-sdk)

**Bottom line:** v0.2.0 is shipped and honest — 9 screens, 185 test cases, no
open PRs/issues, no stale doc claims. The one real gap: the **"Name it"
reminders feature has never actually run** — it no-ops in Expo Go by design and
there was no dev build to fire it. That's #1. Release path is now **decided**:
publish The Mood Layer directly to Google Play under the Tessellate org (DUNS
applied). rubric-sdk is now installed, so these are real numeric scores, not
judgment calls.

**Honesty pass:** no shipped-claim corrections. README/CLAUDE "shipped" claims
all verify against git — v0.2.0 in `cd63188` (#9), redesign in #4–#8, all on
`origin/master` (`4c0ad06`). Regression log (6 rows) is consistent with history.
**One tracker correction:** the rubric-sdk item claimed "agent sandbox can't
install from a personal-repo git URL" — that's false; it installed cleanly this
run (59 packages, exit 0), so the item is now ✅ and scoring is numeric.

**Scoring:** `@tessellate-studio/rubric-sdk` `evaluateFromContext` (heuristic,
rule-based, auditable — no LLM). Axes: Impact / Complexity (inverse: higher =
cheaper) / Reusability / Strategic, each 0–3; total 0–12.

### Prioritized list (by rubric total)

| Rank | Item | Score | I/C/R/S | Why now | Who | Source |
|---|---|---|---|---|---|---|
| 1 | **EAS dev build → verify "Name it" reminders on device** | **8/12** Nice | 2/2/2/2 | Only shipped feature that has *never executed* — reminders can't fire in Expo Go (removed SDK 53+). `eas.json` now scaffolded; EAS login done. Left: run the build + confirm a reminder fires. | **User** | `tracker` EAS row; regression-log #4 |
| 2 | **Clean device pass of The Mood Layer v0.2.0 redesign** | **7/12** Nice | 2/2/1/2 | Last on-device session hit a dev-server connectivity error (stale LAN IP + Public firewall) *before* a clean pass across Quilt cloth / Insights depth / Circle / judgment multi-select / Experiments. | **User** (device); agent preps Metro | regression-log #6; commit `4c0ad06` |
| 3 | **Create `BACKLOG.md`** | **7/12** Nice | 0/3/3/1 | No durable out-of-scope tracker existed — cheap, reusable, unblocks future planning. **Done this run.** | Agent ✅ | `BACKLOG.md` (created 2026-07-12) |
| 4 | **Publish to Google Play (direct, under Tessellate org)** | **6/12** Nice | 3/0/1/2 | Highest *impact* (3/3) but costed down: external Play Console setup + depends on DUNS approval and a clean device pass. **Decision made 2026-07-12** (was "undecided"): direct Play publish under the org account; DUNS applied. | **User** (product/ops) | `BACKLOG.md` P2; `tracker` Play row |

**Closed this run:** rubric-sdk install (tracker ✅); `BACKLOG.md` created.

**Dependencies:** #1 gates confidence in reminders; #2 gates a "v0.2.0 verified"
claim *and* the Play submission (#4); #4 also gates on DUNS approval. #3 was
independent and is done.

**Next pulse:** 2026-07-19. Expect #1/#2 to be the story — whether the dev build
fired a reminder and whether v0.2.0 got a clean device pass.
