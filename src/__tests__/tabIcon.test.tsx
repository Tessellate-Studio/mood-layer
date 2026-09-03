// The Layers tab's mark wears the same prominent current mood as every other
// drawing of the mark (user, 2026-09-03: "Tab bar icon needs to be
// mood-tinted") — one mood across the app chrome, not brand colours in the
// tab bar and mood colours everywhere else.

import React from 'react';
import { render } from '@testing-library/react-native';
import { Rect } from 'react-native-svg';

import { BRAND_STACK } from '@/components/LogoMark';
import { QuiltIcon } from '@/components/TabIcon';
import { colors, familyPalette } from '@/constants/theme';
import { useCheckInStore } from '@/store/checkInStore';
import type { CheckIn, EmotionFamilyId } from '@/types/models';
import { dayKey } from '@/utils/dates';

const initialCheckIns = useCheckInStore.getState();
beforeEach(() => useCheckInStore.setState(initialCheckIns, true));

function checkIn(id: string, when: Date, families: EmotionFamilyId[]): CheckIn {
  const iso = when.toISOString();
  return {
    id,
    createdAt: iso,
    dayKey: dayKey(iso),
    emotions: families.map((family) => ({ emotionId: `${family}-word`, family, intensity: 2 })),
    resistanceFlags: [],
    source: 'manual',
  };
}

const today = (hour: number, families: EmotionFamilyId[], id: string) => {
  const now = new Date();
  return checkIn(id, new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour), families);
};

/** Band fills in render order (bottom band first), as LogoMark draws them. */
const fills = (tree: ReturnType<typeof render>) =>
  tree.UNSAFE_getAllByType(Rect).map((rect) => rect.props.fill as string);

describe('QuiltIcon', () => {
  it('focused, wears this week’s prominent mood', () => {
    useCheckInStore.setState({ checkIns: [today(9, ['fear'], 'a')] });
    const tree = render(<QuiltIcon color={colors.ink} size={24} focused />);
    // One family this week → every band takes it, as LogoMark pads. The tab
    // wears the vivid register so the selected tab stays the boldest one.
    expect(fills(tree)).toEqual(Array(4).fill(familyPalette.fear.shades[3]));
  });

  it('focused with nothing logged, falls back to the brand stack', () => {
    useCheckInStore.setState({ checkIns: [] });
    const tree = render(<QuiltIcon color={colors.ink} size={24} focused />);
    expect(fills(tree)).toEqual(
      [...BRAND_STACK].reverse().map((family) => familyPalette[family].shades[3])
    );
  });

  it('unfocused, stays the tab bar’s ink line art — colour is never the only signal', () => {
    useCheckInStore.setState({ checkIns: [today(9, ['fear'], 'a')] });
    const tree = render(<QuiltIcon color={colors.inkMuted} size={24} />);
    expect(fills(tree)).toEqual(Array(4).fill('none'));
  });
});
