// A small decorative cluster of translucent feeling-cloth — the app's real
// visual grammar (overlapping family pastels, colour deepening where they
// meet) in miniature. Replaces the old dashed-square placeholders on
// onboarding and the empty home screen (user, 2026-07-17: "replace these
// with the colourful layers we have designed").

import React from 'react';
import Svg, { Rect } from 'react-native-svg';

import { familyPalette } from '@/constants/theme';
import { CLOTH_OPACITY } from '@/utils/quiltLayout';
import type { EmotionFamilyId } from '@/types/models';

/** Deterministic mini-cluster: three pieces on a small ring, like a real
 *  three-emotion check-in. Geometry mirrors clothPieces' look at a glance
 *  without importing the layout engine's box math. */
const PIECES: { x: number; y: number; s: number; family: EmotionFamilyId }[] = [
  { x: 14, y: 6, s: 40, family: 'sadness' },
  { x: 6, y: 20, s: 38, family: 'enjoyment' },
  { x: 24, y: 22, s: 36, family: 'anger' },
];

export default function LayeredClusterVignette({ size = 88 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {PIECES.map((p, i) => (
        <Rect
          key={i}
          x={p.x}
          y={p.y}
          width={p.s}
          height={p.s}
          rx={p.s * 0.35}
          ry={p.s * 0.35}
          fill={familyPalette[p.family].shades[3]}
          fillOpacity={CLOTH_OPACITY}
        />
      ))}
    </Svg>
  );
}
