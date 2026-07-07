// InsightsScreen — weekly generation on focus, card rendering, dismissal,
// empty state. Rendered inside a bare NavigationContainer: useNavigation
// falls back to the container ref (isFocused() === true), so useFocusEffect
// fires on mount.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import InsightsScreen from '@/screens/InsightsScreen';
import { useCheckInStore } from '@/store/checkInStore';
import { useExperimentStore } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import { useSettingsStore } from '@/store/settingsStore';
import { previousWeekKey } from '@/utils/dates';
import type { CheckIn } from '@/types/models';

const initialCheckIns = useCheckInStore.getState();
const initialExperiments = useExperimentStore.getState();
const initialInsights = useInsightStore.getState();
const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  useCheckInStore.setState(initialCheckIns, true);
  useExperimentStore.setState(initialExperiments, true);
  useInsightStore.setState(initialInsights, true);
  useSettingsStore.setState(initialSettings, true);
});

/** A check-in in LAST ISO week (7 days back, local), so focus-time generation picks it up. */
function lastWeekCheckIn(n: number, overrides: Partial<CheckIn> = {}): CheckIn {
  const now = new Date();
  const createdAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7,
    9 + n,
    0
  ).toISOString();
  return {
    id: `lw-${n}`,
    createdAt,
    dayKey: createdAt.slice(0, 10),
    emotions: [{ emotionId: 'worried', family: 'fear', intensity: 2 }],
    resistanceFlags: ['binary-stuckness'],
    source: 'manual',
    ...overrides,
  };
}

function renderScreen() {
  return render(
    <NavigationContainer>
      <InsightsScreen />
    </NavigationContainer>
  );
}

describe('InsightsScreen', () => {
  it('generates last week’s insights on focus and renders the cards', async () => {
    // Four stuck-decision check-ins last week → stuck-decisions template.
    useCheckInStore.setState({
      checkIns: [1, 2, 3, 4].map((n) => lastWeekCheckIn(n)),
    });

    renderScreen();

    expect(await screen.findByText('A week of either-or')).toBeTruthy();
    expect(useInsightStore.getState().lastGeneratedWeekKey).toBe(
      previousWeekKey(new Date())
    );
    expect(useInsightStore.getState().cards.length).toBeGreaterThan(0);
  });

  it('does not regenerate when the week is already marked', async () => {
    useInsightStore.setState({
      lastGeneratedWeekKey: previousWeekKey(new Date()),
      cards: [],
    });
    useCheckInStore.setState({
      checkIns: [1, 2, 3, 4].map((n) => lastWeekCheckIn(n)),
    });

    renderScreen();

    expect(await screen.findByTestId('screen-insights')).toBeTruthy();
    expect(useInsightStore.getState().cards).toHaveLength(0);
  });

  it('dismisses a card via its ✕ and persists the dismissal in the store', async () => {
    useCheckInStore.setState({
      checkIns: [1, 2, 3, 4].map((n) => lastWeekCheckIn(n)),
    });

    renderScreen();

    await screen.findByText('A week of either-or');
    const card = useInsightStore
      .getState()
      .cards.find((c) => c.templateId === 'stuck-decisions');
    expect(card).toBeDefined();

    fireEvent.press(screen.getByTestId(`insight-dismiss-${card!.id}`));

    expect(screen.queryByText('A week of either-or')).toBeNull();
    const after = useInsightStore.getState().cards.find((c) => c.id === card!.id);
    expect(after?.dismissedAt).toBeDefined();
  });

  it('shows the gentle empty state when there is nothing to show', async () => {
    renderScreen();
    expect(
      await screen.findByText(
        'Not enough stitches yet — check in a few more times this week.'
      )
    ).toBeTruthy();
  });
});
