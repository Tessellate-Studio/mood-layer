// Pure scheduling maths for "name it" reminders: spread N times evenly across
// the waking window, nudged by a small DETERMINISTIC jitter so the prompts
// don't feel metronomic. No Math.random — a re-run must reproduce the same
// day exactly (the service cancels + reschedules on every settings change, and
// a random shuffle each time would churn the OS schedule and confuse anyone
// reading the preview list).

export interface DailyTime {
  hour: number;
  minute: number;
}

/**
 * Evenly place `timesPerDay` reminders inside [wakeStart, wakeEnd) (hours),
 * each offset by an index-seeded jitter of −15..+15 minutes, clamped to the
 * window and sorted ascending. A single reminder lands near the midpoint.
 */
export function planDailyTimes(
  timesPerDay: 1 | 2 | 3 | 4 | 5,
  wakeStart: number,
  wakeEnd: number
): DailyTime[] {
  const startMin = wakeStart * 60;
  const endMin = wakeEnd * 60;
  const span = Math.max(0, endMin - startMin);

  // Slots sit at the centre of `timesPerDay` equal sub-bands: for n slots the
  // i-th centre is start + span*(i + 0.5)/n. For n=1 that's the midpoint.
  const times: number[] = [];
  for (let i = 0; i < timesPerDay; i++) {
    const base = startMin + (span * (i + 0.5)) / timesPerDay;
    // Deterministic jitter in [-15, +15] seeded by slot index.
    const jitter = ((i * 37) % 31) - 15;
    let m = Math.round(base + jitter);
    if (m < startMin) m = startMin;
    if (m > endMin) m = endMin;
    times.push(m);
  }

  return times
    .sort((a, b) => a - b)
    .map((m) => ({ hour: Math.floor(m / 60), minute: m % 60 }));
}
