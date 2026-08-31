// CircleScreen — invite, per-person Sees/How-often cycling, on-demand share via
// the OS sheet, and remove-with-confirm. All local: Share and Alert are spied.

import React from 'react';
import { Alert, Share, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { NavigationContainer } from '@react-navigation/native';

import CircleScreen from '@/screens/CircleScreen';
import { spacing } from '@/constants/theme';
import { useCircleStore } from '@/store/circleStore';
import { useCheckInStore } from '@/store/checkInStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { CheckIn } from '@/types/models';

const initialCircle = useCircleStore.getState();
const initialCheckIns = useCheckInStore.getState();

const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useCircleStore.setState(initialCircle, true);
  useCheckInStore.setState(initialCheckIns, true);
  useSettingsStore.setState(initialSettings, true);
});

// useFocusEffect (the inbox sync) needs a real navigation tree.
const renderScreen = () =>
  render(
    <NavigationContainer>
      <CircleScreen />
    </NavigationContainer>
  );

describe('first-visit helper note', () => {
  it('floats until dismissed — and inviting someone retires it too', async () => {
    renderScreen();
    expect(await screen.findByTestId('coach-note-circle')).toBeTruthy();
    // Taking the pointed-at action counts as understanding the note.
    fireEvent.press(screen.getByTestId('circle-invite'));
    expect(useSettingsStore.getState().dismissedTips).toContain('note-circle');
    expect(screen.queryByTestId('coach-note-circle')).toBeNull();
  });
});

function seedPerson() {
  return useCircleStore.getState().addPerson({
    name: 'Sam',
    relationship: 'Partner',
    sees: 'colours',
    frequency: 'evening',
  });
}

/** A check-in in the CURRENT week so the preview summary is non-empty. */
function thisWeekCheckIn(): CheckIn {
  const now = new Date();
  const createdAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString();
  return {
    id: 'cw-1',
    createdAt,
    dayKey: createdAt.slice(0, 10),
    emotions: [{ emotionId: 'glad', family: 'enjoyment', intensity: 2 }],
    resistanceFlags: [],
    source: 'manual',
  };
}

describe('CircleScreen', () => {
  it('renders the reassurance and an invite affordance when empty', () => {
    renderScreen();
    expect(screen.getByTestId('screen-circle')).toBeTruthy();
    expect(
      screen.getByText(/Nothing leaves your phone until you choose it/)
    ).toBeTruthy();
    expect(screen.getByTestId('circle-invite')).toBeTruthy();
  });

  it('invites a person, who starts active at weekly', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('circle-invite'));
    fireEvent.changeText(screen.getByTestId('circle-add-name'), 'Priya');
    fireEvent.changeText(screen.getByTestId('circle-add-relationship'), 'Close friend');
    fireEvent.press(screen.getByTestId('circle-add-submit'));

    const people = useCircleStore.getState().people;
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe('Priya');
    expect(people[0].frequency).toBe('weekly');
  });

  it('gives the sees/frequency chips vertical text breathing room', () => {
    // Device 2026-08-31: a wrapped chip label showed only the tops of its
    // descenders — the chip had minHeight 44 and NO vertical padding, so two
    // wrapped label lines filled the box exactly and Courier Prime's 1.318×
    // text box clipped at the bottom (regression log row 25).
    const p = seedPerson();
    renderScreen();
    const chip = screen.getByTestId(`circle-sees-${p.id}`);
    const flat = StyleSheet.flatten(chip.props.style);
    expect(flat.paddingVertical ?? 0).toBeGreaterThanOrEqual(spacing.sm);
  });

  it('cycles what a person sees and how often on tap', () => {
    const p = seedPerson();
    renderScreen();
    fireEvent.press(screen.getByTestId(`circle-sees-${p.id}`));
    expect(useCircleStore.getState().people[0].sees).toBe('count'); // colours → count
    fireEvent.press(screen.getByTestId(`circle-frequency-${p.id}`));
    expect(useCircleStore.getState().people[0].frequency).toBe('weekly'); // evening → weekly
  });

  it('shares this week through the OS sheet with the gated summary', () => {
    const p = seedPerson();
    useCheckInStore.setState({ checkIns: [thisWeekCheckIn()] });
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' } as Awaited<ReturnType<typeof Share.share>>);

    renderScreen();
    fireEvent.press(screen.getByTestId(`circle-share-${p.id}`));

    expect(shareSpy).toHaveBeenCalledTimes(1);
    const arg = shareSpy.mock.calls[0][0] as { message: string };
    // 'colours' level → tone words, no raw counts.
    expect(arg.message).toBe('This week felt mostly warm.');
  });

  it('opens the share sheet for a pending-share person (a tapped reminder)', () => {
    const p = seedPerson();
    useCheckInStore.setState({ checkIns: [thisWeekCheckIn()] });
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' } as Awaited<ReturnType<typeof Share.share>>);

    renderScreen();
    // Simulate App.tsx routing a tapped Circle reminder into the share intent.
    act(() => {
      useCircleStore.getState().requestShare(p.id);
    });

    expect(shareSpy).toHaveBeenCalledTimes(1);
    const arg = shareSpy.mock.calls[0][0] as { message: string };
    // Same gated summary "Share this week" produces ('colours' → tone words).
    expect(arg.message).toBe('This week felt mostly warm.');
    // The one-shot intent is cleared so it can't re-fire.
    expect(useCircleStore.getState().pendingSharePersonId).toBeNull();
  });

  it('clears a pending-share intent for a person who no longer exists, without sharing', () => {
    seedPerson();
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' } as Awaited<ReturnType<typeof Share.share>>);

    renderScreen();
    act(() => {
      useCircleStore.getState().requestShare('ghost-id');
    });

    expect(shareSpy).not.toHaveBeenCalled();
    expect(useCircleStore.getState().pendingSharePersonId).toBeNull();
  });

  it('removes a person after a destructive confirm', () => {
    const p = seedPerson();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });

    renderScreen();
    fireEvent.press(screen.getByTestId(`circle-remove-${p.id}`));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(useCircleStore.getState().people).toHaveLength(0);
  });
});
