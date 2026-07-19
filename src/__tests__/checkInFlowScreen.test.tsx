// P8 — check-in flow screen. Step logic is covered in checkInFlow.test.ts;
// these tests assert the rendered wiring: chips gate Continue, a full walk
// writes one check-in to the store, and the name-it variant differs.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import CheckInFlowScreen from '@/screens/CheckInFlowScreen';
import { useCheckInStore } from '@/store/checkInStore';
import { useSettingsStore } from '@/store/settingsStore';

// Mutable route params — flipped per test to exercise manual vs name-it.
let mockParams: { source: 'manual' | 'name-it' } = { source: 'manual' };
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({ params: mockParams }),
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
}));

const initialCheckIns = useCheckInStore.getState();
const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  mockParams = { source: 'manual' };
  mockGoBack.mockClear();
  useCheckInStore.setState(initialCheckIns, true);
  useSettingsStore.setState(initialSettings, true);
});

const renderScreen = () =>
  render(
    <NavigationContainer>
      <CheckInFlowScreen />
    </NavigationContainer>
  );

describe('CheckInFlowScreen', () => {
  it('starts with families folded and unfolds one at a time', () => {
    renderScreen();
    // No word chips visible until a family is opened — the folded list is the
    // calm default (user feedback 2026-07-13: nine open families overwhelm).
    expect(screen.queryByTestId('chip-sad')).toBeNull();
    fireEvent.press(screen.getByTestId('family-sadness'));
    expect(screen.getByTestId('chip-sad')).toBeTruthy();
    // Opening another family folds the first.
    fireEvent.press(screen.getByTestId('family-anger'));
    expect(screen.getByTestId('chip-irritated')).toBeTruthy();
    expect(screen.queryByTestId('chip-down')).toBeNull();
  });

  it('offers the FULL vocabulary, with the temperature dial on the word', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('family-sadness'));
    // 'heartbroken' lives only in EXTENDED_VOCABULARY — reachable behind the
    // family's "+ more words" unfold (rebalance, 2026-07-17).
    fireEvent.press(screen.getByTestId('chip-more-sadness'));
    fireEvent.press(screen.getByTestId('chip-heartbroken'));
    // Selecting unfolds the word's own four-swatch dial right there — no
    // separate intensity step (temperature-chip design).
    fireEvent.press(screen.getByTestId('dial-heartbroken-4'));
    fireEvent.press(screen.getByTestId('flow-next')); // → body
    fireEvent.press(screen.getByTestId('flow-skip')); // → resistance
    fireEvent.press(screen.getByTestId('flow-skip')); // → note
    fireEvent.press(screen.getByTestId('flow-skip')); // → stitch
    fireEvent.press(screen.getByTestId('flow-stitch'));
    expect(useCheckInStore.getState().checkIns[0].emotions).toEqual([
      { emotionId: 'heartbroken', family: 'sadness', intensity: 4 },
    ]);
  });

  it('keeps a chosen word pinned (with its dial) when its family folds', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('family-sadness'));
    fireEvent.press(screen.getByTestId('chip-sad'));
    fireEvent.press(screen.getByTestId('family-anger'));
    // 'sad' is selected, so its temperature row stays visible under its
    // folded family; its unselected siblings do not.
    expect(screen.getByTestId('chip-picked-sad')).toBeTruthy();
    expect(screen.getByTestId('dial-sad-2')).toBeTruthy();
    expect(screen.queryByTestId('chip-down')).toBeNull();
  });

  it('keeps Continue disabled until an emotion is chosen AND weighed', () => {
    renderScreen();
    expect(screen.getByTestId('flow-next').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByTestId('family-sadness'));
    fireEvent.press(screen.getByTestId('chip-sad'));
    // Named but unweighed: still blocked, with a gentle hint (no default
    // temperatures — user, 2026-07-17).
    expect(screen.getByTestId('flow-next').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('temperature-continue-hint')).toBeTruthy();
    fireEvent.press(screen.getByTestId('dial-sad-1'));
    expect(screen.getByTestId('flow-next').props.accessibilityState.disabled).toBe(false);
    expect(screen.queryByTestId('temperature-continue-hint')).toBeNull();
  });

  it('walks feel → stitch and writes one check-in with the right emotion', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('family-sadness'));
    fireEvent.press(screen.getByTestId('chip-sad'));
    fireEvent.press(screen.getByTestId('dial-sad-3')); // temperature, inline on feel
    fireEvent.press(screen.getByTestId('flow-next')); // → body
    fireEvent.press(screen.getByTestId('flow-skip')); // skip body → resistance
    fireEvent.press(screen.getByTestId('flow-skip')); // skip resistance → note
    fireEvent.press(screen.getByTestId('flow-skip')); // skip note → stitch
    fireEvent.press(screen.getByTestId('flow-stitch'));

    const { checkIns } = useCheckInStore.getState();
    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].emotions).toEqual([{ emotionId: 'sad', family: 'sadness', intensity: 3 }]);
    expect(checkIns[0].source).toBe('manual');
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows the name-it heading and a finish-early affordance', () => {
    mockParams = { source: 'name-it' };
    renderScreen();
    expect(screen.getByText('Can you name it?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('family-fear'));
    fireEvent.press(screen.getByTestId('chip-afraid'));
    fireEvent.press(screen.getByTestId('dial-afraid-2')); // weigh it (required)
    fireEvent.press(screen.getByTestId('flow-next')); // → body
    // From body, a name-it flow can finish early straight to stitch.
    expect(screen.getByTestId('flow-finish-early')).toBeTruthy();
    fireEvent.press(screen.getByTestId('flow-finish-early'));
    fireEvent.press(screen.getByTestId('flow-stitch'));
    expect(useCheckInStore.getState().checkIns[0].source).toBe('name-it');
  });
});
