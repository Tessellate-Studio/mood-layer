# Backlog — The Mood Layer

Durable record of out-of-scope and not-yet-started work. Check here before
proposing "should we build X?". Sections are P0 (do next) → P4 (someday). The
*what + why* lives here; the *exactly-how* for any decided external setup lives
in [`docs/user-actions-tracker.md`](docs/user-actions-tracker.md) — cross-link,
don't copy. Rubric scores (0–12) come from `@tessellate-studio/rubric-sdk`
`evaluateFromContext` (heuristic, auditable).

Seeded 2026-07-12 from the first roadmap-pulse run.

## P0 — now (this week)

- **Circle: scheduled-share reminders (no-backend version)** — **BUILT
  2026-07-13** (decided the same day: do the local, no-backend version first).
  Instead of *delivering* a summary on a schedule (needs a server, breaks
  local-only), we schedule a **local push notification on the user's own phone**
  at each non-paused person's cadence (`evening` → daily 20:00, `weekly` →
  Sunday 20:00). Tapping the nudge deep-links to the Circle tab and opens the OS
  share sheet pre-loaded with that person's gated `shareSummary` — the user
  still taps share, so **nothing leaves the phone on its own** and local-only is
  preserved. Reuses the name-it notification pattern
  (`utils/notificationPlanner` → `services/notifications.rescheduleCircle` →
  ids persisted on `circleStore`, cancelled/rescheduled on
  remove/pause/recadence and on app foreground). Per-id cancellation (never
  `cancelAll`) so it never wipes the name-it reminders sharing the same OS queue.
  ⚠️ **On-device firing needs a dev build** — Expo Go can't fire local
  scheduled notifications (regression-log #4); every circle service fn no-ops
  under Expo Go. Cross-ref the EAS dev-build item under "Post-launch" — the same
  build unblocks device verification of both name-it and circle reminders.

- **Circle: true auto-deliver to recipient (backend automation)** — *separate,
  larger, and a deliberate break of local-only* — **not started**, keep only if
  the local-reminder version above proves insufficient. This is the version that
  actually **sends** a summary off-device on a schedule, which a phone-local app
  can't do → it needs a backend. **Decisions to settle first (before code):**
  1. **Delivery channel** — email? SMS? push (recipient needs an app)? a private
     link the person opens?
  2. **Recipient identity** — a "person" is just a local name today; automated
     delivery needs an address or account.
  3. **Where the backend lives** — mood-layer has NO server today; this is a
     **new** service (its own repo or a small serverless API), separate from
     alate and Loom (different products).
  4. **What's stored server-side** — ideally *nothing durable* (generate → send →
     forget) so the "circumvent storing data" promise survives automation.
  5. **Scheduling** — a server cron per person's cadence + timezone.
  This is a **deliberate, scoped exception to local-only** — decide and write
  down the trust boundary before any code. *Owner: user + agent.*

## P1 — do next

- **Clean on-device verification pass of the v0.2.0 redesign** — rubric **7/12**.
  Full walkthrough of Quilt cloth, Insights depth, Circle, judgment
  multi-select, and Experiments in Expo Go. The last device session was cut
  short by a dev-server connectivity error (regression-log #6) before a clean
  pass. *Owner: user (device); agent preps Metro.*

## P2 — soon

- **Publish The Mood Layer to Google Play (direct, under Tessellate org)** —
  rubric **6/12** (impact 3/3; costed down by external Play Console setup +
  dependencies). **Decision made 2026-07-12:** publish directly to the Play
  Store under the organization developer account; DUNS applied (org
  verification pending Google's review). Depends on DUNS approval + a clean
  v0.2.0 device pass. Steps/credentials go in the user-actions-tracker once the
  DUNS is approved and the Play Console app is created. *Owner: user.*

## Post-launch — verify after v0.2.0 is live

- **Verify "Name it" reminders on a real device** — rubric **8/12**.
  *User-designated post-launch (2026-07-13): ship first, verify reminders after.*
  Local-notification reminders no-op in Expo Go (expo-notifications removed
  SDK 53+, regression-log #4), so this shipped feature has never actually run.
  `eas.json` is now scaffolded (dev/preview/production profiles); EAS login is
  done. Remaining: `eas build --profile development --platform android`, install
  on device, confirm a reminder fires + deep-links into the check-in flow.
  Tradeoff to note: launching first means the reminder path ships unverified —
  low blast radius (it fails silently/no-ops rather than crashing), which is why
  post-launch is reasonable. *Owner: user. How-to: `docs/user-actions-tracker.md`.*

## P3 — later

- **Further de-overwhelm interactions for word pickers** — folded-by-default
  family groups shipped 2026-07-13 (user feedback: nine open families read as
  a wall). Candidates if the feel step still feels heavy: a "words you've
  used lately" row at the top (zero scrolling for regulars — convenience, not
  a streak); a family-first two-step flow (pick 1 of 9 families → see only
  its 6 words); a type-to-find filter (fits the typewriter voice; typing may
  itself be work when overwhelmed — test with users); body-first entry
  ("where do you feel it?" → suggest families from the sensation).

- **Check in with any field-guide word** — the field guide's word finder
  (v0.2.x, `src/content/vocabulary.ts`) is education-only: ~70 wheel words are
  browsable but not selectable in a check-in, so the feel step stays a short,
  nameable list. If users want the precision in their quilt, make word-finder
  words selectable (ids are already unique across gradients + extended, and
  `findVocabularyWord` already resolves both, so no data migration — swap the
  check-in's label lookups from `findEmotionWord` to `findVocabularyWord` and
  design how ~90 chips stay navigable). Also consider a "more words →" doorway
  from the check-in feel step into the guide.

## Done / retired

- **Install rubric-sdk for pulse scoring** — done 2026-07-12. `npm i -D
  github:ramsaptami/rubric-sdk` installs cleanly (59 packages, exit 0); the
  earlier "agent sandbox can't install from a personal-repo git URL" note in the
  tracker was wrong and has been corrected. Pulse scoring is now numeric.
