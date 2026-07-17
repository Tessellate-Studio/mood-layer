// Monthly digests for the Insights tab (user, 2026-07-17: insights should go
// beyond the weekly digest, into the month and into the experiments being
// taken up). Pure generators — same inputs, same strings — and typed copy per
// the hard rule. Tone stays observational and invitational: a texture of the
// month, never a verdict on it.

import { EMOTION_FAMILIES } from '@/content/emotions';
import { PRACTICES } from '@/content/practices';
import { RESISTANCE_TELLS } from '@/content/resistance';
import type {
  CheckIn,
  EmotionFamilyId,
  JudgmentEntry,
  ResistanceTellId,
} from '@/types/models';
import { groupSittings } from '@/utils/sittings';

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

/** Fewer check-ins than this and a month has no texture to read yet. */
export const MONTHLY_MIN_CHECKINS = 8;

export interface MonthlyMoodDigest {
  title: string;
  body: string;
  /** Top families (most-frequent first, up to 3) — tints the card's mark. */
  families: EmotionFamilyId[];
}

const inWindow = (iso: string, now: Date) =>
  now.getTime() - new Date(iso).getTime() <= DAYS_30_MS && new Date(iso) <= now;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The month's mood texture: how often, how spread, which families carried it,
 * and (when one clearly leads) the most frequent resistance tell. Null while
 * the month is too thin to read — absence over a hollow summary.
 */
export function monthlyMoodDigest(
  checkIns: CheckIn[],
  now: Date = new Date()
): MonthlyMoodDigest | null {
  const recent = checkIns.filter((c) => inWindow(c.createdAt, now));
  if (recent.length < MONTHLY_MIN_CHECKINS) return null;

  const days = new Set(recent.map((c) => c.dayKey)).size;

  const familyCounts = new Map<EmotionFamilyId, number>();
  const tellCounts = new Map<ResistanceTellId, number>();
  for (const checkIn of recent) {
    for (const sel of checkIn.emotions) {
      familyCounts.set(sel.family, (familyCounts.get(sel.family) ?? 0) + 1);
    }
    for (const tell of checkIn.resistanceFlags) {
      tellCounts.set(tell, (tellCounts.get(tell) ?? 0) + 1);
    }
  }
  const topFamilies = [...familyCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([family]) => family);
  const labels = topFamilies.slice(0, 2).map((f) => EMOTION_FAMILIES[f].label);

  const topTell = [...tellCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )[0];
  const tellClause =
    topTell && topTell[1] >= 3
      ? ` ${RESISTANCE_TELLS[topTell[0]].label} visited most often.`
      : '';

  const carried =
    labels.length >= 2 ? `${labels[0]} and ${labels[1]}` : labels[0] ?? 'A quiet mix';

  return {
    title: 'The month, in layers',
    body:
      `${plural(recent.length, 'check-in', 'check-ins')} across ` +
      `${plural(days, 'day', 'days')} this month. ${carried} carried it.` +
      `${tellClause} Worth a slow scroll back through the layers?`,
    families: topFamilies.slice(0, 3),
  };
}

/**
 * What practising looked like this month: sittings set down, by practice.
 * Null when nothing was practised — no guilt copy, ever (anti-pattern #3).
 */
export function monthlyPracticeDigest(
  practiceSessions: { practiceId: string; createdAt: string }[],
  judgmentEntries: JudgmentEntry[],
  now: Date = new Date()
): { title: string; body: string } | null {
  const sittings = groupSittings(judgmentEntries).filter((s) =>
    inWindow(s.entries[0].createdAt, now)
  ).length;
  const byPractice = new Map<string, number>();
  for (const session of practiceSessions) {
    if (!inWindow(session.createdAt, now)) continue;
    byPractice.set(session.practiceId, (byPractice.get(session.practiceId) ?? 0) + 1);
  }

  const total = sittings + [...byPractice.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const parts: string[] = [];
  if (sittings > 0) parts.push(`Explore avoided emotions ×${sittings}`);
  for (const practice of PRACTICES) {
    const n = byPractice.get(practice.id);
    if (n) parts.push(`${practice.title} ×${n}`);
  }

  return {
    title: 'The practices, taken up',
    body:
      `${plural(total, 'sitting', 'sittings')} set down this month — ` +
      `${parts.join(', ')}. Whatever they stirred is kept under Reflections.`,
  };
}
