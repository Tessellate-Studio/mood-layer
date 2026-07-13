// Tab bar icons — simple monochrome line art drawn inline with react-native-svg.
// Stroke colour comes from the tab bar's tint (theme ink/inkMuted); no fills.

import React from 'react';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { textures } from '@/constants/theme';

export interface TabIconProps {
  color: string;
  size: number;
}

const STROKE_WIDTH = 1.5;

// The app mark's three stacked bands, outlined only — matches the logo
// handoff's icon_mono.svg (240-unit viewBox), recoloured via the tab bar's
// active/inactive tint instead of shipping separate light/dark files.
const MONO_BANDS = [
  { x: 75, y: 51, w: 90, h: 46 },
  { x: 66, y: 89, w: 108, h: 46 },
  { x: 58, y: 127, w: 124, h: 46 },
];

/** The app mark, three outlined bands — same shape as the launcher icon. */
export function QuiltIcon({ color, size }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
      {MONO_BANDS.map((band, i) => (
        <Rect
          key={i}
          x={band.x}
          y={band.y}
          width={band.w}
          height={band.h}
          rx={band.h / 2}
          stroke={color}
          strokeWidth={8}
        />
      ))}
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

/** Three small rings clustered — a little circle of people. */
export function CircleIcon({ color, size }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={7} r={3} stroke={color} strokeWidth={STROKE_WIDTH} />
      <Circle cx={6.5} cy={16} r={3} stroke={color} strokeWidth={STROKE_WIDTH} />
      <Circle cx={17.5} cy={16} r={3} stroke={color} strokeWidth={STROKE_WIDTH} />
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
