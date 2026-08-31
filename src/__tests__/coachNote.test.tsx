// First-visit helper notes: soft floating cards that show once per install
// (settingsStore.dismissedTips) and dismiss on tap. Animated values are not
// asserted — the hand-rolled reanimated mock collapses timing to immediates —
// only presence and store effects.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { StyleSheet } from 'react-native';

import CoachNote from '@/components/CoachNote';
import { colors, mutedPalette, shadows } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';

const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  useSettingsStore.setState(initialSettings, true);
});

describe('CoachNote', () => {
  it('mounts only after the entry beat, then shows its copy', async () => {
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    // Nothing during the beat — an invisible mounted card would still be
    // hit-testable and could swallow a tap into a permanent dismissal.
    expect(screen.queryByTestId('coach-note-quilt')).toBeNull();
    expect(await screen.findByTestId('coach-note-quilt')).toBeTruthy();
    expect(screen.getByText(/Each layer here is a check-in/)).toBeTruthy();
  });

  it('tap dismisses persistently — gone on the next render', async () => {
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    fireEvent.press(await screen.findByTestId('coach-dismiss-note-quilt'));
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

  it('is an OPAQUE raised card with its family border and a real shadow', async () => {
    // The paperVeil card (94% cream, no elevation cue) was invisible as an
    // object but visible as damage — it silently veiled the home screen's
    // day labels (regression log #24). Opaque + shadowed by contract.
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    const card = await screen.findByTestId('coach-dismiss-note-quilt');
    const flat = StyleSheet.flatten(card.props.style);
    expect(flat.backgroundColor).toBe(colors.paperRaised);
    expect(String(flat.backgroundColor)).not.toContain('rgba');
    expect(flat.borderColor).toBe(mutedPalette.sadness.border);
    expect(flat.elevation).toBe(shadows.floating.elevation);
  });

  it('carries the overline and the quiet dismiss hint', async () => {
    render(<CoachNote id="note-quilt" topOffset={0} family="sadness" />);
    await screen.findByTestId('coach-note-quilt');
    expect(screen.getByText('First visit')).toBeTruthy();
    expect(screen.getByText('Tap to dismiss')).toBeTruthy();
  });
});
