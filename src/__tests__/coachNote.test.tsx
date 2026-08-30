// First-visit helper notes: soft floating cards that show once per install
// (settingsStore.dismissedTips) and dismiss on tap. Animated values are not
// asserted — the hand-rolled reanimated mock collapses timing to immediates —
// only presence and store effects.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import CoachNote from '@/components/CoachNote';
import { useSettingsStore } from '@/store/settingsStore';

const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  useSettingsStore.setState(initialSettings, true);
});

describe('CoachNote', () => {
  it('renders its copy when not yet dismissed', () => {
    render(<CoachNote id="note-quilt" pointer="up" />);
    expect(screen.getByTestId('coach-note-quilt')).toBeTruthy();
    expect(screen.getByText(/Each layer here is a check-in/)).toBeTruthy();
  });

  it('tap dismisses persistently — gone on the next render', () => {
    render(<CoachNote id="note-quilt" />);
    fireEvent.press(screen.getByTestId('coach-dismiss-note-quilt'));
    expect(useSettingsStore.getState().dismissedTips).toContain('note-quilt');
    expect(screen.queryByTestId('coach-note-quilt')).toBeNull();
  });

  it('renders nothing when already dismissed', () => {
    useSettingsStore.setState({ dismissedTips: ['note-circle'] });
    render(<CoachNote id="note-circle" />);
    expect(screen.queryByTestId('coach-note-circle')).toBeNull();
  });

  it('still shows under reduce-motion (snap to rest, no fade)', () => {
    useSettingsStore.setState({ reduceMotionOverride: true });
    render(<CoachNote id="note-insights" />);
    expect(screen.getByTestId('coach-note-insights')).toBeTruthy();
  });
});
