// Pure scheduling maths for "name it" reminders: spread N times evenly across
// the waking window, always ON THE HOUR. Device feedback (2026-07-08): the
// original ±15-minute jitter produced times like 09:57 / 12:27 that read as
// random noise in the preview — whole hours read like a kept appointment.
// Deterministic: a re-run reproduces the same day exactly (the service cancels
// + reschedules on every settings change).
//
// This module also plans the Circle share-nudge cadence (planCircleReminders):
// same "pure function → the service schedules → ids get stored for cancel"
// pattern as name-it, one reminder per non-paused person.

import type { CircleFrequency } from '@/types/models';

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

// --- Circle share reminders -------------------------------------------------
//
// A local nudge on the USER's phone at their chosen cadence to *offer* sharing
// this week with a circle person — the summary itself is still generated and
// handed to the OS share sheet by the user's own tap (nothing auto-sends; hard
// rule: local-only). One reminder per non-paused person.

/** Evening nudge hour, 20:00 local — a settled part of the day, and inside the
 *  name-it default waking window (wakeEnd 21) so it never lands after bedtime. */
export const CIRCLE_EVENING_HOUR = 20;
/** Expo WEEKLY trigger weekday: 1–7 with 1 = Sunday. Sunday evening = a gentle
 *  close to the week. */
export const CIRCLE_WEEKLY_WEEKDAY = 1;

export interface CircleReminderSpec {
  personId: string;
  /** 'daily' → evening cadence; 'weekly' → weekly summary cadence. */
  cadence: 'daily' | 'weekly';
  hour: number;
  minute: number;
  /** Only for weekly cadence — Expo weekday (1 = Sunday). */
  weekday?: number;
}

/**
 * Which people get a reminder, and when. Paused people are excluded entirely;
 * every non-paused person gets exactly one spec at the Circle evening hour —
 * daily for 'evening', weekly (Sunday) for 'weekly'. Pure + order-preserving so
 * a re-run reproduces the same plan (the service cancels + reschedules whenever
 * the people list changes).
 */
export function planCircleReminders(
  people: { id: string; frequency: CircleFrequency }[]
): CircleReminderSpec[] {
  const specs: CircleReminderSpec[] = [];
  for (const person of people) {
    if (person.frequency === 'evening') {
      specs.push({
        personId: person.id,
        cadence: 'daily',
        hour: CIRCLE_EVENING_HOUR,
        minute: 0,
      });
    } else if (person.frequency === 'weekly') {
      specs.push({
        personId: person.id,
        cadence: 'weekly',
        weekday: CIRCLE_WEEKLY_WEEKDAY,
        hour: CIRCLE_EVENING_HOUR,
        minute: 0,
      });
    }
    // 'paused' → no reminder.
  }
  return specs;
}
