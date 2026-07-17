// Box breathing (user-requested 2026-07-17): in for 4, hold for 4, out for
// 4, hold for 4, repeat. A soft feeling-cloth square breathes in that exact
// rhythm while the phase word types itself below; the counts are carried by
// the animation, not a clock readout — nothing to chase, nothing to score
// (never gamify, anti-pattern #3). Under reduce-motion the square sits still
// and the phase words alone carry the pace.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import ModalHeader from '@/components/ModalHeader';
import PaperTexture from '@/components/PaperTexture';
import { borderRadius, colors, familyPalette, hitTarget, motion, spacing, typography } from '@/constants/theme';
import { useMotion } from '@/hooks/useMotion';

const SQUARE = 180;
// Anticipation teal — the layer hue for leaning toward what's coming.
const BREATH_FAMILY = 'anticipation' as const;

const PHASES = ['breathe in', 'hold', 'breathe out', 'hold'] as const;

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { reduced } = useMotion();

  // Phase label: a plain JS interval in the same 4-count rhythm. Kept even
  // under reduce-motion — the words ARE the exercise then.
  const [phaseIndex, setPhaseIndex] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(
      () => setPhaseIndex((i) => (i + 1) % PHASES.length),
      motion.boxBreathePhaseMs
    );
    return () => clearInterval(t);
  }, []);

  const scale = useSharedValue<number>(motion.boxBreatheScale);
  React.useEffect(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    // One 16s box: grow over 4 (in), stay large 4 (hold), shrink over 4
    // (out), stay small 4 (hold). Timings mirror the phase-label interval.
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.boxBreathePhaseMs }),
        withTiming(1, { duration: motion.boxBreathePhaseMs }),
        withTiming(motion.boxBreatheScale, { duration: motion.boxBreathePhaseMs }),
        withTiming(motion.boxBreatheScale, { duration: motion.boxBreathePhaseMs })
      ),
      -1
    );
    return () => cancelAnimation(scale);
    // scale is a stable shared-value ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-breathing">
      <PaperTexture />
      <ModalHeader
        title="Box breathing"
        closeTestID="breathing-close"
        onClose={() => navigation.goBack()}
      />

      <View style={styles.body}>
        <View style={styles.squareHolder}>
          <Animated.View style={[styles.square, breatheStyle]} />
        </View>
        <Text style={styles.phase} testID="breathing-phase">
          {PHASES[phaseIndex]}
        </Text>
        <Text style={styles.hint}>
          Four counts in, four held, four out, four held — let the square set
          the pace. A few rounds is plenty.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          testID="breathing-done"
          accessibilityRole="button"
          style={styles.primaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryText}>Set it down</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  squareHolder: {
    // Reserves the square's FULL size, so the breath never shifts layout —
    // the square only ever contracts inside this box.
    width: SQUARE,
    height: SQUARE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  square: {
    width: SQUARE,
    height: SQUARE,
    borderRadius: SQUARE * 0.35,
    backgroundColor: familyPalette[BREATH_FAMILY].shades[2],
    borderWidth: 1.5,
    borderColor: familyPalette[BREATH_FAMILY].thread,
  },
  phase: {
    ...typography.title,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  footer: {
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    minHeight: hitTarget,
    backgroundColor: colors.ink,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    ...typography.label,
    color: colors.paper,
  },
});
