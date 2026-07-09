// Circle store — the people the user may choose to share with, and how much
// each sees. LOCAL ONLY, persisted via AsyncStorage (hard rule: nothing leaves
// the phone). This holds *preferences* only; the act of sharing generates a
// summary on demand and hands it to the OS share sheet (see content/circle).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CirclePerson } from '@/types/models';
import { generateUUID } from '@/utils/ids';

interface CircleState {
  people: CirclePerson[];
  /** New people start Paused — sharing is off until the user turns it on. */
  addPerson(input: Omit<CirclePerson, 'id'>): CirclePerson;
  updatePerson(id: string, patch: Partial<Omit<CirclePerson, 'id'>>): void;
  removePerson(id: string): void;
  clearAll(): void;
}

export const useCircleStore = create<CircleState>()(
  persist(
    (set) => ({
      people: [],
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
      clearAll: () => set({ people: [] }),
    }),
    { name: 'tml-circle', storage: createJSONStorage(() => AsyncStorage) }
  )
);
