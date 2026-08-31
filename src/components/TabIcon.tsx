// Tab bar icons — line art drawn inline with react-native-svg. Unfocused they
// stay monochrome (the tab bar's inactive tint). FOCUSED, each icon's three
// elements wear the brand stack's three family hues (anger rose / enjoyment
// amber / sadness blue — the same trio as the launcher mark), so the active
// tab is unmistakable at a glance (user, 2026-07-18: the highlight alone was
// too quiet). The label keeps the ink active tint, so colour is never the
// only signal (WCAG 1.4.1).

import React from 'react';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { familyPalette } from '@/constants/theme';
import type { EmotionFamilyId } from '@/types/models';

export interface TabIconProps {
  color: string;
  size: number;
  focused?: boolean;
}

const STROKE_WIDTH = 1.5;

// The launcher mark's trio, top band first. Strokes use the VIVID tones —
// the muted threads read as grey at this size, which left Experiments and
// Insights looking unselected (user, 2026-07-18).
const BRAND_TRIO: EmotionFamilyId[] = ['anger', 'enjoyment', 'sadness'];
const trioFill = (i: number) => familyPalette[BRAND_TRIO[i]].shades[3];
const trioStroke = (i: number) => familyPalette[BRAND_TRIO[i]].vivid;
/** Focused line-work is drawn a touch heavier so the colour has body. */
const FOCUS_STROKE_WIDTH = 2.1;

// The app mark's three stacked bands — matches the logo handoff's
// icon_mono.svg (240-unit viewBox).
const MONO_BANDS = [
  { x: 75, y: 51, w: 90, h: 46 },
  { x: 66, y: 89, w: 108, h: 46 },
  { x: 58, y: 127, w: 124, h: 46 },
];

/** The app mark: outlined bands at rest, the three-hue stack when focused. */
export function QuiltIcon({ color, size, focused }: TabIconProps) {
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
          fill={focused ? trioFill(i) : 'none'}
          stroke={focused ? trioStroke(i) : color}
          strokeWidth={8}
        />
      ))}
    </Svg>
  );
}

/** Hand-drawn asterisk — its three strokes take the trio when focused. */
export function ExperimentsIcon({ color, size, focused }: TabIconProps) {
  const stroke = (i: number) => (focused ? trioStroke(i) : color);
  const width = focused ? FOCUS_STROKE_WIDTH : STROKE_WIDTH;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={12} y1={4} x2={12} y2={20} stroke={stroke(0)} strokeWidth={width} strokeLinecap="round" />
      <Line x1={5.1} y1={8} x2={18.9} y2={16} stroke={stroke(1)} strokeWidth={width} strokeLinecap="round" />
      <Line x1={18.9} y1={8} x2={5.1} y2={16} stroke={stroke(2)} strokeWidth={width} strokeLinecap="round" />
    </Svg>
  );
}

/** Three small rings — each person takes one of the trio when focused. */
export function CircleIcon({ color, size, focused }: TabIconProps) {
  const rings = [
    { cx: 12, cy: 7 },
    { cx: 6.5, cy: 16 },
    { cx: 17.5, cy: 16 },
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {rings.map((ring, i) => (
        <Circle
          key={i}
          cx={ring.cx}
          cy={ring.cy}
          r={3}
          fill={focused ? trioFill(i) : 'none'}
          stroke={focused ? trioStroke(i) : color}
          strokeWidth={STROKE_WIDTH}
        />
      ))}
    </Svg>
  );
}

/** Three ascending stitch lines — one hue per line when focused. */
export function InsightsIcon({ color, size, focused }: TabIconProps) {
  const rows = [
    { y: 18, x2: 19 },
    { y: 12, x2: 16 },
    { y: 6, x2: 13 },
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {rows.map((row, i) => (
        <Line
          key={i}
          x1={5}
          y1={row.y}
          x2={row.x2}
          y2={row.y}
          stroke={focused ? trioStroke(i) : color}
          strokeWidth={focused ? FOCUS_STROKE_WIDTH : STROKE_WIDTH}
        />
      ))}
    </Svg>
  );
}
