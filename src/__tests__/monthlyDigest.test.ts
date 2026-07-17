// Monthly digests — pure generators for the Insights tab's beyond-the-week
// sections. Date-stable: `now` is injected.

import { monthlyMoodDigest, monthlyPracticeDigest, MONTHLY_MIN_CHECKINS } from '@/content/monthlyDigest';
import type { CheckIn, JudgmentEntry } from '@/types/models';
import { dayKey } from '@/utils/dates';

const NOW = new Date('2026-07-17T12:00:00');

function checkIn(daysAgo: number, i = 0, flags: CheckIn['resistanceFlags'] = []): CheckIn {
  const d = new Date(2026, 6, 17 - daysAgo, 9 + i, 0);
  const iso = d.toISOString();
  return {
    id: `c-${daysAgo}-${i}`,
    createdAt: iso,
    dayKey: dayKey(iso),
    emotions: [
      { emotionId: 'worried', family: 'fear', intensity: 2 },
      { emotionId: 'glad', family: 'enjoyment', intensity: 3 },
    ],
    resistanceFlags: flags,
    source: 'manual',
  };
}

describe('monthlyMoodDigest', () => {
  it('stays silent while the month is too thin to read', () => {
    const thin = Array.from({ length: MONTHLY_MIN_CHECKINS - 1 }, (_, i) => checkIn(i + 1));
    expect(monthlyMoodDigest(thin, NOW)).toBeNull();
  });

  it('names count, spread, carrying families, and the leading tell', () => {
    const month = Array.from({ length: 10 }, (_, i) =>
      checkIn(i + 1, 0, i < 4 ? ['binary-stuckness'] : [])
    );
    const digest = monthlyMoodDigest(month, NOW);
    expect(digest).not.toBeNull();
    expect(digest!.body).toContain('10 check-ins across 10 days');
    expect(digest!.body).toContain('Enjoyment and Fear carried it');
    expect(digest!.body).toContain('Stuck between two options');
    // Old check-ins outside the 30-day window don't count.
    expect(monthlyMoodDigest([...month, checkIn(45)], NOW)!.body).toContain('10 check-ins');
  });

  it('skips the tell clause below three occurrences', () => {
    const month = Array.from({ length: 10 }, (_, i) =>
      checkIn(i + 1, 0, i < 2 ? ['comparison'] : [])
    );
    expect(monthlyMoodDigest(month, NOW)!.body).not.toContain('Comparison');
  });
});

describe('monthlyPracticeDigest', () => {
  const sitting = (daysAgo: number, sittingId: string): JudgmentEntry[] => [
    {
      id: `${sittingId}-a`,
      createdAt: new Date(2026, 6, 17 - daysAgo, 20, 0).toISOString(),
      target: 'myself',
      judgment: 'being slow',
      uncoveredFeelings: [],
      sittingId,
    },
    {
      id: `${sittingId}-b`,
      createdAt: new Date(2026, 6, 17 - daysAgo, 20, 0).toISOString(),
      target: 'my neighbour',
      judgment: 'the noise',
      uncoveredFeelings: [],
      sittingId,
    },
  ];

  it('is null with nothing practised — never guilt copy', () => {
    expect(monthlyPracticeDigest([], [], NOW)).toBeNull();
  });

  it('counts sittings by practice, judgment sittings grouped not per-entry', () => {
    const digest = monthlyPracticeDigest(
      [
        { practiceId: 'problem-solution', createdAt: new Date(2026, 6, 10).toISOString() },
        { practiceId: 'problem-solution', createdAt: new Date(2026, 6, 12).toISOString() },
        { practiceId: 'five-year-flashback', createdAt: new Date(2026, 6, 14).toISOString() },
      ],
      sitting(5, 's1'),
      NOW
    );
    expect(digest).not.toBeNull();
    // 2 entries = ONE judgment sitting; 3 practice sessions → 4 total.
    expect(digest!.body).toContain('4 sittings set down this month');
    expect(digest!.body).toContain('Explore avoided emotions ×1');
    expect(digest!.body).toContain('Problem, then solution ×2');
    expect(digest!.body).toContain('Five year flashback ×1');
  });
});
