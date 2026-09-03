// Date helper tests. All fixture ISO strings deliberately OMIT the timezone
// suffix — per the ECMAScript spec, date-time strings without an offset are
// parsed as LOCAL time, which makes these assertions hold in any test-runner
// timezone while still exercising the "dayKey/weekKey use local time" rule.

import {
  dayKey,
  weekKey,
  dayPartLabel,
  monthKey,
  monthLabel,
  previousMonthKey,
  previousWeekKey,
} from '@/utils/dates';

describe('dayKey', () => {
  it('formats local YYYY-MM-DD', () => {
    expect(dayKey('2026-07-07T14:23:45')).toBe('2026-07-07');
  });

  it('stays on the local day right after local midnight and right before it', () => {
    expect(dayKey('2026-07-07T00:30:00')).toBe('2026-07-07');
    expect(dayKey('2026-07-07T23:30:00')).toBe('2026-07-07');
  });

  it('zero-pads single-digit months and days', () => {
    expect(dayKey('2026-01-05T09:00:00')).toBe('2026-01-05');
  });
});

describe('weekKey (ISO-8601, Monday start)', () => {
  it('gives the same week for Monday through Sunday', () => {
    // 2026-07-06 is a Monday.
    expect(weekKey('2026-07-06T00:00:00')).toBe('2026-W28');
    expect(weekKey('2026-07-09T12:00:00')).toBe('2026-W28');
    expect(weekKey('2026-07-12T23:59:59')).toBe('2026-W28');
  });

  it('a Sunday belongs to the week of the preceding Monday', () => {
    // 2026-07-05 is a Sunday — Monday of its week is 2026-06-29 (W27).
    expect(weekKey('2026-07-05T10:00:00')).toBe('2026-W27');
    expect(weekKey('2026-07-06T10:00:00')).toBe('2026-W28');
  });

  it('handles year boundaries per ISO-8601', () => {
    // 2026-01-01 is a Thursday → it anchors week 1 of 2026,
    // and that week starts Monday 2025-12-29.
    expect(weekKey('2026-01-01T08:00:00')).toBe('2026-W01');
    expect(weekKey('2025-12-29T08:00:00')).toBe('2026-W01');
    // 2025 week 1 starts Monday 2024-12-30 (first Thursday: 2025-01-02).
    expect(weekKey('2024-12-31T08:00:00')).toBe('2025-W01');
  });

  it('handles a 53-week ISO year', () => {
    // 2026 starts on a Thursday → it has 53 ISO weeks.
    expect(weekKey('2026-12-28T08:00:00')).toBe('2026-W53'); // Monday
    expect(weekKey('2027-01-01T08:00:00')).toBe('2026-W53'); // Friday, still W53
    expect(weekKey('2027-01-03T08:00:00')).toBe('2026-W53'); // Sunday, still W53
    expect(weekKey('2027-01-04T08:00:00')).toBe('2027-W01'); // next Monday
  });

  it('zero-pads the week number', () => {
    expect(weekKey('2026-01-06T08:00:00')).toBe('2026-W02');
  });
});

describe('previousWeekKey', () => {
  it('returns the key of the week before the given date', () => {
    expect(previousWeekKey(new Date(2026, 6, 7, 12, 0, 0))).toBe('2026-W27');
  });

  it('crosses year boundaries', () => {
    // 2026-01-01 is in 2026-W01; the previous week is 2025-W52.
    expect(previousWeekKey(new Date(2026, 0, 1, 12, 0, 0))).toBe('2025-W52');
  });

  it('on Monday itself already names the week that just ended', () => {
    // 2026-07-06 is a Monday, first minutes of 2026-W28 → last week is W27.
    // The Insights tab refreshes on the FIRST open on Monday, not after it.
    expect(previousWeekKey(new Date(2026, 6, 6, 0, 30, 0))).toBe('2026-W27');
  });
});

describe('monthKey / previousMonthKey / monthLabel', () => {
  it('formats local YYYY-MM', () => {
    expect(monthKey('2026-07-07T14:23:45')).toBe('2026-07');
    expect(monthKey('2026-12-31T23:59:00')).toBe('2026-12');
  });

  it('previousMonthKey names the calendar month before now', () => {
    expect(previousMonthKey(new Date(2026, 6, 17, 12, 0, 0))).toBe('2026-06');
    // On the 1st itself the month that just ended is already "last month".
    expect(previousMonthKey(new Date(2026, 6, 1, 0, 5, 0))).toBe('2026-06');
    // Day-of-month must not carry over: Mar 31 → Feb, not "Mar 3".
    expect(previousMonthKey(new Date(2026, 2, 31, 12, 0, 0))).toBe('2026-02');
  });

  it('previousMonthKey crosses the year boundary', () => {
    expect(previousMonthKey(new Date(2026, 0, 1, 12, 0, 0))).toBe('2025-12');
  });

  it('monthLabel reads as the month name', () => {
    expect(monthLabel('2026-06')).toBe('June');
    expect(monthLabel('2025-12')).toBe('December');
  });
});

describe('dayPartLabel', () => {
  it('maps hour windows to parts of day', () => {
    expect(dayPartLabel('2026-07-07T05:00:00')).toBe('morning');
    expect(dayPartLabel('2026-07-07T11:59:00')).toBe('morning');
    expect(dayPartLabel('2026-07-07T12:00:00')).toBe('afternoon');
    expect(dayPartLabel('2026-07-07T16:59:00')).toBe('afternoon');
    expect(dayPartLabel('2026-07-07T17:00:00')).toBe('evening');
    expect(dayPartLabel('2026-07-07T20:59:00')).toBe('evening');
    expect(dayPartLabel('2026-07-07T21:00:00')).toBe('night');
    expect(dayPartLabel('2026-07-07T02:00:00')).toBe('night');
    expect(dayPartLabel('2026-07-07T04:59:00')).toBe('night');
  });
});
