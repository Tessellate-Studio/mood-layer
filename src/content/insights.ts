// Weekly insight templates. Each template matches on a week's aggregated
// stats and renders a short card. Tone rules (CLAUDE.md): gentle, never
// clinical, never a diagnosis; 2–3 sentences; every body ends with a soft
// invitation, never a directive. Cards cap at 2 per week — the insight store
// takes the top 2 by priority (higher number wins).

import { EMOTION_FAMILIES } from '@/content/emotions';
import type { WeekStats } from '@/types/models';

export interface InsightTemplate {
  id: string;
  /** Higher wins when more than 2 templates match a week. */
  priority: number;
  /** Which shelf the card sits on — drives its overline (see InsightCardState). */
  kind: 'pattern' | 'resistance';
  matches(stats: WeekStats): boolean;
  render(stats: WeekStats): { title: string; body: string };
}

export const INSIGHT_TEMPLATES: InsightTemplate[] = [
  {
    // Two families that keep arriving in the same check-in — the quilt holding
    // both at once. The signature "depth" pattern of the redesign.
    id: 'co-occurrence',
    priority: 85,
    kind: 'pattern',
    matches: (stats) => Array.isArray(stats.coOccurringFamilies),
    render: (stats) => {
      const [a, b] = stats.coOccurringFamilies!;
      const first = EMOTION_FAMILIES[a].label;
      const second = EMOTION_FAMILIES[b].label.toLowerCase();
      return {
        title: `${first} and ${second} keep arriving together`,
        body:
          `More than once this week you named something ${first.toLowerCase()} and something ${second} in the same check-in. They are not opposites — you were holding both at once. Layers can do that; nothing here needs fixing.`,
      };
    },
  },
  {
    id: 'stuck-decisions',
    priority: 60,
    kind: 'resistance',
    matches: (stats) => stats.resistanceCounts['binary-stuckness'] >= 3,
    render: () => ({
      title: 'A week of either-or',
      body:
        'You noticed being stuck between two options several times this week. Often that is an emotion waiting to be felt, not missing data. If a choice is looping, you could ask what feeling sits under it before deciding anything.',
    }),
  },
  {
    id: 'looping-week',
    priority: 70,
    kind: 'resistance',
    matches: (stats) => stats.resistanceCounts['looping-thoughts'] >= 3,
    render: () => ({
      title: 'Thoughts on a loop',
      body:
        'Looping thoughts came up a few times this week. A loop is usually fear being thought about instead of felt, and it tends to quiet when the fear gets a moment in the body. Next time it circles, you might pause and ask where it lives physically.',
    }),
  },
  {
    id: 'judgment-heavy',
    priority: 50,
    kind: 'resistance',
    matches: (stats) =>
      stats.resistanceCounts['harsh-judgment'] >= 3 || stats.judgmentEntryCount >= 3,
    render: () => ({
      title: 'Judgments carrying feelings',
      body:
        'Judgments showed up often this week. They usually point at feelings we have not let in yet, which is good news, because a judgment can be followed home. The judgment exercise is there whenever you feel like opening one up.',
    }),
  },
  {
    id: 'numb-cluster',
    priority: 80,
    kind: 'pattern',
    matches: (stats) => stats.maskingCount >= 3,
    render: () => ({
      title: 'A muffled week',
      body:
        'Several check-ins this week started from a cover word rather than the feeling underneath. You cannot selectively numb, so welcoming the hard feelings is also what lets joy back in. When a cover word comes up again, you could peek at what it is keeping warm.',
    }),
  },
  {
    id: 'masking-fine',
    priority: 40,
    kind: 'pattern',
    matches: (stats) => stats.maskingCount >= 2 && stats.checkInCount >= 4,
    render: () => ({
      title: 'Checking in from behind a cover',
      body:
        'You checked in steadily this week, and a couple of those check-ins began with a cover word rather than a feeling. That is a normal place to start. If it feels right, you could linger a moment longer next time and see what the cover is keeping warm.',
    }),
  },
  {
    id: 'fluid-week',
    priority: 90,
    kind: 'pattern',
    matches: (stats) => stats.distinctEmotionIds.length >= 8,
    render: (stats) => ({
      title: 'A fluid week',
      body:
        `You named ${stats.distinctEmotionIds.length} distinct emotions this week. That is fluidity, letting feelings arrive, be felt, and move on, and that kind of range is what builds resilience. Worth taking a quiet moment to appreciate.`,
    }),
  },
];
