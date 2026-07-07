// Shared header for modal flows: title + a close X. Kept as one component so
// the three modal skeletons (check-in / judgment / name-it) stay identical.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { colors, hitTarget, spacing, typography } from '@/constants/theme';

interface Props {
  title: string;
  closeTestID: string;
  onClose(): void;
}

export function ModalHeader({ title, closeTestID, onClose }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        testID={closeTestID}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.close}
        onPress={onClose}
      >
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
          <Line x1={4} y1={4} x2={16} y2={16} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={16} y1={4} x2={4} y2={16} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    // Close button + wrappable title: top-align, never centre (forge
    // elastic-layout anti-pattern).
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    flex: 1,
    flexWrap: 'wrap',
  },
  close: {
    minWidth: hitTarget,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ModalHeader;
