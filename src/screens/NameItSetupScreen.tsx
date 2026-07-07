// "Name it" reminder setup modal. Skeleton phase — the real setup (times per
// day, waking window, notification scheduling) lands in P10.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ModalHeader from '@/components/ModalHeader';
import { colors, spacing, typography } from '@/constants/theme';

export default function NameItSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-name-it">
      <ModalHeader title="Name it" closeTestID="name-it-close" onClose={() => navigation.goBack()} />
      {/* Real name-it setup (reminder schedule) lands in P10. */}
      <Text style={styles.placeholder}>
        Gentle reminders to pause and name what&apos;s here — setup arrives soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  placeholder: {
    ...typography.body,
    marginTop: spacing.lg,
  },
});
