// Monthly digests — pure generators for the Insights tab's beyond-the-week
// sections. Date-stable: `now` is injected.

import { monthlyMoodDigest, monthlyPracticeReflection, MONTHLY_MIN_CHECKINS } from '@/content/monthlyDigest';
import type { PracticeSession } from '@/store/experimentStore';
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

  const session = (
    id: string,
    practiceId: string,
    daysAgo: number,
    work: PracticeSession['work']
  ): PracticeSession => ({
    id,
    practiceId,
    createdAt: new Date(2026, 6, 17 - daysAgo, 20, 0).toISOString(),
    work,
  });

  it('is null with nothing practised — never guilt copy', () => {
    expect(monthlyPracticeReflection([], [], NOW)).toBeNull();
  });

  it('surfaces the feeling most often found under judgments, not a tally', () => {
    // 'worried' waits under two of the sitting's judgments.
    const entries: JudgmentEntry[] = [
      {
        id: 'j-a',
        createdAt: new Date(2026, 6, 12, 20).toISOString(),
        target: 'myself',
        judgment: 'being slow',
        uncoveredFeelings: [{ emotionId: 'worried', family: 'fear', intensity: 2 }],
        sittingId: 's1',
      },
      {
        id: 'j-b',
        createdAt: new Date(2026, 6, 12, 20).toISOString(),
        target: 'my week',
        judgment: 'the mess',
        uncoveredFeelings: [{ emotionId: 'worried', family: 'fear', intensity: 3 }],
        sittingId: 's1',
      },
    ];
    const reflection = monthlyPracticeReflection([], entries, NOW);
    expect(reflection).not.toBeNull();
    expect(reflection!.body).toContain('worried was waiting 2 times');
  });

  it('breaks the sitting count onto its own line, ahead of the reflection invite', () => {
    // One sitting, one feeling named once — below the topFeeling>=2 threshold,
    // so this exercises the plain count-line branch.
    const entries: JudgmentEntry[] = [
      {
        id: 'j-only',
        createdAt: new Date(2026, 6, 12, 20).toISOString(),
        target: 'myself',
        judgment: 'being slow',
        uncoveredFeelings: [{ emotionId: 'worried', family: 'fear', intensity: 2 }],
        sittingId: 's1',
      },
    ];
    const reflection = monthlyPracticeReflection([], entries, NOW);
    expect(reflection).not.toBeNull();
    // The count sentence and the invitation read as two separate lines, not
    // one run-on paragraph — the invitation is worth a beat on its own.
    expect(reflection!.body).toBe(
      '1 judgment sitting this month.\n\nNaming what sits underneath is the whole practice — the rest can wait.'
    );
  });

  it('keeps the actual CONCLUSIONS of recent sittings, newest first', () => {
    const reflection = monthlyPracticeReflection(
      [
        session('ps-old', 'problem-solution', 10, {
          entries: { problem: ['no time'], ideas: ['ask for help'], 'small-step': ['email Sam'] },
          marks: {},
          picks: { 'one-step': ['ideas:0'] },
        }),
        session('ps-new', 'five-year-flashback', 2, {
          entries: { decision: ['move?'], options: ['stay', 'go north'] },
          marks: {},
          picks: { 'still-matters': ['options:1'] },
        }),
      ],
      [],
      NOW
    );
    expect(reflection).not.toBeNull();
    // Newest sitting first; conclusion = opening → outcome format.
    expect(reflection!.kept[0]).toEqual({
      practice: 'Five year flashback',
      conclusion: 'move? → go north',
    });
    expect(reflection!.kept[1].practice).toBe('Problem, then solution');
  });

  it('ignores sittings older than the 30-day window', () => {
    const reflection = monthlyPracticeReflection(
      [session('ps-stale', 'problem-solution', 45, {
        entries: { problem: ['old'] },
        marks: {},
        picks: {},
      })],
      [],
      NOW
    );
    expect(reflection).toBeNull();
  });
});
