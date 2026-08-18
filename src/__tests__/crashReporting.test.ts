// The privacy contract, as tests. This app holds emotional data; the whole
// point of scrubEvent is that a crash report carries the SHAPE of a failure
// (type, message, stack, which screens were visited) and never its CONTENT.
// If one of these fails, the decision recorded in
// memory/decisions/adr-001-crash-reporting.md has been broken.

import { scrubEvent } from '@/services/crashReporting';

function baseEvent(): Record<string, any> {
  return {
    event_id: 'abc',
    exception: { values: [{ type: 'TypeError', value: "undefined is not a function" }] },
  };
}

describe('scrubEvent — what must never leave the device', () => {
  it('drops the user object (no ids, no ip, no username)', () => {
    const e = scrubEvent({ ...baseEvent(), user: { id: 'u1', ip_address: '1.2.3.4' } });
    expect(e?.user).toBeUndefined();
  });

  it('drops request data (urls and headers can carry pairing tokens)', () => {
    const e = scrubEvent({ ...baseEvent(), request: { url: 'https://x/functions/v1/moodlayer-relay', headers: { Authorization: 'Bearer secret' } } });
    expect(e?.request).toBeUndefined();
    expect(JSON.stringify(e)).not.toMatch(/Bearer|moodlayer-relay/);
  });

  it('drops extra — anything the app attached could be an entry or a note', () => {
    const e = scrubEvent({ ...baseEvent(), extra: { note: 'felt hollow after the call' } });
    expect(e?.extra).toBeUndefined();
    expect(JSON.stringify(e)).not.toMatch(/hollow/);
  });

  it('drops contexts.state — a zustand dump would be the entire journal', () => {
    const e = scrubEvent({
      ...baseEvent(),
      contexts: { state: { checkIns: [{ emotion: 'grief', note: 'private' }] }, os: { name: 'Android' } },
    });
    expect(e?.contexts?.state).toBeUndefined();
    expect(JSON.stringify(e)).not.toMatch(/grief|private/);
    // OS context is diagnostic, not personal — it stays.
    expect(e?.contexts?.os).toEqual({ name: 'Android' });
  });

  it('drops server_name (device hostnames are identifying)', () => {
    const e = scrubEvent({ ...baseEvent(), server_name: 'saptami-pixel-7' });
    expect(e?.server_name).toBeUndefined();
  });

  it('keeps ONLY navigation breadcrumbs, and strips their data', () => {
    const e = scrubEvent({
      ...baseEvent(),
      breadcrumbs: [
        { category: 'console', message: 'note saved: felt hollow', level: 'log' },
        { category: 'xhr', message: 'POST /moodlayer-relay', data: { body: 'ciphertext' } },
        { category: 'navigation', message: 'CheckInFlow', data: { params: { emotion: 'grief' } } },
      ],
    });
    expect(e?.breadcrumbs).toHaveLength(1);
    expect(e?.breadcrumbs?.[0].category).toBe('navigation');
    expect(e?.breadcrumbs?.[0].data).toBeUndefined();
    expect(JSON.stringify(e)).not.toMatch(/hollow|ciphertext|grief/);
  });

  it('keeps the diagnostic core — that is the whole point of sending anything', () => {
    const e = scrubEvent({
      ...baseEvent(),
      exception: { values: [{ type: 'RangeError', value: 'Invalid array length', stacktrace: { frames: [{ filename: 'QuiltScreen.tsx', lineno: 42 }] } }] },
    });
    expect(e?.exception?.values[0].type).toBe('RangeError');
    expect(e?.exception?.values[0].value).toBe('Invalid array length');
    expect(e?.exception?.values[0].stacktrace.frames[0].filename).toBe('QuiltScreen.tsx');
  });

  it('survives a minimal event without throwing (scrubber must never crash the app)', () => {
    expect(() => scrubEvent({} as any)).not.toThrow();
    expect(() => scrubEvent({ breadcrumbs: undefined, contexts: undefined } as any)).not.toThrow();
  });
});

// ── The boundary the JS scrubber CANNOT cross ────────────────────────
// Verified against a real device event 2026-08-17 (Sentry MOOD-LAYER-1):
// a NATIVE crash is captured and sent by the Android SDK without ever
// entering the JS layer, so `beforeSend`/scrubEvent never ran — and the
// event carried `user.id` and `user.geo` (city-level, from the IP). Every
// test above passed while that shipped, because they only ever exercised
// the JS path. The fix is to stop producing events the scrubber cannot
// reach: with native crash handling off, EVERY event Sentry receives is a
// JS event, and every JS event goes through scrubEvent.

describe('init options — the contract holds only if all events are JS events', () => {
  const realDsn = 'https://k@o1.ingest.de.sentry.io/1';

  function initWith(): Record<string, any> | null {
    jest.resetModules();
    process.env.EXPO_PUBLIC_SENTRY_DSN = realDsn;
    let captured: Record<string, any> | null = null;
    jest.doMock('expo-constants', () => ({ appOwnership: null }));
    jest.doMock('@sentry/react-native', () => ({
      init: (opts: Record<string, any>) => { captured = opts; },
      captureException: jest.fn(),
      getClient: () => undefined,
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/services/crashReporting').initCrashReporting();
    return captured;
  }

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    jest.dontMock('expo-constants');
    jest.dontMock('@sentry/react-native');
  });

  it('disables native crash handling — native events bypass beforeSend entirely', () => {
    expect(initWith()?.enableNativeCrashHandling).toBe(false);
  });

  it('keeps beforeSend wired, so the JS path is still scrubbed', () => {
    expect(typeof initWith()?.beforeSend).toBe('function');
  });

  it('never sends default PII', () => {
    expect(initWith()?.sendDefaultPii).toBe(false);
  });
});

describe('scrubEvent — identity that hides outside `user`', () => {
  it('drops contexts.device.id, the stable install uuid', () => {
    // Real-event regression (MOOD-LAYER-2): with `user` deleted, the very
    // same uuid still shipped as contexts.device.id. Diagnostics about the
    // device stay; the thing that names the device does not.
    const e = scrubEvent({
      ...baseEvent(),
      contexts: { device: { id: '22680dc617d34b9ea566d0e6fcda492d', model: 'Pixel 2 XL', battery_level: 64 } },
    });
    expect(e?.contexts?.device?.id).toBeUndefined();
    expect(JSON.stringify(e)).not.toMatch(/22680dc6/);
    // still useful for triage
    expect(e?.contexts?.device?.model).toBe('Pixel 2 XL');
  });

  it('does not throw when contexts has no device', () => {
    expect(() => scrubEvent({ ...baseEvent(), contexts: { os: { name: 'Android' } } })).not.toThrow();
  });
});
