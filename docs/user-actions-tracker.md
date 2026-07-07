# User-actions tracker

Durable record of every external-tool setup that has a **decided** path — the one
place to look when *"where did I leave that setup?"* comes up. Holds actual
providers, actual values, actual steps. Decisions/evaluations live in `BACKLOG.md`
(when it exists); this file holds *exactly how*.

Legend: ✅ done · 🟡 in progress (action left) · 🔲 not started.

## Status at a glance

| Item | Status | What's left (you) |
|---|---|---|
| rubric-sdk dev dependency | 🔲 | Optional: `npm i -D github:ramsaptami/rubric-sdk` (agent sandbox can't install from a personal-repo git URL; roadmap-pulse degrades gracefully without it) |

No other external setups decided yet. The app is local-only by design — no
backend, auth, analytics, or crash-reporting services to configure.
