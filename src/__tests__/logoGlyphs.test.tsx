// The one-colour drawings of the mark — the Quilt tab icon and the closing
// LogoDivider — share LogoMark's four-band geometry, so the tab, the divider,
// the in-app mark and the launcher icon are one shape (user, 2026-09-03: "it
// needs to be 4 bands too").

import React from 'react';
import { render } from '@testing-library/react-native';
import { Rect } from 'react-native-svg';

import LogoDivider from '@/components/LogoDivider';
import { BRAND_STACK, LOGO_BANDS } from '@/components/LogoMark';
import { QuiltIcon } from '@/components/TabIcon';
import { colors, familyPalette } from '@/constants/theme';

const rects = (tree: ReturnType<typeof render>) => tree.UNSAFE_getAllByType(Rect);

describe('mono drawings of the mark', () => {
  it('Quilt tab icon draws the four logo bands, outlined at rest', () => {
    const tree = render(<QuiltIcon color={colors.inkFaint} size={24} />);
    const bands = rects(tree);
    expect(bands).toHaveLength(LOGO_BANDS.length);
    bands.forEach((rect, i) => {
      expect(rect.props.x).toBe(LOGO_BANDS[i].x);
      expect(rect.props.width).toBe(LOGO_BANDS[i].w);
      expect(rect.props.fill).toBe('none');
      expect(rect.props.stroke).toBe(colors.inkFaint);
    });
  });

  it('Quilt tab icon wears the brand stack when focused', () => {
    const tree = render(<QuiltIcon color={colors.ink} size={24} focused />);
    rects(tree).forEach((rect, i) => {
      expect(rect.props.fill).toBe(familyPalette[BRAND_STACK[i]].shades[3]);
      expect(rect.props.stroke).toBe(familyPalette[BRAND_STACK[i]].vivid);
    });
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
