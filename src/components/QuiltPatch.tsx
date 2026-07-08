// One quilt cluster: a check-in rendered as overlapping translucent cloth —
// one rounded, semi-transparent piece per named emotion. Where feelings
// co-occur the pieces overlap and the colour deepens (alpha over alpha), which
// is the whole idea of "Mood Layers": light through layers, no grid, no
// borders, no texture. PURE SVG — no press handling in here. Pressable overlays
// live in QuiltWeek instead, because SVG onPress is unreliable across rnsvg
// versions and unfocusable for screen readers.

import React from 'react';
import { View } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';

import { familyPalette } from '@/constants/theme';
import type { EmotionSelection } from '@/types/models';
import { clothPieces, type ClothPiece, type PatchLayout } from '@/utils/quiltLayout';

/**
 * Cluster body: the translucent cloth pieces. Shared verbatim between
 * QuiltPatch (positioned inside the week canvas via an outer <G>) and
 * PatchPreview (its own <Svg>). Pieces draw in order — the first-named emotion
 * sits underneath, later ones layer over it.
 */
function ClothBody({ pieces }: { pieces: ClothPiece[] }) {
  return (
    <>
      {pieces.map((piece, i) => (
        <Rect
          key={`${piece.emotionId}-${i}`}
          x={piece.rect.x}
          y={piece.rect.y}
          width={piece.rect.w}
          height={piece.rect.h}
          rx={piece.rx}
          ry={piece.rx}
          fill={familyPalette[piece.family].shades[piece.intensity]}
          fillOpacity={piece.opacity}
        />
      ))}
    </>
  );
}

interface QuiltPatchProps {
  layout: PatchLayout;
}

/** One cluster positioned inside a week canvas — pure SVG, memoised. */
export const QuiltPatch = React.memo(function QuiltPatch({ layout }: QuiltPatchProps) {
  return (
    <G transform={`translate(${layout.x}, ${layout.y})`}>
      <ClothBody pieces={layout.pieces} />
    </G>
  );
});

interface PatchPreviewProps {
  emotions: EmotionSelection[];
  size: number;
  a11yLabel?: string;
}

/**
 * Standalone cluster (check-in confirmation step, detail views) — runs the same
 * cloth layout the quilt uses so the preview matches what gets sewn.
 */
export function PatchPreview({ emotions, size, a11yLabel }: PatchPreviewProps) {
  const pieces = React.useMemo(() => clothPieces(emotions, size, size), [emotions, size]);
  return (
    <View
      accessible={a11yLabel !== undefined}
      accessibilityLabel={a11yLabel}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <ClothBody pieces={pieces} />
      </Svg>
    </View>
  );
}

export default QuiltPatch;
