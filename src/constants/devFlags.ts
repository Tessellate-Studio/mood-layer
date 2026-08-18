// Build-time development flags.
//
// Read at MODULE SCOPE on purpose: babel-preset-expo inlines EXPO_PUBLIC_*
// literals during the bundle step, so a production build (where the var is
// unset) compiles these to `false` and dead-code-eliminates whatever they
// guard. That is a stronger guarantee than a runtime check — the guarded UI
// is not merely hidden in a shipped app, it is absent.
//
// Living in its own module so tests can mock the flag without
// `jest.resetModules()`, which breaks React's module identity and makes every
// hook in the screen under test throw.

/**
 * Shows the "Send a test crash" row in Settings. Set on the EAS `development`
 * and `preview` environments; deliberately NOT on `production`.
 *
 * It exists because the JS crash path has no other trigger, and native crash
 * capture is switched off by design (ADR-001) — without this, the pipeline
 * error boundary → reportError → scrubEvent → Sentry cannot be exercised on
 * a real device at all.
 */
export const CRASH_TEST_ENABLED = process.env.EXPO_PUBLIC_ENABLE_CRASH_TEST === 'true';
