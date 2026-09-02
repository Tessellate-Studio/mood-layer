// First-visit helper notes: a tinted note card over a dimmed page, shown once
// per install (settingsStore.dismissedTips), dismissed by a tap on the card
// OR the dim. Animated values are not asserted — the hand-rolled reanimated
// mock collapses timing to immediates — only presence, styling contract, and
// store effects.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { StyleSheet } from 'react-native';

import CoachNote from '@/components/CoachNote';
import { COACH_NOTE_DISMISS_HINT, COACH_NOTE_OVERLINE } from '@/content/coachMarks';
import { colors, mutedPalette, shadows } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';

const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  useSettingsStore.setState(initialSettings, true);
});

describe('CoachNote', () => {
  it('is there with the screen — no entry beat, so nothing arrives late or patchy', () => {
    // The beat-then-fade card arrived a moment after the page and looked
    // patchy while its shadow faded in (user, 2026-09-02). Synchronous now.
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    expect(screen.getByTestId('coach-note-quilt')).toBeTruthy();
    expect(screen.getByText(/Each layer here is a check-in/)).toBeTruthy();
  });

  it('tap on the card dismisses persistently — gone on the next render', () => {
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    fireEvent.press(screen.getByTestId('coach-dismiss-note-quilt'));
    expect(useSettingsStore.getState().dismissedTips).toContain('note-quilt');
    expect(screen.queryByTestId('coach-note-quilt')).toBeNull();
  });

  it('tap on the dim dismisses too — the whole screen is the dismiss target', () => {
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    fireEvent.press(screen.getByTestId('coach-scrim-note-quilt'));
    expect(useSettingsStore.getState().dismissedTips).toContain('note-quilt');
    expect(screen.queryByTestId('coach-note-quilt')).toBeNull();
  });

  it('renders nothing when already dismissed', () => {
    useSettingsStore.setState({ dismissedTips: ['note-circle'] });
    render(<CoachNote id="note-circle" topOffset={0} family="disgust" />);
    expect(screen.queryByTestId('coach-note-circle')).toBeNull();
  });

  it('still shows under reduce-motion (snap to rest, no fade)', () => {
    useSettingsStore.setState({ reduceMotionOverride: true });
    render(<CoachNote id="note-insights" topOffset={0} family="enjoyment" />);
    expect(screen.getByTestId('coach-note-insights')).toBeTruthy();
  });

  it('is an OPAQUE tinted note with its family border and a real shadow, over a dim', () => {
    // The paperVeil card (94% cream, no elevation cue) was invisible as an
    // object but visible as damage (regression log #24); and a cream card on
    // cream words was just more page (user, 2026-09-02). Tinted, opaque,
    // shadowed, dimmed behind — by contract.
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    const card = StyleSheet.flatten(screen.getByTestId('coach-dismiss-note-quilt').props.style);
    expect(card.backgroundColor).toBe(mutedPalette.sadness.fill);
    expect(String(card.backgroundColor)).not.toContain('rgba');
    expect(card.borderColor).toBe(mutedPalette.sadness.border);
    expect(card.elevation).toBe(shadows.floating.elevation);
    // The dim is the sheet backdrop's scrim — one grammar for anything that
    // owns the screen for a moment.
    const dim = StyleSheet.flatten(screen.getByTestId('coach-dim-note-quilt').props.style);
    expect(dim.backgroundColor).toBe(colors.scrim);
  });

  it('carries the overline and the quiet dismiss hint', () => {
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    expect(screen.getByText(COACH_NOTE_OVERLINE)).toBeTruthy();
    expect(screen.getByText(COACH_NOTE_DISMISS_HINT)).toBeTruthy();
  });
});
