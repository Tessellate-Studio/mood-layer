import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EmotionHelperSheet from '@/components/EmotionHelperSheet';
import { FONT_ASSETS } from '@/constants/fontAssets';
import { colors } from '@/constants/theme';
import AppNavigator from '@/navigation/AppNavigator';
import { navigate } from '@/navigation/navigationRef';
import { configureHandler, subscribeToNotificationTaps } from '@/services/notifications';
import { syncCircleReminders, useCircleStore } from '@/store/circleStore';
import { useHelperSheetStore } from '@/store/helperSheetStore';

export default function App() {
  // The map's keys ARE the fontFamily strings used in theme.ts — kept in
  // src/constants/fontAssets.ts so a guardrail test can pin them to the theme
  // tokens (a drift means Android silently drops the typewriter face).
  const [fontsLoaded] = useFonts(FONT_ASSETS);

  // Helper sheet host: one instance for the whole app so any screen can open
  // an emotion's explainer through useHelperSheetStore, no prop drilling.
  const helperFamily = useHelperSheetStore((s) => s.family);
  const closeHelper = useHelperSheetStore((s) => s.close);

  // "Name it" notifications: install the foreground handler once and deep-link
  // tapped reminders (warm + cold start) into the check-in flow. All routed
  // through the notifications service so its Expo Go import guard is the single
  // choke point — importing expo-notifications here would crash Expo Go.
  React.useEffect(() => {
    configureHandler();
    return subscribeToNotificationTaps((data) => {
      const d = data as { route?: string; source?: string; personId?: string } | undefined;
      if (d?.route === 'CheckInFlow') {
        navigate('CheckInFlow', { source: 'name-it' });
      } else if (d?.route === 'Circle') {
        // Ask the Circle screen to open the share sheet for this person, then
        // deep-link to the Circle tab where that intent is picked up.
        if (d.personId) useCircleStore.getState().requestShare(d.personId);
        navigate('Main', { screen: 'CircleTab' });
      }
    });
  }, []);

  // Keep the Circle share reminders in step with the people list: reschedule on
  // app start, on every foreground, and whenever people/cadences change. Cancel
  // + reschedule from current people, so pausing or removing someone drops
  // their nudge. Local-only + no-op under Expo Go (see the notifications
  // service). Reminders only actually fire in a dev build.
  React.useEffect(() => {
    const sync = () => {
      void syncCircleReminders();
    };
    sync();
    const unsubStore = useCircleStore.subscribe((state, prev) => {
      if (state.people !== prev.people) sync();
    });
    const appStateSub = AppState.addEventListener('change', (status) => {
      if (status === 'active') sync();
    });
    return () => {
      unsubStore();
      appStateSub.remove();
    };
  }, []);

  if (!fontsLoaded) {
    // Paper-blank while fonts land (splash covers this in practice).
    return <View style={styles.loading} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppNavigator />
        <EmotionHelperSheet family={helperFamily} onClose={closeHelper} />
        <StatusBar style="dark" backgroundColor={colors.paper} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, backgroundColor: colors.paper },
});
