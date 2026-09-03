// The one ✕ this app draws — the modal header's close, and the dismiss on a
// floating note. Same geometry and weight everywhere; only the ink changes,
// so a note's ✕ can wear its family accent (per-family `accent` is the one
// place colour is allowed to carry meaning) while the header's stays ink.

import React from 'react';
import Svg, { Line } from 'react-native-svg';

import { colors } from '@/constants/theme';

interface Props {
  /** Stroke colour — ink by default; a note passes its family accent. */
  color?: string;
  size?: number;
}

export function CloseGlyph({ color = colors.ink, size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Line x1={4} y1={4} x2={16} y2={16} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={16} y1={4} x2={4} y2={16} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export default CloseGlyph;
