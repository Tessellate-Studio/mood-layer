// The app mark: stacked strata — three bands of translucent feeling-cloth,
// deepening where they overlap (see docs/logo handoff). Drawn inline from
// theme tokens per the handoff spec: each band is a rounded rect filled with
// its family's shades[3] at ~0.82 opacity, outlined with that family's thread
// at 0.6 — no asset files, so the mark can be mood-tinted at runtime. The
// brand stack is anger/enjoyment/sadness; passing `families` swaps which
// families are stacked (the mood variants), same geometry.

import React from 'react';
import Svg, { Rect } from 'react-native-svg';

import { familyPalette } from '@/constants/theme';
import type { EmotionFamilyId } from '@/types/models';

const BRAND_STACK: EmotionFamilyId[] = ['anger', 'enjoyment', 'sadness'];

// Band geometry in a 56-unit viewBox: narrow top fold, widening downward,
// each overlapping the next so the alpha fills deepen at the seams.
const BANDS = [
  { x: 14, y: 8, w: 28, h: 16 },
  { x: 10, y: 19, w: 36, h: 16 },
  { x: 6, y: 30, w: 44, h: 18 },
];

interface Props {
  /**
   * Families to stack, top band first. Padded to three bands by repeating
   * the first (dominant) family. Omit for the fixed brand stack.
   */
  families?: EmotionFamilyId[];
  size?: number;
}

export default function LogoMark({ families, size = 56 }: Props) {
  const stack = families && families.length > 0 ? families : BRAND_STACK;

  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      {BANDS.map((band, i) => {
        const palette = familyPalette[stack[i] ?? stack[0]];
        return (
          <Rect
            key={i}
            x={band.x}
            y={band.y}
            width={band.w}
            height={band.h}
            rx={band.h / 2}
            fill={palette.shades[3]}
            fillOpacity={0.82}
            stroke={palette.thread}
            strokeOpacity={0.6}
            strokeWidth={1}
          />
        );
      })}
    </Svg>
  );
}
