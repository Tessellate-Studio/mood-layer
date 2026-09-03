// The prominent current mood, for every mark that wears it — the Layers
// header and weekly-summary marks, the Insights header mark, the Layers tab
// icon. One hook so the clock question is answered once instead of per call
// site: `now` is read at render, not captured in a data-keyed memo, which
// would hold last week's mood across a Monday while the app sits in memory.
// Screens that already keep a focus clock pass it in; chrome that has none
// (the tab bar re-renders on every tab switch) omits it.

import { selectMoodFamilies, useCheckInStore } from '@/store/checkInStore';
import type { EmotionFamilyId } from '@/types/models';

export function useMoodFamilies(now?: Date): EmotionFamilyId[] {
  const checkIns = useCheckInStore((s) => s.checkIns);
  return selectMoodFamilies(checkIns, now ?? new Date());
}
