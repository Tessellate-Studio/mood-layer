// Reflections: swipe actions (edit / remove), edit-mode judgment flow, and
// the Atlas practice cards opening their guided flows.

import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import ExperimentsScreen from '@/screens/ExperimentsScreen';
import JudgmentFlowScreen from '@/screens/JudgmentFlowScreen';
import { PRACTICES } from '@/content/practices';
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

describe('experiment store editing', () => {
  it('updates an entry in place, preserving id and createdAt', () => {
    const entry = seedEntry();
    useExperimentStore.getState().updateJudgmentEntry(entry.id, { judgment: 'being human' });
    const [updated] = useExperimentStore.getState().judgmentEntries;
    expect(updated.judgment).toBe('being human');
    expect(updated.id).toBe(entry.id);
    expect(updated.createdAt).toBe(entry.createdAt);
  });

  it('removes an entry by id', () => {
    const entry = seedEntry();
    useExperimentStore.getState().removeJudgmentEntry(entry.id);
    expect(useExperimentStore.getState().judgmentEntries).toHaveLength(0);
  });
});

describe('ExperimentsScreen', () => {
  it('each Atlas practice card opens its own guided flow', () => {
    render(
      <NavigationContainer>
        <ExperimentsScreen />
      </NavigationContainer>
    );
    for (const practice of PRACTICES) {
      fireEvent.press(screen.getByTestId(`practice-${practice.id}`));
      expect(mockNavigate).toHaveBeenCalledWith('PracticeFlow', { practiceId: practice.id });
    }
  });

  it('swipe actions: edit navigates with the entry id, remove confirms then deletes', () => {
    const entry = seedEntry();
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_t, _m, buttons) => {
        const destructive = buttons?.find((b) => b.style === 'destructive');
        destructive?.onPress?.();
      });

    render(
      <NavigationContainer>
        <ExperimentsScreen />
      </NavigationContainer>
    );

    fireEvent.press(screen.getByTestId('judgment-edit-0'));
    expect(mockNavigate).toHaveBeenCalledWith('JudgmentFlow', { editId: entry.id });

    fireEvent.press(screen.getByTestId('judgment-delete-0'));
    expect(useExperimentStore.getState().judgmentEntries).toHaveLength(0);

    alertSpy.mockRestore();
  });
});

describe('JudgmentFlowScreen edit mode', () => {
  it('prefills from the entry and updates it on save', () => {
    const entry = seedEntry();
    mockParams = { editId: entry.id };

    render(
      <NavigationContainer>
        <JudgmentFlowScreen />
      </NavigationContainer>
    );

    // Prefilled target on step 1.
    expect(screen.getByTestId('judgment-target').props.value).toBe('myself');
    fireEvent.changeText(screen.getByTestId('judgment-target'), 'my past self');
    fireEvent.press(screen.getByTestId('judgment-next'));
    fireEvent.press(screen.getByTestId('judgment-next'));
    fireEvent.press(screen.getByTestId('judgment-next'));
    fireEvent.press(screen.getByTestId('judgment-save'));

    const entries = useExperimentStore.getState().judgmentEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].target).toBe('my past self');
    expect(entries[0].id).toBe(entry.id);
    expect(mockGoBack).toHaveBeenCalled();
  });
});
