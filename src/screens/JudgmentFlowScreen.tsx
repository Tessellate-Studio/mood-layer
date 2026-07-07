// "Under the judgment" modal. Skeleton phase — the real guided flow (target →
// judgment → what's under it → optional free-writing) lands in P10.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ModalHeader from '@/components/ModalHeader';
import { colors, spacing, typography } from '@/constants/theme';

export default function JudgmentFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-judgment">
      <ModalHeader
        title="Under the judgment"
        closeTestID="judgment-close"
        onClose={() => navigation.goBack()}
      />
      {/* Real judgment-experiment flow lands in P10. */}
      <Text style={styles.placeholder}>
        Every judgment points at a feeling that wants attention — the guided flow arrives soon.
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
