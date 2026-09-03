// useMeasuredHeight — the one way a screen tells CoachNote how tall its header
// is. Measured with onLayout, never typed (user, 2026-09-03: the note sat above
// the header on one screen and below it on another because each screen
// carried its own hand-tuned number).

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

  it('hands back a stable onLayout so it never churns the header’s props', () => {
    const { result, rerender } = renderHook(() => useMeasuredHeight());
    const first = result.current[1];
    rerender({});
    expect(result.current[1]).toBe(first);
  });
});
