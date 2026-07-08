// Experiment store: judgment-experiment entries + "name it" prompt settings.
// Persisted locally via AsyncStorage (hard rule: local-only, no server).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { JudgmentEntry, NameItSettings } from '@/types/models';
import { generateUUID } from '@/utils/ids';

const NAME_IT_DEFAULTS: NameItSettings = {
  enabled: false,
  timesPerDay: 3,
  wakeStart: 9,
  wakeEnd: 21,
  scheduledIds: [],
};

interface ExperimentState {
  /** Newest-first. */
  judgmentEntries: JudgmentEntry[];
  nameIt: NameItSettings;
  /**
   * Free-writing kept beside the Atlas perspective practices — a scratch pad
   * so a practice is something you *do*, not just read. Keyed
   * practiceId → per-step text (index matches the practice's `steps`).
   */
  practiceNotes: Record<string, string[]>;
  addJudgmentEntry(input: Omit<JudgmentEntry, 'id' | 'createdAt'>): JudgmentEntry;
  updateJudgmentEntry(id: string, patch: Partial<Omit<JudgmentEntry, 'id' | 'createdAt'>>): void;
  removeJudgmentEntry(id: string): void;
  setNameIt(partial: Partial<NameItSettings>): void;
  setPracticeNote(practiceId: string, stepIndex: number, text: string): void;
  clearAll(): void;
}

export const useExperimentStore = create<ExperimentState>()(
  persist(
    (set) => ({
      judgmentEntries: [],
      nameIt: NAME_IT_DEFAULTS,
      practiceNotes: {},
      addJudgmentEntry: (input) => {
        const entry: JudgmentEntry = {
          ...input,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ judgmentEntries: [entry, ...state.judgmentEntries] }));
        return entry;
      },
      updateJudgmentEntry: (id, patch) =>
        set((state) => ({
          judgmentEntries: state.judgmentEntries.map((e) =>
            e.id === id ? { ...e, ...patch, id: e.id, createdAt: e.createdAt } : e
          ),
        })),
      removeJudgmentEntry: (id) =>
        set((state) => ({
          judgmentEntries: state.judgmentEntries.filter((e) => e.id !== id),
        })),
      setNameIt: (partial) => set((state) => ({ nameIt: { ...state.nameIt, ...partial } })),
      setPracticeNote: (practiceId, stepIndex, text) =>
        set((state) => {
          const current = state.practiceNotes[practiceId] ?? [];
          const next = current.slice();
          next[stepIndex] = text;
          return { practiceNotes: { ...state.practiceNotes, [practiceId]: next } };
        }),
      clearAll: () => set({ judgmentEntries: [], nameIt: NAME_IT_DEFAULTS, practiceNotes: {} }),
    }),
    {
      name: 'tml-experiments',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v1: `uncoveredFeeling: EmotionSelection | null` → `uncoveredFeelings:
      // EmotionSelection[]`. Wrap any single value a device saved before the
      // multi-select change so old reflections still render.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        if (version < 1 && Array.isArray(state.judgmentEntries)) {
          state.judgmentEntries = (state.judgmentEntries as Array<Record<string, unknown>>).map(
            (entry) => {
              const legacy = entry.uncoveredFeeling;
              const { uncoveredFeeling: _drop, ...rest } = entry;
              return {
                ...rest,
                uncoveredFeelings: Array.isArray(entry.uncoveredFeelings)
                  ? entry.uncoveredFeelings
                  : legacy
                    ? [legacy]
                    : [],
              };
            }
          );
        }
        if (typeof state.practiceNotes !== 'object' || state.practiceNotes === null) {
          state.practiceNotes = {};
        }
        return state as unknown as ExperimentState;
      },
    }
  )
);
