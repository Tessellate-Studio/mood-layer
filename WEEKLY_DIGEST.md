# Weekly Digest — The Mood Layer

Append-only history of weekly priority decisions, produced by the
`forge:roadmap-pulse` skill. Newest section on top. Each item cites the source
(`file:line` or commit SHA) that justifies its status.

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
