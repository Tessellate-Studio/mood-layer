// The one-colour drawings of the mark — the Quilt tab icon and the closing
// LogoDivider — share LogoMark's four-band geometry, so the tab, the divider,
// the in-app mark and the launcher icon are one shape (user, 2026-09-03: "it
// needs to be 4 bands too").

import React from 'react';
import { render } from '@testing-library/react-native';
import { Rect } from 'react-native-svg';

import LogoDivider from '@/components/LogoDivider';
import LogoMark, { BRAND_STACK, LOGO_BANDS } from '@/components/LogoMark';
import { QuiltIcon } from '@/components/TabIcon';
import { colors, familyPalette } from '@/constants/theme';

const rects = (tree: ReturnType<typeof render>) => tree.UNSAFE_getAllByType(Rect);

describe('mono drawings of the mark', () => {
  it('Quilt tab icon draws the four logo bands, outlined at rest', () => {
    const tree = render(<QuiltIcon color={colors.inkFaint} size={24} />);
    const bands = rects(tree);
    expect(bands).toHaveLength(LOGO_BANDS.length);
    // Order-agnostic: LogoMark paints bottom-band-first so each band overlaps
    // the one beneath it. What matters here is that all four bands are drawn,
    // to the icon's geometry, in the tab bar's ink.
    const drawn = bands.map((rect) => ({ x: rect.props.x, w: rect.props.width }));
    expect(drawn).toEqual(
      expect.arrayContaining(LOGO_BANDS.map((band) => ({ x: band.x, w: band.w })))
    );
    bands.forEach((rect) => {
      expect(rect.props.fill).toBe('none');
      expect(rect.props.stroke).toBe(colors.inkFaint);
    });
  });

  it('Quilt tab icon is LogoMark itself — the tab and the in-page mark are one drawing', () => {
    // Which families it wears when focused is the mood rule, covered in
    // tabIcon.test.tsx; this file is about every drawing being one shape.
    const tab = rects(render(<QuiltIcon color={colors.ink} size={24} focused />));
    const mark = rects(render(<LogoMark size={24} />));
    expect(tab.map((r) => [r.props.x, r.props.y, r.props.width, r.props.height])).toEqual(
      mark.map((r) => [r.props.x, r.props.y, r.props.width, r.props.height])
    );
  });

  it('LogoDivider draws the same four bands, ink fading down the stack', () => {
    const tree = render(<LogoDivider />);
    const bands = rects(tree);
    expect(bands).toHaveLength(LOGO_BANDS.length);
    expect(bands.map((r) => r.props.stroke)).toEqual([
      colors.ink,
      colors.inkSoft,
      colors.inkMuted,
      colors.inkFaint,
    ]);
    bands.forEach((rect, i) => expect(rect.props.y).toBe(LOGO_BANDS[i].y));
  });
});
