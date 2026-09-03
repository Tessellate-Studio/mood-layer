// InsightsScreen — weekly generation on focus, last-week-only card
// rendering (no dismiss), empty state. Rendered inside a bare NavigationContainer: useNavigation
// falls back to the container ref (isFocused() === true), so useFocusEffect
// fires on mount.

import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import LogoMark from '@/components/LogoMark';
import { spacing } from '@/constants/theme';
import { INSIGHTS_FOOTER } from '@/content/insights';
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
  // Tap-dismiss behaviour is proven generically in coachNote.test.tsx;
  // this pins only the screen-specific fact: the note is wired here.
  it('floats on first visit', async () => {
    renderScreen();
    expect(await screen.findByTestId('coach-note-insights')).toBeTruthy();
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

  it('has no dismiss control — cards are not dismissable (user, 2026-09-03)', async () => {
    useCheckInStore.setState({
      checkIns: [1, 2, 3, 4].map((n) => lastWeekCheckIn(n)),
    });

    renderScreen();

    await screen.findByText('A week of either-or');
    expect(screen.queryAllByLabelText('Dismiss insight')).toHaveLength(0);
  });

  it('shows last week’s cards only — older weeks stay in the store, off the page', async () => {
    // Without dismiss, the list would otherwise grow by two every week under
    // a header that says "Last week". Older cards are kept (the variety
    // pitch reads them to avoid repeats) but never rendered.
    const lastWeek = previousWeekKey(new Date());
    useInsightStore.setState({
      lastGeneratedWeekKey: lastWeek,
      cards: [
        { id: 'old', weekKey: '2026-W20', templateId: 'looping-week', kind: 'resistance', title: 'Old week card', body: 'old' },
        { id: 'new', weekKey: lastWeek, templateId: 'fluid-week', kind: 'pattern', title: 'Last week card', body: 'new' },
      ],
    });

    renderScreen();

    expect(await screen.findByText('Last week card')).toBeTruthy();
    expect(screen.queryByText('Old week card')).toBeNull();
  });

  it('never shows a stale week under the "Last week" header — the empty state returns instead', async () => {
    // W-2 produced cards, last week was too quiet to (still marked, nothing
    // stored). Gating on the store's newest card would put the W-2 cards under
    // "Last week"; gating on previousWeekKey shows the honest empty state.
    useInsightStore.setState({
      lastGeneratedWeekKey: previousWeekKey(new Date()),
      cards: [
        { id: 'old', weekKey: '2026-W20', templateId: 'looping-week', kind: 'resistance', title: 'Old week card', body: 'old' },
      ],
    });
    useCheckInStore.setState({ checkIns: [] });

    renderScreen();

    expect(await screen.findByTestId('insights-empty')).toBeTruthy();
    expect(screen.queryByText('Old week card')).toBeNull();
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

    const footer = screen.getByTestId('insights-footer');
    expect(within(footer).getByText(INSIGHTS_FOOTER)).toBeTruthy();
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

  it('header mark wears the prominent current mood — last week’s while this week is empty', async () => {
    useCheckInStore.setState({ checkIns: [1, 2, 3].map((n) => lastWeekCheckIn(n)) }); // fear
    renderScreen();
    const header = await screen.findByTestId('insights-header');
    expect(within(header).UNSAFE_getByType(LogoMark).props.families).toEqual(['fear']);
  });

  it('header mark switches to this week as soon as something is layered in', async () => {
    const now = new Date();
    const thisWeek: CheckIn = {
      id: 'tw-mood',
      createdAt: now.toISOString(),
      dayKey: now.toISOString().slice(0, 10),
      emotions: [{ emotionId: 'glad', family: 'enjoyment', intensity: 2 }],
      resistanceFlags: [],
      source: 'manual',
    };
    useCheckInStore.setState({ checkIns: [thisWeek, lastWeekCheckIn(1)] });
    renderScreen();
    const header = await screen.findByTestId('insights-header');
    expect(within(header).UNSAFE_getByType(LogoMark).props.families).toEqual(['enjoyment']);
  });

  it('coach note sits directly under the MEASURED header — never a typed offset', async () => {
    useCheckInStore.setState({ checkIns: [1, 2, 3, 4].map((n) => lastWeekCheckIn(n)) });
    renderScreen();
    const header = await screen.findByTestId('insights-header');
    // Before the measurement lands the note is present but invisible — it
    // must appear once, in place, never draw over the title and jump.
    const frame = screen.getByTestId('coach-frame-note-insights');
    expect(StyleSheet.flatten(frame.props.style).opacity).toBe(0);
    fireEvent(header, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 80 } } });
    // The frame's top = safe-area top (0 under the jest mock) + the screen's
    // own paddingTop + the measured header.
    const measured = StyleSheet.flatten(frame.props.style);
    expect(measured.top).toBe(spacing.md + 80);
    expect(measured.opacity).toBe(1);
  });
});
