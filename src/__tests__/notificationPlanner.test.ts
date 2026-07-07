// planDailyTimes: evenly spread N reminder times across the waking window,
// always ON THE HOUR (device feedback 2026-07-08 — jittered minutes like 09:57
// read as noise), distinct, sorted, deterministic.

import {
  MAX_TIMES_PER_DAY,
  planDailyTimes,
} from '@/utils/notificationPlanner';

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
