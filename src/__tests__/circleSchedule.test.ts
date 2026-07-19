// Due-send logic — the automation's whole contract, date-stable.

import { dueSends } from '@/utils/circleSchedule';
import type { PairingCredentials } from '@/services/circleRelay';
import type { CirclePerson } from '@/types/models';

const creds: PairingCredentials = { pairingId: 'p1', side: 'a', token: 't', peerPub: 'pk' };

function person(id: string, frequency: CirclePerson['frequency']): CirclePerson {
  return { id, name: id, relationship: 'friend', sees: 'colours', frequency };
}

// 2026-07-17 is a Friday; 2026-07-19 a Sunday.
const FRI_EVENING = new Date(2026, 6, 17, 19, 30);
const FRI_MORNING = new Date(2026, 6, 17, 9, 0);
const SUN_EVENING = new Date(2026, 6, 19, 19, 30);

describe('dueSends', () => {
  it('never sends for unpaired or paused people', () => {
    const people = [person('unpaired', 'evening'), person('paused', 'paused')];
    expect(dueSends(people, { paused: creds }, {}, FRI_EVENING)).toEqual([]);
  });

  it('evening cadence: after 6pm, once per day', () => {
    const people = [person('a', 'evening')];
    const pairings = { a: creds };
    expect(dueSends(people, pairings, {}, FRI_MORNING)).toEqual([]);
    expect(dueSends(people, pairings, {}, FRI_EVENING)).toEqual(['a']);
    // Already sent this evening → not due again today…
    const sentToday = { a: new Date(2026, 6, 17, 18, 5).toISOString() };
    expect(dueSends(people, pairings, sentToday, FRI_EVENING)).toEqual([]);
    // …but due again the NEXT evening.
    const nextEvening = new Date(2026, 6, 18, 19, 0);
    expect(dueSends(people, pairings, sentToday, nextEvening)).toEqual(['a']);
  });

  it('weekly cadence: Sunday evening, once per ISO week', () => {
    const people = [person('w', 'weekly')];
    const pairings = { w: creds };
    expect(dueSends(people, pairings, {}, FRI_EVENING)).toEqual([]); // not Sunday
    expect(dueSends(people, pairings, {}, SUN_EVENING)).toEqual(['w']);
    const sentThisWeek = { w: SUN_EVENING.toISOString() };
    expect(dueSends(people, pairings, sentThisWeek, SUN_EVENING)).toEqual([]);
    // The following Sunday is a new ISO week.
    const nextSunday = new Date(2026, 6, 26, 19, 30);
    expect(dueSends(people, pairings, sentThisWeek, nextSunday)).toEqual(['w']);
  });
});
