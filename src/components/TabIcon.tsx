// Tab bar icons — simple monochrome line art drawn inline with react-native-svg.
// Stroke colour comes from the tab bar's tint (theme ink/inkMuted); no fills.

import React from 'react';
import Svg, { Line, Rect } from 'react-native-svg';

import { textures } from '@/constants/theme';

export interface TabIconProps {
  color: string;
  size: number;
}

const STROKE_WIDTH = 1.5;

/** 2x2 quilt grid: an outer square with a dashed middle seam both ways. */
export function QuiltIcon({ color, size }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={16} rx={1.5} stroke={color} strokeWidth={STROKE_WIDTH} />
      <Line
        x1={12}
        y1={4}
        x2={12}
        y2={20}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={[...textures.stitchDashFine]}
      />
      <Line
        x1={4}
        y1={12}
        x2={20}
        y2={12}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={[...textures.stitchDashFine]}
      />
    </Svg>
  );
}

/** Hand-drawn asterisk: three lines crossing at the centre. */
export function ExperimentsIcon({ color, size }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={12} y1={4} x2={12} y2={20} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Line x1={5.1} y1={8} x2={18.9} y2={16} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Line x1={18.9} y1={8} x2={5.1} y2={16} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
}

/** Three ascending horizontal stitch lines. */
export function InsightsIcon({ color, size }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1={5}
        y1={18}
        x2={19}
        y2={18}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={[...textures.stitchDashFine]}
      />
      <Line
        x1={5}
        y1={12}
        x2={16}
        y2={12}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={[...textures.stitchDashFine]}
      />
      <Line
        x1={5}
        y1={6}
        x2={13}
        y2={6}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={[...textures.stitchDashFine]}
      />
    </Svg>
  );
}
