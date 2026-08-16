// insightEngine — the pure weekly-stats + insight-selection layer the
// Insights screen calls on focus. Generation semantics (max 2 cards, <3
// check-ins → nothing) must stay in lockstep with insightStore, which
// delegates to this engine (single source of truth).

import type { CheckIn, JudgmentEntry, WeekStats } from '@/types/models';
import { weekKey } from '@/utils/dates';
import { computeStatsForWeek, generateInsights } from '@/utils/insightEngine';

function stats(overrides: Partial<WeekStats> = {}): WeekStats {
  return {
    weekKey: '2026-W27',
    checkInCount: 5,
    activeDayCount: 0,
    familyCounts: {
      anger: 0,
      fear: 0,
      sadness: 0,
      disgust: 0,
      enjoyment: 0,
      surprise: 0,
      contempt: 0,
      anticipation: 0,
      trust: 0,
    },
    resistanceCounts: {
      'looping-thoughts': 0,
      'harsh-judgment': 0,
      'binary-stuckness': 0,
      comparison: 0,
    },
    maskingCount: 0,
    distinctEmotionIds: [],
    coOccurringFamilies: null,
    judgmentEntryCount: 0,
    ...overrides,
  };
}

function checkIn(createdAt: string, overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: `c-${createdAt}`,
    createdAt,
    dayKey: createdAt.slice(0, 10),
    emotions: [{ emotionId: 'irritated', family: 'anger', intensity: 2 }],
    resistanceFlags: [],
    source: 'manual',
    ...overrides,
  };
}

function judgment(createdAt: string): JudgmentEntry {
  return {
    id: `j-${createdAt}`,
    createdAt,
    target: 'a colleague',
    judgment: 'being careless',
    uncoveredFeelings: [],
  };
}

describe('generateInsights', () => {
  it('surfaces stuck-decisions for a binary-stuckness-heavy week', () => {
    const result = generateInsights(
      stats({
        checkInCount: 4,
        resistanceCounts: {
          'looping-thoughts': 0,
          'harsh-judgment': 0,
          'binary-stuckness': 3,
          comparison: 0,
        },
      })
    );
    expect(result.map((r) => r.templateId)).toContain('stuck-decisions');
    for (const card of result) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.body.length).toBeGreaterThan(0);
    }
  });

  it('caps at 2 cards even when many templates match, highest priority first', () => {
    // Matches looping-week (70), numb-cluster (80), masking-fine (40),
    // fluid-week (90), judgment-heavy (50) — five candidates.
    const busy = stats({
      checkInCount: 8,
      resistanceCounts: {
        'looping-thoughts': 4,
        'harsh-judgment': 3,
        'binary-stuckness': 0,
        comparison: 0,
      },
      maskingCount: 3,
      distinctEmotionIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    });
    const result = generateInsights(busy);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.templateId)).toEqual(['fluid-week', 'numb-cluster']);
  });

  it('returns nothing under 3 check-ins (not enough stitches)', () => {
    const result = generateInsights(
      stats({
        checkInCount: 2,
        resistanceCounts: {
          'looping-thoughts': 4,
          'harsh-judgment': 4,
          'binary-stuckness': 4,
          comparison: 4,
        },
      })
    );
    expect(result).toEqual([]);
  });

  it('is deterministic for the same stats', () => {
    const fixture = stats({
      checkInCount: 6,
      maskingCount: 3,
      distinctEmotionIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    });
    expect(generateInsights(fixture)).toEqual(generateInsights(fixture));
  });
});

describe('computeStatsForWeek', () => {
  // Local-time fixtures a week apart; derive the week keys from the util so
  // the test holds in any timezone.
  const now = new Date();
  const inWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 10, 0);
  const otherWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
  const wk = weekKey(inWeek.toISOString());

  it('counts only judgment entries whose createdAt falls in the week', () => {
    const result = computeStatsForWeek(
      [],
      [judgment(inWeek.toISOString()), judgment(inWeek.toISOString()), judgment(otherWeek.toISOString())],
      wk
    );
    expect(result.judgmentEntryCount).toBe(2);
  });

  it('delegates check-in aggregation to the week-stats selector', () => {
    const result = computeStatsForWeek(
      [
        checkIn(inWeek.toISOString(), { resistanceFlags: ['binary-stuckness'] }),
        checkIn(inWeek.toISOString(), { maskingUsed: ['fine'] }),
        checkIn(otherWeek.toISOString()),
      ],
      [],
      wk
    );
    expect(result.weekKey).toBe(wk);
    expect(result.checkInCount).toBe(2);
    expect(result.resistanceCounts['binary-stuckness']).toBe(1);
    expect(result.maskingCount).toBe(1);
    expect(result.familyCounts.anger).toBe(2);
    expect(result.distinctEmotionIds).toEqual(['irritated']);
  });

  it('counts distinct active days', () => {
    // Anchored to the MONDAY of the target week, not to `now - 7`. Two
    // consecutive days are only in the same ISO week if the first one isn't a
    // Sunday — `now - 7` and `now - 6` straddle the boundary every Sunday,
    // which failed this test (and master's CI) on 2026-08-16. Monday and
    // Tuesday always share a week, in every timezone.
    const monday = new Date(
      inWeek.getFullYear(),
      inWeek.getMonth(),
      inWeek.getDate() - ((inWeek.getDay() + 6) % 7)
    );
    const day1 = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 9, 0);
    const day1b = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 20, 0);
    const day2 = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 1, 9, 0);
    const result = computeStatsForWeek(
      [day1, day1b, day2].map((d) => checkIn(d.toISOString())),
      [],
      wk
    );
    expect(result.checkInCount).toBe(3);
    expect(result.activeDayCount).toBe(2);
  });

  it('finds the two families that most often co-occur in a check-in (≥2), sorted', () => {
    const bothFamilies = {
      emotions: [
        { emotionId: 'sad', family: 'sadness' as const, intensity: 2 as const },
        { emotionId: 'glad', family: 'enjoyment' as const, intensity: 2 as const },
      ],
    };
    const result = computeStatsForWeek(
      [
        checkIn(inWeek.toISOString(), bothFamilies),
        checkIn(inWeek.toISOString(), bothFamilies),
      ],
      [],
      wk
    );
    // 'enjoyment' < 'sadness' alphabetically → returned in sorted order.
    expect(result.coOccurringFamilies).toEqual(['enjoyment', 'sadness']);
  });

  it('does not call a single co-occurrence a pattern', () => {
    const result = computeStatsForWeek(
      [
        checkIn(inWeek.toISOString(), {
          emotions: [
            { emotionId: 'sad', family: 'sadness', intensity: 2 },
            { emotionId: 'glad', family: 'enjoyment', intensity: 2 },
          ],
        }),
        checkIn(inWeek.toISOString()),
      ],
      [],
      wk
    );
    expect(result.coOccurringFamilies).toBeNull();
  });
});
