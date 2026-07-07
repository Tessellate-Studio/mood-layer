// Quilt layout engine — PURE functions, no React. Everything the quilt canvas
// draws is computed here as plain data so it can be unit-tested exactly and
// rendered by dumb components. Pattern textures are generated PRIMITIVES
// (lines/circles/paths), never SVG <Pattern> defs — rnsvg's def support is
// quirky across renderers and defs are untestable as data (CLAUDE.md hard
// rule "SVG quilt patterns are generated primitives").

import { findEmotionWord } from '@/content/emotions';
import type { CheckIn, EmotionFamilyId, EmotionSelection, Intensity } from '@/types/models';
import { dayKey, dayPartLabel, weekKey } from '@/utils/dates';

export interface SegmentLayout {
  emotionId: string;
  family: EmotionFamilyId;
  intensity: Intensity;
  /** Local to the patch: (0,0) is the patch's top-left corner. */
  rect: { x: number; y: number; w: number; h: number };
}

export interface PatchLayout {
  checkInId: string;
  /** Position within the week block's canvas (gutters already baked in). */
  x: number;
  y: number;
  w: number;
  h: number;
  segments: SegmentLayout[];
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

export type PatternElement =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'path'; d: string };

/** Seam gutter between patches and between rows (baked into x/y positions). */
export const QUILT_GUTTER = 6;
/** Height of a day row that holds patches. */
export const DAY_ROW_HEIGHT = 72;
/** Height of an empty-day strip (a thin dashed seam). */
export const EMPTY_ROW_HEIGHT = 14;

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

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Split a 1-D span into consecutive sizes proportional to `weights`.
 * Positions come from cumulative sums so the pieces tile the span exactly
 * (no drift from summing rounded sizes).
 */
function splitSpan(total: number, weights: number[]): Array<{ start: number; size: number }> {
  const sum = weights.reduce((a, b) => a + b, 0);
  const out: Array<{ start: number; size: number }> = [];
  let cum = 0;
  for (const weight of weights) {
    const start = (total * cum) / sum;
    cum += weight;
    const end = (total * cum) / sum;
    out.push({ start, size: end - start });
  }
  return out;
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * Subdivide a patch rect into one segment per emotion.
 * Canonical shapes at equal intensity (the quilt's visual grammar):
 *   k=1 full rect · k=2 vertical halves · k=3 left half + two stacked right
 *   quarters · k=4 2×2 grid · k=5 five vertical strips.
 * Along each cut axis, sizes are weighted by intensity (share = intensity /
 * sum of intensities in that cut group). Where a cut separates GROUPS of
 * segments (k=3's left-vs-right, k=4's columns) the group weight is the MEAN
 * of its members' intensities — that is what keeps the canonical shapes exact
 * when all intensities are equal (a sum-weight would make k=3's "left half"
 * a third). Deterministic; areas always tile w×h exactly.
 */
export function subdividePatch(
  emotions: EmotionSelection[],
  w: number,
  h: number
): SegmentLayout[] {
  const seg = (e: EmotionSelection, rect: Rect): SegmentLayout => ({
    emotionId: e.emotionId,
    family: e.family,
    intensity: e.intensity,
    rect,
  });

  const k = emotions.length;
  if (k === 0) return [];
  if (k === 1) return [seg(emotions[0], { x: 0, y: 0, w, h })];

  if (k === 2) {
    const cols = splitSpan(
      w,
      emotions.map((e) => e.intensity)
    );
    return emotions.map((e, i) => seg(e, { x: cols[i].start, y: 0, w: cols[i].size, h }));
  }

  if (k === 3) {
    const [left, topRight, bottomRight] = emotions;
    const cols = splitSpan(w, [
      left.intensity,
      mean([topRight.intensity, bottomRight.intensity]),
    ]);
    const rightRows = splitSpan(h, [topRight.intensity, bottomRight.intensity]);
    return [
      seg(left, { x: cols[0].start, y: 0, w: cols[0].size, h }),
      seg(topRight, { x: cols[1].start, y: rightRows[0].start, w: cols[1].size, h: rightRows[0].size }),
      seg(bottomRight, { x: cols[1].start, y: rightRows[1].start, w: cols[1].size, h: rightRows[1].size }),
    ];
  }

  if (k === 4) {
    const [a, b, c, d] = emotions;
    const cols = splitSpan(w, [mean([a.intensity, b.intensity]), mean([c.intensity, d.intensity])]);
    const leftRows = splitSpan(h, [a.intensity, b.intensity]);
    const rightRows = splitSpan(h, [c.intensity, d.intensity]);
    return [
      seg(a, { x: cols[0].start, y: leftRows[0].start, w: cols[0].size, h: leftRows[0].size }),
      seg(b, { x: cols[0].start, y: leftRows[1].start, w: cols[0].size, h: leftRows[1].size }),
      seg(c, { x: cols[1].start, y: rightRows[0].start, w: cols[1].size, h: rightRows[0].size }),
      seg(d, { x: cols[1].start, y: rightRows[1].start, w: cols[1].size, h: rightRows[1].size }),
    ];
  }

  // k >= 5: vertical strips (the model caps a check-in at 5 emotions).
  const cols = splitSpan(
    w,
    emotions.map((e) => e.intensity)
  );
  return emotions.map((e, i) => seg(e, { x: cols[i].start, y: 0, w: cols[i].size, h }));
}

/** 'Tuesday morning: sad 3, hopeful 2' — screen-reader summary of a patch. */
export function buildPatchA11yLabel(checkIn: CheckIn): string {
  const created = new Date(checkIn.createdAt);
  const weekday = WEEKDAYS_FULL[created.getDay()];
  const part = dayPartLabel(checkIn.createdAt);
  const items = checkIn.emotions.map((selection) => {
    const word = findEmotionWord(selection.emotionId)?.word.label ?? selection.emotionId;
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
 * are omitted, not shown as empty strips), empty days as thin strips, at most
 * 5 patches per row (overflow wraps to a second row with the same dayKey).
 * `now` is injectable so tests are date-stable.
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
        // Slot count floors at 3 so a lone patch stays patch-sized instead of
        // stretching across the whole quilt.
        const slots = Math.max(3, Math.min(rowCheckIns.length, 5));
        const patchW = (containerWidth - (slots - 1) * QUILT_GUTTER) / slots;
        const patches: PatchLayout[] = rowCheckIns.map((checkIn, i) => ({
          checkInId: checkIn.id,
          x: i * (patchW + QUILT_GUTTER),
          y,
          w: patchW,
          h: DAY_ROW_HEIGHT,
          segments: subdividePatch(checkIn.emotions, patchW, DAY_ROW_HEIGHT),
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

/** Round for compact, deterministic path strings. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Monochrome texture primitives for one segment rect, everything strictly
 * inside the rect. Paths use absolute M/L commands ONLY so tests (and any
 * future tooling) can parse coordinates back out of the string.
 * Unknown ids return [] — the segment renders as plain shade.
 */
export function generatePatternElements(
  patternId: string,
  rect: Rect,
  opts?: { spacing?: number }
): PatternElement[] {
  const spacing = opts?.spacing ?? 7;
  const { x, y, w, h } = rect;
  const elements: PatternElement[] = [];

  // Diagonal lines with slope +1 (down-right) or -1 (up-right), clipped to
  // the rect by solving for the parameter range where x stays in bounds.
  const diagonals = (slope: 1 | -1) => {
    const t0 = -Math.ceil(h / spacing) * spacing;
    for (let t = t0; t < w; t += spacing) {
      const s0 = Math.max(0, -t);
      const s1 = Math.min(h, w - t);
      if (s1 - s0 <= 0.5) continue;
      if (slope === 1) {
        elements.push({ kind: 'line', x1: x + t + s0, y1: y + s0, x2: x + t + s1, y2: y + s1 });
      } else {
        elements.push({ kind: 'line', x1: x + t + s0, y1: y + h - s0, x2: x + t + s1, y2: y + h - s1 });
      }
    }
  };

  switch (patternId) {
    case 'hatch':
      diagonals(1);
      break;

    case 'vertical':
      for (let vx = x + spacing; vx < x + w; vx += spacing) {
        elements.push({ kind: 'line', x1: vx, y1: y, x2: vx, y2: y + h });
      }
      break;

    case 'wave': {
      const amplitude = 2.5;
      const periods = 2.5; // 2–3 gentle periods across the width
      const samples = 24;
      for (let yc = y + spacing; yc < y + h; yc += spacing) {
        if (yc - amplitude < y || yc + amplitude > y + h) continue;
        const points: string[] = [];
        for (let i = 0; i <= samples; i++) {
          const px = x + (w * i) / samples;
          const py = yc + amplitude * Math.sin((2 * Math.PI * periods * i) / samples);
          points.push(`${i === 0 ? 'M' : 'L'} ${r2(px)} ${r2(py)}`);
        }
        elements.push({ kind: 'path', d: points.join(' ') });
      }
      break;
    }

    case 'crosshatch':
      diagonals(1);
      diagonals(-1);
      break;

    case 'dots': {
      const radius = 1.6;
      for (let row = 0; ; row++) {
        const cy = y + spacing * 0.5 + row * spacing;
        if (cy + radius > y + h) break;
        if (cy - radius < y) continue;
        // Offset alternate rows by half a step for a woven look.
        const startX = x + spacing * 0.5 + (row % 2) * (spacing / 2);
        for (let cx = startX; cx + radius <= x + w; cx += spacing) {
          if (cx - radius < x) continue;
          elements.push({ kind: 'circle', cx, cy, r: radius });
        }
      }
      break;
    }

    case 'spokes': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const len = Math.min(w, h) * 0.32;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        // Start a little out from the centre so the spokes read as stitches,
        // not a solid asterisk.
        elements.push({
          kind: 'line',
          x1: cx + Math.cos(angle) * len * 0.35,
          y1: cy + Math.sin(angle) * len * 0.35,
          x2: cx + Math.cos(angle) * len,
          y2: cy + Math.sin(angle) * len,
        });
      }
      break;
    }

    case 'chevron': {
      // Sparse rows (double spacing) of small V shapes.
      const rowStep = spacing * 2;
      const vWidth = spacing * 1.6;
      const depth = spacing * 0.6;
      for (let yc = y + spacing; yc + depth <= y + h; yc += rowStep) {
        for (let px = x + spacing * 0.5; px + vWidth <= x + w; px += vWidth + spacing) {
          elements.push({
            kind: 'path',
            d: `M ${r2(px)} ${r2(yc)} L ${r2(px + vWidth / 2)} ${r2(yc + depth)} L ${r2(px + vWidth)} ${r2(yc)}`,
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return elements;
}
