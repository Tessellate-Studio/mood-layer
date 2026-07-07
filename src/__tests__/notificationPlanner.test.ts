// P10 — planDailyTimes: evenly spread N reminder times across the waking
// window with a small DETERMINISTIC jitter (no Math.random — schedules must be
// reproducible so a re-run doesn't shuffle the day).

import { planDailyTimes } from '@/utils/notificationPlanner';

function toMinutes(t: { hour: number; minute: number }): number {
  return t.hour * 60 + t.minute;
}

describe('planDailyTimes', () => {
  it('returns exactly timesPerDay entries', () => {
    ([1, 2, 3, 4, 5] as const).forEach((n) => {
      expect(planDailyTimes(n, 9, 21)).toHaveLength(n);
    });
  });

  it('keeps every time inside [wakeStart, wakeEnd]', () => {
    const times = planDailyTimes(5, 9, 21);
    for (const t of times) {
      const m = toMinutes(t);
      expect(m).toBeGreaterThanOrEqual(9 * 60);
      expect(m).toBeLessThanOrEqual(21 * 60);
      expect(t.minute).toBeGreaterThanOrEqual(0);
      expect(t.minute).toBeLessThanOrEqual(59);
    }
  });

  it('is deterministic — identical output on repeat', () => {
    expect(planDailyTimes(4, 8, 22)).toEqual(planDailyTimes(4, 8, 22));
  });

  it('returns times sorted ascending', () => {
    const times = planDailyTimes(5, 9, 21);
    const mins = times.map(toMinutes);
    const sorted = [...mins].sort((a, b) => a - b);
    expect(mins).toEqual(sorted);
  });

  it('spaces multiple times roughly evenly', () => {
    const times = planDailyTimes(4, 9, 21).map(toMinutes);
    const gaps = times.slice(1).map((m, i) => m - times[i]);
    const windowMin = (21 - 9) * 60;
    const idealGap = windowMin / 4;
    // Each gap within ~one jitter-span (±15min on each side → 30) of ideal.
    for (const g of gaps) {
      expect(Math.abs(g - idealGap)).toBeLessThanOrEqual(idealGap);
    }
  });

  it('places a single reminder near the window midpoint', () => {
    const [only] = planDailyTimes(1, 9, 21);
    const mid = ((9 + 21) / 2) * 60; // 15:00 = 900
    expect(Math.abs(toMinutes(only) - mid)).toBeLessThanOrEqual(30);
  });
});
