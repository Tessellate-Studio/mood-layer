// Single source of truth for "should motion play right now?". Combines the OS
// reduce-motion preference with the app's own settings override, so every
// animated component consults one hook instead of repeating the same
// override-vs-system merge. reduceMotionOverride === null means "follow the
// system"; true/false force it. Hard rule (CLAUDE.md): every animation must
// disable cleanly under reduce-motion.

import { useReducedMotion } from 'react-native-reanimated';

import { useSettingsStore } from '@/store/settingsStore';

export interface Motion {
  /** True when animations should be skipped (held at their resting state). */
  reduced: boolean;
}

export function useMotion(): Motion {
  const systemReduced = useReducedMotion();
  const override = useSettingsStore((s) => s.reduceMotionOverride);
  return { reduced: override ?? systemReduced };
}
