// One week block of the quilt: a single SVG canvas of patches + empty-day
// seams, weekday labels down the left margin, and one RN Pressable overlay
// per patch. Press targets are RN views (not SVG onPress) so screen readers
// can focus them and the role/label contract holds — see QuiltPatch.tsx.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';

import { colors, motion, spacing, textures, typography } from '@/constants/theme';
import { useMotion } from '@/hooks/useMotion';
import type { WeekBlock } from '@/utils/quiltLayout';
import QuiltPatch from '@/components/QuiltPatch';

/** Width reserved for the weekday labels left of the canvas. */
const DEFAULT_LEFT_MARGIN = 34;

interface Props {
  block: WeekBlock;
  width: number;
  leftMargin?: number;
  /** checkInId of a just-stitched patch to animate in, or null. */
  animateId?: string | null;
  onPatchPress: (checkInId: string) => void;
}

/**
 * Stitch-in effect: an overlay View fading paper → transparent with a small
 * scale spring, sitting ON TOP of the already-drawn patch. Overlay animation
 * instead of animated SVG props — the jest reanimated mock and rnsvg's
 * AnimatedProps support don't mix; the visual result is identical.
 */
function StitchInOverlay({ rect }: { rect: { left: number; top: number; width: number; height: number } }) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.96);
  React.useEffect(() => {
    opacity.value = withTiming(0, { duration: motion.stitchMs });
    scale.value = withSpring(1, motion.spring);
  }, [opacity, scale]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.stitchOverlay, rect, style]}
    />
  );
}

function QuiltWeekInner({
  block,
  width,
  leftMargin = DEFAULT_LEFT_MARGIN,
  animateId = null,
  onPatchPress,
}: Props) {
  const { reduced: reduceMotion } = useMotion();

  const canvasWidth = width - leftMargin;
  const animatedPatch = animateId
    ? block.rows.flatMap((r) => r.patches).find((p) => p.checkInId === animateId)
    : undefined;

  return (
    <View>
      <Text style={styles.weekLabel}>{block.label}</Text>
      <View style={{ height: block.totalHeight }}>
        <Svg width={width} height={block.totalHeight}>
          <G transform={`translate(${leftMargin}, 0)`}>
            {block.rows.map((row) =>
              row.empty ? (
                // Empty day: a thin dashed seam across the canvas.
                <Line
                  key={row.dayKey}
                  x1={0}
                  y1={row.y + row.height / 2}
                  x2={canvasWidth}
                  y2={row.y + row.height / 2}
                  stroke={colors.inkFaint}
                  strokeWidth={1}
                  strokeDasharray={[...textures.stitchDashFine]}
                />
              ) : (
                row.patches.map((patch) => (
                  <QuiltPatch key={patch.checkInId} layout={patch} />
                ))
              )
            )}
          </G>
        </Svg>

        {/* Weekday labels, absolutely positioned at each row's y. */}
        {block.rows.map((row) =>
          row.label ? (
            <Text
              key={`label-${row.dayKey}`}
              style={[styles.dayLabel, { top: row.y }]}
            >
              {row.label}
            </Text>
          ) : null
        )}

        {/* One a11y-focusable pressable overlay per patch. */}
        {block.rows.flatMap((row) =>
          row.patches.map((patch) => (
            <Pressable
              key={`press-${patch.checkInId}`}
              testID={`patch-${patch.checkInId}`}
              accessibilityRole="button"
              accessibilityLabel={patch.a11yLabel}
              style={{
                position: 'absolute',
                left: leftMargin + patch.x,
                top: patch.y,
                width: patch.w,
                height: patch.h,
              }}
              onPress={() => onPatchPress(patch.checkInId)}
            />
          ))
        )}

        {animatedPatch && !reduceMotion ? (
          <StitchInOverlay
            rect={{
              left: leftMargin + animatedPatch.x,
              top: animatedPatch.y,
              width: animatedPatch.w,
              height: animatedPatch.h,
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export const QuiltWeek = React.memo(QuiltWeekInner);

const styles = StyleSheet.create({
  weekLabel: {
    ...typography.overline,
    marginBottom: spacing.sm,
  },
  dayLabel: {
    position: 'absolute',
    left: 0,
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    // Weekday labels are meaningful text, so inkMuted (7:1) not inkFaint
    // (~3.3:1, decoration-only) — WCAG 2.1 AA.
    color: colors.inkMuted,
  },
  stitchOverlay: {
    position: 'absolute',
    backgroundColor: colors.paper,
  },
});

export default QuiltWeek;
