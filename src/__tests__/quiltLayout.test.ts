// P6 — pure quilt layout engine. Everything here is deterministic math over
// plain data: cloth-piece geometry, week/day grouping, and a11y labels.

import type { CheckIn, EmotionSelection } from '@/types/models';
import {
  buildPatchA11yLabel,
  clothPieces,
  CLOTH_OPACITY,
  computeQuiltLayout,
  DAY_ROW_HEIGHT,
  EMPTY_ROW_HEIGHT,
  offsetForCheckIn,
  QUILT_GUTTER,
  WEEK_LABEL_BLOCK,
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

const centerOf = (p: ReturnType<typeof clothPieces>[number]) => ({
  x: p.rect.x + p.rect.w / 2,
  y: p.rect.y + p.rect.h / 2,
});
const areaOf = (p: ReturnType<typeof clothPieces>[number]) => p.rect.w * p.rect.h;

describe('clothPieces', () => {
  it('emits one translucent piece per emotion, carrying its identity', () => {
    const pieces = clothPieces(
      [sel('sad', 'sadness', 3), sel('glad', 'enjoyment', 2)],
      100,
      80
    );
    expect(pieces).toHaveLength(2);
    expect(pieces.map((p) => p.emotionId)).toEqual(['sad', 'glad']);
    expect(pieces.map((p) => p.family)).toEqual(['sadness', 'enjoyment']);
    for (const piece of pieces) {
      expect(piece.opacity).toBe(CLOTH_OPACITY);
      expect(piece.rx).toBeGreaterThan(0);
    }
  });

  it('k=0 yields nothing', () => {
    expect(clothPieces([], 100, 80)).toEqual([]);
  });

  it('a lone piece sits dead-centre in the box', () => {
    const [piece] = clothPieces([sel('sad', 'sadness', 2)], 100, 80);
    expect(centerOf(piece)).toEqual({ x: 50, y: 40 });
  });

  it('a stronger feeling is a larger piece of cloth', () => {
    const [mild] = clothPieces([sel('uneasy', 'fear', 1)], 100, 80);
    const [strong] = clothPieces([sel('panicked', 'fear', 4)], 100, 80);
    expect(areaOf(strong)).toBeGreaterThan(areaOf(mild));
  });

  it('a cluster spreads its pieces so they overlap (not all concentric)', () => {
    const pieces = clothPieces(
      [sel('sad', 'sadness', 2), sel('glad', 'enjoyment', 2), sel('uneasy', 'fear', 2)],
      100,
      80
    );
    const centers = pieces.map(centerOf);
    // At least two centres differ — the ring pushed them apart.
    const distinct = new Set(centers.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('keeps every piece fully inside the box, even 5 pressed-hard emotions', () => {
    // Regression: intensity-4 pieces on the spread ring used to reach past the
    // box — SVG clipped them into hard square corners on the preview and let
    // clusters bleed into neighbours on the quilt (device screenshots,
    // 2026-07-17).
    for (let k = 1; k <= 5; k++) {
      const emotions = Array.from({ length: k }, (_, i) => sel(`e${i}`, 'anger', 4));
      for (const [w, h] of [
        [100, 80],
        [160, 160],
      ] as const) {
        for (const piece of clothPieces(emotions, w, h)) {
          expect(piece.rect.x).toBeGreaterThanOrEqual(-1e-9);
          expect(piece.rect.y).toBeGreaterThanOrEqual(-1e-9);
          expect(piece.rect.x + piece.rect.w).toBeLessThanOrEqual(w + 1e-9);
          expect(piece.rect.y + piece.rect.h).toBeLessThanOrEqual(h + 1e-9);
        }
      }
    }
  });

  it('is deterministic — repeat calls deep-equal', () => {
    const emotions = [sel('angry', 'anger', 3), sel('sad', 'sadness', 1), sel('glad', 'enjoyment', 4)];
    expect(clothPieces(emotions, 100, 80)).toEqual(clothPieces(emotions, 100, 80));
  });
});

describe('offsetForCheckIn', () => {
  const WIDTH = 320;
  const NOW = new Date('2026-07-11T12:00:00'); // Saturday of the Jul 6–12 week

  it('points at the row holding the check-in, minus a breathing margin', () => {
    // Saturday sits at the BOTTOM of the week — the case that was scrolling
    // out of view after a save (2026-07-18).
    const saturday = checkIn({ createdAt: '2026-07-11T09:00:00', id: 'sat' });
    const blocks = computeQuiltLayout([saturday], WIDTH, NOW);
    const row = blocks[0].rows.find((r) => r.patches.length > 0)!;
    expect(offsetForCheckIn(blocks, 'sat', 16, 24)).toBe(16 + WEEK_LABEL_BLOCK + row.y - 24);
    // That row really is far down the block — the fix is not a no-op.
    expect(row.y).toBeGreaterThan(0);
  });

  it('never returns a negative offset for a row near the top', () => {
    const monday = checkIn({ createdAt: '2026-07-06T09:00:00', id: 'mon' });
    const blocks = computeQuiltLayout([monday], WIDTH, NOW);
    expect(offsetForCheckIn(blocks, 'mon', 16, 240)).toBe(0);
  });

  it('accumulates earlier week blocks when the check-in is older', () => {
    const older = checkIn({ createdAt: '2026-06-30T09:00:00', id: 'older' });
    const blocks = computeQuiltLayout([older], WIDTH, NOW);
    // Two blocks: current (empty) then the older week holding it.
    expect(blocks).toHaveLength(2);
    const offset = offsetForCheckIn(blocks, 'older', 16, 0)!;
    expect(offset).toBeGreaterThan(blocks[0].totalHeight);
  });

  it('returns null for an id that is not laid out', () => {
    const blocks = computeQuiltLayout([], WIDTH, NOW);
    expect(offsetForCheckIn(blocks, 'nope')).toBeNull();
  });
});

describe('buildPatchA11yLabel', () => {
  it('reads weekday + day part + lowercase words with intensity', () => {
    // 2026-07-07 is a Tuesday; 09:30 local → morning. 'hopeful' lives in the
    // EXTENDED vocabulary (check-in-selectable since 2026-07-17) and must
    // resolve; an unknown id falls back to itself.
    const label = buildPatchA11yLabel(
      checkIn({
        createdAt: '2026-07-07T09:30:00',
        emotions: [
          sel('sad', 'sadness', 3),
          sel('hopeful', 'anticipation', 2),
          sel('not-a-word', 'enjoyment', 1),
        ],
      })
    );
    expect(label).toBe('Tuesday morning: sad 3, hopeful 2, not-a-word 1');
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

  it('sizes cluster boxes by row count with a floor of 3 slots, gutters baked into x', () => {
    const blocks = computeQuiltLayout([checkIn({ createdAt: '2026-07-07T09:30:00' })], WIDTH, NOW);
    const row = blocks[0].rows.find((r) => !r.empty)!;
    const patch = row.patches[0];
    // One cluster → 3 slots: width = (container - 2 gutters) / 3.
    expect(patch.w).toBeCloseTo((WIDTH - 2 * QUILT_GUTTER) / 3);
    expect(patch.x).toBe(0);
    expect(patch.h).toBe(DAY_ROW_HEIGHT);
    expect(patch.a11yLabel).toContain('Tuesday morning');
    expect(patch.pieces).toHaveLength(1);
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
