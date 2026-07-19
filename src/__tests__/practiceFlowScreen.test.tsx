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

    // Step 5 — pick the idea to keep.
    fireEvent.press(screen.getByTestId('practice-pick-one-step-0'));
    fireEvent.press(screen.getByTestId('practice-next'));

    // Step 6 — the small step; closing thought shows on the last step.
    fireEvent.changeText(
      screen.getByTestId('practice-write-small-step'),
      'ask about the Monday call'
    );
    expect(screen.getByText(/held at the same time/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('practice-done'));
    expect(mockGoBack).toHaveBeenCalled();

    // "Set it down" ARCHIVES the sitting and clears the form — next visit
    // starts fresh instead of resurfacing old answers (user, 2026-07-17).
    expect(useExperimentStore.getState().practiceWork['problem-solution']).toBeUndefined();
    const [session] = useExperimentStore.getState().practiceSessions;
    expect(session.practiceId).toBe('problem-solution');
    expect(session.work.entries.problem).toEqual(['never enough time']);
    expect(session.work.entries.cannot).toEqual(['the days are full', 'nobody can help']);
    expect(session.work.entries.ideas).toEqual(['ask for help anyway', 'a robot does my chores']);
    expect(session.work.marks.fantastical).toEqual(['ideas:1']);
    expect(session.work.picks['one-step']).toEqual(['ideas:0']);
    expect(session.work.entries['small-step']).toEqual(['ask about the Monday call']);
  });

  it('an untouched sitting archives nothing', () => {
    renderFlow('problem-solution');
    for (let i = 0; i < 5; i++) fireEvent.press(screen.getByTestId('practice-next'));
    fireEvent.press(screen.getByTestId('practice-done'));
    expect(useExperimentStore.getState().practiceSessions).toHaveLength(0);
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
  it('the changed step shows each option BESIDE its own writing space', () => {
    renderFlow('five-year-flashback');
    fireEvent.changeText(screen.getByTestId('practice-write-decision'), 'move cities?');
    fireEvent.press(screen.getByTestId('practice-next'));

    fireEvent.changeText(screen.getByTestId('practice-item-options-0'), 'stay put');
    fireEvent.press(screen.getByTestId('practice-add-options'));
    fireEvent.changeText(screen.getByTestId('practice-item-options-1'), 'go north');
    fireEvent.press(screen.getByTestId('practice-next'));

    // "How am I — and others — changed?": both noted options visible, each
    // with its own box (worksheet p.42).
    expect(screen.getByText('stay put')).toBeTruthy();
    expect(screen.getByText('go north')).toBeTruthy();
    fireEvent.changeText(
      screen.getByTestId('practice-reflect-changed-1'),
      'harder year up front, closer after'
    );

    const work = useExperimentStore.getState().practiceWork['five-year-flashback'];
    // Reflection saved at the SAME index as its option — alignment contract.
    expect(work.entries.changed[1]).toBe('harder year up front, closer after');

    // Final step: choose which options still matter in five years —
    // MULTI-select (user, 2026-07-17): both can.
    fireEvent.press(screen.getByTestId('practice-next'));
    fireEvent.press(screen.getByTestId('practice-pick-still-matters-1'));
    fireEvent.press(screen.getByTestId('practice-pick-still-matters-0'));
    expect(
      useExperimentStore.getState().practiceWork['five-year-flashback'].picks['still-matters']
    ).toEqual(['options:1', 'options:0']);
  });

  it('a reflect step with nothing noted offers a gentle way on', () => {
    renderFlow('five-year-flashback');
    fireEvent.press(screen.getByTestId('practice-next')); // → options (blank)
    fireEvent.press(screen.getByTestId('practice-next')); // → changed
    expect(screen.getByText(/Nothing noted under/)).toBeTruthy();
  });
});
