// Tiny UI store for the emotion-helper bottom sheet. NOT persisted — it holds
// only which family's helper is open right now, so any screen can open the
// sheet without prop drilling (the sheet host lives once in App.tsx). Plain
// create(), no AsyncStorage: ephemeral UI state, nothing to remember.

import { create } from 'zustand';
import type { EmotionFamilyId } from '@/types/models';

interface HelperSheetState {
  /** The family whose helper is open, or null when the sheet is closed. */
  family: EmotionFamilyId | null;
  open(family: EmotionFamilyId): void;
  close(): void;
}

export const useHelperSheetStore = create<HelperSheetState>((set) => ({
  family: null,
  open: (family) => set({ family }),
  close: () => set({ family: null }),
}));
