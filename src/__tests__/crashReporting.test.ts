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
