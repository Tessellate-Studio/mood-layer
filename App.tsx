import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EmotionHelperSheet from '@/components/EmotionHelperSheet';
import { colors } from '@/constants/theme';
import AppNavigator from '@/navigation/AppNavigator';
import { navigate } from '@/navigation/navigationRef';
import { configureHandler } from '@/services/notifications';
import { useHelperSheetStore } from '@/store/helperSheetStore';

export default function App() {
  // Keys here ARE the fontFamily strings used in theme.ts (fonts.display /
  // displayEmphasis / body) — each weight its own family, never synthetic bold.
  // Courier Prime gives the whole app its typed-on-paper voice.
  const [fontsLoaded] = useFonts({
    'CourierPrime-Regular': require('./assets/fonts/CourierPrime-Regular.ttf'),
    'CourierPrime-Bold': require('./assets/fonts/CourierPrime-Bold.ttf'),
  });

  // Helper sheet host: one instance for the whole app so any screen can open
  // an emotion's explainer through useHelperSheetStore, no prop drilling.
  const helperFamily = useHelperSheetStore((s) => s.family);
  const closeHelper = useHelperSheetStore((s) => s.close);

  // "Name it" notifications: install the foreground handler once, deep-link a
  // tapped reminder into the check-in flow (both warm-start responses and the
  // cold-start case). Guarded so the jest mock (getLast… → null) is a no-op.
  React.useEffect(() => {
    configureHandler();

    const routeFrom = (data: unknown) => {
      const d = data as { route?: string; source?: string } | undefined;
      if (d?.route === 'CheckInFlow') navigate('CheckInFlow', { source: 'name-it' });
    };

    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      routeFrom(r.notification.request.content.data);
    });

    // Cold start: app launched by tapping a reminder.
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) routeFrom(r.notification.request.content.data);
    });

    return () => sub.remove();
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
