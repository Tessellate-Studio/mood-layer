import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { useMotion } from '@/hooks/useMotion';
import { useSettingsStore } from '@/store/settingsStore';

// The reanimated mock's useReducedMotion returns false, so the OS baseline is
// "motion allowed" and the settings override is what we exercise here.

function Probe() {
  const { reduced } = useMotion();
  return <Text>{reduced ? 'reduced' : 'motion'}</Text>;
}

const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  useSettingsStore.setState(initialSettings, true);
});

describe('useMotion', () => {
  it('follows the system baseline when no override is set', () => {
    useSettingsStore.setState({ reduceMotionOverride: null });
    render(<Probe />);
    expect(screen.getByText('motion')).toBeTruthy();
  });

  it('honours a true override even when the system allows motion', () => {
    useSettingsStore.setState({ reduceMotionOverride: true });
    render(<Probe />);
    expect(screen.getByText('reduced')).toBeTruthy();
  });

  it('honours a false override', () => {
    useSettingsStore.setState({ reduceMotionOverride: false });
    render(<Probe />);
    expect(screen.getByText('motion')).toBeTruthy();
  });
});
