// Perspective practice flow — rendered wiring: each step kind draws its
// working area, work persists live to the store, and the side-by-side reflect
// step shows every noted point next to its own writing space.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import PracticeFlowScreen from '@/screens/PracticeFlowScreen';
import { useExperimentStore } from '@/store/experimentStore';

let mockParams: { practiceId: string };
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({ params: mockParams }),
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
}));

const initialExperiments = useExperimentStore.getState();

beforeEach(() => {
  mockGoBack.mockClear();
  useExperimentStore.setState(initialExperiments, true);
});

const renderFlow = (practiceId: string) => {
  mockParams = { practiceId };
  return render(
    <NavigationContainer>
      <PracticeFlowScreen />
    </NavigationContainer>
  );
};

describe('PracticeFlowScreen — problem, then solution', () => {
  it('walks write → list → list → mark → pick and persists everything', () => {
    renderFlow('problem-solution');
    expect(screen.getByTestId('screen-practice')).toBeTruthy();

    // Step 1 — write the problem.
    fireEvent.changeText(screen.getByTestId('practice-write-problem'), 'never enough time');
    fireEvent.press(screen.getByTestId('practice-next'));

    // Step 2 — reasons it cannot be solved: two points.
    fireEvent.changeText(screen.getByTestId('practice-item-cannot-0'), 'the days are full');
    fireEvent.press(screen.getByTestId('practice-add-cannot'));
    fireEvent.changeText(screen.getByTestId('practice-item-cannot-1'), 'nobody can help');
    fireEvent.press(screen.getByTestId('practice-next'));

    // Step 3 — ideas: two points.
    fireEvent.changeText(screen.getByTestId('practice-item-ideas-0'), 'ask for help anyway');
    fireEvent.press(screen.getByTestId('practice-add-ideas'));
    fireEvent.changeText(screen.getByTestId('practice-item-ideas-1'), 'a robot does my chores');
    fireEvent.press(screen.getByTestId('practice-next'));

    // Step 4 — both sides side by side; mark the fantastical idea.
    expect(screen.getByText('Problem side')).toBeTruthy();
    expect(screen.getByText('Solution side')).toBeTruthy();
    expect(screen.getByText('the days are full')).toBeTruthy();
    fireEvent.press(screen.getByTestId('practice-mark-ideas-1'));
    fireEvent.press(screen.getByTestId('practice-next'));

    // Step 5 — pick the idea to keep; the closing thought shows on the last step.
    fireEvent.press(screen.getByTestId('practice-pick-one-step-0'));
    expect(screen.getByText(/held at the same time/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('practice-done'));
    expect(mockGoBack).toHaveBeenCalled();

    const work = useExperimentStore.getState().practiceWork['problem-solution'];
    expect(work.entries.problem).toEqual(['never enough time']);
    expect(work.entries.cannot).toEqual(['the days are full', 'nobody can help']);
    expect(work.entries.ideas).toEqual(['ask for help anyway', 'a robot does my chores']);
    expect(work.marks.fantastical).toEqual(['ideas:1']);
    expect(work.picks['one-step']).toBe('ideas:0');
  });

  it('removing a point removes its row', () => {
    renderFlow('problem-solution');
    fireEvent.press(screen.getByTestId('practice-next')); // → cannot
    fireEvent.changeText(screen.getByTestId('practice-item-cannot-0'), 'reason A');
    fireEvent.press(screen.getByTestId('practice-add-cannot'));
    fireEvent.changeText(screen.getByTestId('practice-item-cannot-1'), 'reason B');

    fireEvent.press(screen.getByTestId('practice-remove-cannot-0'));
    expect(screen.getByTestId('practice-item-cannot-0').props.value).toBe('reason B');
    expect(screen.queryByTestId('practice-item-cannot-1')).toBeNull();
  });
});

describe('PracticeFlowScreen — five year flashback', () => {
  it('reflect steps show each option BESIDE its own writing space', () => {
    renderFlow('five-year-flashback');
    fireEvent.changeText(screen.getByTestId('practice-write-decision'), 'move cities?');
    fireEvent.press(screen.getByTestId('practice-next'));

    fireEvent.changeText(screen.getByTestId('practice-item-options-0'), 'stay put');
    fireEvent.press(screen.getByTestId('practice-add-options'));
    fireEvent.changeText(screen.getByTestId('practice-item-options-1'), 'go north');
    fireEvent.press(screen.getByTestId('practice-next'));

    // From five years up: both noted options visible, each with its own box.
    expect(screen.getByText('stay put')).toBeTruthy();
    expect(screen.getByText('go north')).toBeTruthy();
    fireEvent.changeText(
      screen.getByTestId('practice-reflect-from-above-1'),
      'it looked scary and small from here'
    );

    const work = useExperimentStore.getState().practiceWork['five-year-flashback'];
    // Reflection saved at the SAME index as its option — alignment contract.
    expect(work.entries['from-above'][1]).toBe('it looked scary and small from here');
  });

  it('a reflect step with nothing noted offers a gentle way on', () => {
    renderFlow('five-year-flashback');
    fireEvent.press(screen.getByTestId('practice-next')); // → options (blank)
    fireEvent.press(screen.getByTestId('practice-next')); // → from-above
    expect(screen.getByText(/Nothing noted under/)).toBeTruthy();
  });
});
