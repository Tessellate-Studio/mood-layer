// The app mark: stacked strata — three bands of translucent feeling-cloth,
// deepening where they overlap. Geometry matches the logo handoff's
// appicon_bare.svg exactly (240-unit viewBox, top-to-bottom narrowing bands
// centred at x=120) so the in-app mark and the store/launcher icon are the
// same shape. Colours come from theme tokens, not the asset's baked-in hex,
// so the mark can be mood-tinted at runtime: the brand stack is
// anger/enjoyment/sadness (rose/amber/blue, per the handoff); passing
// `families` swaps which families are stacked (the mood variants), same
// geometry.

import React from 'react';
import Svg, { Rect } from 'react-native-svg';

import { familyPalette } from '@/constants/theme';
import type { EmotionFamilyId } from '@/types/models';

const BRAND_STACK: EmotionFamilyId[] = ['anger', 'enjoyment', 'sadness'];

const VIEWBOX_SIZE = 240;

// Top-to-bottom, narrowest-to-widest, each overlapping the one below by 28
// units so the alpha fills deepen at the seams — lifted verbatim from
// assets/svg/appicon_bare.svg.
const BANDS = [
  { x: 59, y: 49, w: 122, h: 66 },
  { x: 47, y: 87, w: 146, h: 66 },
  { x: 36, y: 125, w: 168, h: 66 },
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
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
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
            strokeWidth={2.2}
          />
        );
      })}
    </Svg>
  );
}
