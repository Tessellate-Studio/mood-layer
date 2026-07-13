// Circle copy + the pure share-summary generator. All strings live here as
// typed data (hard rule). The summary is generated on demand from a week's
// stats and handed to the OS share sheet — it is never stored, and its detail
// is gated by the person's `sees` level. Local-only: nothing leaves the phone
// until the user taps share, and only what they chose to reveal.

import type {
  CircleFrequency,
  CirclePerson,
  CircleSeesLevel,
  EmotionFamilyId,
  WeekStats,
} from '@/types/models';

export const SEES_ORDER: CircleSeesLevel[] = ['colours-words', 'colours', 'count'];
export const SEES_LABELS: Record<CircleSeesLevel, string> = {
  'colours-words': 'Colours + words',
  colours: 'Colours only',
  count: 'Just a check-in count',
};

export const FREQUENCY_ORDER: CircleFrequency[] = ['evening', 'weekly', 'paused'];
export const FREQUENCY_LABELS: Record<CircleFrequency, string> = {
  evening: 'Every evening',
  weekly: 'Weekly summary',
  paused: 'Paused',
};

/** Tap a chip → advance to the next option, wrapping around. */
export function nextInCycle<T>(order: T[], current: T): T {
  const i = order.indexOf(current);
  return order[(i + 1) % order.length];
}

// A soft, evocative tone per family — the "colour" words a person sees when the
// exact emotion words are held back.
const FAMILY_TONE: Record<EmotionFamilyId, string> = {
  anger: 'fiery',
  fear: 'bracing',
  sadness: 'tender',
  disgust: 'wary',
  enjoyment: 'warm',
  surprise: 'open',
  contempt: 'guarded',
};

/** The families that showed up most this week, most-frequent first (count > 0). */
function topFamilies(stats: WeekStats): EmotionFamilyId[] {
  return (Object.entries(stats.familyCounts) as [EmotionFamilyId, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([family]) => family);
}

function joinTones(tones: string[]): string {
  if (tones.length === 0) return 'quiet';
  if (tones.length === 1) return tones[0];
  return `${tones.slice(0, -1).join(', ')} and ${tones[tones.length - 1]}`;
}

/**
 * A one-line, gentle summary of a week, gated by how much the person sees.
 * Pure: same stats + level → same string. Used both for the on-card preview
 * ("what they see") and the text handed to the share sheet.
 */
export function shareSummary(sees: CircleSeesLevel, stats: WeekStats): string {
  if (stats.checkInCount === 0) return 'A quiet week — nothing stitched in yet.';

  if (sees === 'count') {
    const checkins = stats.checkInCount === 1 ? '1 check-in' : `${stats.checkInCount} check-ins`;
    return `This week: ${checkins}.`;
  }

  const tones = topFamilies(stats).slice(0, 2).map((f) => FAMILY_TONE[f]);
  if (sees === 'colours') {
    return `This week felt mostly ${joinTones(tones)}.`;
  }

  // colours-words: the tones plus a hint of range, closest to the mockup voice.
  const third = topFamilies(stats)[2];
  const tail = third ? ` — some ${FAMILY_TONE[third]} too` : '';
  return `Mostly ${joinTones(tones)}${tail}.`;
}

/**
 * The title + body for a scheduled Circle share-nudge. Gentle and inviting,
 * never directive (tone rule) — it *offers* sharing, it doesn't instruct. The
 * live summary isn't baked in here: it's generated from the current week only
 * when the user taps the reminder and the share sheet opens, so it can never go
 * stale inside a standing daily/weekly notification.
 */
export function circleReminderContent(person: CirclePerson): { title: string; body: string } {
  return {
    title: 'A moment to share',
    body: `Share this week with ${person.name}, whenever you're ready.`,
  };
}
