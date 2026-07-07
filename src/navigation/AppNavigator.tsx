import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

// Placeholder shell — replaced by the real navigator (tabs + modals) in the
// navigation phase.
export default function AppNavigator() {
  return (
    <View style={styles.container} testID="app-root">
      <Text style={typography.display}>The Mood Layer</Text>
      <Text style={[typography.body, styles.sub]}>track your emotional quilt</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sub: { marginTop: spacing.sm },
});
