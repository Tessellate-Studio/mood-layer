// Crash reporting — the ONE sanctioned exception to "no crash-reporting SDKs",
// decided by the user 2026-08-13 and recorded in
// memory/decisions/adr-001-crash-reporting.md + the privacy review in
// docs/SECURITY.md. The old rule's own escape hatch ("until the user
// explicitly decides otherwise, then tracker + privacy review") is what this
// walks through.
//
// THREE GATES, all of which must pass before a single byte leaves the phone:
//
//   1. CONSENT. Off by default. Nothing initializes until the user turns
//      "Help fix crashes" on in Settings. Turning it off closes the client.
//   2. EXPO GO GUARD. @sentry/react-native carries native code; importing it
//      inside Expo Go is exactly the import-time crash class that red-screened
//      the v1 launch (expo-notifications, regression #4 / CLAUDE.md). It is
//      lazy-required and skipped entirely under Expo Go, same shape as
//      services/notifications.ts.
//   3. SCRUBBING. scrubEvent() below is the privacy contract, pinned by
//      src/__tests__/crashReporting.test.ts: a report carries the SHAPE of a
//      failure (type, message, stack, screens visited) and never its CONTENT.
//
// What is deliberately NOT sent: user object, IP (sendDefaultPii: false),
// request/urls/headers (the relay bearer token lives there), `extra`,
// contexts.state (a zustand dump would be the entire journal), server_name,
// and every breadcrumb except navigation route names.
//
// RESIDUAL RISK, stated honestly rather than papered over: an error message
// interpolating user text (`throw new Error(\`bad note: ${note}\`)`) would
// still ship that text inside exception.value. No code does this today; if
// you add one, scrub at the throw site. See the privacy review.

import Constants from 'expo-constants';

/** appOwnership === 'expo' only inside Expo Go, never in a real build. */
const IS_EXPO_GO = Constants.appOwnership === 'expo';

/** Breadcrumb categories allowed through. Navigation = screen names only. */
const ALLOWED_BREADCRUMB_CATEGORIES = ['navigation'];

type SentryEvent = Record<string, any>;

/**
 * The privacy contract. Pure and exported so the test suite can prove it,
 * rather than trusting a config flag. Returning null would drop the event
 * entirely; we never need that today, but Sentry honours it.
 */
export function scrubEvent(event: SentryEvent | null): SentryEvent | null {
  if (!event) return event;

  // Identity + transport: nothing here is diagnostic, all of it is personal.
  delete event.user;
  delete event.request;
  delete event.server_name;

  // Anything the app attached itself. No allowlist: an accidental
  // `extra: { entry }` must not be one review away from shipping a journal.
  delete event.extra;

  if (event.contexts) {
    // State dumps (zustand/redux integrations) are the highest-value leak in
    // this app — that IS the journal. Device/OS/app contexts stay: they are
    // what makes a stack trace actionable.
    delete event.contexts.state;
  }

  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs
      .filter((b: SentryEvent) => ALLOWED_BREADCRUMB_CATEGORIES.includes(b?.category))
      .map((b: SentryEvent) => {
        // Route params can carry an emotion or a note — keep the route name
        // (the trail we actually need) and drop the payload.
        const { data, ...rest } = b;
        return rest;
      });
  }

  return event;
}

type SentryModule = typeof import('@sentry/react-native');

let cachedModule: SentryModule | null | undefined;
let started = false;

function getSentry(): SentryModule | null {
  if (cachedModule === undefined) {
    if (IS_EXPO_GO) {
      cachedModule = null;
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        cachedModule = require('@sentry/react-native') as SentryModule;
      } catch {
        // Not linked in this binary (e.g. an older build). Crash reporting is
        // a nice-to-have; never let its absence take the app down.
        cachedModule = null;
      }
    }
  }
  return cachedModule;
}

/**
 * Start reporting. Called only after the user opts in (settingsStore), and on
 * app start when they already had. No DSN configured → stays off, so a build
 * without the env var behaves exactly like today.
 */
export function initCrashReporting(): void {
  if (started) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;
  const Sentry = getSentry();
  if (!Sentry) return;

  Sentry.init({
    dsn,
    // No IP, no device identifiers beyond the diagnostic contexts.
    sendDefaultPii: false,
    // Performance/replay would sample screens and interactions — never for
    // this app.
    tracesSampleRate: 0,
    enableAutoPerformanceTracing: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    beforeSend: (event) => scrubEvent(event as SentryEvent) as never,
    beforeBreadcrumb: (breadcrumb) =>
      ALLOWED_BREADCRUMB_CATEGORIES.includes(breadcrumb?.category ?? '')
        ? ({ ...breadcrumb, data: undefined } as never)
        : null,
  });
  started = true;
}

/** Stop reporting when consent is withdrawn. Best-effort; never throws. */
export function shutdownCrashReporting(): void {
  if (!started) return;
  const Sentry = getSentry();
  try {
    Sentry?.getClient?.()?.close?.();
  } catch {
    // ignore — nothing to do if the client is already gone
  }
  started = false;
}

/**
 * Report a caught error. No-ops entirely unless reporting started, so callers
 * need no consent checks of their own.
 */
export function reportError(error: unknown): void {
  if (!started) return;
  const Sentry = getSentry();
  try {
    Sentry?.captureException(error);
  } catch {
    // reporting must never be the thing that breaks the app
  }
}
