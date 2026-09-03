// useNowOnFocus — a Date that moves with focus, so date-keyed screens roll
// over without a data change. Focus itself is exercised by the screen tests
// (a bare NavigationContainer focuses on mount).

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { renderHook } from '@testing-library/react-native';

import { useNowOnFocus } from '@/hooks/useNowOnFocus';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

describe('useNowOnFocus', () => {
  it('yields the current time on mount', () => {
    const before = Date.now();
    const { result } = renderHook(() => useNowOnFocus(), { wrapper });
    expect(result.current).toBeInstanceOf(Date);
    expect(result.current.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.current.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
