// Experiment store: judgment-experiment entries + "name it" prompt settings.
// Persisted locally via AsyncStorage (hard rule: local-only, no server).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { JudgmentEntry, NameItSettings } from '@/types/models';
import { generateUUID } from '@/utils/ids';
import { emptyWork, type PracticeWork } from '@/utils/practiceWork';

const NAME_IT_DEFAULTS: NameItSettings = {
  enabled: false,
  timesPerDay: 3,
  wakeStart: 9,
  wakeEnd: 21,
  scheduledIds: [],
};

/** One finished sitting of a perspective practice — archived by "Set it
 *  down" so the next visit starts on a fresh page (user, 2026-07-17). */
export interface PracticeSession {
  id: string;
  practiceId: string;
  createdAt: string;
  work: PracticeWork;
}

/** True when any step holds something worth keeping. */
function workHasContent(work: PracticeWork): boolean {
  return (
    Object.values(work.entries).some((texts) => texts.some((t) => t.trim().length > 0)) ||
    Object.values(work.marks).some((keys) => keys.length > 0) ||
    Object.keys(work.picks).length > 0
  );
}

interface ExperimentState {
  /** Newest-first. */
  judgmentEntries: JudgmentEntry[];
  nameIt: NameItSettings;
  /**
   * Everything typed into a perspective practice's flow, keyed practiceId →
   * PracticeWork (per-step entries / marks / picks — utils/practiceWork.ts).
   * Saved live so closing a flow mid-way loses nothing.
   */
  practiceWork: Record<string, PracticeWork>;
  /** Finished practice sittings, newest-first. */
  practiceSessions: PracticeSession[];
  addJudgmentEntry(input: Omit<JudgmentEntry, 'id' | 'createdAt'>): JudgmentEntry;
  updateJudgmentEntry(id: string, patch: Partial<Omit<JudgmentEntry, 'id' | 'createdAt'>>): void;
  removeJudgmentEntry(id: string): void;
  setNameIt(partial: Partial<NameItSettings>): void;
  updatePracticeWork(practiceId: string, updater: (work: PracticeWork) => PracticeWork): void;
  /** Archive the current work as a session (if it holds anything) and clear
   *  the form. Returns the archived session, or null when there was nothing. */
  completePractice(practiceId: string): PracticeSession | null;
  removePracticeSession(id: string): void;
  clearAll(): void;
}

export const useExperimentStore = create<ExperimentState>()(
  persist(
    (set) => ({
      judgmentEntries: [],
      nameIt: NAME_IT_DEFAULTS,
      practiceWork: {},
      practiceSessions: [],
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
      updatePracticeWork: (practiceId, updater) =>
        set((state) => ({
          practiceWork: {
            ...state.practiceWork,
            [practiceId]: updater(state.practiceWork[practiceId] ?? emptyWork()),
          },
        })),
      completePractice: (practiceId) => {
        const work = useExperimentStore.getState().practiceWork[practiceId];
        const { [practiceId]: _done, ...rest } =
          useExperimentStore.getState().practiceWork;
        if (!work || !workHasContent(work)) {
          // Nothing written — just make sure the form is fresh next time.
          set({ practiceWork: rest });
          return null;
        }
        const session: PracticeSession = {
          id: generateUUID(),
          practiceId,
          createdAt: new Date().toISOString(),
          work,
        };
        set((state) => ({
          practiceWork: rest,
          practiceSessions: [session, ...state.practiceSessions],
        }));
        return session;
      },
      removePracticeSession: (id) =>
        set((state) => ({
          practiceSessions: state.practiceSessions.filter((s) => s.id !== id),
        })),
      clearAll: () =>
        set({
          judgmentEntries: [],
          nameIt: NAME_IT_DEFAULTS,
          practiceWork: {},
          practiceSessions: [],
        }),
    }),
    {
      name: 'tml-experiments',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      // v1: `uncoveredFeeling: EmotionSelection | null` → `uncoveredFeelings:
      // EmotionSelection[]`. Wrap any single value a device saved before the
      // multi-select change so old reflections still render.
      // v2: the inline scratch pad (`practiceNotes`, flat per-step strings)
      // became structured `practiceWork`. Old free-form notes don't map onto
      // the typed steps — they are dropped, the field removed.
      // v3: `practiceSessions` (archived sittings) joins with a default.
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
        if (version < 2) {
          delete state.practiceNotes;
        }
        if (typeof state.practiceWork !== 'object' || state.practiceWork === null) {
          state.practiceWork = {};
        }
        // v3 additions arrive with defaults; just guard the shape.
        if (!Array.isArray(state.practiceSessions)) {
          state.practiceSessions = [];
        }
        return state as unknown as ExperimentState;
      },
    }
  )
);
