import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EmotionHelperSheet from '@/components/EmotionHelperSheet';
import { colors } from '@/constants/theme';
import AppNavigator from '@/navigation/AppNavigator';
import { useHelperSheetStore } from '@/store/helperSheetStore';

export default function App() {
  // Keys here ARE the fontFamily strings used in theme.ts (fonts.display /
  // fonts.displayEmphasis) — each weight its own family, never synthetic bold.
  const [fontsLoaded] = useFonts({
    'Lora-Regular': require('./assets/fonts/Lora-Regular.ttf'),
    'Lora-Medium': require('./assets/fonts/Lora-Medium.ttf'),
  });

  // Helper sheet host: one instance for the whole app so any screen can open
  // an emotion's explainer through useHelperSheetStore, no prop drilling.
  const helperFamily = useHelperSheetStore((s) => s.family);
  const closeHelper = useHelperSheetStore((s) => s.close);

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
