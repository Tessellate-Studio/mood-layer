import type { CheckIn } from '@/types/models';
import {
  useCheckInStore,
  selectCheckInsByDay,
  selectWeekStats,
} from '@/store/checkInStore';

const initialState = useCheckInStore.getState();

beforeEach(() => {
  useCheckInStore.setState(initialState, true);
});

/** Build a raw CheckIn fixture with an explicit createdAt. */
function fixture(overrides: Partial<CheckIn> & { createdAt: string; dayKey: string }): CheckIn {
  return {
    id: `fix-${overrides.createdAt}-${Math.random()}`,
    emotions: [],
    resistanceFlags: [],
    source: 'manual',
    ...overrides,
  };
}

describe('checkInStore actions', () => {
  it('addCheckIn stamps id, createdAt, and a dayKey derived from createdAt, and prepends', () => {
    const first = useCheckInStore.getState().addCheckIn({
      emotions: [{ emotionId: 'worried', family: 'fear', intensity: 2 }],
      resistanceFlags: ['looping-thoughts'],
      source: 'manual',
    });

    expect(first.id.length).toBeGreaterThan(0);
    expect(new Date(first.createdAt).getTime()).not.toBeNaN();
    // dayKey must be the local YYYY-MM-DD of createdAt
    const d = new Date(first.createdAt);
    const expectedDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    expect(first.dayKey).toBe(expectedDay);

    const second = useCheckInStore.getState().addCheckIn({
      emotions: [{ emotionId: 'glad', family: 'enjoyment', intensity: 1 }],
      resistanceFlags: [],
      source: 'name-it',
    });

    // Newest-first, ids unique
    const { checkIns } = useCheckInStore.getState();
    expect(checkIns).toHaveLength(2);
    expect(checkIns[0].id).toBe(second.id);
    expect(checkIns[1].id).toBe(first.id);
    expect(first.id).not.toBe(second.id);
  });

  it('deleteCheckIn removes only the matching entry', () => {
    const a = useCheckInStore.getState().addCheckIn({
      emotions: [],
      resistanceFlags: [],
      source: 'manual',
    });
    const b = useCheckInStore.getState().addCheckIn({
      emotions: [],
      resistanceFlags: [],
      source: 'manual',
    });

    useCheckInStore.getState().deleteCheckIn(a.id);
    const { checkIns } = useCheckInStore.getState();
    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].id).toBe(b.id);
  });

  it('clearAll empties the list', () => {
    useCheckInStore.getState().addCheckIn({ emotions: [], resistanceFlags: [], source: 'manual' });
    useCheckInStore.getState().clearAll();
    expect(useCheckInStore.getState().checkIns).toHaveLength(0);
  });
});

describe('selectCheckInsByDay', () => {
  it('groups check-ins by dayKey, preserving order within a day', () => {
    const a = fixture({ createdAt: '2026-07-07T09:00:00', dayKey: '2026-07-07' });
    const b = fixture({ createdAt: '2026-07-07T18:00:00', dayKey: '2026-07-07' });
    const c = fixture({ createdAt: '2026-07-06T12:00:00', dayKey: '2026-07-06' });

    const byDay = selectCheckInsByDay([b, a, c]); // newest-first input
    expect([...byDay.keys()].sort()).toEqual(['2026-07-06', '2026-07-07']);
    expect(byDay.get('2026-07-07')).toEqual([b, a]);
    expect(byDay.get('2026-07-06')).toEqual([c]);
  });
});

describe('selectWeekStats', () => {
  // W28 of 2026 = Mon 2026-07-06 .. Sun 2026-07-12; W27 ends Sun 2026-07-05.
  const inWeek1 = fixture({
    createdAt: '2026-07-06T09:00:00',
    dayKey: '2026-07-06',
    emotions: [
      { emotionId: 'worried', family: 'fear', intensity: 2 },
      { emotionId: 'irritated', family: 'anger', intensity: 1 },
    ],
    resistanceFlags: ['looping-thoughts', 'harsh-judgment'],
    maskingUsed: ['stressed'],
  });
  const inWeek2 = fixture({
    createdAt: '2026-07-12T21:00:00',
    dayKey: '2026-07-12',
    emotions: [
      { emotionId: 'worried', family: 'fear', intensity: 3 },
      { emotionId: 'sad', family: 'sadness', intensity: 2 },
    ],
    resistanceFlags: ['looping-thoughts'],
  });
  const otherWeek = fixture({
    createdAt: '2026-07-05T09:00:00', // Sunday — previous ISO week
    dayKey: '2026-07-05',
    emotions: [{ emotionId: 'joyful', family: 'enjoyment', intensity: 4 }],
    resistanceFlags: ['comparison'],
    maskingUsed: ['fine'],
  });

  it('only counts check-ins whose createdAt falls in the requested ISO week', () => {
    const stats = selectWeekStats([inWeek2, inWeek1, otherWeek], 0, '2026-W28');
    expect(stats.weekKey).toBe('2026-W28');
    expect(stats.checkInCount).toBe(2);
  });

  it('aggregates family counts across all emotions in the week', () => {
    const stats = selectWeekStats([inWeek2, inWeek1, otherWeek], 0, '2026-W28');
    expect(stats.familyCounts.fear).toBe(2);
    expect(stats.familyCounts.anger).toBe(1);
    expect(stats.familyCounts.sadness).toBe(1);
    expect(stats.familyCounts.enjoyment).toBe(0); // otherWeek excluded
    expect(stats.familyCounts.disgust).toBe(0);
  });

  it('aggregates resistance counts, masking count, and distinct emotion ids', () => {
    const stats = selectWeekStats([inWeek2, inWeek1, otherWeek], 0, '2026-W28');
    expect(stats.resistanceCounts['looping-thoughts']).toBe(2);
    expect(stats.resistanceCounts['harsh-judgment']).toBe(1);
    expect(stats.resistanceCounts.comparison).toBe(0);
    expect(stats.maskingCount).toBe(1); // only inWeek1 used a masking state
    expect([...stats.distinctEmotionIds].sort()).toEqual(['irritated', 'sad', 'worried']);
  });

  it('passes judgmentEntryCount through', () => {
    const stats = selectWeekStats([inWeek1], 4, '2026-W28');
    expect(stats.judgmentEntryCount).toBe(4);
  });
});
