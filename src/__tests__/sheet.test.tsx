// Sheet pan-to-dismiss wiring. The Pan gesture's onChange/onEnd run as
// Reanimated worklets on the UI thread, where calling a plain JS function
// (like the onClose prop) is a FATAL UI-runtime error on device — it aborts
// the app outside every JS error boundary, and node can't reproduce it
// (regression #23: collapsing the field-guide helper sheet by dragging down
// crashed the app). So these tests drive the recorded gesture handlers and
// assert the close call is routed through runOnJS — testing the wiring, not
// just the behaviour, per regressions #16/#22.

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
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
