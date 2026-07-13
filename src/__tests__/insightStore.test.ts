import type { WeekStats } from '@/types/models';
import { useInsightStore } from '@/store/insightStore';

const initialState = useInsightStore.getState();

beforeEach(() => {
  useInsightStore.setState(initialState, true);
});

function stats(overrides: Partial<WeekStats> = {}): WeekStats {
  return {
    weekKey: '2026-W28',
    checkInCount: 5,
    activeDayCount: 1,
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

/** Triggers looping-week, numb-cluster, masking-fine, and fluid-week (4 matches). */
const busyWeek = stats({
  checkInCount: 8,
  resistanceCounts: {
    'looping-thoughts': 4,
    'harsh-judgment': 0,
    'binary-stuckness': 0,
    comparison: 0,
  },
  maskingCount: 3,
  distinctEmotionIds: ['irritated', 'worried', 'sad', 'hurt', 'content', 'glad', 'curious', 'amazed'],
});

describe('insightStore.generateForWeek', () => {
  it('caps at 2 cards, keeping the highest-priority matches', () => {
    useInsightStore.getState().generateForWeek('2026-W28', busyWeek);
    const { cards, lastGeneratedWeekKey } = useInsightStore.getState();

    expect(lastGeneratedWeekKey).toBe('2026-W28');
    expect(cards).toHaveLength(2);
    // fluid-week (90) and numb-cluster (80) outrank looping-week (70) and masking-fine (40)
    expect(cards.map((c) => c.templateId).sort()).toEqual(['fluid-week', 'numb-cluster']);
    for (const card of cards) {
      expect(card.weekKey).toBe('2026-W28');
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.body.length).toBeGreaterThan(0);
      expect(card.dismissedAt).toBeUndefined();
    }
  });

  it('is idempotent for the same week', () => {
    useInsightStore.getState().generateForWeek('2026-W28', busyWeek);
    useInsightStore.getState().generateForWeek('2026-W28', busyWeek);
    expect(useInsightStore.getState().cards).toHaveLength(2);
  });

  it('generates nothing under 3 check-ins but still marks the week', () => {
    useInsightStore.getState().generateForWeek('2026-W28', { ...busyWeek, checkInCount: 2 });
    expect(useInsightStore.getState().cards).toHaveLength(0);
    expect(useInsightStore.getState().lastGeneratedWeekKey).toBe('2026-W28');
    // and marking means a repeat call for that week stays a no-op
    useInsightStore.getState().generateForWeek('2026-W28', busyWeek);
    expect(useInsightStore.getState().cards).toHaveLength(0);
  });

  it('generates nothing when no template matches, but marks the week', () => {
    useInsightStore.getState().generateForWeek('2026-W28', stats());
    expect(useInsightStore.getState().cards).toHaveLength(0);
    expect(useInsightStore.getState().lastGeneratedWeekKey).toBe('2026-W28');
  });

  it('appends cards for a new week alongside the previous ones', () => {
    useInsightStore.getState().generateForWeek('2026-W28', busyWeek);
    useInsightStore.getState().generateForWeek('2026-W29', busyWeek);
    const { cards } = useInsightStore.getState();
    expect(cards).toHaveLength(4);
    expect(cards.filter((c) => c.weekKey === '2026-W29')).toHaveLength(2);
  });
});

describe('insightStore.dismissCard', () => {
  it('stamps dismissedAt and the card stays dismissed', () => {
    useInsightStore.getState().generateForWeek('2026-W28', busyWeek);
    const target = useInsightStore.getState().cards[0];

    useInsightStore.getState().dismissCard(target.id);
    const after = useInsightStore.getState().cards.find((c) => c.id === target.id);
    expect(after?.dismissedAt).toBeDefined();
    expect(new Date(after?.dismissedAt as string).getTime()).not.toBeNaN();

    // Re-generating the same week does not resurrect it
    useInsightStore.getState().generateForWeek('2026-W28', busyWeek);
    const still = useInsightStore.getState().cards.find((c) => c.id === target.id);
    expect(still?.dismissedAt).toBe(after?.dismissedAt);
  });
});

describe('insightStore.clearAll', () => {
  it('empties cards and clears the week marker', () => {
    useInsightStore.getState().generateForWeek('2026-W28', busyWeek);
    useInsightStore.getState().clearAll();
    expect(useInsightStore.getState().cards).toHaveLength(0);
    expect(useInsightStore.getState().lastGeneratedWeekKey).toBeNull();
  });
});
