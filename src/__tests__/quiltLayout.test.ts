// P6 — pure quilt layout engine. Everything here is deterministic math over
// plain data: subdivision, week/day grouping, a11y labels, and the pattern
// primitives (generated, never <Pattern> defs — CLAUDE.md hard rule).

import { PATCH_PATTERN_IDS } from '@/content/emotions';
import type { CheckIn, EmotionSelection } from '@/types/models';
import {
  buildPatchA11yLabel,
  computeQuiltLayout,
  DAY_ROW_HEIGHT,
  EMPTY_ROW_HEIGHT,
  generatePatternElements,
  QUILT_GUTTER,
  subdividePatch,
  type PatternElement,
} from '@/utils/quiltLayout';

const sel = (emotionId: string, family: EmotionSelection['family'], intensity: 1 | 2 | 3 | 4): EmotionSelection => ({
  emotionId,
  family,
  intensity,
});

function checkIn(overrides: Partial<CheckIn> & { createdAt: string }): CheckIn {
  const created = overrides.createdAt;
  const d = new Date(created);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id: overrides.id ?? `ci-${created}`,
    createdAt: created,
    dayKey: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    emotions: overrides.emotions ?? [sel('sad', 'sadness', 3)],
    resistanceFlags: overrides.resistanceFlags ?? [],
    source: overrides.source ?? 'manual',
    ...('note' in overrides ? { note: overrides.note } : {}),
  };
}

const areaOf = (segments: ReturnType<typeof subdividePatch>) =>
  segments.reduce((sum, s) => sum + s.rect.w * s.rect.h, 0);

describe('subdividePatch', () => {
  it('k=1 fills the whole rect', () => {
    const segs = subdividePatch([sel('sad', 'sadness', 2)], 100, 80);
    expect(segs).toHaveLength(1);
    expect(segs[0].rect).toEqual({ x: 0, y: 0, w: 100, h: 80 });
    expect(segs[0].emotionId).toBe('sad');
    expect(segs[0].intensity).toBe(2);
  });

  it('k=2 splits vertically, widths weighted by intensity (1 vs 3 → 25%/75%)', () => {
    const segs = subdividePatch([sel('uneasy', 'fear', 1), sel('sad', 'sadness', 3)], 100, 80);
    expect(segs).toHaveLength(2);
    expect(segs[0].rect.x).toBe(0);
    expect(segs[0].rect.w).toBeCloseTo(25);
    expect(segs[0].rect.h).toBe(80);
    expect(segs[1].rect.x).toBeCloseTo(25);
    expect(segs[1].rect.w).toBeCloseTo(75);
    expect(segs[1].rect.h).toBe(80);
  });

  it('k=3 with equal intensities: left half + two stacked right quarters', () => {
    const segs = subdividePatch(
      [sel('angry', 'anger', 2), sel('sad', 'sadness', 2), sel('glad', 'enjoyment', 2)],
      100,
      80
    );
    expect(segs).toHaveLength(3);
    // Left half, full height.
    expect(segs[0].rect).toEqual({ x: 0, y: 0, w: 50, h: 80 });
    // Two stacked right quarters.
    expect(segs[1].rect).toEqual({ x: 50, y: 0, w: 50, h: 40 });
    expect(segs[2].rect).toEqual({ x: 50, y: 40, w: 50, h: 40 });
  });

  it('k=4 with equal intensities: 2×2 grid', () => {
    const segs = subdividePatch(
      [
        sel('angry', 'anger', 1),
        sel('sad', 'sadness', 1),
        sel('glad', 'enjoyment', 1),
        sel('curious', 'surprise', 1),
      ],
      100,
      80
    );
    expect(segs).toHaveLength(4);
    expect(segs[0].rect).toEqual({ x: 0, y: 0, w: 50, h: 40 });
    expect(segs[1].rect).toEqual({ x: 0, y: 40, w: 50, h: 40 });
    expect(segs[2].rect).toEqual({ x: 50, y: 0, w: 50, h: 40 });
    expect(segs[3].rect).toEqual({ x: 50, y: 40, w: 50, h: 40 });
  });

  it('k=5: five vertical strips, x ascending, full height', () => {
    const segs = subdividePatch(
      [
        sel('angry', 'anger', 1),
        sel('sad', 'sadness', 2),
        sel('glad', 'enjoyment', 3),
        sel('curious', 'surprise', 4),
        sel('uneasy', 'fear', 2),
      ],
      120,
      60
    );
    expect(segs).toHaveLength(5);
    let x = 0;
    for (const seg of segs) {
      expect(seg.rect.x).toBeCloseTo(x);
      expect(seg.rect.y).toBe(0);
      expect(seg.rect.h).toBe(60);
      x += seg.rect.w;
    }
    expect(x).toBeCloseTo(120);
  });

  it('areas always sum to w*h (float tolerance) for k=1..5 mixed intensities', () => {
    const pool: EmotionSelection[] = [
      sel('angry', 'anger', 3),
      sel('sad', 'sadness', 1),
      sel('glad', 'enjoyment', 4),
      sel('curious', 'surprise', 2),
      sel('uneasy', 'fear', 2),
    ];
    for (let k = 1; k <= 5; k++) {
      expect(areaOf(subdividePatch(pool.slice(0, k), 97, 63))).toBeCloseTo(97 * 63, 5);
    }
  });

  it('is deterministic — repeat calls deep-equal', () => {
    const emotions = [sel('angry', 'anger', 3), sel('sad', 'sadness', 1), sel('glad', 'enjoyment', 4)];
    expect(subdividePatch(emotions, 100, 80)).toEqual(subdividePatch(emotions, 100, 80));
  });
});

describe('buildPatchA11yLabel', () => {
  it('reads weekday + day part + lowercase words with intensity', () => {
    // 2026-07-07 is a Tuesday; 09:30 local → morning. 'hopeful' is not in the
    // taxonomy → falls back to the raw emotionId.
    const label = buildPatchA11yLabel(
      checkIn({
        createdAt: '2026-07-07T09:30:00',
        emotions: [sel('sad', 'sadness', 3), sel('hopeful', 'enjoyment', 2)],
      })
    );
    expect(label).toBe('Tuesday morning: sad 3, hopeful 2');
  });
});

describe('computeQuiltLayout', () => {
  const WIDTH = 320;
  const NOW = new Date('2026-07-09T12:00:00'); // Thursday of the Jul 6–12 week

  it('always includes the current week, even with zero check-ins', () => {
    const blocks = computeQuiltLayout([], WIDTH, NOW);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].weekKey).toBe('2026-W28');
    expect(blocks[0].label).toBe('Jul 6 – Jul 12');
  });

  it('current week omits future days but includes past empty days as thin strips', () => {
    const blocks = computeQuiltLayout(
      [checkIn({ createdAt: '2026-07-07T09:30:00' })], // Tuesday
      WIDTH,
      NOW // Thursday
    );
    const rows = blocks[0].rows;
    // Mon..Thu only — Fri/Sat/Sun are in the future and omitted entirely.
    expect(rows.map((r) => r.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu']);
    expect(rows.map((r) => r.empty)).toEqual([true, false, true, true]);
    expect(rows[0].height).toBe(EMPTY_ROW_HEIGHT);
    expect(rows[1].height).toBe(DAY_ROW_HEIGHT);
    expect(rows[1].patches).toHaveLength(1);
  });

  it('groups by ISO week desc across a month boundary, skipping zero-check-in weeks', () => {
    const blocks = computeQuiltLayout(
      [
        checkIn({ createdAt: '2026-07-01T10:00:00', id: 'july' }), // Wed, week Jun 29 – Jul 5
        checkIn({ createdAt: '2026-06-17T10:00:00', id: 'june' }), // Wed, week Jun 15 – 21
      ],
      WIDTH,
      NOW
    );
    // Current week (empty but always present), then the two weeks with data;
    // the empty Jun 22–28 week between them is NOT rendered.
    expect(blocks.map((b) => b.weekKey)).toEqual(['2026-W28', '2026-W27', '2026-W25']);
    expect(blocks[1].label).toBe('Jun 29 – Jul 5');
    // A past week always shows all 7 day rows Mon→Sun.
    expect(blocks[1].rows).toHaveLength(7);
    expect(blocks[1].rows[6].label).toBe('Sun');
  });

  it('wraps a 6th same-day check-in to a second row with the same dayKey and empty label', () => {
    const six = Array.from({ length: 6 }, (_, i) =>
      checkIn({ createdAt: `2026-07-07T0${i + 1}:00:00`, id: `c${i}` })
    );
    const blocks = computeQuiltLayout(six, WIDTH, NOW);
    const tueRows = blocks[0].rows.filter((r) => r.dayKey === '2026-07-07');
    expect(tueRows).toHaveLength(2);
    expect(tueRows[0].patches).toHaveLength(5);
    expect(tueRows[0].label).toBe('Tue');
    expect(tueRows[1].patches).toHaveLength(1);
    expect(tueRows[1].label).toBe('');
  });

  it('sizes patches by row count with a floor of 3 slots, gutters baked into x', () => {
    const blocks = computeQuiltLayout([checkIn({ createdAt: '2026-07-07T09:30:00' })], WIDTH, NOW);
    const row = blocks[0].rows.find((r) => !r.empty)!;
    const patch = row.patches[0];
    // One patch → 3 slots: width = (container - 2 gutters) / 3.
    expect(patch.w).toBeCloseTo((WIDTH - 2 * QUILT_GUTTER) / 3);
    expect(patch.x).toBe(0);
    expect(patch.h).toBe(DAY_ROW_HEIGHT);
    expect(patch.a11yLabel).toContain('Tuesday morning');
    expect(patch.segments).toHaveLength(1);
  });

  it('positions rows with gutters and reports totalHeight to match', () => {
    const blocks = computeQuiltLayout([checkIn({ createdAt: '2026-07-06T09:00:00' })], WIDTH, NOW);
    const rows = blocks[0].rows; // Mon(patch), Tue..Thu empty
    expect(rows[0].y).toBe(0);
    expect(rows[1].y).toBe(rows[0].height + QUILT_GUTTER);
    const last = rows[rows.length - 1];
    expect(blocks[0].totalHeight).toBe(last.y + last.height);
  });
});

describe('generatePatternElements', () => {
  const rect = { x: 10, y: 20, w: 60, h: 48 };
  const MIN = { x: rect.x - 0.5, y: rect.y - 0.5 };
  const MAX = { x: rect.x + rect.w + 0.5, y: rect.y + rect.h + 0.5 };

  function pointsOf(el: PatternElement): Array<{ x: number; y: number }> {
    if (el.kind === 'line') {
      return [
        { x: el.x1, y: el.y1 },
        { x: el.x2, y: el.y2 },
      ];
    }
    if (el.kind === 'circle') {
      // Circle extremes must stay inside too.
      return [
        { x: el.cx - el.r, y: el.cy },
        { x: el.cx + el.r, y: el.cy },
        { x: el.cx, y: el.cy - el.r },
        { x: el.cx, y: el.cy + el.r },
      ];
    }
    // Paths are emitted with absolute M/L commands only, so the numbers
    // alternate x,y — parse and pair them.
    const nums = (el.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      pts.push({ x: nums[i], y: nums[i + 1] });
    }
    return pts;
  }

  it.each(PATCH_PATTERN_IDS)('%s yields ≥1 element, all inside the rect', (patternId) => {
    const elements = generatePatternElements(patternId, rect);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    for (const el of elements) {
      for (const pt of pointsOf(el)) {
        expect(pt.x).toBeGreaterThanOrEqual(MIN.x);
        expect(pt.x).toBeLessThanOrEqual(MAX.x);
        expect(pt.y).toBeGreaterThanOrEqual(MIN.y);
        expect(pt.y).toBeLessThanOrEqual(MAX.y);
      }
    }
  });

  it('is deterministic and honours the spacing option', () => {
    const a = generatePatternElements('vertical', rect);
    expect(a).toEqual(generatePatternElements('vertical', rect));
    const dense = generatePatternElements('vertical', rect, { spacing: 4 });
    expect(dense.length).toBeGreaterThan(a.length);
  });

  it('unknown pattern id returns no elements (renders as plain shade)', () => {
    expect(generatePatternElements('nope', rect)).toEqual([]);
  });
});
