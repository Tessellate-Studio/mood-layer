// Check-in store — the quilt's data. Persisted locally via AsyncStorage
// (hard rule: local-only, no server). Selectors are PURE functions over a
// checkIns array so they can be unit-tested and reused without hooks.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  CheckIn,
  EmotionFamilyId,
  ResistanceTellId,
  WeekStats,
} from '@/types/models';
import { dayKey, weekKey } from '@/utils/dates';
import { generateUUID } from '@/utils/ids';

interface CheckInState {
  /** Newest-first. */
  checkIns: CheckIn[];
  addCheckIn(input: Omit<CheckIn, 'id' | 'createdAt' | 'dayKey'>): CheckIn;
  deleteCheckIn(id: string): void;
  clearAll(): void;
}

export const useCheckInStore = create<CheckInState>()(
  persist(
    (set) => ({
      checkIns: [],
      addCheckIn: (input) => {
        const createdAt = new Date().toISOString();
        const entry: CheckIn = {
          ...input,
          id: generateUUID(),
          createdAt,
          dayKey: dayKey(createdAt),
        };
        set((state) => ({ checkIns: [entry, ...state.checkIns] }));
        return entry;
      },
      deleteCheckIn: (id) =>
        set((state) => ({ checkIns: state.checkIns.filter((c) => c.id !== id) })),
      clearAll: () => set({ checkIns: [] }),
    }),
    { name: 'tml-checkins', storage: createJSONStorage(() => AsyncStorage) }
  )
);

/** Group check-ins by dayKey, preserving input order within each day. */
export function selectCheckInsByDay(checkIns: CheckIn[]): Map<string, CheckIn[]> {
  const byDay = new Map<string, CheckIn[]>();
  for (const checkIn of checkIns) {
    const existing = byDay.get(checkIn.dayKey);
    if (existing) {
      existing.push(checkIn);
    } else {
      byDay.set(checkIn.dayKey, [checkIn]);
    }
  }
  return byDay;
}

const FAMILY_IDS: EmotionFamilyId[] = [
  'anger',
  'fear',
  'sadness',
  'disgust',
  'enjoyment',
  'surprise',
  'contempt',
];

const TELL_IDS: ResistanceTellId[] = [
  'looping-thoughts',
  'harsh-judgment',
  'binary-stuckness',
  'comparison',
];

/**
 * Aggregate one ISO week of check-ins into the WeekStats shape insight
 * templates match on. judgmentEntryCount comes from the experiment store —
 * passed in so this stays a pure function of its arguments.
 */
export function selectWeekStats(
  checkIns: CheckIn[],
  judgmentEntryCount: number,
  wk: string
): WeekStats {
  const familyCounts = Object.fromEntries(FAMILY_IDS.map((id) => [id, 0])) as Record<
    EmotionFamilyId,
    number
  >;
  const resistanceCounts = Object.fromEntries(TELL_IDS.map((id) => [id, 0])) as Record<
    ResistanceTellId,
    number
  >;
  const distinct = new Set<string>();
  let checkInCount = 0;
  let maskingCount = 0;

  for (const checkIn of checkIns) {
    if (weekKey(checkIn.createdAt) !== wk) continue;
    checkInCount += 1;
    if ((checkIn.maskingUsed?.length ?? 0) > 0) maskingCount += 1;
    for (const selection of checkIn.emotions) {
      familyCounts[selection.family] += 1;
      distinct.add(selection.emotionId);
    }
    for (const flag of checkIn.resistanceFlags) {
      resistanceCounts[flag] += 1;
    }
  }

  return {
    weekKey: wk,
    checkInCount,
    familyCounts,
    resistanceCounts,
    maskingCount,
    distinctEmotionIds: [...distinct],
    judgmentEntryCount,
  };
}
