// Date helpers — all keyed to LOCAL time, because a check-in at 23:30 belongs
// to the day the user experienced, not the UTC day. Week keys are ISO-8601
// (Monday start, week 1 contains the first Thursday), implemented by hand to
// stay dependency-free.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local-time 'YYYY-MM-DD' for an ISO timestamp. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * ISO-8601 week key, 'GGGG-Www' (e.g. '2026-W28'). Monday starts the week;
 * a date's ISO year/week is that of the Thursday in its week — which is what
 * makes late-December and early-January dates land in the right year.
 */
export function weekKey(iso: string): string {
  const d = new Date(iso);
  // Local midnight of the date, so time-of-day and DST never shift the day.
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const mondayIndexedDay = (target.getDay() + 6) % 7; // Mon=0 .. Sun=6
  // Move to the Thursday of this ISO week — it carries the ISO year.
  target.setDate(target.getDate() - mondayIndexedDay + 3);
  const isoYear = target.getFullYear();
  // Thursday of ISO week 1 = the Thursday in the week containing Jan 4.
  const jan4 = new Date(isoYear, 0, 4);
  const week1Thursday = new Date(isoYear, 0, 4 - ((jan4.getDay() + 6) % 7) + 3);
  // Round smooths any DST hour drift between the two local timestamps.
  const week = 1 + Math.round((target.getTime() - week1Thursday.getTime()) / (7 * MS_PER_DAY));
  return `${isoYear}-W${pad2(week)}`;
}

/** Week key of the ISO week before the one containing `now`. */
export function previousWeekKey(now: Date): string {
  const sevenDaysBack = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  return weekKey(sevenDaysBack.toISOString());
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

/** Local part-of-day: 5:00–11:59 morning, 12:00–16:59 afternoon, 17:00–20:59 evening, else night. */
export function dayPartLabel(iso: string): DayPart {
  const hour = new Date(iso).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
