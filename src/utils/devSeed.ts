// Sample-month painter: ~30 days of plausible history across EVERY store —
// check-ins, judgment reflections, practice sittings, circle people — so the
// app can be previewed as if someone had lived in it for a month (user,
// 2026-07-17: release builds too, via Settings → "Preview a sample month";
// local-only app, nothing here touches a network). Deterministic (seeded
// PRNG) so repeated seeding paints the same month.

import { MASKING_STATES } from '@/content/emotions';
import { useCheckInStore } from '@/store/checkInStore';
import { useCircleStore } from '@/store/circleStore';
import { useExperimentStore, type PracticeSession } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import type { CheckIn, CirclePerson, EmotionSelection, Intensity, JudgmentEntry, ResistanceTellId } from '@/types/models';
import { dayKey } from '@/utils/dates';
import { generateUUID } from '@/utils/ids';

// Small deterministic PRNG (mulberry32) — reseeding paints the same month.
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORDS: { id: string; family: EmotionSelection['family'] }[] = [
  { id: 'irritated', family: 'anger' },
  { id: 'frustrated', family: 'anger' },
  { id: 'resentful', family: 'anger' },
  { id: 'uneasy', family: 'fear' },
  { id: 'worried', family: 'fear' },
  { id: 'afraid', family: 'fear' },
  { id: 'wistful', family: 'sadness' },
  { id: 'down', family: 'sadness' },
  { id: 'sad', family: 'sadness' },
  { id: 'hurt', family: 'sadness' },
  { id: 'put-off', family: 'disgust' },
  { id: 'content', family: 'enjoyment' },
  { id: 'glad', family: 'enjoyment' },
  { id: 'warm', family: 'enjoyment' },
  { id: 'delighted', family: 'enjoyment' },
  { id: 'curious', family: 'surprise' },
  { id: 'startled', family: 'surprise' },
  { id: 'dismissive', family: 'contempt' },
  { id: 'eager', family: 'anticipation' },
  { id: 'excited', family: 'anticipation' },
  { id: 'open', family: 'trust' },
  { id: 'secure', family: 'trust' },
];

const BODY = ['tight chest', 'warm face', 'heavy limbs', 'lump in throat', 'light shoulders'];
const TELLS: ResistanceTellId[] = ['looping-thoughts', 'harsh-judgment', 'binary-stuckness', 'comparison'];
const NOTES = [
  'long day, but it moved',
  'said the hard thing out loud',
  'kept circling the same decision',
  'quiet morning, louder afternoon',
];

/** Seeds ~30 days of history ending yesterday. Returns the check-in count. */
export function seedMonth(now: Date = new Date()): number {
  const rand = prng(20260708);
  const checkIns: CheckIn[] = [];

  for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
    // Most days 1–3 check-ins; some days quiet (empty seams matter visually).
    const roll = rand();
    const perDay = roll < 0.18 ? 0 : roll < 0.55 ? 1 : roll < 0.85 ? 2 : 3;
    // The last COMPLETED week is what Insights reads — make it dense enough
    // to clear the >=3-check-ins gate and trip pattern templates.
    const inLastWeek = daysAgo <= 7 + now.getDay() && daysAgo > now.getDay();
    const count = inLastWeek ? Math.max(perDay, 1) : perDay;

    for (let c = 0; c < count; c++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo,
        8 + Math.floor(rand() * 13), Math.floor(rand() * 60));
      const emotionCount = 1 + Math.floor(rand() * 3);
      const picked = new Set<number>();
      while (picked.size < emotionCount) picked.add(Math.floor(rand() * WORDS.length));
      const emotions: EmotionSelection[] = [...picked].map((i) => ({
        emotionId: WORDS[i].id,
        family: WORDS[i].family,
        intensity: (1 + Math.floor(rand() * 4)) as Intensity,
      }));
      const flags: ResistanceTellId[] = [];
      // Last week leans on stuck decisions + looping so insight cards fire.
      if (inLastWeek && rand() < 0.6) flags.push('binary-stuckness');
      if (inLastWeek && rand() < 0.45) flags.push('looping-thoughts');
      if (!inLastWeek && rand() < 0.2) flags.push(TELLS[Math.floor(rand() * TELLS.length)]);

      const iso = d.toISOString();
      checkIns.push({
        id: generateUUID(),
        createdAt: iso,
        dayKey: dayKey(iso),
        emotions,
        resistanceFlags: [...new Set(flags)],
        source: rand() < 0.25 ? 'name-it' : 'manual',
        ...(rand() < 0.4 ? { bodySensations: [BODY[Math.floor(rand() * BODY.length)]] } : {}),
        ...(rand() < 0.15
          ? { maskingUsed: [MASKING_STATES[Math.floor(rand() * MASKING_STATES.length)].id] }
          : {}),
        ...(rand() < 0.3 ? { note: NOTES[Math.floor(rand() * NOTES.length)] } : {}),
      });
    }
  }

  // Newest first, matching the store's invariant.
  checkIns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const seedJudgments: { target: string; judgment: string; feeling: EmotionSelection }[] = [
    { target: 'myself', judgment: 'being behind', feeling: { emotionId: 'worried', family: 'fear', intensity: 3 } },
    { target: 'my neighbour', judgment: 'the noise', feeling: { emotionId: 'irritated', family: 'anger', intensity: 2 } },
    { target: 'myself', judgment: 'saying no', feeling: { emotionId: 'hurt', family: 'sadness', intensity: 2 } },
  ];
  const judgments: JudgmentEntry[] = seedJudgments.map((j, i) => ({
    id: generateUUID(),
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (4 + i * 3), 20, 0).toISOString(),
    target: j.target,
    judgment: j.judgment,
    uncoveredFeelings: [j.feeling],
  }));

  // Two archived practice sittings, so Past reflections shows both kinds.
  const sessions: PracticeSession[] = [
    {
      id: generateUUID(),
      practiceId: 'problem-solution',
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 21, 10).toISOString(),
      work: {
        entries: {
          problem: ['never enough hours in the day'],
          cannot: ['the days are already full', 'nobody else can take it on'],
          ideas: ['ask for help with one thing', 'a robot does the chores', 'drop one standing meeting'],
          'small-step': ['ask about moving the Monday call'],
        },
        marks: { fantastical: ['ideas:1'] },
        picks: { 'one-step': ['ideas:2'] },
      },
    },
    {
      id: generateUUID(),
      practiceId: 'five-year-flashback',
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12, 20, 40).toISOString(),
      work: {
        entries: {
          decision: ['whether to move closer to family'],
          options: ['stay where we are', 'move north this year'],
          changed: [
            'settled, but still far away for every birthday',
            'harder year up front, closer for all the ones after',
          ],
        },
        marks: {},
        picks: { 'still-matters': ['options:1'] },
      },
    },
  ];

  // A small circle — sharing previews without sending anything anywhere.
  const people: CirclePerson[] = [
    { id: generateUUID(), name: 'Maya', relationship: 'Partner', sees: 'colours-words', frequency: 'evening' },
    { id: generateUUID(), name: 'Appa', relationship: 'Family', sees: 'colours', frequency: 'weekly' },
  ];

  useCheckInStore.setState({ checkIns });
  useExperimentStore.setState((s) => ({
    ...s,
    judgmentEntries: judgments,
    practiceSessions: sessions,
  }));
  useCircleStore.setState((s) => ({ ...s, people }));
  // Wipe generated cards + the week marker so the next Insights focus
  // regenerates against the seeded month.
  useInsightStore.setState({ cards: [], lastGeneratedWeekKey: null });

  return checkIns.length;
}
