// Navigation-phase smoke tests: the REAL AppNavigator renders end-to-end
// (initial-route pick included), every skeleton screen mounts with its
// testID landmark, and the screen error boundary catches + retries.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';

import AppNavigator, { pickInitialRoute } from '@/navigation/AppNavigator';
import ScreenErrorBoundary from '@/components/ScreenErrorBoundary';
import ExperimentsScreen from '@/screens/ExperimentsScreen';
import InsightsScreen from '@/screens/InsightsScreen';
import NameItSetupScreen from '@/screens/NameItSetupScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import QuiltScreen from '@/screens/QuiltScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { useCheckInStore } from '@/store/checkInStore';
import { useExperimentStore } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import { useSettingsStore } from '@/store/settingsStore';

// Pristine store snapshots captured at module load (actions included), so
// every test starts from the persisted-store defaults.
const initialSettings = useSettingsStore.getState();
const initialCheckIns = useCheckInStore.getState();
const initialExperiments = useExperimentStore.getState();
const initialInsights = useInsightStore.getState();

beforeEach(() => {
  useSettingsStore.setState(initialSettings, true);
  useCheckInStore.setState(initialCheckIns, true);
  useExperimentStore.setState(initialExperiments, true);
  useInsightStore.setState(initialInsights, true);
});

describe('pickInitialRoute', () => {
  it('routes to Onboarding when onboarding has never completed', () => {
    expect(pickInitialRoute(null)).toBe('Onboarding');
  });

  it('routes to Main once onboarding completed', () => {
    expect(pickInitialRoute('2026-07-07T09:00:00.000Z')).toBe('Main');
  });
});

describe('AppNavigator (real navigator)', () => {
  // The first full-navigator render pays the module cold-start cost (native
  // stack + tabs + all screens transform on demand) and can blow the 5s
  // default on slower machines — give these renders room.
  const NAVIGATOR_TIMEOUT_MS = 20000;

  it(
    'starts on onboarding for a fresh settings store',
    async () => {
      render(<AppNavigator />);
      expect(await screen.findByTestId('screen-onboarding')).toBeTruthy();
    },
    NAVIGATOR_TIMEOUT_MS
  );

  it(
    'starts on the quilt tab once onboarding is complete',
    async () => {
      useSettingsStore.setState({ onboardingCompletedAt: '2026-07-07T09:00:00.000Z' });
      render(<AppNavigator />);
      expect(await screen.findByTestId('screen-quilt')).toBeTruthy();
    },
    NAVIGATOR_TIMEOUT_MS
  );

  it(
    'opens the check-in modal from the quilt FAB',
    async () => {
      useSettingsStore.setState({ onboardingCompletedAt: '2026-07-07T09:00:00.000Z' });
      render(<AppNavigator />);
      fireEvent.press(await screen.findByTestId('checkin-fab'));
      expect(await screen.findByTestId('screen-checkin')).toBeTruthy();
    },
    NAVIGATOR_TIMEOUT_MS
  );
});

describe('screen skeletons render their landmarks', () => {
  // CheckInFlowScreen and JudgmentFlowScreen are intentionally absent: both
  // read route params via useRoute, which throws outside a real navigator
  // screen. They're covered with route mocks in checkInFlowScreen.test.tsx /
  // experiments.test.tsx / reflections.test.tsx.
  const cases: [string, React.ComponentType][] = [
    ['screen-quilt', QuiltScreen],
    ['screen-experiments', ExperimentsScreen],
    ['screen-insights', InsightsScreen],
    ['screen-name-it', NameItSetupScreen],
    ['screen-settings', SettingsScreen],
    ['screen-onboarding', OnboardingScreen],
  ];

  it.each(cases)('%s mounts', async (testID, Screen) => {
    render(
      <NavigationContainer>
        <Screen />
      </NavigationContainer>
    );
    expect(await screen.findByTestId(testID)).toBeTruthy();
  });

  it('quilt shows the empty state with no check-ins', async () => {
    render(
      <NavigationContainer>
        <QuiltScreen />
      </NavigationContainer>
    );
    expect(await screen.findByText('Your quilt begins with one square.')).toBeTruthy();
  });

  it('quilt renders an accessible patch when a check-in exists', async () => {
    // Detailed canvas behaviour is covered in quiltRender.test.tsx; here we
    // only confirm the screen wires a check-in into a focusable patch. Use a
    // today-based timestamp so it lands in the live current week.
    const now = new Date();
    const createdAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      10,
      0
    ).toISOString();
    useCheckInStore.setState({
      checkIns: [
        {
          id: 'c1',
          createdAt,
          dayKey: createdAt.slice(0, 10),
          emotions: [{ emotionId: 'irritated', family: 'anger', intensity: 2 }],
          resistanceFlags: [],
          source: 'manual',
        },
      ],
    });
    render(
      <NavigationContainer>
        <QuiltScreen />
      </NavigationContainer>
    );
    expect(await screen.findByTestId('patch-c1')).toBeTruthy();
  });

  it('experiments shows the name-it status line from the store', async () => {
    useExperimentStore.setState((state) => ({
      nameIt: { ...state.nameIt, enabled: true, timesPerDay: 4 },
    }));
    render(
      <NavigationContainer>
        <ExperimentsScreen />
      </NavigationContainer>
    );
    expect(await screen.findByText('4× a day')).toBeTruthy();
  });
});

describe('ScreenErrorBoundary', () => {
  let shouldThrow = true;
  function Bomb() {
    if (shouldThrow) throw new Error('boom');
    return <Text>recovered</Text>;
  }

  it('shows the fallback and recovers on retry', () => {
    shouldThrow = true;
    render(
      <ScreenErrorBoundary name="TestScreen">
        <Bomb />
      </ScreenErrorBoundary>
    );
    expect(screen.getByText('Something tore a stitch')).toBeTruthy();
    shouldThrow = false;
    fireEvent.press(screen.getByTestId('error-retry'));
    expect(screen.getByText('recovered')).toBeTruthy();
  });
});
