# ADR-003 — Canonical terminology for educative copy

- **Status:** accepted 2026-08-31 — confirmed by the user asking to implement
  it as scoped (the one term choice and both no-gos below stand).
- **Tier:** ADR (tactical, reversible — copy + one test file, no dependency,
  no screen/flow changes). Scored via the sizing guide: files touched sits in
  the Pitch band (5-7), but blast radius (content layer only), reversibility
  (plain revert), and duration (hours) all score ADR — weighted sum 9, exactly
  the sizing guide's stated boundary, which it says to resolve toward the
  lighter tier. The actual decision underneath the file count is also
  ADR-shaped: a choice between three concrete alternatives (status quo /
  in-repo jest glossary check / adopt an external prose linter), not a new
  screen or flow.
- **Decider:** user (asked directly: "is there a standard for educative
  content — the app sounds confusing"; "yes, plan it out").

## Context

The product owner asked whether an internal standard governs the app's
teaching copy and, separately, whether one exists in industry — both because
the app "at times sounds confusing." A grep-verified audit found the answer to
the first question is: barely. `CLAUDE.md` states tone rules in two sentences
(gentle/non-clinical/non-directive; never say quilt/stitch/sew) and
`content.shape.test.ts`/`fieldGuideContent.test.ts` automate that tone check
on only 4 of 15 content files. Nothing checks whether the *same concept* is
named the same way twice.

That gap is real, but narrower than it first looked once every citation was
checked directly against the file:

- **Confirmed user-facing defect:** `src/content/insights.ts:81,92` call the
  same mechanism a **"cover word"** — twice — a term that appears nowhere
  else in the product. The check-in flow that produces this state
  (`src/content/checkInCopy.ts:12-14`, `src/content/emotions.ts:157-192`) and
  the Field Guide's own section for it
  (`src/screens/FieldGuideScreen.tsx:97-99`) both already say **"underneath"**
  consistently. A user who sees an Insights card has no way to connect
  "cover word" to the "underneath" language they met in the check-in itself.
- **Not a defect — already load-bearing intentional design:** each masking
  doorway's prompt uses its own metaphor (`emotions.ts:157` "wearing a coat,"
  `:177` "a lid," `:183` "outrunning a feeling"), but 4 of the 6 prompts
  already close on the shared word "underneath" (`:157,171,177,190`) — the
  metaphors are decorative variety inside a consistent frame, not competing
  vocabulary. Separately, `underneath.ts:10-11` states outright that "Numb"
  deliberately carries two different explanations across the check-in chip
  and the Field Guide ("two doors into the same room") — a documented choice,
  not drift.
- **Dev-facing only, not user-facing:** "helper sheet" (code comments and test
  names for the per-family teaching panel opened via the "learn →" link —
  `LearnLink.tsx:4`, `WordTemperatureRow.tsx:24`) now sits one word away from
  "helper notes" (the Settings label for first-visit coach marks, shipped
  this session — `SettingsScreen.tsx`). No user ever reads the string "helper
  sheet"; the collision only costs a future reader of the code a beat of
  confusion, not a user.
- **The gap that lets this recur:** there is no written list of which term
  wins per concept, and no test would catch a second "cover word"-style
  coinage — proven by this session itself introducing a *third* independent
  echo of it, `CheckInFlowScreen.tsx:366`'s code comment "What a cover word
  carries," written today with no cross-reference to either the existing
  Insights usage or the "underneath" language three lines away in the same
  file's user-facing copy.

Industry framing, researched via WebSearch (2026-08-31): the general principle
is Nielsen Norman Group's **"Consistency and standards"** heuristic — "users
should not have to wonder whether different words... mean the same thing" —
one of the original 10 usability heuristics, industry-standard in UX since the
1990s. The common artifact orgs build to enforce it is a **content style
guide with a canonical-terms glossary**; GOV.UK, 18F, Mailchimp, and Microsoft
all publish theirs. [ISO 24495-1:2023](https://www.iso.org/standard/78907.html)
is the first true international standard for plain language, but it governs
document clarity generally, not a product's internal term consistency, so it
informs this decision without dictating its shape.

## Decision

Adopt a lightweight, in-repo glossary + jest-enforced ban, not an external
linter. Concretely:

1. **New `memory/content_glossary.md`** — one canonical term per recurring
   teaching concept, its banned synonyms, and which files use it. Starts with
   exactly one entry (the one confirmed defect): `underneath` wins over
   `cover word`.
2. **Fix `insights.ts:81,92`** — replace "cover word" with phrasing built on
   "underneath," matching the check-in flow and Field Guide.
3. **New test in `content.shape.test.ts`** — a single cross-file check:
   scan every `src/content/*.ts` string export for each glossary file's
   banned-synonym list and fail if found anywhere outside that concept's own
   canonical phrasing. This is the same pattern already proven for the
   quilt/stitch/sew ban (`content.shape.test.ts:359-363`) generalized from one
   hardcoded regex to a small data-driven table — no new tooling, no new
   dependency, fits the existing idiom the team already reads.
4. **Extend the existing tone lint** (no `!`, no "you should"/"you must," per
   `content.shape.test.ts:352-364`) to `EMOTION_HELPERS` (`helpers.ts`) and
   `ONBOARDING_SLIDES` (`onboarding.ts`) — the two highest-read teaching
   surfaces in the app, currently the only content files with *no* tone
   assertion at all.
5. **Do not touch:** the masking-state metaphors (coat/lid/outrunning), the
   deliberate dual description of "Numb," or the internal-only "helper sheet"
   naming. Recorded as explicit no-gos below so they don't get relitigated as
   "inconsistency" later.

## Why not adopt a prose linter (Vale)

[Vale](https://vale.sh/) is the real industry tool for exactly this job —
CI-integrated, `accept.txt`/`reject.txt` controlled vocabularies, importable
Microsoft/Google style rules, used by Datadog, Meilisearch, PostHog. Rejected
for this app specifically: it's a separate Go binary + CI step for a total
teaching-copy surface of 15 short TypeScript files, all already validated by
jest at PR time. The cost (new tool, new CI job, a second place tone rules
live) buys nothing an eight-line jest table doesn't already buy at this scale.
Revisit if `src/content/` grows past what a glossary table can track by eye —
not a concern today.

## Rabbit hole to bound

Flattening every masking-state prompt to the same closing phrase ("...want to
look underneath?") would be the tempting over-correction. Don't: the app's
whole voice is built on Courier Prime typewriter personality and per-state
metaphor is part of that, and 4 of 6 states already anchor on "underneath"
without losing their individual flavor. If the two stragglers (`busy`,
`overwhelmed`) ever get touched for another reason, adding an "underneath"
close is a one-line nice-to-have — not a reason to open this ADR's scope now.

## Consequences

- **Positive:** the next content file written has a glossary to check against
  instead of inventing its own metaphor, and a test that fails loudly if it
  doesn't. Directly answers the product owner's question — yes, a standard
  now exists, and it's the same shape (glossary + tone rules) the rest of the
  industry uses, just sized for a 15-file app instead of a linter deployment.
- **Negative:** a glossary is only as good as its upkeep — nothing forces a
  future session to add a new concept to it before shipping copy that needs
  one. Mitigated by the glossary living next to the test that reads it
  (`content.shape.test.ts`), so extending one is a visible prompt to extend
  the other.
- **Neutral:** the "helper sheet" vs "helper notes" naming collision is
  explicitly deferred, not fixed — a future rename of the internal
  identifier (e.g. to "meaning sheet") is a free, zero-risk cleanup whenever
  someone is already touching `LearnLink.tsx`/`WordTemperatureRow.tsx`, but
  isn't worth its own PR today since no user-facing string is affected.

## Verification

`content.shape.test.ts`'s new cross-file test is the contract: it must fail
red on current `main` (the "cover word" instances existing) before the fix,
and pass green after — proving the guard actually catches the defect it was
written for, not just a shape check that happens to pass. The two newly
tone-linted files (`helpers.ts`, `onboarding.ts`) get the same
no-`!`/no-should/no-must assertions already proven on `CHECK_IN_COPY` and
`COACH_MARKS`.

## Implementation plan (once accepted)

1. `memory/content_glossary.md` — one entry: `underneath` (canonical) vs
   `cover word` (banned), with the file list it applies to.
2. Failing test first in `content.shape.test.ts`: the cross-file banned-term
   scan, plus new tone-lint blocks for `EMOTION_HELPERS` and
   `ONBOARDING_SLIDES`.
3. Fix `insights.ts:81,92` to use "underneath" phrasing.
4. `npx jest --no-coverage` + `npx tsc --noEmit` green; quality pass
   (`/code-review`, `/simplify`) since this touches a shared test file.
5. Commit the ADR separately from the code, per the plan skill's convention
   (`docs: add decision adr-003-canonical-content-terminology`), then the fix
   as its own commit on a fresh branch off master.

## Open question for the user — resolved

Confirmed 2026-08-31 by the user asking to implement this ADR: "underneath"
over "cover word" stands, and the no-gos (masking-state metaphors, "Numb"'s
dual explanation, "helper sheet"/"helper notes") stay untouched.
