// Root navigation: native stack (onboarding / main tabs / modal flows /
// settings), every screen wrapped in a ScreenErrorBoundary. Monochrome tab
// bar styled from theme tokens only.

import React from 'react';
import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ScreenErrorBoundary from '@/components/ScreenErrorBoundary';
import { CircleIcon, ExperimentsIcon, InsightsIcon, QuiltIcon, type TabIconProps } from '@/components/TabIcon';
import { colors, fonts } from '@/constants/theme';
import { navigationRef } from '@/navigation/navigationRef';
import BreathingScreen from '@/screens/BreathingScreen';
import CheckInFlowScreen from '@/screens/CheckInFlowScreen';
import CircleScreen from '@/screens/CircleScreen';
import ExperimentsScreen from '@/screens/ExperimentsScreen';
import FieldGuideScreen from '@/screens/FieldGuideScreen';
import InsightsScreen from '@/screens/InsightsScreen';
import JudgmentFlowScreen from '@/screens/JudgmentFlowScreen';
import NameItSetupScreen from '@/screens/NameItSetupScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import PracticeFlowScreen from '@/screens/PracticeFlowScreen';
import QuiltScreen from '@/screens/QuiltScreen';
import ReflectionsScreen from '@/screens/ReflectionsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { useSettingsStore } from '@/store/settingsStore';

export type RootStackParamList = {
  // Nested params so a tapped Circle reminder can deep-link straight to the
  // CircleTab (navigate('Main', { screen: 'CircleTab' })).
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Onboarding: undefined;
  CheckInFlow: { source: 'manual' | 'name-it' } | undefined;
  JudgmentFlow: { editId?: string } | undefined;
  PracticeFlow: { practiceId: string };
  Breathing: undefined;
  NameItSetup: undefined;
  FieldGuide: undefined;
  Reflections: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  QuiltTab: undefined;
  ExperimentsTab: undefined;
  InsightsTab: undefined;
  CircleTab: undefined;
};

/** Pure so tests can cover the routing decision without rendering. */
export function pickInitialRoute(onboardingCompletedAt: string | null): 'Onboarding' | 'Main' {
  return onboardingCompletedAt === null ? 'Onboarding' : 'Main';
}

// Safe wrappers: every registered screen sits inside a ScreenErrorBoundary so
// a render crash tears one stitch, not the whole app.
function withBoundary(name: string, Screen: React.ComponentType): React.ComponentType {
  function SafeScreen() {
    return (
      <ScreenErrorBoundary name={name}>
        <Screen />
      </ScreenErrorBoundary>
    );
  }
  SafeScreen.displayName = `Safe${name}Screen`;
  return SafeScreen;
}

const SafeQuiltScreen = withBoundary('Quilt', QuiltScreen);
const SafeExperimentsScreen = withBoundary('Experiments', ExperimentsScreen);
const SafeInsightsScreen = withBoundary('Insights', InsightsScreen);
const SafeCircleScreen = withBoundary('Circle', CircleScreen);
const SafeOnboardingScreen = withBoundary('Onboarding', OnboardingScreen);
const SafeCheckInFlowScreen = withBoundary('CheckInFlow', CheckInFlowScreen);
const SafeJudgmentFlowScreen = withBoundary('JudgmentFlow', JudgmentFlowScreen);
const SafePracticeFlowScreen = withBoundary('PracticeFlow', PracticeFlowScreen);
const SafeBreathingScreen = withBoundary('Breathing', BreathingScreen);
const SafeNameItSetupScreen = withBoundary('NameItSetup', NameItSetupScreen);
const SafeFieldGuideScreen = withBoundary('FieldGuide', FieldGuideScreen);
const SafeReflectionsScreen = withBoundary('Reflections', ReflectionsScreen);
const SafeSettingsScreen = withBoundary('Settings', SettingsScreen);

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const renderQuiltIcon = (props: TabIconProps) => <QuiltIcon {...props} />;
const renderExperimentsIcon = (props: TabIconProps) => <ExperimentsIcon {...props} />;
const renderInsightsIcon = (props: TabIconProps) => <InsightsIcon {...props} />;
const renderCircleIcon = (props: TabIconProps) => <CircleIcon {...props} />;

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        // Screens draw their own SafeArea-padded headers.
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.paperRaised },
        // Typewriter face on the tab labels too — device test showed them
        // falling back to system sans without an explicit fontFamily.
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 11, fontWeight: '400' },
      }}
    >
      <Tab.Screen
        name="QuiltTab"
        component={SafeQuiltScreen}
        options={{ title: 'Layers', tabBarIcon: renderQuiltIcon }}
      />
      <Tab.Screen
        name="ExperimentsTab"
        component={SafeExperimentsScreen}
        options={{ title: 'Experiments', tabBarIcon: renderExperimentsIcon }}
      />
      <Tab.Screen
        name="InsightsTab"
        component={SafeInsightsScreen}
        options={{ title: 'Insights', tabBarIcon: renderInsightsIcon }}
      />
      <Tab.Screen
        name="CircleTab"
        component={SafeCircleScreen}
        options={{ title: 'Circle', tabBarIcon: renderCircleIcon }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  // Computed ONCE at mount (lazy useState initializer): all routes stay
  // registered; only the starting point differs. Post-mount changes to
  // onboardingCompletedAt navigate explicitly (OnboardingScreen resets to
  // Main) rather than re-picking the initial route.
  const [initialRoute] = React.useState(() =>
    pickInitialRoute(useSettingsStore.getState().onboardingCompletedAt)
  );

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={SafeOnboardingScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="CheckInFlow"
          component={SafeCheckInFlowScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="JudgmentFlow"
          component={SafeJudgmentFlowScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="PracticeFlow"
          component={SafePracticeFlowScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="Breathing"
          component={SafeBreathingScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="NameItSetup"
          component={SafeNameItSetupScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="FieldGuide" component={SafeFieldGuideScreen} />
        <Stack.Screen name="Reflections" component={SafeReflectionsScreen} />
        <Stack.Screen name="Settings" component={SafeSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
