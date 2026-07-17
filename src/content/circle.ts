// Circle copy + the pure share-summary generator. All strings live here as
// typed data (hard rule). The summary is generated on demand from a week's
// stats and handed to the OS share sheet — it is never stored, and its detail
// is gated by the person's `sees` level. Local-only: nothing leaves the phone
// until the user taps share, and only what they chose to reveal.

import { EMOTION_FAMILIES } from '@/content/emotions';
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
  anticipation: 'expectant',
  trust: 'settled',
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
  if (stats.checkInCount === 0) return 'A quiet week — nothing layered in yet.';

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

/** The home screen's weekly-summary card overline (a hard rule: copy lives here, not inline in JSX). */
export const WEEKLY_SUMMARY_OVERLINE = 'This week, mostly';

export interface HomeWeeklySummary {
  /** Bold headline word, e.g. "Warm" — the top family's tone, capitalised. */
  headline: string;
  /** Gentle one-line body naming which families showed up. */
  body: string;
  /** Top families (most-frequent first, up to 3) — for tinting the summary mark. */
  families: EmotionFamilyId[];
}

function capitalize(word: string): string {
  return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1);
}

/**
 * The home screen's "THIS WEEK, MOSTLY ___" card: a headline tone word plus a
 * gentle sentence naming the families that showed up. Returns null for a
 * quiet week (nothing stitched in yet) so the card can hide itself rather
 * than announce an absence.
 */
export function homeWeeklySummary(stats: WeekStats): HomeWeeklySummary | null {
  if (stats.checkInCount === 0) return null;

  const top = topFamilies(stats);
  const families = top.slice(0, 3);
  const labels = top.slice(0, 2).map((f) => EMOTION_FAMILIES[f].label);
  const headline = capitalize(FAMILY_TONE[top[0]]);

  let body: string;
  if (labels.length === 1) {
    body = `${labels[0]}, running through the week.`;
  } else {
    const third = top[2];
    const tail = third ? ` — with a trace of ${EMOTION_FAMILIES[third].label} too.` : '.';
    body = `${labels[0]} and ${labels[1]}, layered side by side${tail}`;
  }

  return { headline, body, families };
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
