// In-house bottom sheet. We deliberately DON'T use @gorhom/bottom-sheet: its
// Reanimated-4 / RN-0.83 compatibility is unproven on this stack, and a modal
// backdrop + a single slide/pan animation is small enough to own outright.
// A native <Modal> gives us the focus trap, back-button handling, and portal
// for free; Reanimated drives only the slide + backdrop fade.

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, hitTarget, motion, spacing, typography } from '@/constants/theme';
import { useMotion } from '@/hooks/useMotion';

interface Props {
  visible: boolean;
  onClose(): void;
  children: React.ReactNode;
  /** Static title, rendered in the (non-scrolling) grab area with the handle
   *  so the whole top of the sheet can be dragged down to dismiss. A title
   *  inside a scrolling child is NOT draggable — the scroll takes the touch. */
  title?: string;
  testID?: string;
}

/** Drag past this many px downward on release dismisses the sheet. */
const DISMISS_THRESHOLD = 80;
/** Fallback slide distance before the sheet has measured its own height. */
const FALLBACK_HEIGHT = 480;

export function Sheet({ visible, onClose, children, title, testID }: Props) {
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
        // onEnd runs as a worklet on the UI thread; onClose is a plain JS
        // function, so it MUST go through runOnJS — a direct call is a fatal
        // UI-runtime error that kills the app (regression #23).
        runOnJS(onClose)();
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
            {/* The grab area: a real 44dp target holding the handle bar and,
                when given, the sheet's title. Everything here is OUTSIDE any
                scrolling child, so a drag that starts on it reaches the pan
                instead of scrolling the body — a 4px handle bar alone left
                nothing to grab (device feedback 2026-09-02). */}
            <View style={styles.grabArea} testID={testID ? `${testID}-grab` : undefined}>
              <View style={styles.handle} pointerEvents="none" />
              {title ? (
                <Text style={styles.title} accessibilityRole="header">
                  {title}
                </Text>
              ) : null}
            </View>
            {/* Render children directly: the sheet sits above the backdrop in
                the tree, so taps here never reach the backdrop. A wrapping
                Pressable would collapse the whole sheet into one screen-reader
                "button" and swallow inner scrolling. */}
            {children}
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
  grabArea: {
    // One touch target's worth of draggable sheet, minimum — the handle bar
    // is 4px of ink but the whole zone is what the finger gets.
    minHeight: hitTarget,
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.inkFaint,
  },
  title: {
    ...typography.title,
  },
});

export default Sheet;
