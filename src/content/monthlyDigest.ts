// Monthly digests for the Insights tab (user, 2026-07-17: insights should go
// beyond the weekly digest, into the month and into the experiments being
// taken up). Pure generators — same inputs, same strings — and typed copy per
// the hard rule. Tone stays observational and invitational: a texture of the
// month, never a verdict on it.

import { EMOTION_FAMILIES } from '@/content/emotions';
import { PRACTICES } from '@/content/practices';
import { RESISTANCE_TELLS } from '@/content/resistance';
import { findVocabularyWord } from '@/content/vocabulary';
import type {
  CheckIn,
  EmotionFamilyId,
  JudgmentEntry,
  ResistanceTellId,
} from '@/types/models';
import type { PracticeSession } from '@/store/experimentStore';
import { sessionConclusion } from '@/utils/practiceWork';
import { groupSittings } from '@/utils/sittings';

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

/** Fewer check-ins than this and a month has no texture to read yet. */
export const MONTHLY_MIN_CHECKINS = 8;

// The overlines the Insights screen wears on the month cards — kept with the
// titles they label, so the pairing is decided here, not in the screen. "This
// month" is honest: the window is the rolling 30 days ending today.
export const MONTHLY_TEXTURE_OVERLINE = 'This month · Texture';
export const MONTHLY_PRACTICES_OVERLINE = 'This month · Practices';

export interface MonthlyMoodDigest {
  overline: string;
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
    overline: MONTHLY_TEXTURE_OVERLINE,
    title: 'The month, in layers',
    body:
      `${plural(recent.length, 'check-in', 'check-ins')} across ` +
      `${plural(days, 'day', 'days')} this month. ${carried} carried it.` +
      `${tellClause} Worth a slow scroll back through the layers?`,
    families: topFamilies.slice(0, 3),
  };
}

export interface PracticeReflection {
  overline: string;
  title: string;
  /** The gentle lead line — what the month's practising pointed at. */
  body: string;
  /** Recent sittings, each as "practice → what it arrived at". */
  kept: { practice: string; conclusion: string }[];
}

/**
 * What the month's practising SURFACED — not a tally of how often you sat
 * down (a count is scoreboard-shaped and says nothing, user 2026-07-18).
 * Two useful things instead: the feeling that most often turned out to be
 * under your judgments, and the actual conclusions the sittings reached, so
 * a decision made three weeks ago is still in front of you.
 * Null when nothing was practised — no guilt copy, ever (anti-pattern #3).
 */
export function monthlyPracticeReflection(
  practiceSessions: PracticeSession[],
  judgmentEntries: JudgmentEntry[],
  now: Date = new Date()
): PracticeReflection | null {
  const sittings = groupSittings(judgmentEntries).filter((s) =>
    inWindow(s.entries[0].createdAt, now)
  );
  const recentSessions = practiceSessions
    .filter((s) => inWindow(s.createdAt, now))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (sittings.length === 0 && recentSessions.length === 0) return null;

  // The feeling most often found under a judgment — the practice's whole
  // point, made visible across a month instead of one sitting.
  const feelingCounts = new Map<string, number>();
  for (const sitting of sittings) {
    for (const entry of sitting.entries) {
      for (const feeling of entry.uncoveredFeelings) {
        feelingCounts.set(feeling.emotionId, (feelingCounts.get(feeling.emotionId) ?? 0) + 1);
      }
    }
  }
  const topFeeling = [...feelingCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )[0];

  let body: string;
  if (topFeeling && topFeeling[1] >= 2) {
    const label = (findVocabularyWord(topFeeling[0])?.word.label ?? topFeeling[0]).toLowerCase();
    body =
      `Under the judgments you looked at this month, ${label} was waiting ` +
      `${plural(topFeeling[1], 'time', 'times')}. Worth meeting it directly?`;
  } else if (sittings.length > 0) {
    // A blank line ahead of the invitation, so it reads as its own beat
    // instead of trailing the count as one run-on sentence (user, 2026-09-02).
    body =
      `${plural(sittings.length, 'judgment sitting', 'judgment sittings')} this month.\n\n` +
      'Naming what sits underneath is the whole practice — the rest can wait.';
  } else {
    body = 'What these sittings arrived at, kept where you can find it again.';
  }

  // Up to three most recent conclusions — a glance, not an archive.
  const kept: PracticeReflection['kept'] = [];
  for (const session of recentSessions) {
    const practice = PRACTICES.find((p) => p.id === session.practiceId);
    if (!practice) continue;
    const conclusion = sessionConclusion(practice, session.work);
    if (conclusion) kept.push({ practice: practice.title, conclusion });
    if (kept.length === 3) break;
  }

  return { overline: MONTHLY_PRACTICES_OVERLINE, title: 'What the practices surfaced', body, kept };
}
