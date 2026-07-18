// Reflections: the week-by-week catalog screen (expand / swipe actions),
// edit-mode judgment sittings, and the store's sitting-level operations.

import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import JudgmentFlowScreen from '@/screens/JudgmentFlowScreen';
import ReflectionsScreen from '@/screens/ReflectionsScreen';
import { useExperimentStore } from '@/store/experimentStore';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockParams: { editId?: string } | undefined;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockParams }),
}));

const initialExperiments = useExperimentStore.getState();

beforeEach(() => {
  mockNavigate.mockClear();
  mockGoBack.mockClear();
  mockParams = undefined;
  useExperimentStore.setState(initialExperiments, true);
});

function seedEntry() {
  return useExperimentStore.getState().addJudgmentEntry({
    target: 'myself',
    judgment: 'being late',
    uncoveredFeelings: [{ emotionId: 'worried', family: 'fear', intensity: 2 }],
  });
}

describe('experiment store sittings', () => {
  it('saves one entry per judgment, sharing a sittingId, free writing on the first', () => {
    useExperimentStore.getState().saveJudgmentSitting({
      items: [
        { target: 'myself', judgment: 'being slow', uncoveredFeelings: [] },
        {
          target: 'my coworker',
          judgment: 'the mess',
          uncoveredFeelings: [{ emotionId: 'irritated', family: 'anger', intensity: 2 }],
        },
      ],
      freeWriting: 'a lot of this is tiredness',
    });
    const entries = useExperimentStore.getState().judgmentEntries;
    expect(entries).toHaveLength(2);
    expect(entries[0].sittingId).toBe(entries[1].sittingId);
    expect(entries[0].freeWriting).toBe('a lot of this is tiredness');
    expect(entries[1].freeWriting).toBeUndefined();
  });

  it('re-saving a sitting replaces its entries, keeping its place in time', () => {
    seedEntry();
    const original = useExperimentStore.getState().judgmentEntries[0];
    useExperimentStore.getState().saveJudgmentSitting({
      items: [{ target: 'my past self', judgment: 'being late', uncoveredFeelings: [] }],
      sittingId: original.id,
    });
    const entries = useExperimentStore.getState().judgmentEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].target).toBe('my past self');
    expect(entries[0].sittingId).toBe(original.id);
    expect(entries[0].createdAt).toBe(original.createdAt);
  });

  it('removeJudgmentSitting clears every entry of the sitting', () => {
    useExperimentStore.getState().saveJudgmentSitting({
      items: [
        { target: 'a', judgment: 'b', uncoveredFeelings: [] },
        { target: 'c', judgment: 'd', uncoveredFeelings: [] },
      ],
    });
    const sid = useExperimentStore.getState().judgmentEntries[0].sittingId!;
    useExperimentStore.getState().removeJudgmentSitting(sid);
    expect(useExperimentStore.getState().judgmentEntries).toHaveLength(0);
  });
});

describe('ReflectionsScreen', () => {
  it('lists a sitting under its week, expands on tap', () => {
    seedEntry();
    const sid = useExperimentStore.getState().judgmentEntries[0].id;
    render(
      <NavigationContainer>
        <ReflectionsScreen />
      </NavigationContainer>
    );
    const card = screen.getByTestId(`reflection-judgment-${sid}`);
    // Collapsed: the underneath line stays hidden until tapped.
    expect(screen.queryByText(/Underneath:/)).toBeNull();
    fireEvent.press(card);
    expect(screen.getByText(/Underneath: Worried/)).toBeTruthy();
  });

  it('swipe actions: edit navigates with the sitting id, remove confirms then deletes', () => {
    seedEntry();
    const sid = useExperimentStore.getState().judgmentEntries[0].id;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const destructive = buttons?.find((b) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    render(
      <NavigationContainer>
        <ReflectionsScreen />
      </NavigationContainer>
    );

    fireEvent.press(screen.getByTestId(`reflection-edit-${sid}`));
    expect(mockNavigate).toHaveBeenCalledWith('JudgmentFlow', { editId: sid });

    fireEvent.press(screen.getByTestId(`reflection-delete-${sid}`));
    expect(useExperimentStore.getState().judgmentEntries).toHaveLength(0);

    alertSpy.mockRestore();
  });

  it('shows practice name + conclusion collapsed, full per-step summary on expand', () => {
    useExperimentStore.setState((s) => ({
      ...s,
      practiceSessions: [
        {
          id: 'ps-1',
          practiceId: 'problem-solution',
          createdAt: new Date().toISOString(),
          work: {
            entries: { problem: ['no time'], 'small-step': ['email Sam'] },
            marks: {},
            picks: {},
          },
        },
      ],
    }));
    render(
      <NavigationContainer>
        <ReflectionsScreen />
      </NavigationContainer>
    );
    // Collapsed: the practice NAME and its conclusion subtitle (the last thing
    // written — the small step) show; the step LABELS stay hidden.
    expect(screen.getByText('Problem, then solution')).toBeTruthy();
    expect(screen.getByText('email Sam')).toBeTruthy();
    expect(screen.queryByText('The problem')).toBeNull();
    fireEvent.press(screen.getByTestId('reflection-practice-ps-1'));
    expect(screen.getByText('The problem')).toBeTruthy();
    expect(screen.getByText('no time')).toBeTruthy();
  });
});

describe('JudgmentFlowScreen edit mode', () => {
  it('prefills the sitting and replaces it on save, keeping its identity', () => {
    const entry = seedEntry();
    mockParams = { editId: entry.id };

    render(
      <NavigationContainer>
        <JudgmentFlowScreen />
      </NavigationContainer>
    );

    // Prefilled judgment row on step 1.
    expect(screen.getByTestId('judgment-target-0').props.value).toBe('myself');
    fireEvent.changeText(screen.getByTestId('judgment-target-0'), 'my past self');
    fireEvent.press(screen.getByTestId('judgment-next')); // → feelings (weighed already)
    fireEvent.press(screen.getByTestId('judgment-next')); // → free writing
    fireEvent.press(screen.getByTestId('judgment-save'));

    const entries = useExperimentStore.getState().judgmentEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].target).toBe('my past self');
    // Entry ids regenerate on re-save; the SITTING identity is what holds.
    expect(entries[0].sittingId).toBe(entry.id);
    expect(entries[0].createdAt).toBe(entry.createdAt);
    expect(mockGoBack).toHaveBeenCalled();
  });
});
