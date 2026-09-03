// LogoMark: the stacked-strata app mark, drawn inline from theme tokens so it
// can be mood-tinted (the logo-handoff variants swap which families stack).
// Four bands since 2026-09-02, matching the installed launcher icon.

import React from 'react';
import { render } from '@testing-library/react-native';

import { Rect } from 'react-native-svg';

import LogoMark, { LOGO_BANDS } from '@/components/LogoMark';
import { familyPalette } from '@/constants/theme';

/** Every band's fill, in render order (bottom band first). react-native-svg
 *  is real here (not mocked) and turns colours into native payloads on the
 *  host view, so read the prop off the Rect element itself. */
const fills = (tree: ReturnType<typeof render>) =>
  tree.UNSAFE_getAllByType(Rect).map((rect) => rect.props.fill as string);

describe('LogoMark', () => {
  it('is four bands, each overlapping the one below, same shape as the icon', () => {
    expect(LOGO_BANDS).toHaveLength(4);
    for (let i = 1; i < LOGO_BANDS.length; i += 1) {
      const above = LOGO_BANDS[i - 1];
      const below = LOGO_BANDS[i];
      // Widening downward, centred, and overlapping by 16 units.
      expect(below.w).toBeGreaterThan(above.w);
      expect(below.x + below.w / 2).toBe(120);
      expect(above.y + above.h - below.y).toBe(16);
    }
  });

  it('renders the fixed brand stack by default — amber, rose, mauve, blue', () => {
    const tree = render(<LogoMark />);
    expect(fills(tree)).toEqual([
      familyPalette.sadness.shades[4],
      familyPalette.contempt.shades[4],
      familyPalette.anger.shades[4],
      familyPalette.enjoyment.shades[4],
    ]);
  });

  it('renders a mood-tinted stack, padding short lists to four bands', () => {
    const one = render(<LogoMark families={['fear']} />);
    expect(fills(one)).toEqual(Array(4).fill(familyPalette.fear.shades[4]));
    const three = render(<LogoMark families={['sadness', 'enjoyment', 'fear']} size={40} />);
    // Three named, the fourth (bottom) band repeats the dominant first.
    expect(fills(three)).toEqual([
      familyPalette.sadness.shades[4],
      familyPalette.fear.shades[4],
      familyPalette.enjoyment.shades[4],
      familyPalette.sadness.shades[4],
    ]);
  });
});
