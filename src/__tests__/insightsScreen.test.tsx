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

describe('first-visit helper note', () => {
  it('floats until dismissed, then stays gone', async () => {
    renderScreen();
    expect(await screen.findByTestId('coach-note-insights')).toBeTruthy();
    fireEvent.press(screen.getByTestId('coach-dismiss-note-insights'));
    expect(useSettingsStore.getState().dismissedTips).toContain('note-insights');
    expect(screen.queryByTestId('coach-note-insights')).toBeNull();
  });
});

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

  it('shows a week summary, the resistance overline, its tells, and the gentle footer', async () => {
    useCheckInStore.setState({
      checkIns: [1, 2, 3, 4].map((n) => lastWeekCheckIn(n)),
    });

    renderScreen();
    await screen.findByText('A week of either-or');

    // Header summary: count + active days for the shown week.
    const summary = screen.getByTestId('insights-summary');
    // Regex so the match searches across the summary's nested <Text> spans.
    expect(summary).toHaveTextContent(/4 check-ins across 1 day/);

    // Resistance card overline + its four tell chips, the fired one selected.
    expect(screen.getByText('Gentle notice · Resistance')).toBeTruthy();
    const fired = screen.getByTestId('insight-tell-binary-stuckness');
    expect(fired.props.accessibilityState.selected).toBe(true);
    const quiet = screen.getByTestId('insight-tell-comparison');
    expect(quiet.props.accessibilityState.selected).toBe(false);

    expect(screen.getByTestId('insights-footer')).toBeTruthy();
  });

  it('empty state names the TRUE reason: a quiet week vs no pattern yet', async () => {
    // No check-ins at all → "quiet week so far", not a misleading "not enough
    // layers" that ignored the month behind it (user, 2026-07-18).
    useCheckInStore.setState({ checkIns: [] });
    renderScreen();
    expect(await screen.findByText(/quiet week so far/)).toBeTruthy();
  });

  it('empty state distinguishes "checked in but no pattern" from a quiet week', async () => {
    // A check-in THIS week but no template match → the honest second message,
    // never "not enough layers".
    const now = new Date();
    const thisWeek: CheckIn = {
      id: 'tw-1',
      createdAt: now.toISOString(),
      dayKey: now.toISOString().slice(0, 10),
      emotions: [{ emotionId: 'glad', family: 'enjoyment', intensity: 2 }],
      resistanceFlags: [],
      source: 'manual',
    };
    useCheckInStore.setState({ checkIns: [thisWeek] });
    useInsightStore.setState({ lastGeneratedWeekKey: previousWeekKey(new Date()), cards: [] });
    renderScreen();
    expect(await screen.findByText(/no clear pattern has surfaced yet/)).toBeTruthy();
    expect(screen.queryByText(/Not enough layers/)).toBeNull();
  });
});
