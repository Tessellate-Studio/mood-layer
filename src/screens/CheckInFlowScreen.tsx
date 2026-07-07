// Check-in modal. Skeleton phase — the real multi-step flow (masking states →
// emotion words → intensity → body sensations → resistance tells) lands in P8.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ModalHeader from '@/components/ModalHeader';
import { colors, spacing, typography } from '@/constants/theme';

export default function CheckInFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-checkin">
      <ModalHeader
        title="What's here right now?"
        closeTestID="checkin-close"
        onClose={() => navigation.goBack()}
      />
      {/* Real multi-step check-in flow lands in P8. */}
      <Text style={styles.placeholder}>
        This is where you&apos;ll name what&apos;s here — the flow is still being stitched.
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
