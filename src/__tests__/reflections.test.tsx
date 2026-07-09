// Reflections: swipe actions (edit / remove), edit-mode judgment flow, and
// the Atlas practices living inline on the Experiments screen.

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
  it('renders the Atlas practices as sibling cards that unfold in place', () => {
    render(
      <NavigationContainer>
        <ExperimentsScreen />
      </NavigationContainer>
    );
    const first = PRACTICES[0];
    expect(screen.getByTestId(`practice-${first.id}`)).toBeTruthy();
    // Steps hidden until opened.
    expect(screen.queryByText(first.steps[0])).toBeNull();
    fireEvent.press(screen.getByTestId(`practice-${first.id}`));
    expect(screen.getByText(first.steps[0])).toBeTruthy();
    expect(screen.getByText(first.closing)).toBeTruthy();
  });

  it('a practice offers a scratch pad per step that persists what you write', () => {
    const first = PRACTICES[0];
    render(
      <NavigationContainer>
        <ExperimentsScreen />
      </NavigationContainer>
    );
    // No writing box until the practice is opened.
    expect(screen.queryByTestId(`practice-${first.id}-note-0`)).toBeNull();

    fireEvent.press(screen.getByTestId(`practice-${first.id}`));
    fireEvent.changeText(
      screen.getByTestId(`practice-${first.id}-note-0`),
      'what my future self sees'
    );

    // Saved locally, keyed to that practice + step.
    expect(useExperimentStore.getState().practiceNotes[first.id][0]).toBe(
      'what my future self sees'
    );
    // And it stays in the field (reads back from the store).
    expect(screen.getByTestId(`practice-${first.id}-note-0`).props.value).toBe(
      'what my future self sees'
    );
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
