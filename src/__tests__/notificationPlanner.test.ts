// planDailyTimes: evenly spread N reminder times across the waking window,
// always ON THE HOUR (device feedback 2026-07-08 — jittered minutes like 09:57
// read as noise), distinct, sorted, deterministic.

import {
  CIRCLE_EVENING_HOUR,
  CIRCLE_WEEKLY_WEEKDAY,
  MAX_TIMES_PER_DAY,
  planCircleReminders,
  planDailyTimes,
} from '@/utils/notificationPlanner';
import type { CircleFrequency } from '@/types/models';

function toMinutes(t: { hour: number; minute: number }): number {
  return t.hour * 60 + t.minute;
}

describe('planDailyTimes', () => {
  it('returns exactly timesPerDay entries up to the max', () => {
    for (let n = 1; n <= MAX_TIMES_PER_DAY; n++) {
      expect(planDailyTimes(n, 9, 21)).toHaveLength(n);
    }
  });

  it('always lands on whole hours', () => {
    for (let n = 1; n <= MAX_TIMES_PER_DAY; n++) {
      for (const t of planDailyTimes(n, 9, 21)) {
        expect(t.minute).toBe(0);
        expect(Number.isInteger(t.hour)).toBe(true);
      }
    }
  });

  it('keeps every time inside [wakeStart, wakeEnd] and distinct', () => {
    const times = planDailyTimes(10, 9, 21);
    const hours = times.map((t) => t.hour);
    expect(new Set(hours).size).toBe(hours.length);
    for (const h of hours) {
      expect(h).toBeGreaterThanOrEqual(9);
      expect(h).toBeLessThanOrEqual(21);
    }
  });

  it('caps at the number of whole hours in a narrow window', () => {
    // 10 requested but only 3 distinct hours available (18, 19, 20... 18–20).
    const times = planDailyTimes(10, 18, 20);
    expect(times.length).toBe(3);
  });

  it('is deterministic — identical output on repeat', () => {
    expect(planDailyTimes(4, 8, 22)).toEqual(planDailyTimes(4, 8, 22));
  });

  it('returns times sorted ascending', () => {
    const times = planDailyTimes(5, 9, 21);
    const mins = times.map(toMinutes);
    expect(mins).toEqual([...mins].sort((a, b) => a - b));
  });

  it('spaces multiple times roughly evenly', () => {
    const times = planDailyTimes(4, 9, 21).map(toMinutes);
    const gaps = times.slice(1).map((m, i) => m - times[i]);
    const idealGap = ((21 - 9) * 60) / 4;
    for (const g of gaps) {
      expect(Math.abs(g - idealGap)).toBeLessThanOrEqual(idealGap);
    }
  });

  it('places a single reminder at the window midpoint hour', () => {
    const [only] = planDailyTimes(1, 9, 21);
    expect(only).toEqual({ hour: 15, minute: 0 });
  });

  it('clamps out-of-range requests instead of throwing', () => {
    expect(planDailyTimes(0, 9, 21)).toHaveLength(1);
    expect(planDailyTimes(99, 9, 21)).toHaveLength(MAX_TIMES_PER_DAY);
  });
});

describe('planCircleReminders', () => {
  const person = (id: string, frequency: CircleFrequency) => ({ id, frequency });

  it('gives a paused person no reminder', () => {
    expect(planCircleReminders([person('a', 'paused')])).toEqual([]);
  });

  it('schedules a daily evening reminder for the evening cadence', () => {
    expect(planCircleReminders([person('a', 'evening')])).toEqual([
      { personId: 'a', cadence: 'daily', hour: CIRCLE_EVENING_HOUR, minute: 0 },
    ]);
  });

  it('schedules a weekly Sunday-evening reminder for the weekly cadence', () => {
    expect(planCircleReminders([person('b', 'weekly')])).toEqual([
      {
        personId: 'b',
        cadence: 'weekly',
        weekday: CIRCLE_WEEKLY_WEEKDAY,
        hour: CIRCLE_EVENING_HOUR,
        minute: 0,
      },
    ]);
  });

  it('keeps one spec per non-paused person, in order, dropping paused ones', () => {
    const specs = planCircleReminders([
      person('a', 'evening'),
      person('b', 'paused'),
      person('c', 'weekly'),
    ]);
    expect(specs.map((s) => s.personId)).toEqual(['a', 'c']);
  });

  it('returns nothing for an empty circle', () => {
    expect(planCircleReminders([])).toEqual([]);
  });

  it('places the nudge in the evening (18:00–22:00), inside waking hours', () => {
    expect(CIRCLE_EVENING_HOUR).toBeGreaterThanOrEqual(18);
    expect(CIRCLE_EVENING_HOUR).toBeLessThanOrEqual(22);
  });

  it('uses Expo weekday 1 (Sunday) for the weekly nudge', () => {
    expect(CIRCLE_WEEKLY_WEEKDAY).toBe(1);
  });
});
