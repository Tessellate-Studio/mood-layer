// Pure weekly-insight engine. The Insights screen calls computeStatsForWeek
// on focus, and insightStore.generateForWeek delegates card selection to
// generateInsights — ONE generation path, so the "not enough stitches" guard
// and the 2-card cap can never drift apart between screen and store.

import { INSIGHT_TEMPLATES } from '@/content/insights';
import { selectWeekStats } from '@/store/checkInStore';
import type { CheckIn, JudgmentEntry, WeekStats } from '@/types/models';
import { weekKey } from '@/utils/dates';

/** Minimum check-ins in a week before we reflect anything back. */
export const MIN_CHECKINS_FOR_INSIGHTS = 3;
/** At most this many cards per week — calm > completionism (tone rule). */
export const MAX_CARDS_PER_WEEK = 2;

export interface RenderedInsight {
  templateId: string;
  kind: 'pattern' | 'resistance';
  title: string;
  body: string;
}

/**
 * Aggregate one ISO week into WeekStats. Thin composition: count the judgment
 * entries that fall in the week, then delegate the check-in aggregation to
 * checkInStore's pure selector (don't duplicate it).
 */
export function computeStatsForWeek(
  checkIns: CheckIn[],
  judgmentEntries: JudgmentEntry[],
  wk: string
): WeekStats {
  const judgmentEntryCount = judgmentEntries.filter(
    (entry) => weekKey(entry.createdAt) === wk
  ).length;
  return selectWeekStats(checkIns, judgmentEntryCount, wk);
}

/**
 * Run the templates against a week's stats and render the winners: matches
 * sorted by priority DESC, capped at MAX_CARDS_PER_WEEK. A week with fewer
 * than MIN_CHECKINS_FOR_INSIGHTS check-ins renders nothing — too little
 * signal to reflect back.
 */
export function generateInsights(stats: WeekStats): RenderedInsight[] {
  if (stats.checkInCount < MIN_CHECKINS_FOR_INSIGHTS) return [];

  return INSIGHT_TEMPLATES.filter((template) => template.matches(stats))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_CARDS_PER_WEEK)
    .map((template) => ({ templateId: template.id, kind: template.kind, ...template.render(stats) }));
}
