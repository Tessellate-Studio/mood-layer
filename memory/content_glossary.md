# Content glossary — canonical terms for educative copy

Companion to ADR-003. One row per recurring teaching concept that has drawn
more than one name in the copy. `content.shape.test.ts`'s glossary guard
reads this table's shape (canonical vs. banned) — add a row here before
shipping copy that needs one; the test only catches what's listed.

The guard parses every `.ts` file's source text directly under `src/content/`
(via the TypeScript compiler API, skipping comments and internal
id/type-literal identifiers) — it is not a hand-picked list of imports, so a
new content file, and copy built inside a generator function rather than a
static const, are both covered automatically. The "Where it lives" column
below is informational (where the term is currently used), not the scan's
boundary.

| Concept | Canonical term | Banned synonyms | Where it lives |
|---|---|---|---|
| The feeling a masking state (e.g. "stressed", "fine") is standing in front of | `underneath` | `cover word` | `content/checkInCopy.ts`, `content/emotions.ts`, `content/insights.ts`, `content/helpers.ts`, `content/resistance.ts`, `content/monthlyDigest.ts`, `content/underneath.ts`, `screens/FieldGuideScreen.tsx` |
| The app's user-facing framing for holding several emotions at once (CLAUDE.md, "the app SPEAKS in layer language") | `layers` | `quilt`, `stitch`, `sew` | every `src/content/*.ts` file — the quilt stays named exactly once, outside content copy: Settings → About the ideas |

## Explicitly not glossary drift (don't relitigate)

- **Masking-state metaphors** (`emotions.ts` — "wearing a coat," "a lid,"
  "outrunning a feeling") are decorative variety inside the shared
  `underneath` frame, not competing vocabulary. Leave them.
- **"Numb" carrying two explanations** (`underneath.ts:10-11`, the check-in
  chip vs. the Field Guide) is a documented deliberate choice ("two doors
  into the same room"), not drift.
- **"helper sheet"** (dev-only naming in `LearnLink.tsx` / `WordTemperatureRow.tsx`
  comments and test names, for the per-family teaching panel) sitting one
  word from **"helper notes"** (the user-facing Settings label for first-visit
  coach marks) is a dev-facing-only collision, deferred per ADR-003. Free to
  rename `LearnLink`'s internal identifier whenever someone is already
  touching that file — not worth its own PR.
