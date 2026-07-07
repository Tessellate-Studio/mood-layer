// Home tab: the quilt. This phase ships the skeleton — header + empty state +
// a day/emotion list stand-in + the check-in FAB.

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { borderRadius, colors, hitTarget, spacing, textures, typography } from '@/constants/theme';
import { findEmotionWord } from '@/content/emotions';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useCheckInStore } from '@/store/checkInStore';
import type { CheckIn } from '@/types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FAB_SIZE = hitTarget + 12;

// Gear: a circle with 8 spokes, same line language as the tab icons.
const GEAR_SPOKES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI) / 4;
  return {
    x1: 12 + Math.cos(angle) * 6,
    y1: 12 + Math.sin(angle) * 6,
    x2: 12 + Math.cos(angle) * 9.5,
    y2: 12 + Math.sin(angle) * 9.5,
  };
});

function emotionLabels(checkIn: CheckIn): string {
  return checkIn.emotions
    .map((sel) => findEmotionWord(sel.emotionId)?.word.label ?? sel.emotionId)
    .join(', ');
}

export default function QuiltScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const checkIns = useCheckInStore((s) => s.checkIns);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-quilt">
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your quilt</Text>
        <Pressable
          testID="open-settings"
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.iconButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={4} stroke={colors.ink} strokeWidth={1.5} />
            {GEAR_SPOKES.map((spoke, index) => (
              <Line
                key={index}
                x1={spoke.x1}
                y1={spoke.y1}
                x2={spoke.x2}
                y2={spoke.y2}
                stroke={colors.ink}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            ))}
          </Svg>
        </Pressable>
      </View>

      {checkIns.length === 0 ? (
        <View style={styles.empty}>
          <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
            <Rect
              x={1.5}
              y={1.5}
              width={61}
              height={61}
              rx={borderRadius.sm}
              stroke={colors.inkFaint}
              strokeWidth={1.5}
              strokeDasharray={[...textures.stitchDash]}
            />
          </Svg>
          <Text style={styles.emptyText}>Your quilt begins with one square.</Text>
        </View>
      ) : (
        /* Quilt canvas lands in P7 — this list is a plain stand-in. */
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={typography.label}>{item.dayKey}</Text>
              <Text style={styles.rowEmotions}>{emotionLabels(item)}</Text>
            </View>
          )}
        />
      )}

      <Pressable
        testID="checkin-fab"
        accessibilityRole="button"
        accessibilityLabel="Add a check-in"
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => navigation.navigate('CheckInFlow', { source: 'manual' })}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Line x1={12} y1={5} x2={12} y2={19} stroke={colors.paper} strokeWidth={2} strokeLinecap="round" />
          <Line x1={5} y1={12} x2={19} y2={12} stroke={colors.paper} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
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
  iconButton: {
    minWidth: hitTarget,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: spacing.md,
    // Keep the last row clear of the FAB.
    paddingBottom: FAB_SIZE + spacing.xxl,
    gap: spacing.sm,
  },
  row: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowEmotions: {
    ...typography.caption,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
