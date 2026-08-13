// App settings. Persisted locally via AsyncStorage (hard rule: local-only).
// reduceMotionOverride: null = follow the OS setting; true/false = user
// override consumed by useMotion() alongside useReducedMotion().

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { initCrashReporting, shutdownCrashReporting } from '@/services/crashReporting';

interface SettingsValues {
  onboardingCompletedAt: string | null;
  hapticsEnabled: boolean;
  reduceMotionOverride: boolean | null;
  dismissedTips: string[];
  /**
   * Crash reporting consent. MUST default to false and stay opt-in: this is
   * the only setting that sends anything off-device, and the privacy review
   * (docs/SECURITY.md) rests on it being an explicit choice. Never flip the
   * default; never enable it from anywhere but the Settings toggle.
   */
  crashReportingEnabled: boolean;
}

const DEFAULTS: SettingsValues = {
  onboardingCompletedAt: null,
  hapticsEnabled: true,
  reduceMotionOverride: null,
  dismissedTips: [],
  crashReportingEnabled: false,
};

interface SettingsState extends SettingsValues {
  completeOnboarding(): void;
  setHapticsEnabled(enabled: boolean): void;
  setReduceMotionOverride(override: boolean | null): void;
  setCrashReportingEnabled(enabled: boolean): void;
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
      setCrashReportingEnabled: (enabled) => {
        // Start/stop at the moment of choice, so "off" means off immediately —
        // not at the next launch.
        if (enabled) initCrashReporting();
        else shutdownCrashReporting();
        set({ crashReportingEnabled: enabled });
      },
      dismissTip: (tipId) =>
        set((state) =>
          state.dismissedTips.includes(tipId) ? {} : { dismissedTips: [...state.dismissedTips, tipId] }
        ),
      resetAll: () => set({ ...DEFAULTS }),
    }),
    { name: 'tml-settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
