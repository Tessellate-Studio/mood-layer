import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import AppNavigator from '@/navigation/AppNavigator';

export default function App() {
  // Keys here ARE the fontFamily strings used in theme.ts (fonts.display /
  // fonts.displayEmphasis) — each weight its own family, never synthetic bold.
  const [fontsLoaded] = useFonts({
    'Lora-Regular': require('./assets/fonts/Lora-Regular.ttf'),
    'Lora-Medium': require('./assets/fonts/Lora-Medium.ttf'),
  });

  if (!fontsLoaded) {
    // Paper-blank while fonts land (splash covers this in practice).
    return <View style={styles.loading} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="dark" backgroundColor={colors.paper} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, backgroundColor: colors.paper },
});
