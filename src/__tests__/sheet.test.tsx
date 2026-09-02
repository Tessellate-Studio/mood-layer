// Sheet pan-to-dismiss wiring. The Pan gesture's onChange/onEnd run as
// Reanimated worklets on the UI thread, where calling a plain JS function
// (like the onClose prop) is a FATAL UI-runtime error on device — it aborts
// the app outside every JS error boundary, and node can't reproduce it
// (regression #23: collapsing the field-guide helper sheet by dragging down
// crashed the app). So these tests drive the recorded gesture handlers and
// assert the close call is routed through runOnJS — testing the wiring, not
// just the behaviour, per regressions #16/#22.

import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import { runOnJS } from 'react-native-reanimated';
import * as GestureHandler from 'react-native-gesture-handler';

import { Sheet } from '@/components/Sheet';

// Recorded by the jest.setup.js mock, keyed by the GestureDetector child's testID.
const { __capturedGestures } = GestureHandler as unknown as {
  __capturedGestures: Map<
    string,
    { handlers: { onChange(e: { changeY: number }): void; onEnd(): void } }
  >;
};

function renderSheet(onClose: jest.Mock) {
  render(
    <Sheet visible onClose={onClose} testID="sheet-under-test">
      <Text>body</Text>
    </Sheet>
  );
  return __capturedGestures.get('sheet-under-test')!;
}

describe('Sheet pan-to-dismiss', () => {
  beforeEach(() => {
    __capturedGestures.clear();
    (runOnJS as unknown as jest.Mock).mockClear();
  });

  it('a release past the dismiss threshold closes the sheet — via runOnJS, never a direct worklet call', () => {
    const onClose = jest.fn();
    const pan = renderSheet(onClose);

    pan.handlers.onChange({ changeY: 120 }); // past DISMISS_THRESHOLD (80)
    pan.handlers.onEnd();

    expect(onClose).toHaveBeenCalledTimes(1);
    // The wiring is the point: a direct onClose() call also passes the line
    // above under jest, but crashes the app on the device's UI thread.
    expect(runOnJS).toHaveBeenCalledWith(onClose);
  });

  it('a release short of the threshold springs back without closing', () => {
    const onClose = jest.fn();
    const pan = renderSheet(onClose);

    pan.handlers.onChange({ changeY: 40 });
    pan.handlers.onEnd();

    expect(onClose).not.toHaveBeenCalled();
  });
});

// A pan that works is useless if there is nothing to grab: the sheet's body is
// a ScrollView, so a drag started on it scrolls instead of dismissing, and a
// 4px handle bar is not a target (device feedback 2026-09-02 — "I can't
// collapse the card by dragging the top area"). The grab area is the fix: a
// full-width, hit-target-tall strip OUTSIDE the scrolling child.
// A native Modal is its own window on Android: RNGH's touch interceptor is
// registered by the GestureHandlerRootView that wraps a view tree, and
// App.tsx's root view is in a different window. The pan inside was wired,
// tested (above) — and dead under a real finger (regression #28). The sheet
// has to carry its own root view, INSIDE the Modal.
describe('Sheet gesture root', () => {
  it('wraps the Modal content in its own GestureHandlerRootView', () => {
    render(
      <Sheet visible onClose={() => {}} testID="sheet-under-test">
        <Text>body</Text>
      </Sheet>
    );
    const root = screen.getByTestId('sheet-under-test-gesture-root');
    // The sheet (and so its GestureDetector) lives inside that root view.
    expect(within(root).getByTestId('sheet-under-test')).toBeTruthy();
  });
});

describe('Sheet grab area', () => {
  beforeEach(() => __capturedGestures.clear());

  it('gives the top of the sheet a full touch target to drag, above the scroll', () => {
    render(
      <Sheet visible onClose={() => {}} title="Disgust" testID="sheet-under-test">
        <ScrollView>
          <Text>body</Text>
        </ScrollView>
      </Sheet>
    );

    const grab = screen.getByTestId('sheet-under-test-grab');
    expect(StyleSheet.flatten(grab.props.style).minHeight).toBeGreaterThanOrEqual(44);
    // The title belongs to the grab area, not the scroll — that is what makes
    // "drag the top of the card" work at all.
    expect(within(grab).getByText('Disgust')).toBeTruthy();
  });
});
