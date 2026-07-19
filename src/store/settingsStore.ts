// App settings. Persisted locally via AsyncStorage (hard rule: local-only).
// reduceMotionOverride: null = follow the OS setting; true/false = user
// override consumed by useMotion() alongside useReducedMotion().

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsValues {
  onboardingCompletedAt: string | null;
  hapticsEnabled: boolean;
  reduceMotionOverride: boolean | null;
  dismissedTips: string[];
}

const DEFAULTS: SettingsValues = {
  onboardingCompletedAt: null,
  hapticsEnabled: true,
  reduceMotionOverride: null,
  dismissedTips: [],
};

interface SettingsState extends SettingsValues {
  completeOnboarding(): void;
  setHapticsEnabled(enabled: boolean): void;
  setReduceMotionOverride(override: boolean | null): void;
  dismissTip(tipId: string): void;
  resetAll(): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      completeOnboarding: () => set({ onboardingCompletedAt: new Date().toISOString() }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setReduceMotionOverride: (override) => set({ reduceMotionOverride: override }),
      dismissTip: (tipId) =>
        set((state) =>
          state.dismissedTips.includes(tipId) ? {} : { dismissedTips: [...state.dismissedTips, tipId] }
        ),
      resetAll: () => set({ ...DEFAULTS }),
    }),
    { name: 'tml-settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
