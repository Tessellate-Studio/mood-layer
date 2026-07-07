// One quilt patch: a check-in rendered as shaded, textured SVG segments with
// hand-stitched dashed seams. PURE SVG — no press handling in here. Pressable
// overlays live in QuiltWeek instead, because SVG onPress is unreliable across
// rnsvg versions and unfocusable for screen readers; RN Pressable overlays
// give proper a11y (role/label/focus) for free.

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { colors, shadeForIntensity, textures } from '@/constants/theme';
import { EMOTION_FAMILIES } from '@/content/emotions';
import type { EmotionSelection } from '@/types/models';
import {
  generatePatternElements,
  subdividePatch,
  type PatchLayout,
  type SegmentLayout,
} from '@/utils/quiltLayout';

/** Texture stroke width — thin enough to read as thread, not bars. */
const TEXTURE_STROKE = 0.8;

/** Simple deterministic 32-bit string hash (djb2-style) for border wobble. */
function hash32(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/**
 * Hand-stitched border: each corner gets a deterministic ±1px jitter derived
 * from the checkInId hash, so every patch's outline wobbles slightly — like a
 * seam sewn by hand — but never changes between renders.
 */
function wobblyBorderPath(seed: string, w: number, h: number): string {
  const hash = hash32(seed);
  // 8 jitter values (x and y per corner), each in {-1, 0, 1}.
  const jitter = (i: number) => ((hash >>> (i * 4)) % 3) - 1;
  const corners = [
    { x: 0 + jitter(0), y: 0 + jitter(1) },
    { x: w + jitter(2), y: 0 + jitter(3) },
    { x: w + jitter(4), y: h + jitter(5) },
    { x: 0 + jitter(6), y: h + jitter(7) },
  ];
  return (
    corners.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ') + ' Z'
  );
}

/** Texture colour: dark fills (intensity ≥3) need light thread to stay visible. */
const textureColor = (intensity: SegmentLayout['intensity']) =>
  intensity >= 3 ? colors.paper : colors.stitch;

function SegmentTexture({ segment }: { segment: SegmentLayout }) {
  const patternId = EMOTION_FAMILIES[segment.family].patternId;
  const elements = generatePatternElements(patternId, segment.rect);
  const stroke = textureColor(segment.intensity);
  return (
    <>
      {elements.map((el, i) => {
        if (el.kind === 'line') {
          return (
            <Line
              key={i}
              x1={el.x1}
              y1={el.y1}
              x2={el.x2}
              y2={el.y2}
              stroke={stroke}
              strokeWidth={TEXTURE_STROKE}
            />
          );
        }
        if (el.kind === 'circle') {
          // Dots are filled, not stroked — a stroked 1.6px circle reads as a
          // ring, not a polka dot.
          return <Circle key={i} cx={el.cx} cy={el.cy} r={el.r} fill={stroke} />;
        }
        return (
          <Path key={i} d={el.d} stroke={stroke} strokeWidth={TEXTURE_STROKE} fill="none" />
        );
      })}
    </>
  );
}

/**
 * Patch body: segments (fill + texture + dashed boundary) and the wobbled
 * dashed border. Shared verbatim between QuiltPatch (positioned inside the
 * week canvas) and PatchPreview (standalone Svg).
 */
function PatchBody({
  segments,
  seed,
  w,
  h,
}: {
  segments: SegmentLayout[];
  seed: string;
  w: number;
  h: number;
}) {
  return (
    <>
      {segments.map((segment, i) => (
        <React.Fragment key={`${segment.emotionId}-${i}`}>
          <Rect
            x={segment.rect.x}
            y={segment.rect.y}
            width={segment.rect.w}
            height={segment.rect.h}
            fill={shadeForIntensity[segment.intensity]}
          />
          <SegmentTexture segment={segment} />
          {/* Dashed segment boundary — drawing every segment's outline also
              covers the shared internal seams. */}
          <Rect
            x={segment.rect.x}
            y={segment.rect.y}
            width={segment.rect.w}
            height={segment.rect.h}
            fill="none"
            stroke={colors.stitch}
            strokeWidth={1}
            strokeDasharray={[...textures.stitchDash]}
          />
        </React.Fragment>
      ))}
      <Path
        d={wobblyBorderPath(seed, w, h)}
        fill="none"
        stroke={colors.stitch}
        strokeWidth={1}
        strokeDasharray={[...textures.stitchDash]}
      />
    </>
  );
}

interface QuiltPatchProps {
  layout: PatchLayout;
}

/** One patch positioned inside a week canvas — pure SVG, memoised. */
export const QuiltPatch = React.memo(function QuiltPatch({ layout }: QuiltPatchProps) {
  return (
    <G transform={`translate(${layout.x}, ${layout.y})`}>
      <PatchBody
        segments={layout.segments}
        seed={layout.checkInId}
        w={layout.w}
        h={layout.h}
      />
    </G>
  );
});

interface PatchPreviewProps {
  emotions: EmotionSelection[];
  size: number;
  a11yLabel?: string;
}

/**
 * Standalone square patch (check-in confirmation step, detail views) — runs
 * the same subdivision the quilt uses so the preview matches what gets sewn.
 */
export function PatchPreview({ emotions, size, a11yLabel }: PatchPreviewProps) {
  const segments = React.useMemo(() => subdividePatch(emotions, size, size), [emotions, size]);
  // Preview seed: derived from the emotion ids so the wobble is stable for a
  // given selection (there is no checkInId yet).
  const seed = emotions.map((e) => e.emotionId).join('|');
  return (
    <View
      accessible={a11yLabel !== undefined}
      accessibilityLabel={a11yLabel}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <PatchBody segments={segments} seed={seed} w={size} h={size} />
      </Svg>
    </View>
  );
}

export default QuiltPatch;
