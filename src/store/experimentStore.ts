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
  addJudgmentEntry(input: Omit<JudgmentEntry, 'id' | 'createdAt'>): JudgmentEntry;
  updateJudgmentEntry(id: string, patch: Partial<Omit<JudgmentEntry, 'id' | 'createdAt'>>): void;
  removeJudgmentEntry(id: string): void;
  setNameIt(partial: Partial<NameItSettings>): void;
  clearAll(): void;
}

export const useExperimentStore = create<ExperimentState>()(
  persist(
    (set) => ({
      judgmentEntries: [],
      nameIt: NAME_IT_DEFAULTS,
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
      clearAll: () => set({ judgmentEntries: [], nameIt: NAME_IT_DEFAULTS }),
    }),
    { name: 'tml-experiments', storage: createJSONStorage(() => AsyncStorage) }
  )
);
