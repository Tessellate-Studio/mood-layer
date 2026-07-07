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
      setNameIt: (partial) => set((state) => ({ nameIt: { ...state.nameIt, ...partial } })),
      clearAll: () => set({ judgmentEntries: [], nameIt: NAME_IT_DEFAULTS }),
    }),
    { name: 'tml-experiments', storage: createJSONStorage(() => AsyncStorage) }
  )
);
