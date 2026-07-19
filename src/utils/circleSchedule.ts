// Pure due-send logic for automatic circle delivery (phase 2). No React, no
// stores — the background task and the foreground catch-up both ask the same
// question: "who is due a send right now?" Honest automation: the summary can
// only be built ON this phone (that's where the data lives), so a send
// happens at the next wake after its moment — evening sends after 6 pm,
// weekly sends on Sunday evening — never retroactively spammed.

import type { PairingCredentials } from '@/services/circleRelay';
import type { CirclePerson } from '@/types/models';
import { dayKey, weekKey } from '@/utils/dates';

/** Evening sends unlock at this local hour (6 pm). */
export const EVENING_HOUR = 18;

/**
 * People due an automatic send at `now`: paired, not paused, and their
 * cadence's moment has arrived without a send already made for it.
 *  - evening: after 6 pm local, at most once per day.
 *  - weekly:  Sunday after 6 pm local, at most once per ISO week.
 */
export function dueSends(
  people: CirclePerson[],
  pairings: Record<string, PairingCredentials>,
  lastAutoSent: Record<string, string>,
  now: Date
): string[] {
  const iso = now.toISOString();
  const today = dayKey(iso);
  const thisWeek = weekKey(iso);
  const eveningYet = now.getHours() >= EVENING_HOUR;

  return people
    .filter((person) => {
      if (!pairings[person.id]) return false;
      if (person.frequency === 'paused') return false;
      if (!eveningYet) return false;
      const last = lastAutoSent[person.id];
      if (person.frequency === 'evening') {
        return !last || dayKey(last) !== today;
      }
      // weekly: Sunday evening, once per ISO week.
      if (now.getDay() !== 0) return false;
      return !last || weekKey(last) !== thisWeek;
    })
    .map((person) => person.id);
}
