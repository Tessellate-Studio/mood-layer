// Quilt layout engine — PURE functions, no React. Everything the quilt canvas
// draws is computed here as plain data so it can be unit-tested exactly and
// rendered by dumb components.
//
// Visual grammar (Mood Layers redesign, 2026-07-08): a check-in is NOT a
// bordered, subdivided patch. It is a small cluster of translucent cloth
// pieces — one per named emotion — that overlap so where feelings co-occur the
// colour deepens. No grid, no borders, no texture: just light through layers
// (design handoff "Mood Layers"). The week/day row structure below still
// positions each cluster; only the piece geometry changed.

import { spacing, typography } from '@/constants/theme';
import { findVocabularyWord } from '@/content/vocabulary';
import type { CheckIn, EmotionFamilyId, EmotionSelection, Intensity } from '@/types/models';
import { dayKey, dayPartLabel, weekKey } from '@/utils/dates';

/** One translucent cloth piece — a single emotion inside a check-in cluster. */
export interface ClothPiece {
  emotionId: string;
  family: EmotionFamilyId;
  intensity: Intensity;
  /** Local to the patch box: (0,0) is the box's top-left corner. */
  rect: { x: number; y: number; w: number; h: number };
  /** Corner radius — soft, near-pill cloth (≈0.35 of the short side). */
  rx: number;
  /** Fill translucency, so stacked pieces deepen instead of covering. */
  opacity: number;
}

export interface PatchLayout {
  checkInId: string;
  /** Position of the check-in's box within the week canvas (gutters baked in). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Overlapping cloth pieces, one per emotion, laid out inside the box. */
  pieces: ClothPiece[];
  a11yLabel: string;
}

export interface DayRow {
  dayKey: string;
  /** Short weekday ('Mon'); '' on wrap rows for the same day. */
  label: string;
  patches: PatchLayout[];
  y: number;
  height: number;
  empty: boolean;
}

export interface WeekBlock {
  weekKey: string;
  /** e.g. 'Jun 30 – Jul 6' (en dash). */
  label: string;
  rows: DayRow[];
  totalHeight: number;
}

/** Seam gutter between clusters and between rows (baked into x/y positions). */
export const QUILT_GUTTER = 6;
/** Height of a day row that holds check-in clusters. */
export const DAY_ROW_HEIGHT = 72;
/** Height of an empty-day strip (breathing space, no drawn seam). */
export const EMPTY_ROW_HEIGHT = 14;

/** Cloth fill translucency — matches the "fill-opacity 0.66" in the handoff. */
export const CLOTH_OPACITY = 0.66;

const WEEKDAYS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Fraction of the box a piece fills, by intensity. A stronger feeling is a
 * larger piece of cloth (the handoff shows ~two scales); the ramp stays gentle
 * so a cluster of mixed intensities still overlaps rather than one swallowing
 * the rest.
 */
function sizeFactor(intensity: Intensity): number {
  return 0.62 + intensity * 0.08; // 1→0.70, 2→0.78, 3→0.86, 4→0.94
}

/**
 * Lay a check-in's emotions out as overlapping cloth pieces inside a w×h box.
 * Pieces are centred on the box and pushed onto a small ring so they overlap
 * (co-occurring feelings deepen where they meet). Deterministic: the ring
 * angle is a function of index only — same emotions → same layout, every time.
 * Piece order follows selection order (first-named sits under the rest).
 */
export function clothPieces(emotions: EmotionSelection[], w: number, h: number): ClothPiece[] {
  const k = emotions.length;
  if (k === 0) return [];

  const cx = w / 2;
  const cy = h / 2;
  // A lone piece sits dead-centre; a cluster spreads on a ring ~16% of the box.
  const radius = k === 1 ? 0 : Math.min(w, h) * 0.16;

  // First pass: ideal sizes + ring offsets, starting at the top of the ring
  // and stepping evenly around it.
  const raw = emotions.map((emotion, i) => {
    const f = sizeFactor(emotion.intensity);
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / k;
    return {
      emotion,
      pw: w * f,
      ph: h * f,
      ox: radius * Math.cos(angle),
      oy: radius * Math.sin(angle),
    };
  });

  // Intense pieces pushed onto the ring can reach past the box; the SVG then
  // clips them into hard square corners (and clusters bleed into neighbours on
  // the quilt). Scale sizes AND offsets down uniformly so every piece stays
  // inside while the cluster keeps its overlap proportions.
  let scale = 1;
  for (const p of raw) {
    scale = Math.min(
      scale,
      w / 2 / (Math.abs(p.ox) + p.pw / 2),
      h / 2 / (Math.abs(p.oy) + p.ph / 2)
    );
  }

  return raw.map((p) => {
    const pw = p.pw * scale;
    const ph = p.ph * scale;
    return {
      emotionId: p.emotion.emotionId,
      family: p.emotion.family,
      intensity: p.emotion.intensity,
      rect: { x: cx + p.ox * scale - pw / 2, y: cy + p.oy * scale - ph / 2, w: pw, h: ph },
      rx: Math.min(pw, ph) * 0.35,
      opacity: CLOTH_OPACITY,
    };
  });
}

/**
 * Vertical space a week block spends above its first row: the week label
 * (overline line-height) plus its bottom margin. Mirrors QuiltWeek's header.
 */
export const WEEK_LABEL_BLOCK = typography.overline.lineHeight + spacing.sm;

/**
 * Scroll offset that brings a check-in's cluster into view inside the quilt
 * list, or null when it isn't in these blocks. A fresh check-in lands at the
 * BOTTOM of the current week (Saturday is the 6th row), which can sit below
 * the fold — without scrolling there, a save looks like it did nothing
 * (device feedback, 2026-07-18). `topPadding` is the list's content padding;
 * `margin` leaves a little breathing room above the row.
 */
export function offsetForCheckIn(
  blocks: WeekBlock[],
  checkInId: string,
  topPadding = 16,
  margin = 24
): number | null {
  let blockTop = topPadding;
  for (const block of blocks) {
    for (const row of block.rows) {
      if (row.patches.some((p) => p.checkInId === checkInId)) {
        return Math.max(0, blockTop + WEEK_LABEL_BLOCK + row.y - margin);
      }
    }
    blockTop += WEEK_LABEL_BLOCK + block.totalHeight;
  }
  return null;
}

/** 'Tuesday morning: sad 3, hopeful 2' — screen-reader summary of a patch. */
export function buildPatchA11yLabel(checkIn: CheckIn): string {
  const created = new Date(checkIn.createdAt);
  const weekday = WEEKDAYS_FULL[created.getDay()];
  const part = dayPartLabel(checkIn.createdAt);
  const items = checkIn.emotions.map((selection) => {
    const word = findVocabularyWord(selection.emotionId)?.word.label ?? selection.emotionId;
    return `${word.toLowerCase()} ${selection.intensity}`;
  });
  return `${weekday} ${part}: ${items.join(', ')}`;
}

/** Local midnight of the Monday for an ISO 'GGGG-Www' week key. */
function mondayOfWeekKey(wk: string): Date {
  const isoYear = Number(wk.slice(0, 4));
  const week = Number(wk.slice(6));
  // Jan 4 is always in ISO week 1; back up to its Monday, then step weeks.
  const jan4 = new Date(isoYear, 0, 4);
  const mondayWeek1 = new Date(isoYear, 0, 4 - ((jan4.getDay() + 6) % 7));
  return new Date(mondayWeek1.getFullYear(), mondayWeek1.getMonth(), mondayWeek1.getDate() + (week - 1) * 7);
}

const shortDate = (d: Date) => `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;

/** Chunk an array into groups of at most `size`, preserving order. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Lay the whole quilt out: week blocks (current week first, descending),
 * seven Mon→Sun day rows per week (current week stops at `now` — future days
 * are omitted, not shown as empty strips), empty days as thin breathing gaps,
 * at most 5 clusters per row (overflow wraps to a second row with the same
 * dayKey). `now` is injectable so tests are date-stable.
 */
export function computeQuiltLayout(
  checkIns: CheckIn[],
  containerWidth: number,
  now: Date = new Date()
): WeekBlock[] {
  const todayKey = dayKey(now.toISOString());
  const currentWk = weekKey(now.toISOString());

  // Group by day, oldest-first within a day (first check-in of the day sits
  // leftmost — reading order matches lived order).
  const byDay = new Map<string, CheckIn[]>();
  for (const checkIn of checkIns) {
    const list = byDay.get(checkIn.dayKey) ?? [];
    list.push(checkIn);
    byDay.set(checkIn.dayKey, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // Weeks that have check-ins, plus the current week (always shown).
  const weekKeys = new Set<string>([currentWk]);
  for (const checkIn of checkIns) weekKeys.add(weekKey(checkIn.createdAt));
  // 'GGGG-Www' sorts lexicographically; descending = newest first.
  const orderedWeeks = [...weekKeys].sort((a, b) => b.localeCompare(a));

  const blocks: WeekBlock[] = [];
  for (const wk of orderedWeeks) {
    const monday = mondayOfWeekKey(wk);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    const rows: DayRow[] = [];
    let y = 0;

    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + offset);
      const dk = dayKey(day.toISOString());
      // Current week: future days simply don't exist yet — omit them.
      if (wk === currentWk && dk > todayKey) break;
      const dayLabel = WEEKDAYS_SHORT[day.getDay()];
      const dayCheckIns = byDay.get(dk) ?? [];

      if (dayCheckIns.length === 0) {
        rows.push({ dayKey: dk, label: dayLabel, patches: [], y, height: EMPTY_ROW_HEIGHT, empty: true });
        y += EMPTY_ROW_HEIGHT + QUILT_GUTTER;
        continue;
      }

      const rowChunks = chunk(dayCheckIns, 5);
      rowChunks.forEach((rowCheckIns, chunkIndex) => {
        // Slot count floors at 3 so a lone cluster stays cluster-sized instead
        // of stretching across the whole quilt.
        const slots = Math.max(3, Math.min(rowCheckIns.length, 5));
        const patchW = (containerWidth - (slots - 1) * QUILT_GUTTER) / slots;
        const patches: PatchLayout[] = rowCheckIns.map((checkIn, i) => ({
          checkInId: checkIn.id,
          x: i * (patchW + QUILT_GUTTER),
          y,
          w: patchW,
          h: DAY_ROW_HEIGHT,
          pieces: clothPieces(checkIn.emotions, patchW, DAY_ROW_HEIGHT),
          a11yLabel: buildPatchA11yLabel(checkIn),
        }));
        rows.push({
          dayKey: dk,
          label: chunkIndex === 0 ? dayLabel : '',
          patches,
          y,
          height: DAY_ROW_HEIGHT,
          empty: false,
        });
        y += DAY_ROW_HEIGHT + QUILT_GUTTER;
      });
    }

    const last = rows[rows.length - 1];
    blocks.push({
      weekKey: wk,
      label: `${shortDate(monday)} – ${shortDate(sunday)}`,
      rows,
      totalHeight: last ? last.y + last.height : 0,
    });
  }

  return blocks;
}
