// SettingsScreen + polished OnboardingScreen. Navigation is mocked at the
// hook level (the screens under test only need navigate/goBack/reset), the
// notifications service is mocked so delete-everything's cancel call is
// observable, and Share/Alert are spied per-test.

import React from 'react';
import { Alert, Share } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import OnboardingScreen from '@/screens/OnboardingScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { useCheckInStore } from '@/store/checkInStore';
import { useExperimentStore } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import { useSettingsStore } from '@/store/settingsStore';
import { rescheduleNameIt } from '@/services/notifications';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      reset: mockReset,
    }),
  };
});

jest.mock('@/services/notifications', () => ({
  rescheduleNameIt: jest.fn(() => Promise.resolve([])),
  ensurePermissions: jest.fn(() => Promise.resolve(true)),
}));

const initialCheckIns = useCheckInStore.getState();
const initialExperiments = useExperimentStore.getState();
const initialInsights = useInsightStore.getState();
const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useCheckInStore.setState(initialCheckIns, true);
  useExperimentStore.setState(initialExperiments, true);
  useInsightStore.setState(initialInsights, true);
  useSettingsStore.setState(initialSettings, true);
});

function seedData() {
  useCheckInStore.setState({
    checkIns: [
      {
        id: 'seed-checkin',
        createdAt: '2026-07-01T10:00:00.000Z',
        dayKey: '2026-07-01',
        emotions: [{ emotionId: 'irritated', family: 'anger', intensity: 2 }],
        resistanceFlags: [],
        source: 'manual',
      },
    ],
  });
  useExperimentStore.setState((state) => ({
    judgmentEntries: [
      {
        id: 'seed-judgment',
        createdAt: '2026-07-01T11:00:00.000Z',
        target: 'myself',
        judgment: 'being slow',
        uncoveredFeelings: [],
      },
    ],
    nameIt: { ...state.nameIt, enabled: true, timesPerDay: 2, scheduledIds: ['n1'] },
  }));
  useInsightStore.setState({
    cards: [
      {
        id: 'seed-card',
        weekKey: '2026-W27',
        templateId: 'fluid-week',
        kind: 'pattern',
        title: 't',
        body: 'b',
      },
    ],
    lastGeneratedWeekKey: '2026-W27',
  });
  useSettingsStore.setState({ onboardingCompletedAt: '2026-07-01T09:00:00.000Z' });
}

describe('SettingsScreen', () => {
  it('renders the section headers and the version caption', () => {
    render(<SettingsScreen />);
    expect(screen.getByTestId('screen-settings')).toBeTruthy();
    expect(screen.getByText('Reminders')).toBeTruthy();
    expect(screen.getByText('Feel')).toBeTruthy();
    expect(screen.getByText('About the ideas')).toBeTruthy();
    expect(screen.getByText('Your data')).toBeTruthy();
    expect(screen.getByText('v0.2.0')).toBeTruthy();
  });

  it('shows the name-it status and navigates to its setup', () => {
    useExperimentStore.setState((state) => ({
      nameIt: { ...state.nameIt, enabled: true, timesPerDay: 3 },
    }));
    render(<SettingsScreen />);
    expect(screen.getByText('3× a day')).toBeTruthy();

    fireEvent.press(screen.getByTestId('settings-name-it'));
    expect(mockNavigate).toHaveBeenCalledWith('NameItSetup');
  });

  it('shows Off when name-it reminders are disabled', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Off')).toBeTruthy();
  });

  it('haptics switch writes through to the settings store', () => {
    render(<SettingsScreen />);
    fireEvent(screen.getByTestId('settings-haptics'), 'valueChange', false);
    expect(useSettingsStore.getState().hapticsEnabled).toBe(false);
    fireEvent(screen.getByTestId('settings-haptics'), 'valueChange', true);
    expect(useSettingsStore.getState().hapticsEnabled).toBe(true);
  });

  it('reduce-motion switch sets the override', () => {
    render(<SettingsScreen />);
    expect(useSettingsStore.getState().reduceMotionOverride).toBeNull();
    fireEvent(screen.getByTestId('settings-reduce-motion'), 'valueChange', true);
    expect(useSettingsStore.getState().reduceMotionOverride).toBe(true);
    fireEvent(screen.getByTestId('settings-reduce-motion'), 'valueChange', false);
    expect(useSettingsStore.getState().reduceMotionOverride).toBe(false);
  });

  it('show-helpers row brings every first-visit note back', () => {
    useSettingsStore.setState({ dismissedTips: ['note-quilt', 'home'] });
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId('settings-show-helpers'));
    expect(useSettingsStore.getState().dismissedTips).toEqual([]);
  });

  it('expands the about-the-ideas paragraph on press', () => {
    render(<SettingsScreen />);
    expect(screen.queryByText(/practice companion, not therapy/)).toBeNull();
    fireEvent.press(screen.getByTestId('settings-about'));
    expect(screen.getByText(/Paul Ekman/)).toBeTruthy();
    expect(screen.getByText(/Joe Hudson/)).toBeTruthy();
    expect(screen.getByText(/practice companion, not therapy or diagnosis/)).toBeTruthy();
  });

  it('export shares a JSON snapshot of all four stores', async () => {
    seedData();
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({
      action: 'sharedAction',
    } as Awaited<ReturnType<typeof Share.share>>);

    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId('settings-export'));

    expect(shareSpy).toHaveBeenCalledTimes(1);
    const arg = shareSpy.mock.calls[0][0] as { message: string; title?: string };
    expect(arg.title).toBe('The Mood Layer export');
    const parsed = JSON.parse(arg.message);
    expect(parsed.checkIns[0].id).toBe('seed-checkin');
    expect(parsed.judgmentEntries[0].id).toBe('seed-judgment');
    expect(parsed.insightCards[0].id).toBe('seed-card');
    expect(parsed.settings.hapticsEnabled).toBe(true);
    expect(parsed.nameIt.enabled).toBe(true);
  });

  it('export swallows a rejected share (sheet dismissed)', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('dismissed'));
    render(<SettingsScreen />);
    // Must not throw or leave an unhandled rejection.
    fireEvent.press(screen.getByTestId('settings-export'));
    await Promise.resolve();
    expect(screen.getByTestId('screen-settings')).toBeTruthy();
  });

  it('delete everything confirms destructively, empties the stores, and cancels reminders', () => {
    seedData();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const destructive = buttons?.find((b) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId('settings-delete'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(useCheckInStore.getState().checkIns).toHaveLength(0);
    expect(useExperimentStore.getState().judgmentEntries).toHaveLength(0);
    expect(useInsightStore.getState().cards).toHaveLength(0);
    expect(useInsightStore.getState().lastGeneratedWeekKey).toBeNull();
    // resetAll() clears onboardingCompletedAt too — the user re-onboards.
    expect(useSettingsStore.getState().onboardingCompletedAt).toBeNull();
    expect(rescheduleNameIt).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, scheduledIds: [] })
    );
  });

  it('keeps everything when the confirm is cancelled', () => {
    seedData();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'cancel')?.onPress?.();
    });

    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId('settings-delete'));

    expect(useCheckInStore.getState().checkIns).toHaveLength(1);
    expect(rescheduleNameIt).not.toHaveBeenCalled();
  });

  it('back button pops the screen', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId('settings-back'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('OnboardingScreen (polished)', () => {
  it('still renders the pager and Begin completes onboarding', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('screen-onboarding')).toBeTruthy();

    fireEvent.press(screen.getByTestId('onboarding-begin'));
    expect(useSettingsStore.getState().onboardingCompletedAt).not.toBeNull();
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Main' }] });
  });
});

// ── The test-crash trigger must never reach a shipped app ────────────
// It exists only so the JS crash path can be verified end-to-end on a device
// (ADR-001 switches native crash capture off, so nothing else produces a
// scrubbed event). The gate lives in its own module read at build time, where
// babel-preset-expo inlines EXPO_PUBLIC_* — a production bundle compiles the
// row away rather than merely hiding it.
describe('test-crash trigger gate', () => {
  it('is ABSENT in the default (production) case', () => {
    render(<SettingsScreen />);
    expect(screen.queryByTestId('settings-crash-test')).toBeNull();
  });
});
