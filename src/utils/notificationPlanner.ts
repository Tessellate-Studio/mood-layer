// Pure scheduling maths for "name it" reminders: spread N times evenly across
// the waking window, always ON THE HOUR. Device feedback (2026-07-08): the
// original ±15-minute jitter produced times like 09:57 / 12:27 that read as
// random noise in the preview — whole hours read like a kept appointment.
// Deterministic: a re-run reproduces the same day exactly (the service cancels
// + reschedules on every settings change).

export interface DailyTime {
  hour: number;
  minute: number;
}

/** Frequency bounds — up to one nudge every waking hour or two. */
export const MIN_TIMES_PER_DAY = 1;
export const MAX_TIMES_PER_DAY = 10;

/**
 * Evenly place `timesPerDay` reminders inside [wakeStart, wakeEnd] as DISTINCT
 * whole hours, sorted ascending. A single reminder lands at the midpoint hour.
 * If the window has fewer whole hours than requested, every hour in the window
 * is used (the count caps at the window size rather than doubling up).
 */
export function planDailyTimes(
  timesPerDay: number,
  wakeStart: number,
  wakeEnd: number
): DailyTime[] {
  const span = Math.max(0, wakeEnd - wakeStart);
  const requested = Math.min(
    Math.max(Math.round(timesPerDay), MIN_TIMES_PER_DAY),
    MAX_TIMES_PER_DAY
  );
  // Distinct whole hours available in the window (inclusive of both ends).
  const n = Math.min(requested, span + 1);

  const hours = new Set<number>();
  for (let i = 0; i < n; i++) {
    // Centre of the i-th of n equal sub-bands, rounded to a whole hour.
    let h = Math.round(wakeStart + (span * (i + 0.5)) / n);
    // Collisions from rounding walk forward to the next free hour (bounded by
    // n ≤ span+1, so a free hour always exists in-window).
    while (hours.has(h) && h < wakeEnd) h += 1;
    while (hours.has(h) && h > wakeStart) h -= 1;
    hours.add(h);
  }

  return [...hours].sort((a, b) => a - b).map((hour) => ({ hour, minute: 0 }));
}
