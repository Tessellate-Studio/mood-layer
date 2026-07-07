// In-house bottom sheet. We deliberately DON'T use @gorhom/bottom-sheet: its
// Reanimated-4 / RN-0.83 compatibility is unproven on this stack, and a modal
// backdrop + a single slide/pan animation is small enough to own outright.
// A native <Modal> gives us the focus trap, back-button handling, and portal
// for free; Reanimated drives only the slide + backdrop fade.

import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, motion, spacing } from '@/constants/theme';
import { useMotion } from '@/hooks/useMotion';

interface Props {
  visible: boolean;
  onClose(): void;
  children: React.ReactNode;
  testID?: string;
}

/** Drag past this many px downward on release dismisses the sheet. */
const DISMISS_THRESHOLD = 80;
/** Fallback slide distance before the sheet has measured its own height. */
const FALLBACK_HEIGHT = 480;

export function Sheet({ visible, onClose, children, testID }: Props) {
  const insets = useSafeAreaInsets();
  const { reduced: reduceMotion } = useMotion();

  const sheetHeight = useSharedValue(FALLBACK_HEIGHT);
  const translateY = useSharedValue(FALLBACK_HEIGHT);
  const backdrop = useSharedValue(0);

  // Slide in on show, out on hide. Under reduce-motion the sheet simply
  // appears/disappears (no translate), per the hard rule.
  React.useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        translateY.value = 0;
        backdrop.value = 1;
      } else {
        translateY.value = withTiming(0, { duration: motion.gentleMs });
        backdrop.value = withTiming(1, { duration: motion.gentleMs });
      }
    } else {
      translateY.value = reduceMotion
        ? sheetHeight.value
        : withTiming(sheetHeight.value, { duration: motion.gentleMs });
      backdrop.value = reduceMotion ? 0 : withTiming(0, { duration: motion.gentleMs });
    }
    // sheetHeight/backdrop/translateY are stable shared-value refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion]);

  // Pan-down-to-dismiss: the sheet follows the finger (down only); a release
  // past the threshold closes, otherwise it springs back to rest.
  const pan = Gesture.Pan()
    .onChange((e) => {
      const next = translateY.value + e.changeY;
      translateY.value = next < 0 ? 0 : next;
    })
    .onEnd(() => {
      if (translateY.value > DISMISS_THRESHOLD) {
        onClose();
      } else {
        translateY.value = withSpring(0, motion.spring);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        {/* Backdrop: fades in, taps through to close. */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={styles.fill}
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            testID={testID}
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + spacing.lg },
              sheetStyle,
            ]}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0) sheetHeight.value = h;
            }}
          >
            {/* Drag handle — a decorative grab bar. */}
            <View style={styles.handle} pointerEvents="none" />
            {/* Stop backdrop taps from bubbling out through the sheet body. */}
            <Pressable onPress={() => {}}>{children}</Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
    padding: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.inkFaint,
    marginBottom: spacing.md,
  },
});

export default Sheet;
