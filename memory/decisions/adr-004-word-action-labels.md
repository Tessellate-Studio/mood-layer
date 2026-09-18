# ADR-004 — Word-definition action labels: keep "Constructive / Ambiguous / Destructive", or soften them

- **Date:** 2026-09-18 (drafted from `BACKLOG.md` P1 "Hold-to-learn opens the FAMILY's helper, not the WORD's" → *Still open*)
- **Status:** proposed
- **Tier:** ADR. It is a copy-only change, three strings in one typed content file.
- **Decider:** user (owner)

## Context

PR #108 (2026-09-03) shipped word-level definitions. Each word gets a situational definition
plus three possible responses, grouped as the Atlas of Emotions groups them:
constructive, ambiguous, destructive. The owner asked for exactly that grouping: *"add the
constructive, ambiguous and destructive bit."*

The labels a reader sees are `WORD_ACTION_LABELS` in `src/content/wordDefinitions.ts`
(`'Constructive'`, `'Ambiguous'`, `'Destructive'`). `WordDefinitionContent.tsx` renders them
as row headers under every one of the ~121 words.

The backlog left one question open: *"no design review yet on whether the action-bucket
LABELS … read as clinical against the app's gentle voice — worth a look once it's seen on a
phone."* The relevant house rule is CLAUDE.md: *"Tone is gentle, never clinical or
directive."* "Destructive", shown directly under a feeling someone just named, is the word
most at risk.

Because the labels live in one typed map, any choice here changes three strings and nothing
else. The bucket *content* is unaffected.

## Options

**(a) Keep the Atlas terms.** They are accurate and recognisable, and they are what the owner
asked for. The risk is a clinical tone on the most sensitive surface of the app.

**(b) Soften the labels and keep the three buckets.** For example *"Tends to help" / "Could
go either way" / "Tends to hurt"*, or *"Moves you forward" / "Depends how it's held" / "Can
cost you"*. This keeps the Atlas's third bucket (the point of the design) in the app's own
voice. **Cost:** three strings, plus a check that `wordDefinitions.test.ts`'s gentle-copy rule
still passes.

**(c) Keep the Atlas terms, with a one-line gloss.** For example, a small caption under the
section: *"Ways people tend to respond, from the Atlas of Emotions."* This keeps the terms and
frames them as descriptive rather than a verdict on the reader.

## Recommendation

**Decide after the device pass, leaning (b).** The owner chose these words in the abstract,
and the open question is specifically how they *feel on a phone*. Look at two or three words
on a device (a hard one such as *Explosive* or *Ashamed*), then pick. If they read as
clinical, apply (b) with the first label set above. That is a one-commit change.

## Open questions

1. Seen on the phone, does "Destructive" under a word you just picked feel like a judgement
   of you?
2. If softening: which label set, one from (b) or the owner's own wording?
3. Should the Field Guide's per-word panel (the same content, shown inline) use the same
   labels, or can the educational surface keep the Atlas terms while the check-in surface
   softens?
