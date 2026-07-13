// Field-guide screen: the emotional-education home. Two sections — "What's
// underneath?" (surface state → the resisted feeling it tends to carry) and
// "Find the word" (the full mild→intense vocabulary per family).

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ExperimentsScreen from '@/screens/ExperimentsScreen';
import FieldGuideScreen from '@/screens/FieldGuideScreen';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { UNDERNEATH_MAP } from '@/content/underneath';
import { useHelperSheetStore } from '@/store/helperSheetStore';

const initialHelper = useHelperSheetStore.getState();

beforeEach(() => {
  useHelperSheetStore.setState(initialHelper, true);
});

function renderScreen(node: React.ReactElement) {
  return render(<NavigationContainer>{node}</NavigationContainer>);
}

describe('FieldGuideScreen', () => {
  it('renders its landmark and both section headings', async () => {
    renderScreen(<FieldGuideScreen />);
    expect(await screen.findByTestId('screen-field-guide')).toBeTruthy();
    expect(screen.getByText(/underneath/i)).toBeTruthy();
    expect(screen.getByText(/find the word/i)).toBeTruthy();
  });

  it('shows a chip for every surface state', async () => {
    renderScreen(<FieldGuideScreen />);
    await screen.findByTestId('screen-field-guide');
    for (const state of UNDERNEATH_MAP) {
      expect(screen.getByTestId(`chip-state-${state.id}`)).toBeTruthy();
    }
  });

  it('tapping a state unfolds its description, families, and invitation', async () => {
    renderScreen(<FieldGuideScreen />);
    fireEvent.press(await screen.findByTestId('chip-state-anxious'));
    const anxious = UNDERNEATH_MAP.find((s) => s.id === 'anxious')!;
    expect(await screen.findByTestId('underneath-panel-anxious')).toBeTruthy();
    expect(screen.getByText(anxious.description)).toBeTruthy();
    expect(screen.getByText(anxious.invitation)).toBeTruthy();
    // Its underlying family is named, with a learn link.
    expect(screen.getByTestId(`guide-learn-${anxious.underneath[0]}`)).toBeTruthy();
  });

  it('a state panel learn link opens the family helper sheet', async () => {
    renderScreen(<FieldGuideScreen />);
    fireEvent.press(await screen.findByTestId('chip-state-anxious'));
    fireEvent.press(await screen.findByTestId('guide-learn-fear'));
    expect(useHelperSheetStore.getState().family).toBe('fear');
  });

  it('tapping a second state swaps the open panel', async () => {
    renderScreen(<FieldGuideScreen />);
    fireEvent.press(await screen.findByTestId('chip-state-anxious'));
    fireEvent.press(await screen.findByTestId('chip-state-numb'));
    expect(await screen.findByTestId('underneath-panel-numb')).toBeTruthy();
    expect(screen.queryByTestId('underneath-panel-anxious')).toBeNull();
  });

  it('lists every family group in the word finder', async () => {
    renderScreen(<FieldGuideScreen />);
    await screen.findByTestId('screen-field-guide');
    for (const family of Object.values(EMOTION_FAMILIES)) {
      expect(screen.getByTestId(`word-family-${family.id}`)).toBeTruthy();
    }
  });

  it('tapping a word shows its family and intensity, with a learn link', async () => {
    renderScreen(<FieldGuideScreen />);
    // 'serene' is an extended enjoyment word from the wheel.
    fireEvent.press(await screen.findByTestId('chip-word-serene'));
    const detail = await screen.findByTestId('word-detail-enjoyment');
    expect(detail).toBeTruthy();
    fireEvent.press(screen.getByTestId('word-learn-enjoyment'));
    expect(useHelperSheetStore.getState().family).toBe('enjoyment');
  });
});

describe('Experiments → Field guide entry', () => {
  type TestStack = { Experiments: undefined; FieldGuide: undefined };
  const Stack = createNativeStackNavigator<TestStack>();

  it('the experiments card navigates to the field guide', async () => {
    render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Experiments" component={ExperimentsScreen} />
          <Stack.Screen name="FieldGuide" component={FieldGuideScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
    fireEvent.press(await screen.findByTestId('card-field-guide'));
    expect(await screen.findByTestId('screen-field-guide')).toBeTruthy();
  });
});
