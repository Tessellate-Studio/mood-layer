# ADR-002 — Anonymized, event-level usage analytics (PROPOSED)

- **Status:** proposed 2026-08-26 — scoped, **not yet decided**. This ADR is
  the vehicle for the hard rule's escape hatch ("until the user explicitly
  decides otherwise, then it goes through the tracker + a privacy review"),
  but the decision itself still needs an explicit yes from the user before any
  code lands. Nothing in this doc authorizes implementation.
- **Tier:** ADR (tactical, reversible — one toggle, one new dependency), same
  tier as `memory/decisions/adr-001-crash-reporting.md`, on the same reasoning:
  scoped data class, opt-in, one library, no architecture change.
- **Decider:** user (pending)

## Context

The user wants to know two things within the next few weeks:

1. Which features/moods are most used.
2. Whether the app is understandable enough, or is instead causing silent
   abandonment (onboarding drop-off, one-and-done installs).

Today there is no way to answer either. `docs/SECURITY.md` and
`CLAUDE.md` are explicit: **local-only data, no analytics**, with exactly two
user-decided, reviewed exceptions — the circle relay (`docs/SECURITY.md` →
"Circle relay") and opt-in crash reporting (ADR-001). Adding usage analytics
would be a **third** sanctioned exception, and per the hard rule in
`CLAUDE.md`, "there is already an exception" is explicitly *not* a precedent —
this needs its own decision and its own privacy review, not a rider on the
crash-reporting or Play Store submission work already in flight (BACKLOG →
"Publish The Mood Layer to Google Play").

### The scope has to be narrower than the question

The literal question — "which **moods** are most used" — points straight at
the exact data this app promises never leaves the device: which emotion words
someone tapped, at what intensity, on which day. That is the emotional quilt
itself, the same class of content the crash-reporting scrubber
(`src/services/crashReporting.ts`) goes out of its way to strip (`extra`,
`contexts.state`, breadcrumb `data`) precisely because a state dump "would be
the entire journal."

So this ADR proposes answering a **narrower, adjacent** question instead:
- "Which **screens/features** get used" (navigation-shaped, like the crash
  reporter's route-name breadcrumbs) — not which moods.
- "Where do people drop off" (onboarding step reached, session start/end) —
  not what they felt when they did.

This gets most of the way to "is the app understandable / causing
abandonment," and a limited way to "which features are used" (e.g. "check-in
flow opened" vs "breathing screen opened"), but it **cannot** answer "which
specific moods are most logged" without capturing emotion content — that
question stays out of scope for this exception. If the user later decides they
need mood-level aggregates, that is a **separate, wider exception** requiring
its own review (e.g. k-anonymized rollups, never raw check-ins) — not
something to fold in here.

## Decision (proposed)

Ship an anonymized, event-level, **opt-in** usage analytics channel, shaped
exactly like the crash-reporting precedent — off by default, one Settings
toggle, one library, and a strict allowlist enforced in code with tests as the
contract (not a config claim).

### What would be sent (if the user opts in)

Event name + a small fixed property set, **nothing free-form**:

| Event | Properties | Notes |
|---|---|---|
| `screen_view` | `screen` (enum of known screen names) | `CheckInFlow`, `Quilt`, `Insights`, `Reflections`, `Circle`, `FieldGuide`, `Breathing`, `PracticeFlow`, `JudgmentFlow`, `NameItSetup`, `Experiments`, `Settings`, `Onboarding` |
| `feature_tap` | `feature` (enum, e.g. `checkin_start`, `breathing_start`, `circle_share`, `insight_card_viewed`) | Taps on entry points, never on emotion words/chips |
| `session_start` | none | App foregrounded |
| `onboarding_step` | `step` (enum of onboarding step ids), `completed` (bool) | Answers the drop-off question directly |

Explicitly **never** sent, enforced the same way `scrubEvent()` enforces its
list today:
- Any emotion/mood word, intensity value, journal/reflection text, or
  check-in content — the quilt vocabulary itself.
- Free-form strings of any kind (no event property is ever a user-authored
  string — allowlisted enums only, same shape as the crash reporter's
  navigation-breadcrumb-route-name-only rule).
- Any persistent per-user or per-device identifier. No `distinct_id` tied to
  anything stable — see "Identity" below.
- IP address (provider-level scrub, same ask made of Sentry in ADR-001).
- Timestamps coarser than day-level, to avoid reconstructing a usage
  fingerprint from event timing.

### Identity — anonymous, session-scoped only

No account, no device UUID persisted for analytics, no cross-session linking.
Use a random id generated in memory at app launch and discarded on close (or
the provider's ability to disable persistent distinct-id entirely, e.g.
PostHog's `persistence: 'memory'` with a fresh id per session). This means the
tool **cannot** answer "retention" or "did the same person come back" — that
trade is deliberate: a persistent anonymous id is still a device fingerprint,
and this app's whole premise is that nothing about a person accumulates off
their phone. If retention becomes a real question later, that is a new,
explicit decision, not a default.

### Tool options (compare before picking)

| | Autocapture risk | Hosting | Fit |
|---|---|---|---|
| **PostHog** | High by default — autocapture, session replay, and heatmaps must be explicitly disabled at init, same posture as turning off Sentry's tracing/screenshots/view-hierarchy in ADR-001 | Self-host, or EU Cloud (`eu.posthog.com`) | Powerful, but the default footprint is wide; safe only if every extra capture surface is turned off and verified, same as `enableNativeCrashHandling: false` was for Sentry |
| **Aptabase** | Low — purpose-built for exactly this threat model (privacy-first mobile/desktop telemetry): manual events only, no autocapture, no session replay surface to disable in the first place | EU region available, open source (self-hostable) | Closest match to "off by default, strict allowlist" — less to misconfigure because there's less capability to begin with |
| **Self-hosted Umami/Plausible** | Low, but web-page-model (pageviews/referrers) — awkward fit for a screen-based RN app, weaker event-property support | Self-host only | Not a natural fit for mobile event taxonomy |

**Recommendation to evaluate with the user:** Aptabase over PostHog, on the
same logic ADR-001 used against the local-only crash journal — not the
maximally-featured option, the one whose *default* footprint matches the
promise. PostHog remains viable if the user has a reason to prefer it (e.g.
already self-hosting it for `alate`), provided autocapture/replay/heatmaps are
verifiably off — that verification would need the same real-event proof ADR-001
required for Sentry's geo residual, not a config-flag assertion.

### Consent gate — same three-gate shape as ADR-001

1. **Consent.** `settingsStore.usageAnalyticsEnabled`, default `false`. Off =
   SDK never initializes. Toggling off closes the client immediately.
2. **Expo Go guard.** Lazy-required, skipped under Expo Go, same as
   `services/notifications.ts` and `services/crashReporting.ts`.
3. **Allowlist enforcement.** A pure, exported `sanitizeEvent(name, props)`
   function — reject (not silently strip) any event name or property key not
   on the allowlist, so a future `analytics.track('mood_logged', { emotion })`
   fails loudly in a test rather than shipping quietly. Pinned by a test suite
   the same way `crashReporting.test.ts` pins `scrubEvent()`.

## Why not just widen the crash-reporting scope

Sentry already exists on-device and already has a scrubbing pipeline — reusing
it for product events would avoid a new dependency. Rejected: Sentry's
`beforeSend`/breadcrumb model is shaped for *error* events, not deliberate
product analytics (funnels, drop-off rates), and blending the two purposes
into one SDK makes the crash-reporting privacy contract harder to audit in
isolation — ADR-001's contract is already load-bearing enough (see its
"CORRECTION" and "ACCEPTED RESIDUAL" entries) without adding a second
responsibility to it.

## Consequences

- **A third line item** in `CLAUDE.md`'s hard-rules bullet ("TWO sanctioned
  exceptions") becomes three, *only once this is actually decided* — not as
  part of this scoping pass.
- **App Store / Play Store disclosure.** BACKLOG's Play Store data-safety entry
  currently states "no analytics" as a settled fact
  (`BACKLOG.md` → "Publish The Mood Layer to Google Play"). That line becomes
  false the moment this ships and must be updated in the same PR — "Usage
  analytics — collected, optional, not linked to identity," mirroring the
  existing crash-logs entry.
- **Privacy policy.** The public privacy policy lives in the `tessellate-pages`
  repo (renamed from `app_privacy_policy`; org changed too), not in this repo.
  That page's "what we collect" section currently should say
  nothing-leaves-the-device or name only the crash-report exception; it needs
  a cross-repo update before or at launch. This ADR cannot ship that edit
  itself — flag it as a blocking dependency, not an afterthought.
- **The user's stated question is only partially answered.** "Which
  moods/features are most used" resolves to features, not moods. If mood-level
  aggregates are still wanted after seeing what feature-level data looks like,
  that's ADR-003, not a scope-creep amendment to this one.
- Needs a project + API key (Aptabase or PostHog), gated the same way ADR-001
  gates `EXPO_PUBLIC_SENTRY_DSN` — un-provisioned build behaves exactly as
  before.
- **Residual risk, stated plainly:** an enum-only allowlist prevents *content*
  leaks but not *inference* leaks — e.g. a spike in `BreathingScreen`
  `screen_view` events correlates with distress even without saying so. This
  is inherent to any usage telemetry and is accepted the same way ADR-001
  accepted city-level crash geolocation: named, not hidden.

## Verification (once implemented)

Same bar as `crashReporting.test.ts`: a `usageAnalytics.test.ts` asserting
(a) the allowlist rejects any event/property not on it, (b) the SDK never
initializes with the toggle off, (c) no persistent id is set, (d)
autocapture/session-replay/heatmaps are verifiably disabled at init if the
chosen provider is PostHog. Real-device proof (not just the unit contract) is
required before calling the scrub claim true — ADR-001's native-crash
correction is the cautionary example: unit tests all passed while a real event
still leaked `user.id`.

## Implementation plan (only once the user accepts this ADR)

Not to be started as a side effect of the crash-reporting or Play Store
submission work already in flight — its own PR, after this ADR's status moves
from "proposed" to "accepted."

1. **Pick the tool** (resolve open question 1 below) and provision a
   project/API key — EU-region if PostHog, EU/self-host if Aptabase.
2. **`src/services/usageAnalytics.ts`** — mirror
   `src/services/crashReporting.ts`'s shape: lazy-required, Expo-Go-guarded,
   `initUsageAnalytics()` / `shutdownUsageAnalytics()` / `trackEvent(name,
   props)`, with `sanitizeEvent()` as the pure, exported, unit-tested allowlist
   gate (reject unknown event names/properties, don't silently drop them).
   Explicitly disable autocapture, session replay, and heatmaps at init if the
   tool is PostHog.
3. **`settingsStore.ts`** — add `usageAnalyticsEnabled: boolean` (default
   `false`) alongside `crashReportingEnabled`, and a `setUsageAnalyticsEnabled`
   action that starts/stops the client immediately, same pattern as the
   existing crash-reporting setter.
4. **Settings screen** — new toggle, copy modeled on the existing "Send crash
   reports" caption: state plainly what is and isn't sent (features/screens,
   never moods/journal content, no identity).
5. **`src/__tests__/usageAnalytics.test.ts`** — the enforcement contract:
   allowlist rejects unknown events/properties, SDK never initializes with the
   toggle off, no persistent id is set, autocapture/replay/heatmaps verified
   off (if PostHog). Treat any failure here as a privacy regression, not a
   test to loosen — same standing as `crashReporting.test.ts`.
6. **Real-device verification** — confirm on an installed build (not just
   Expo Go) that a real event reaches the provider dashboard carrying only
   allowlisted fields, the same way ADR-001's native-crash correction was only
   caught by testing on real hardware, not by the unit suite.
7. **Docs, in the same PR:**
   - `docs/SECURITY.md` → flip this section from "PROPOSED" to a dated,
     accepted review (mirror the "Crash reports" section's structure).
   - `CLAUDE.md` hard-rules bullet → "TWO" becomes "THREE," with a one-line
     summary and a link to this ADR, matching the existing two entries' format.
   - `BACKLOG.md` → Play Store data-safety entry gets a new line: "Usage
     analytics — collected, optional, not linked to identity."
   - App Store / Play Store privacy questionnaire (whichever is live at
     submission time) → same disclosure, in the listing itself, not just
     BACKLOG.
   - `tessellate-pages` repo, privacy policy page → cross-repo PR adding the
     usage-analytics disclosure; treat as a blocking dependency for launch,
     filed and tracked before this ships, not discovered after.

## Open questions for the user (before this can move to "accepted")

1. Aptabase vs PostHog (EU) vs something else — any existing preference or
   account already in use elsewhere (e.g. `alate`)?
2. Is "features, not moods" an acceptable answer to the original question, or
   does the user want to scope a separate, wider ADR for mood-level aggregates
   now instead of later?
3. Timeline: implementation plan below assumes this ships as its own PR,
   separate from and after the in-flight crash-reporting/Play-Store work.
