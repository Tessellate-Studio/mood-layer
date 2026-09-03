// ScreenFrame — the one page frame (user, 2026-09-03: extend the Settings /
// field guide / Layers spacing to every screen, empty and filled). The rule
// lives in the component, so these tests state it once instead of per screen.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';

import ScreenFrame, { screenContent } from '@/components/ScreenFrame';
import { colors, spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';

const initialSettings = useSettingsStore.getState();
beforeEach(() => useSettingsStore.setState(initialSettings, true));

const renderFrame = (props: Partial<React.ComponentProps<typeof ScreenFrame>> = {}) =>
  render(
    <ScreenFrame testID="screen-example" header={<Text>Example</Text>} {...props}>
      <View testID="body" />
    </ScreenFrame>
  );

describe('ScreenFrame', () => {
  it('puts the safe-area top and the side gutters on the OUTER frame', () => {
    // Not on the scroller's content: that is what let Circle's and
    // Experiments' titles scroll up under the status bar.
    renderFrame();
    const frame = StyleSheet.flatten(screen.getByTestId('screen-example').props.style);
    // The jest safe-area mock reports 0 insets, so the top is the gap alone.
    expect(frame.paddingTop).toBe(spacing.md);
    expect(frame.paddingHorizontal).toBe(spacing.md);
    expect(frame.backgroundColor).toBe(colors.paper);
    expect(frame.flex).toBe(1);
  });

  it('renders the header outside the body, above it', () => {
    renderFrame();
    const header = screen.getByTestId('screen-example-header');
    expect(within(header).getByText('Example')).toBeTruthy();
    // The body is a sibling of the header, never inside it — that is what
    // keeps the title fixed while the body scrolls.
    expect(within(header).queryByTestId('body')).toBeNull();
    expect(screen.getByTestId('body')).toBeTruthy();
  });

  it('anchors the note under the measured header — no note without a measurement', () => {
    renderFrame({ note: { id: 'note-quilt', family: 'sadness' } });
    const frame = screen.getByTestId('coach-frame-note-quilt');
    // Unmeasured, the note is invisible rather than sitting over the title.
    expect(StyleSheet.flatten(frame.props.style).opacity).toBe(0);
  });

  it('mounts no note when the screen does not ask for one', () => {
    renderFrame();
    expect(screen.queryByTestId('coach-note-quilt')).toBeNull();
  });

  it('gives every scroller the same bottom, empty or full', () => {
    expect(StyleSheet.flatten(screenContent).paddingBottom).toBe(spacing.xl);
  });
});
