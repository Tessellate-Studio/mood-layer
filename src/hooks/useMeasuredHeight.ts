// The one way a screen tells a floating element how tall the thing it sits
// under is: measure it. A typed number that equals the header's height at
// today's type scale drifts on the next +1px commit, a wrapped title, or a
// larger system font — and drifts per screen (anti-pattern #9, 2026-09-03).

import React from 'react';
import type { LayoutChangeEvent } from 'react-native';

/** `[height, onLayout]` — attach `onLayout` to the view whose height you need. */
export function useMeasuredHeight(): readonly [number, (event: LayoutChangeEvent) => void] {
  const [height, setHeight] = React.useState(0);
  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height),
    []
  );
  return [height, onLayout] as const;
}
