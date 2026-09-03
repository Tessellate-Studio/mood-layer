// A view's height, measured with onLayout — the one source for anything that
// positions against it (anti-pattern #9: measured, never typed).

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
