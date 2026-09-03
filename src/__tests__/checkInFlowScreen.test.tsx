// P8 — check-in flow screen. Step logic is covered in checkInFlow.test.ts;
// these tests assert the rendered wiring: chips gate Continue, a full walk
// writes one check-in to the store, and the name-it variant differs.

import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import { motion, typography } from '@/constants/theme';
import { CHECK_IN_COPY, FEEL_NOTE_LOG_LIMIT } from '@/content/checkInCopy';
import CheckInFlowScreen from '@/screens/CheckInFlowScreen';
import { useCheckInStore } from '@/store/checkInStore';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import { useSettingsStore } from '@/store/settingsStore';

// Mutable route params — flipped per test to exercise manual vs name-it.
let mockParams: { source: 'manual' | 'name-it' } = { source: 'manual' };
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({ params: mockParams }),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
}));

const initialCheckIns = useCheckInStore.getState();
const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  mockParams = { source: 'manual' };
  mockGoBack.mockClear();
  mockNavigate.mockClear();
  useCheckInStore.setState(initialCheckIns, true);
  useSettingsStore.setState(initialSettings, true);
  useHelperSheetStore.setState({ family: null });
});

const renderScreen = () =>
  render(
    <NavigationContainer>
      <CheckInFlowScreen />
    </NavigationContainer>
  );

describe('CheckInFlowScreen', () => {
  it('sets the hints the reader has to read in body size, never caption (user, 2026-09-03: "too tiny")', () => {
    // Rule: reading text is never below `body`; `caption` is for metadata
    // (timestamps, counts, legends). The feel-step hint and the "set a
    // temperature to continue" hint are read to proceed, so they are body.
    renderScreen();
    const feelHint = screen.getByText(CHECK_IN_COPY.feelHint);
    expect(StyleSheet.flatten(feelHint.props.style).fontSize).toBeGreaterThanOrEqual(
      typography.body.fontSize
    );
    fireEvent.press(screen.getByTestId('family-sadness'));
    fireEvent.press(screen.getByTestId('chip-sad'));
    const continueHint = screen.getByTestId('temperature-continue-hint');
    expect(StyleSheet.flatten(continueHint.props.style).fontSize).toBeGreaterThanOrEqual(
      typography.body.fontSize
    );
  });

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

  it('floats the why-is-Continue-grey hint over the flow, and never eats a tap', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('family-sadness'));
    fireEvent.press(screen.getByTestId('chip-sad'));

    const float = screen.getByTestId('feel-hint-float');
    // In the layout flow it read as one more paragraph and stole height from
    // the words; as an overlay it must not block the chips underneath.
    expect(StyleSheet.flatten(float.props.style).position).toBe('absolute');
    expect(float.props.pointerEvents).toBe('none');
    // Still tappable underneath: the dial that answers this hint.
    fireEvent.press(screen.getByTestId('dial-sad-1'));
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

  it('invites a second word once the first is weighed, then steps back', () => {
    renderScreen();
    expect(screen.queryByTestId('add-another-hint')).toBeNull();
    fireEvent.press(screen.getByTestId('family-sadness'));
    fireEvent.press(screen.getByTestId('chip-sad'));
    // Unweighed: the temperature hint owns the slot, not the invitation.
    expect(screen.getByTestId('temperature-continue-hint')).toBeTruthy();
    expect(screen.queryByTestId('add-another-hint')).toBeNull();
    fireEvent.press(screen.getByTestId('dial-sad-2'));
    expect(screen.getByTestId('add-another-hint')).toBeTruthy();
    // A second word means the invitation has done its job.
    fireEvent.press(screen.getByTestId('chip-hurt'));
    expect(screen.queryByTestId('add-another-hint')).toBeNull();
  });

  it('long-pressing any word chip opens its family helper sheet', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('family-sadness'));
    fireEvent(screen.getByTestId('chip-sad'), 'longPress');
    expect(useHelperSheetStore.getState().family).toBe('sadness');
  });

  it('long-pressing an underneath-panel chip opens that family helper too', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('chip-stressed')); // masking → panel
    fireEvent(screen.getByTestId('chip-under-uneasy'), 'longPress');
    expect(useHelperSheetStore.getState().family).toBe('fear');
  });

  it("long-pressing a masking chip reveals its underneath panel — 'any word' means any", () => {
    renderScreen();
    // What a cover word carries is its own prompt + families, so hold opens
    // the panel (never a single family's sheet, which would read as a
    // diagnosis for hedged covers like 'Fine').
    fireEvent(screen.getByTestId('chip-guilty'), 'longPress');
    expect(screen.getByTestId('underneath-guilty')).toBeTruthy();
    // Holding again never deselects — the gesture teaches, it doesn't toggle.
    fireEvent(screen.getByTestId('chip-guilty'), 'longPress');
    expect(screen.getByTestId('underneath-guilty')).toBeTruthy();
  });

  it('links to the field guide through the same doorway the empty home shows', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('checkin-field-guide-link'));
    // Pushed above the modal — the in-progress check-in survives underneath.
    expect(mockNavigate).toHaveBeenCalledWith('FieldGuide');
  });

  it('teaches hold-to-learn and "+ more words" as a note when a family unfolds', () => {
    renderScreen();
    // Nothing unfolded: no lesson, no permanent "Hold any word" line either
    // (it moved into the note — user, 2026-09-02).
    expect(screen.queryByTestId('explore-note')).toBeNull();
    expect(screen.queryByTestId('feel-hold-hint')).toBeNull();
    fireEvent.press(screen.getByTestId('family-sadness'));
    expect(screen.getByTestId('explore-note')).toBeTruthy();
    // Choosing a word hands the slot to the temperature note.
    fireEvent.press(screen.getByTestId('chip-sad'));
    expect(screen.queryByTestId('explore-note')).toBeNull();
    expect(screen.getByTestId('temperature-continue-hint')).toBeTruthy();
  });

  it('retires the teaching notes once enough check-ins exist', () => {
    // Three logs in the store: the lessons have landed (user, 2026-09-02).
    for (let i = 0; i < FEEL_NOTE_LOG_LIMIT; i += 1) {
      useCheckInStore.getState().addCheckIn({
        emotions: [{ emotionId: 'sad', family: 'sadness', intensity: 2 }],
        resistanceFlags: [],
        source: 'manual',
      });
    }
    renderScreen();
    fireEvent.press(screen.getByTestId('family-sadness'));
    expect(screen.queryByTestId('explore-note')).toBeNull();
    fireEvent.press(screen.getByTestId('chip-sad'));
    expect(screen.queryByTestId('temperature-continue-hint')).toBeNull();
    // Continue is still gated — only the explanation has retired.
    expect(screen.getByTestId('flow-next').props.accessibilityState.disabled).toBe(true);
  });

  it('holds a word for a deliberate beat, not a full second', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('family-sadness'));
    // The host View doesn't carry Pressable's timing prop — read it off the
    // Pressable itself. Wiring test: the chip must pass the token through.
    const pressable = screen
      .UNSAFE_getAllByProps({ testID: 'chip-sad' })
      .find((node) => node.props.delayLongPress !== undefined);
    expect(pressable?.props.delayLongPress).toBe(motion.holdMs);
    expect(motion.holdMs).toBeLessThanOrEqual(400);
  });

  it("offers the 'Guilty' doorway and unpacks it through anger", () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('chip-guilty'));
    expect(screen.getByTestId('underneath-guilty')).toBeTruthy();
    // Anger leads the unpack (guilt = anger turned inward).
    expect(screen.getByTestId('chip-under-irritated')).toBeTruthy();
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
