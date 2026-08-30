// A first-visit helper note: one soft floating card per screen, pointing at
// the key action, shown once per install (settingsStore.dismissedTips) and
// gone for good on tap — the whole card is the dismiss target, well past the
// 44dp hit rule. CoachNote owns the floating frame (absolute, safe-area top,
// spacing.md gutters); the screen passes only `topOffset`, the height of its
// own chrome. No scrim — the screen breathes through the paperVeil fill.
// Copy lives in content/coachMarks.ts.

import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';

import { borderRadius, colors, hitTarget, motion, spacing, typography } from '@/constants/theme';
import { COACH_MARKS, type CoachMarkId } from '@/content/coachMarks';
import { useMotion } from '@/hooks/useMotion';
import { useSettingsStore } from '@/store/settingsStore';

interface Props {
  id: CoachMarkId;
  /** Height of the screen's own chrome above the note (header, title…). */
  topOffset: number;
  /** Which edge grows the little triangle toward the anchored action. */
  pointer?: 'up' | 'down' | 'none';
  /** Pointer tip distance from the note's RIGHT edge; omit to centre it. */
  pointerInset?: number;
  /** Escape hatch for per-screen frame overrides (e.g. a wider left gutter). */
  style?: StyleProp<ViewStyle>;
}

export function CoachNote(props: Props) {
  const dismissed = useSettingsStore((s) => s.dismissedTips.includes(props.id));
  // Dismissed is the permanent steady state — mount none of the timer or
  // animation machinery once the note has done its job.
  if (dismissed) return null;
  return <CoachNoteCard {...props} />;
}

function CoachNoteCard({ id, topOffset, pointer = 'none', pointerInset, style }: Props) {
  const dismissTip = useSettingsStore((s) => s.dismissTip);
  const insets = useSafeAreaInsets();
  const { reduced } = useMotion();
  // Nothing mounts during the entry beat: RN opacity does not gate touches,
  // so an invisible-but-mounted card would swallow taps meant for the content
  // underneath — and permanently dismiss a note the user never saw
  // (adversarial review, 2026-08-30). Mount after the beat, then fade.
  const [mounted, setMounted] = React.useState(reduced);
  const opacity = useSharedValue(reduced ? 1 : 0);

  React.useEffect(() => {
    if (reduced) {
      // Hard rule (CLAUDE.md): animations disable cleanly — snap to rest.
      setMounted(true);
      opacity.value = 1;
      return;
    }
    // A gentle beat before a gentle fade, both from the shared motion token —
    // the note arrives after the screen has settled, not with it.
    const beat = setTimeout(() => {
      setMounted(true);
      opacity.value = withTiming(1, { duration: motion.gentleMs });
    }, motion.gentleMs);
    return () => clearTimeout(beat);
  }, [opacity, reduced]);

  const entryStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!mounted) return null;

  const mark = COACH_MARKS[id];
  const triangle =
    pointer === 'none' ? null : (
      <View
        style={[
          styles.pointerHolder,
          pointerInset !== undefined
            ? { alignItems: 'flex-end', paddingRight: pointerInset }
            : null,
        ]}
      >
        <Svg width={16} height={8} viewBox="0 0 16 8">
          <Polygon
            points={pointer === 'up' ? '8,0 16,8 0,8' : '0,0 16,0 8,8'}
            fill={colors.paperVeil}
          />
        </Svg>
      </View>
    );

  return (
    <Animated.View
      style={[
        entryStyle,
        styles.frame,
        { top: insets.top + spacing.md + topOffset },
        style,
      ]}
      testID={`coach-${id}`}
    >
      {pointer === 'up' ? triangle : null}
      <Pressable
        testID={`coach-dismiss-${id}`}
        accessibilityRole="button"
        accessibilityLabel={mark}
        accessibilityHint="Dismisses this note"
        style={styles.card}
        onPress={() => dismissTip(id)}
      >
        <Text style={typography.body}>{mark}</Text>
      </Pressable>
      {pointer === 'down' ? triangle : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  card: {
    backgroundColor: colors.paperVeil,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    minHeight: hitTarget,
    justifyContent: 'center',
  },
  pointerHolder: {
    alignItems: 'center',
  },
});

export default CoachNote;
