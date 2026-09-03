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

/** The brand stack, top band first — shared with the Quilt tab's focused mark. */
export const BRAND_STACK: EmotionFamilyId[] = ['enjoyment', 'anger', 'contempt', 'sadness'];

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
  /**
   * How the bands are painted:
   *   'cloth' — translucent pastel, the mark on a page (default).
   *   'vivid' — opaque, saturated thread: the tab bar's FOCUSED mark. At
   *             24px the cloth register sank below the unfocused icons' ink
   *             and the selected tab read as the faintest one.
   *   'ink'   — bare outlines in `ink`, what the tab bar wears at rest, so
   *             resting and focused are one drawing rather than two.
   */
  register?: 'cloth' | 'vivid' | 'ink';
  /** The line colour for the 'ink' register. */
  ink?: string;
  /** Line weight; the default suits the in-page mark, a tab icon needs more. */
  strokeWidth?: number;
}

export default function LogoMark({
  families,
  size = 56,
  register = 'cloth',
  ink,
  strokeWidth = 1.6,
}: Props) {
  const stack = families && families.length > 0 ? families : BRAND_STACK;
  // Resolved once: the three registers are alternatives, so a band cannot be
  // painted half one way and half another.
  const paint = (palette: (typeof familyPalette)[EmotionFamilyId]) => {
    if (register === 'ink') return { fill: 'none', stroke: ink } as const;
    if (register === 'vivid') return { fill: palette.shades[3], stroke: palette.vivid } as const;
    return {
      fill: palette.shades[4],
      fillOpacity: 0.82,
      stroke: palette.thread,
      strokeOpacity: 0.6,
    } as const;
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} fill="none">
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
            strokeWidth={strokeWidth}
            {...paint(palette)}
          />
        );
      })}
    </Svg>
  );
}
