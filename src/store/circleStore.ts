// Circle store — the people the user may choose to share with, and how much
// each sees. LOCAL ONLY, persisted via AsyncStorage (hard rule: nothing leaves
// the phone). This holds *preferences* only; the act of sharing generates a
// summary on demand and hands it to the OS share sheet (see content/circle).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { rescheduleCircle } from '@/services/notifications';
import type { CirclePerson } from '@/types/models';
import { generateUUID } from '@/utils/ids';

interface CircleState {
  people: CirclePerson[];
  /**
   * personId → the scheduled local-notification ids for their share nudge, so
   * a reminder can be cancelled/rescheduled when a person is removed, paused,
   * or recadenced. Persisted (the OS keeps scheduled notifications across
   * restarts, so we must remember which ids are ours to cancel).
   */
  reminderIds: Record<string, string[]>;
  /**
   * Set when a tapped Circle reminder asks the Circle screen to open the OS
   * share sheet for this person. Transient (NOT persisted — a share intent
   * must not survive a restart); the screen clears it once it acts.
   */
  pendingSharePersonId: string | null;
  /** New people start Paused — sharing is off until the user turns it on. */
  addPerson(input: Omit<CirclePerson, 'id'>): CirclePerson;
  updatePerson(id: string, patch: Partial<Omit<CirclePerson, 'id'>>): void;
  removePerson(id: string): void;
  setReminderIds(map: Record<string, string[]>): void;
  requestShare(personId: string): void;
  clearPendingShare(): void;
  clearAll(): void;
}

export const useCircleStore = create<CircleState>()(
  persist(
    (set) => ({
      people: [],
      reminderIds: {},
      pendingSharePersonId: null,
      addPerson: (input) => {
        const person: CirclePerson = { ...input, id: generateUUID() };
        set((state) => ({ people: [...state.people, person] }));
        return person;
      },
      updatePerson: (id, patch) =>
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p)),
        })),
      removePerson: (id) =>
        set((state) => ({ people: state.people.filter((p) => p.id !== id) })),
      setReminderIds: (map) => set({ reminderIds: map }),
      requestShare: (personId) => set({ pendingSharePersonId: personId }),
      clearPendingShare: () => set({ pendingSharePersonId: null }),
      clearAll: () => set({ people: [], reminderIds: {}, pendingSharePersonId: null }),
    }),
    {
      name: 'tml-circle',
      storage: createJSONStorage(() => AsyncStorage),
      // pendingSharePersonId is deliberately excluded — it's a one-shot intent,
      // never a stored preference.
      partialize: (state) => ({ people: state.people, reminderIds: state.reminderIds }),
    }
  )
);

// Serialize concurrent syncs (people change + app-foreground can fire together)
// so two reschedules don't race on the same OS queue and double-book.
let circleSyncInFlight = false;

/**
 * Reconcile the on-device Circle reminders with the current people list: cancel
 * the previously-scheduled ids, (re)schedule one nudge per non-paused person,
 * and persist the fresh id map. Call on app start, on app foreground, and
 * whenever the people list changes. No-op-safe under Expo Go (the service
 * returns {} there).
 */
export async function syncCircleReminders(): Promise<void> {
  if (circleSyncInFlight) return;
  circleSyncInFlight = true;
  try {
    const { people, reminderIds } = useCircleStore.getState();
    const next = await rescheduleCircle(people, reminderIds);
    useCircleStore.getState().setReminderIds(next);
  } finally {
    circleSyncInFlight = false;
  }
}
