// The app mark: stacked strata — four bands of translucent feeling-cloth,
// deepening where they overlap. Geometry matches the logo handoff's
// four-band icon_paper.svg exactly (240-unit viewBox, top-to-bottom widening
// bands centred at x=120, each overlapping the one below by 16 units) so the
// in-app mark and the store/launcher icon are the same shape (installed
// 2026-09-02 — the user's pick from the identity canvas). Colours come from
// theme tokens, not the asset's baked-in hex, so the mark can be mood-tinted
// at runtime: the brand stack is enjoyment / anger / contempt / sadness
// (amber · rose · mauve · blue, top to bottom, per the canvas); passing
// `families` swaps which families are stacked (the mood variants), same
// geometry. Overlap-deepening is alpha alone — no blend mode on
// react-native-svg.

import React from 'react';
import Svg, { Rect } from 'react-native-svg';

import { familyPalette } from '@/constants/theme';
import type { EmotionFamilyId } from '@/types/models';

const BRAND_STACK: EmotionFamilyId[] = ['enjoyment', 'anger', 'contempt', 'sadness'];

const VIEWBOX_SIZE = 240;

// Top-to-bottom, narrowest-to-widest — lifted verbatim from icon_paper.svg.
export const LOGO_BANDS = [
  { x: 84, y: 48, w: 72, h: 48 },
  { x: 74, y: 80, w: 92, h: 48 },
  { x: 64, y: 112, w: 112, h: 48 },
  { x: 54, y: 144, w: 132, h: 48 },
] as const;

interface Props {
  /**
   * Families to stack, top band first. Padded to four bands by repeating
   * the first (dominant) family. Omit for the fixed brand stack.
   */
  families?: EmotionFamilyId[];
  size?: number;
}

export default function LogoMark({ families, size = 56 }: Props) {
  const stack = families && families.length > 0 ? families : BRAND_STACK;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
      {/* Bottom band first so each band overlaps the one beneath it. */}
      {[...LOGO_BANDS].reverse().map((band, i) => {
        const bandIndex = LOGO_BANDS.length - 1 - i;
        const palette = familyPalette[stack[bandIndex] ?? stack[0]];
        return (
          <Rect
            key={bandIndex}
            x={band.x}
            y={band.y}
            width={band.w}
            height={band.h}
            rx={band.h / 2}
            fill={palette.shades[4]}
            fillOpacity={0.82}
            stroke={palette.thread}
            strokeOpacity={0.6}
            strokeWidth={1.6}
          />
        );
      })}
    </Svg>
  );
}
