// Circle store (local-only people CRUD) + the pure share-summary generator.

import { syncCircleReminders, useCircleStore } from '@/store/circleStore';
import {
  FREQUENCY_ORDER,
  nextInCycle,
  SEES_ORDER,
  shareSummary,
} from '@/content/circle';
import type { WeekStats } from '@/types/models';

const initial = useCircleStore.getState();
beforeEach(() => useCircleStore.setState(initial, true));

function stats(overrides: Partial<WeekStats> = {}): WeekStats {
  return {
    weekKey: '2026-W28',
    checkInCount: 0,
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
    judgmentEntryCount: 0,
    coOccurringFamilies: null,
    ...overrides,
  };
}

describe('circleStore', () => {
  it('adds a person with a stamped id and keeps them local', () => {
    const p = useCircleStore.getState().addPerson({
      name: 'Sam',
      relationship: 'Partner',
      sees: 'colours-words',
      frequency: 'evening',
    });
    expect(p.id.length).toBeGreaterThan(0);
    expect(useCircleStore.getState().people).toHaveLength(1);
    expect(useCircleStore.getState().people[0].name).toBe('Sam');
  });

  it('updates a person in place, preserving id', () => {
    const p = useCircleStore.getState().addPerson({
      name: 'Mum',
      relationship: 'Family',
      sees: 'colours',
      frequency: 'weekly',
    });
    useCircleStore.getState().updatePerson(p.id, { sees: 'count' });
    const [updated] = useCircleStore.getState().people;
    expect(updated.id).toBe(p.id);
    expect(updated.sees).toBe('count');
    expect(updated.frequency).toBe('weekly');
  });

  it('removes a person and clearAll empties the circle', () => {
    const p = useCircleStore.getState().addPerson({
      name: 'Priya',
      relationship: 'Close friend',
      sees: 'count',
      frequency: 'paused',
    });
    useCircleStore.getState().removePerson(p.id);
    expect(useCircleStore.getState().people).toHaveLength(0);

    useCircleStore.getState().addPerson({ name: 'X', relationship: 'Y', sees: 'colours', frequency: 'paused' });
    useCircleStore.getState().clearAll();
    expect(useCircleStore.getState().people).toEqual([]);
  });

  it('holds and clears a one-shot pending-share intent', () => {
    useCircleStore.getState().requestShare('p1');
    expect(useCircleStore.getState().pendingSharePersonId).toBe('p1');
    useCircleStore.getState().clearPendingShare();
    expect(useCircleStore.getState().pendingSharePersonId).toBeNull();
  });

  it('clearAll also drops reminder ids and any pending share', () => {
    useCircleStore.getState().setReminderIds({ p1: ['id-1'] });
    useCircleStore.getState().requestShare('p1');
    useCircleStore.getState().clearAll();
    expect(useCircleStore.getState().reminderIds).toEqual({});
    expect(useCircleStore.getState().pendingSharePersonId).toBeNull();
  });
});

describe('syncCircleReminders', () => {
  it('schedules a reminder for a non-paused person and stores the id map', async () => {
    const p = useCircleStore.getState().addPerson({
      name: 'Sam',
      relationship: 'Partner',
      sees: 'colours',
      frequency: 'evening',
    });
    await syncCircleReminders();
    expect(useCircleStore.getState().reminderIds).toEqual({ [p.id]: ['mock-notification-id'] });
  });

  it('recadencing everyone to paused cancels and clears the stored ids', async () => {
    const p = useCircleStore.getState().addPerson({
      name: 'Sam',
      relationship: 'Partner',
      sees: 'colours',
      frequency: 'evening',
    });
    await syncCircleReminders();
    expect(useCircleStore.getState().reminderIds).not.toEqual({});

    useCircleStore.getState().updatePerson(p.id, { frequency: 'paused' });
    await syncCircleReminders();
    expect(useCircleStore.getState().reminderIds).toEqual({});
  });
});

describe('nextInCycle', () => {
  it('advances through the options and wraps', () => {
    expect(nextInCycle(SEES_ORDER, 'colours-words')).toBe('colours');
    expect(nextInCycle(SEES_ORDER, 'count')).toBe('colours-words');
    expect(nextInCycle(FREQUENCY_ORDER, 'paused')).toBe('evening');
  });
});

describe('shareSummary', () => {
  const week = stats({
    checkInCount: 6,
    familyCounts: {
      anger: 0,
      fear: 1,
      sadness: 4,
      disgust: 0,
      enjoyment: 3,
      surprise: 0,
      contempt: 0,
      anticipation: 0,
      trust: 0,
    },
  });

  it('a count-only person sees numbers, never feelings', () => {
    const out = shareSummary('count', week);
    expect(out).toBe('This week: 6 check-ins.');
    expect(out).not.toMatch(/tender|warm|fiery/);
  });

  it('a colours person sees tone words for the top families', () => {
    // sadness (4) → tender, enjoyment (3) → warm.
    expect(shareSummary('colours', week)).toBe('This week felt mostly tender and warm.');
  });

  it('a colours+words person gets a hint of range', () => {
    // Third family fear (1) → bracing.
    expect(shareSummary('colours-words', week)).toBe('Mostly tender and warm — some bracing too.');
  });

  it('a truly empty week says so, at every level', () => {
    for (const level of SEES_ORDER) {
      expect(shareSummary(level, stats())).toBe('A quiet week — nothing stitched in yet.');
    }
  });
});
