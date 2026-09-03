// P10 — experiment screens. The notifications SERVICE is mocked so these tests
// assert wiring (permission gate, reschedule on change) without touching the
// expo-notifications surface directly.

import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@/services/notifications', () => ({
  ensurePermissions: jest.fn(() => Promise.resolve(true)),
  rescheduleNameIt: jest.fn(() => Promise.resolve(['id-1', 'id-2', 'id-3'])),
  configureHandler: jest.fn(),
  ensureChannel: jest.fn(() => Promise.resolve()),
}));

// JudgmentFlowScreen reads route params (edit mode); provide an empty route so
// bare renders behave as "add" mode. Navigation is mocked so card presses can
// be asserted without registering real navigator screens.
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({ params: {} }),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

import { mutedPalette } from '@/constants/theme';
import * as notifications from '@/services/notifications';
import ExperimentsScreen from '@/screens/ExperimentsScreen';
import JudgmentFlowScreen from '@/screens/JudgmentFlowScreen';
import NameItSetupScreen from '@/screens/NameItSetupScreen';
import { useExperimentStore, type PracticeSession } from '@/store/experimentStore';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import { useSettingsStore } from '@/store/settingsStore';

const initialExperiments = useExperimentStore.getState();

const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useExperimentStore.setState(initialExperiments, true);
  useHelperSheetStore.setState({ target: null });
  useSettingsStore.setState(initialSettings, true);
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
  it('walks a TWO-judgment sitting: list → per-judgment feelings → free writing', async () => {
    renderScreen(<JudgmentFlowScreen />);
    expect(await screen.findByTestId('screen-judgment')).toBeTruthy();

    // Step 1 — the judgments list (worksheet: think of ~5 recent judgments).
    fireEvent.changeText(screen.getByTestId('judgment-target-0'), 'my coworker');
    fireEvent.changeText(screen.getByTestId('judgment-for-0'), 'being disorganized');
    fireEvent.press(screen.getByTestId('judgment-add'));
    fireEvent.changeText(screen.getByTestId('judgment-target-1'), 'myself');
    fireEvent.changeText(screen.getByTestId('judgment-for-1'), 'being slow');
    fireEvent.press(screen.getByTestId('judgment-next'));

    // Step 2 — first judgment's feelings, sentence carried forward.
    expect(await screen.findByTestId('judgment-stitch')).toHaveTextContent(
      /my coworker.*being disorganized/
    );
    // A named feeling starts UNWEIGHED and blocks Continue until its dial is
    // tapped (no default temperatures, 2026-07-17).
    fireEvent.press(screen.getByTestId('judgment-family-fear'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-worried'));
    expect(screen.getByTestId('judgment-next').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByTestId('dial-worried-2'));
    fireEvent.press(screen.getByTestId('judgment-next'));

    // Step 3 — second judgment's feelings.
    expect(await screen.findByTestId('judgment-stitch')).toHaveTextContent(/myself.*being slow/);
    fireEvent.press(screen.getByTestId('judgment-family-sadness'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-hurt'));
    fireEvent.press(screen.getByTestId('dial-hurt-3'));
    fireEvent.press(screen.getByTestId('judgment-next'));

    // Step 4 — one shared free-writing about what came up, then save.
    fireEvent.changeText(await screen.findByTestId('judgment-freewriting'), 'the deadline scares me');
    fireEvent.press(screen.getByTestId('judgment-save'));

    await waitFor(() => expect(useExperimentStore.getState().judgmentEntries).toHaveLength(2));
    const [first, second] = useExperimentStore.getState().judgmentEntries;
    expect(first.target).toBe('my coworker');
    expect(first.uncoveredFeelings).toEqual([
      { emotionId: 'worried', family: 'fear', intensity: 2 },
    ]);
    expect(first.freeWriting).toBe('the deadline scares me');
    expect(second.target).toBe('myself');
    expect(second.uncoveredFeelings).toEqual([
      { emotionId: 'hurt', family: 'sadness', intensity: 3 },
    ]);
    expect(second.sittingId).toBe(first.sittingId);
  });

  it('deselects a feeling when its chip is tapped again', async () => {
    renderScreen(<JudgmentFlowScreen />);
    fireEvent.changeText(await screen.findByTestId('judgment-target-0'), 'myself');
    fireEvent.changeText(screen.getByTestId('judgment-for-0'), 'being slow');
    fireEvent.press(screen.getByTestId('judgment-next'));

    fireEvent.press(await screen.findByTestId('judgment-family-fear'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-worried'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-worried'));
    fireEvent.press(screen.getByTestId('judgment-next'));
    fireEvent.press(await screen.findByTestId('judgment-save'));

    await waitFor(() => expect(useExperimentStore.getState().judgmentEntries).toHaveLength(1));
    expect(useExperimentStore.getState().judgmentEntries[0].uncoveredFeelings).toEqual([]);
  });

  it('long-pressing a word chip opens its family helper sheet', async () => {
    // The check-in flow teaches "Hold any word to learn what it carries" — the
    // gesture must not go dead on this screen's visually identical chips.
    renderScreen(<JudgmentFlowScreen />);
    fireEvent.changeText(await screen.findByTestId('judgment-target-0'), 'myself');
    fireEvent.changeText(screen.getByTestId('judgment-for-0'), 'being slow');
    fireEvent.press(screen.getByTestId('judgment-next'));

    fireEvent.press(await screen.findByTestId('judgment-family-fear'));
    fireEvent(screen.getByTestId('chip-judgment-feeling-worried'), 'longPress');
    expect(useHelperSheetStore.getState().target).toEqual({ kind: 'word', wordId: 'worried' });
  });

  it('long-pressing a picked chip (temperature row) opens that word helper too', async () => {
    renderScreen(<JudgmentFlowScreen />);
    fireEvent.changeText(await screen.findByTestId('judgment-target-0'), 'myself');
    fireEvent.changeText(screen.getByTestId('judgment-for-0'), 'being slow');
    fireEvent.press(screen.getByTestId('judgment-next'));

    fireEvent.press(await screen.findByTestId('judgment-family-sadness'));
    fireEvent.press(screen.getByTestId('chip-judgment-feeling-hurt'));
    fireEvent(screen.getByTestId('chip-judgment-picked-hurt'), 'longPress');
    expect(useHelperSheetStore.getState().target).toEqual({ kind: 'word', wordId: 'hurt' });
  });

  it('cannot advance with no complete judgment', async () => {
    renderScreen(<JudgmentFlowScreen />);
    // Half a judgment (target only) doesn't unlock Continue.
    fireEvent.changeText(await screen.findByTestId('judgment-target-0'), 'myself');
    expect(screen.getByTestId('judgment-next').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByTestId('judgment-next'));
    expect(screen.queryByTestId('judgment-stitch')).toBeNull();
  });
});

describe('first-visit helper note', () => {
  // Tap-dismiss behaviour is proven generically in coachNote.test.tsx;
  // this pins only the screen-specific fact: the note is wired here.
  it('floats on first visit', async () => {
    renderScreen(<ExperimentsScreen />);
    expect(await screen.findByTestId('coach-note-experiments')).toBeTruthy();
  });
});

describe('ExperimentsScreen layout', () => {
  it('structures the page by kind: Deep work, Breath work, Learn, Reminders', async () => {
    renderScreen(<ExperimentsScreen />);
    await screen.findByTestId('screen-experiments');
    expect(screen.getByText(/Small practices for meeting what/)).toBeTruthy();
    // The sit-down exercises live under Deep work; box breathing regulates
    // rather than excavates, so it has its own Breath work section; Name it
    // is a schedule, so it sits under Reminders last (user, 2026-07-18).
    expect(screen.getByText('Deep work')).toBeTruthy();
    expect(screen.getByText('Breath work')).toBeTruthy();
    expect(screen.getByText('Learn')).toBeTruthy();
    expect(screen.getByText('Reminders')).toBeTruthy();
    expect(screen.queryByText('Practices')).toBeNull();
    expect(screen.getByText(/Nothing here is a test/)).toBeTruthy();
  });

  it('offers ONE compact doorway into the Reflections catalog, with a count', async () => {
    // Detailed catalog behaviour lives in reflections.test.tsx — here the
    // page just counts sittings (2 practice + 1 judgment sitting = 3) and
    // navigates. A twenty-sitting wall never renders inline (user, 2026-07-17).
    const sessions: PracticeSession[] = [
      {
        id: 'ps-1',
        practiceId: 'problem-solution',
        createdAt: '2026-07-15T20:00:00.000Z',
        work: { entries: { problem: ['no time'] }, marks: {}, picks: {} },
      },
      {
        id: 'ps-2',
        practiceId: 'five-year-flashback',
        createdAt: '2026-07-14T20:00:00.000Z',
        work: { entries: { decision: ['move?'] }, marks: {}, picks: {} },
      },
    ];
    useExperimentStore.setState((s) => ({ ...s, practiceSessions: sessions }));
    useExperimentStore.getState().addJudgmentEntry({
      target: 'my friend',
      judgment: 'canceling',
      uncoveredFeelings: [],
    });

    renderScreen(<ExperimentsScreen />);
    expect(await screen.findByText('Past reflections')).toBeTruthy();
    expect(screen.getByText(/3 sittings, kept/)).toBeTruthy();
    // The sittings themselves stay OFF this page.
    expect(screen.queryByText('no time')).toBeNull();
    fireEvent.press(screen.getByTestId('card-reflections'));
    expect(mockNavigate).toHaveBeenCalledWith('Reflections');
  });

  it('gives every card its own layer hue — the mockup mapping (user, 2026-08-31)', async () => {
    // Seed one practice session + one judgment entry so all 8 cards mount.
    const sessions: PracticeSession[] = [
      {
        id: 'ps-1',
        practiceId: 'problem-solution',
        createdAt: '2026-07-15T20:00:00.000Z',
        work: { entries: { problem: ['no time'] }, marks: {}, picks: {} },
      },
    ];
    useExperimentStore.setState((s) => ({ ...s, practiceSessions: sessions }));

    renderScreen(<ExperimentsScreen />);
    await screen.findByTestId('screen-experiments');

    const spine = (id: string) =>
      StyleSheet.flatten(screen.getByTestId(`${id}-spine`).props.style).backgroundColor;

    // One distinct family hue per card, straight from the endorsed mockup:
    // judgment anger rose, flashback enjoyment amber, empathic disgust green,
    // problem fear violet, name-it sadness blue, reflections contempt mauve —
    // breathing keeps anticipation and the field guide takes surprise so no
    // hue repeats anywhere on the page.
    const expected: Record<string, string> = {
      'card-judgment': mutedPalette.anger.thread,
      'practice-five-year-flashback': mutedPalette.enjoyment.thread,
      'practice-empathic-respect': mutedPalette.disgust.thread,
      'practice-problem-solution': mutedPalette.fear.thread,
      'card-breathing': mutedPalette.anticipation.thread,
      'card-reflections': mutedPalette.contempt.thread,
      'card-field-guide': mutedPalette.surprise.thread,
      'card-name-it': mutedPalette.sadness.thread,
    };
    for (const [card, thread] of Object.entries(expected)) {
      expect(spine(card)).toBe(thread);
    }
    expect(new Set(Object.values(expected)).size).toBe(8);
  });

  it('splits the perspective practices into their own titled section (mockup)', async () => {
    renderScreen(<ExperimentsScreen />);
    await screen.findByTestId('screen-experiments');
    expect(screen.getByText('Perspective practices')).toBeTruthy();
  });

  it('shows the Past reflections doorway only once there is a reflection', async () => {
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
