// P10 — experiment screens. The notifications SERVICE is mocked so these tests
// assert wiring (permission gate, reschedule on change) without touching the
// expo-notifications surface directly.

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/services/notifications', () => ({
  ensurePermissions: jest.fn(() => Promise.resolve(true)),
  rescheduleNameIt: jest.fn(() => Promise.resolve(['id-1', 'id-2', 'id-3'])),
  configureHandler: jest.fn(),
  ensureChannel: jest.fn(() => Promise.resolve()),
}));

// JudgmentFlowScreen reads route params (edit mode); provide an empty route so
// bare renders behave as "add" mode.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({ params: {} }),
}));

import * as notifications from '@/services/notifications';
import ExperimentsScreen from '@/screens/ExperimentsScreen';
import JudgmentFlowScreen from '@/screens/JudgmentFlowScreen';
import NameItSetupScreen from '@/screens/NameItSetupScreen';
import { useExperimentStore } from '@/store/experimentStore';

const initialExperiments = useExperimentStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useExperimentStore.setState(initialExperiments, true);
});

function renderScreen(node: React.ReactElement) {
  return render(<NavigationContainer>{node}</NavigationContainer>);
}

describe('NameItSetupScreen', () => {
  it('renders its landmark', async () => {
    renderScreen(<NameItSetupScreen />);
    expect(await screen.findByTestId('screen-name-it')).toBeTruthy();
  });

  it('enabling asks permission then reschedules', async () => {
    renderScreen(<NameItSetupScreen />);
    // Switch fires onValueChange, not press.
    fireEvent(await screen.findByTestId('name-it-enabled'), 'valueChange', true);

    await waitFor(() => expect(notifications.ensurePermissions).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(notifications.rescheduleNameIt).toHaveBeenCalled());
    expect(useExperimentStore.getState().nameIt.enabled).toBe(true);
  });

  it('does NOT enable when permission is denied', async () => {
    (notifications.ensurePermissions as jest.Mock).mockResolvedValueOnce(false);
    renderScreen(<NameItSetupScreen />);
    fireEvent(await screen.findByTestId('name-it-enabled'), 'valueChange', true);

    await waitFor(() => expect(notifications.ensurePermissions).toHaveBeenCalled());
    expect(useExperimentStore.getState().nameIt.enabled).toBe(false);
    expect(notifications.rescheduleNameIt).not.toHaveBeenCalled();
  });

  it('frequency stepper increments the value', async () => {
    // Start enabled so the stepper is live and reschedules.
    useExperimentStore.setState((s) => ({ nameIt: { ...s.nameIt, enabled: true, timesPerDay: 3 } }));
    renderScreen(<NameItSetupScreen />);
    fireEvent.press(await screen.findByTestId('freq-inc'));
    await waitFor(() => expect(useExperimentStore.getState().nameIt.timesPerDay).toBe(4));
  });
});

describe('JudgmentFlowScreen', () => {
  it('walks the 4 steps and saves more than one feeling', async () => {
    renderScreen(<JudgmentFlowScreen />);
    expect(await screen.findByTestId('screen-judgment')).toBeTruthy();

    // Step 1 — target
    fireEvent.changeText(screen.getByTestId('judgment-target'), 'my coworker');
    fireEvent.press(screen.getByTestId('judgment-next'));

    // Step 2 — judgment
    fireEvent.changeText(await screen.findByTestId('judgment-judgment'), 'being disorganized');
    fireEvent.press(screen.getByTestId('judgment-next'));

    // Step 3 — the feeling step carries the previous two answers forward so
    // "who" + "why" stay in view.
    const stitch = await screen.findByTestId('judgment-stitch');
    // Regex so the match searches across the nested <Text> spans (target +
    // judgment are emphasised inline).
    expect(stitch).toHaveTextContent(/my coworker.*being disorganized/);

    // Multi-select: name two feelings, not one. Families start folded, so each
    // one is unfolded first. EmotionChip stamps `chip-${id}`, so
    // `judgment-feeling-worried` renders as `chip-judgment-feeling-worried`.
    fireEvent.press(screen.getByTestId('judgment-family-fear'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-worried'));
    fireEvent.press(screen.getByTestId('judgment-family-sadness'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-hurt'));
    fireEvent.press(screen.getByTestId('judgment-next'));

    // Step 4 — optional free-writing, then save
    fireEvent.changeText(await screen.findByTestId('judgment-freewriting'), 'the deadline scares me');
    fireEvent.press(screen.getByTestId('judgment-save'));

    await waitFor(() => expect(useExperimentStore.getState().judgmentEntries).toHaveLength(1));
    const entry = useExperimentStore.getState().judgmentEntries[0];
    expect(entry.target).toBe('my coworker');
    expect(entry.judgment).toBe('being disorganized');
    expect(entry.uncoveredFeelings.map((f) => f.emotionId)).toEqual(['worried', 'hurt']);
    expect(entry.uncoveredFeelings.map((f) => f.family)).toEqual(['fear', 'sadness']);
    expect(entry.freeWriting).toBe('the deadline scares me');
  });

  it('deselects a feeling when its chip is tapped again', async () => {
    renderScreen(<JudgmentFlowScreen />);
    fireEvent.changeText(await screen.findByTestId('judgment-target'), 'myself');
    fireEvent.press(screen.getByTestId('judgment-next'));
    fireEvent.changeText(await screen.findByTestId('judgment-judgment'), 'being slow');
    fireEvent.press(screen.getByTestId('judgment-next'));

    fireEvent.press(await screen.findByTestId('judgment-family-fear'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-worried'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-worried'));
    fireEvent.press(screen.getByTestId('judgment-next'));
    fireEvent.press(await screen.findByTestId('judgment-save'));

    await waitFor(() => expect(useExperimentStore.getState().judgmentEntries).toHaveLength(1));
    expect(useExperimentStore.getState().judgmentEntries[0].uncoveredFeelings).toEqual([]);
  });

  it('cannot advance step 1 with an empty target', async () => {
    renderScreen(<JudgmentFlowScreen />);
    fireEvent.press(await screen.findByTestId('judgment-next'));
    // Still on step 1 — the judgment input hasn't appeared.
    expect(screen.queryByTestId('judgment-judgment')).toBeNull();
  });
});

describe('ExperimentsScreen layout', () => {
  it('groups practices into overlined sections with a gentle intro and footer', async () => {
    renderScreen(<ExperimentsScreen />);
    await screen.findByTestId('screen-experiments');
    expect(screen.getByText(/Small practices for meeting what/)).toBeTruthy();
    expect(screen.getByText('Guided practices')).toBeTruthy();
    expect(screen.getByText('Perspective practices')).toBeTruthy();
    expect(screen.getByText(/Nothing here is a test/)).toBeTruthy();
  });

  it('shows the Past reflections section only once there is a reflection', async () => {
    renderScreen(<ExperimentsScreen />);
    await screen.findByTestId('screen-experiments');
    expect(screen.queryByText('Past reflections')).toBeNull();

    useExperimentStore.getState().addJudgmentEntry({
      target: 'my friend',
      judgment: 'canceling',
      uncoveredFeelings: [],
    });
    expect(await screen.findByText('Past reflections')).toBeTruthy();
  });
});

describe('ExperimentsScreen past reflections', () => {
  it('lists a past reflection and expands it on tap', async () => {
    useExperimentStore.getState().addJudgmentEntry({
      target: 'my friend',
      judgment: 'canceling',
      uncoveredFeelings: [{ emotionId: 'hurt', family: 'sadness', intensity: 3 }],
      freeWriting: 'I felt unimportant.',
    });

    renderScreen(<ExperimentsScreen />);
    const entry = await screen.findByTestId('judgment-entry-0');
    expect(entry).toBeTruthy();
    // Collapsed: free-writing hidden until tapped.
    expect(screen.queryByText('I felt unimportant.')).toBeNull();
    fireEvent.press(entry);
    expect(await screen.findByText('I felt unimportant.')).toBeTruthy();
  });

  it('shows every named feeling under an expanded reflection', async () => {
    useExperimentStore.getState().addJudgmentEntry({
      target: 'my friend',
      judgment: 'canceling',
      uncoveredFeelings: [
        { emotionId: 'hurt', family: 'sadness', intensity: 3 },
        { emotionId: 'worried', family: 'fear', intensity: 2 },
      ],
    });

    renderScreen(<ExperimentsScreen />);
    fireEvent.press(await screen.findByTestId('judgment-entry-0'));
    expect(await screen.findByText('Underneath: Hurt, Worried')).toBeTruthy();
  });

  it('shows no reflections section when the store is empty', async () => {
    renderScreen(<ExperimentsScreen />);
    await screen.findByTestId('screen-experiments');
    expect(screen.queryByTestId('judgment-entry-0')).toBeNull();
  });
});
