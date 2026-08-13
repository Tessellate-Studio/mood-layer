# ADR-001 — Opt-in, scrubbed crash reporting

- **Status:** accepted 2026-08-13, implemented same day
- **Tier:** ADR (tactical, reversible — one toggle, one dependency)
- **Decider:** user, explicitly, when asked

## Context

`CLAUDE.md`'s local-only rule reads: *"No accounts, no server, no analytics,
no crash-reporting SDKs. Sending emotional data anywhere is an anti-pattern
**until the user explicitly decides otherwise (then it goes through the
tracker + a privacy review)**."* This ADR is that decision and that review —
the rule's own escape hatch, walked deliberately rather than quietly widened.

What forced the question: an ops audit (2026-08-13) found mood-layer has
**zero runtime observability**. Every screen is wrapped in
`ScreenErrorBoundary`, but it logs to `console.error` only, and the app ships
as a sideloaded APK. If the binary crashes on a real phone, nothing anywhere
learns about it — the v1 launch already red-screened once on an import-time
crash that unit tests could not see (regression #4). The alternative on the
table (a local-only crash journal the user reads from Settings) preserves the
rule perfectly but only reveals crashes on devices whose owner volunteers a
report — which, for testers, is most of them silently lost.

## Decision

Ship `@sentry/react-native`, **off by default**, behind three gates:

1. **Consent.** `settingsStore.crashReportingEnabled`, default `false`,
   flipped only by the Settings toggle ("Send crash reports"). Off means the
   SDK never initializes; turning it off closes the client immediately, not
   at next launch.
2. **Expo Go guard.** Lazy-required and skipped under Expo Go, mirroring
   `services/notifications.ts`. Importing native modules in Expo Go is the
   exact class that crashed the v1 launch; a crash reporter that crashes the
   app would be a bleak joke.
3. **Scrubbing.** `scrubEvent()` strips `user`, `request`, `server_name`,
   `extra`, `contexts.state`, and every breadcrumb except navigation route
   names (params dropped). `sendDefaultPii: false` (no IP), tracing off,
   screenshots off, view hierarchy off.

A report therefore carries the **shape** of a failure — error type, message,
stack, which screens were visited — and never its **content**.

## Why not the local-only journal

It respects the rule with zero risk, and it was the recommended option. The
user chose off-device reporting because a journal answers "why did MY app
crash" and the actual question before a Play closed test is "why did a
TESTER's app crash, on hardware I do not have, that they will never report."
The scrubbing contract is what makes that acceptable rather than a rule
rewrite.

## Consequences

- The privacy claim in user-facing copy narrows from "nothing leaves your
  phone" to "what you record never leaves your phone" — precise, and true.
  The Settings caption says exactly this.
- `docs/SECURITY.md` carries the privacy review (trust boundary, data
  classes, residual risks).
- **Residual risk, stated plainly:** an error message that interpolates user
  text (`throw new Error(\`bad note: ${note}\`)`) would ship that text inside
  `exception.value`. No code does this today. Scrub at the throw site if you
  ever add one — the scrubber cannot know which substring is a feeling.
- Needs a Sentry project + `EXPO_PUBLIC_SENTRY_DSN`; without the DSN the code
  stays inert, so an un-provisioned build behaves exactly as before.
- Play Store data-safety disclosure will need a "Crash logs — optional"
  entry when the listing is filled in (BACKLOG P2).

## Verification

`src/__tests__/crashReporting.test.ts` executes the privacy contract: eight
cases proving user/request/extra/state/server_name are dropped, that only
navigation breadcrumbs survive with their data stripped, that the diagnostic
core is preserved, and that the scrubber never throws. Those tests ARE the
review's teeth — if one fails, this decision has been broken.
