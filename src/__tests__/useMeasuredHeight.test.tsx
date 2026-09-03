// useMeasuredHeight — a view's height from onLayout (anti-pattern #9).

import type { LayoutChangeEvent } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { useMeasuredHeight } from '@/hooks/useMeasuredHeight';

const layoutEvent = (height: number) =>
  ({ nativeEvent: { layout: { x: 0, y: 0, width: 320, height } } }) as LayoutChangeEvent;

describe('useMeasuredHeight', () => {
  it('starts at 0 and follows the measured layout', () => {
    const { result } = renderHook(() => useMeasuredHeight());
    expect(result.current[0]).toBe(0);
    act(() => result.current[1](layoutEvent(80)));
    expect(result.current[0]).toBe(80);
    act(() => result.current[1](layoutEvent(92)));
    expect(result.current[0]).toBe(92);
  });
});
