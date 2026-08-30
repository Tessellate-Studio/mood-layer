// A first-visit helper note: one soft floating card per screen, pointing at
// the key action, shown once per install (settingsStore.dismissedTips) and
// gone for good on tap — the whole card is the dismiss target, well past the
// 44dp hit rule. The parent screen supplies absolute placement via `style`;
// the card renders above the content with no scrim, so the screen breathes
// through the paperVeil fill. Copy lives in content/coachMarks.ts.

import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

import { borderRadius, colors, hitTarget, motion, spacing, typography } from '@/constants/theme';
import { COACH_MARKS, type CoachMarkId } from '@/content/coachMarks';
import { useMotion } from '@/hooks/useMotion';
import { useSettingsStore } from '@/store/settingsStore';

interface Props {
  id: CoachMarkId;
  /** Which edge grows the little triangle toward the anchored action. */
  pointer?: 'up' | 'down' | 'none';
  /** Pointer tip distance from the note's RIGHT edge; omit to centre it. */
  pointerInset?: number;
  /** Absolute placement, supplied by the parent screen. */
  style?: StyleProp<ViewStyle>;
}

export function CoachNote({ id, pointer = 'none', pointerInset, style }: Props) {
  const dismissed = useSettingsStore((s) => s.dismissedTips.includes(id));
  const dismissTip = useSettingsStore((s) => s.dismissTip);
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

  if (dismissed || !mounted) return null;

  const mark = COACH_MARKS[id];
  const triangle = (direction: 'up' | 'down') => (
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
          points={direction === 'up' ? '8,0 16,8 0,8' : '0,0 16,0 8,8'}
          fill={colors.paperVeil}
        />
      </Svg>
    </View>
  );

  return (
    <Animated.View style={[entryStyle, style]} testID={`coach-${id}`}>
      {pointer === 'up' ? triangle('up') : null}
      <Pressable
        testID={`coach-dismiss-${id}`}
        accessibilityRole="button"
        accessibilityLabel={mark.text}
        accessibilityHint="Dismisses this note"
        style={styles.card}
        onPress={() => dismissTip(id)}
      >
        <Text style={styles.text}>{mark.text}</Text>
      </Pressable>
      {pointer === 'down' ? triangle('down') : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperVeil,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    minHeight: hitTarget,
    justifyContent: 'center',
  },
  text: {
    ...typography.body,
  },
  pointerHolder: {
    alignItems: 'center',
  },
});

export default CoachNote;
