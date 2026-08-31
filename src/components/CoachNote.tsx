// A first-visit helper note: one opaque raised card per screen, lifted off
// the page with a real shadow and tinted to the screen's family hue, shown
// once per install (settingsStore.dismissedTips) and gone for good on tap —
// the whole card is the dismiss target, well past the 44dp hit rule.
// CoachNote owns the floating frame (absolute, safe-area top, spacing.md
// gutters); the screen passes only `topOffset`, the height of its own
// chrome. Opaque by contract: the old 94% paperVeil card read as damage,
// not as a card — it silently veiled whatever it crossed (regression #24).
// Copy lives in content/coachMarks.ts.

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  borderRadius,
  colors,
  motion,
  mutedPalette,
  shadows,
  spacing,
  typography,
} from '@/constants/theme';
import {
  COACH_MARKS,
  COACH_NOTE_DISMISS_HINT,
  COACH_NOTE_OVERLINE,
  type CoachMarkId,
} from '@/content/coachMarks';
import { useMotion } from '@/hooks/useMotion';
import { useSettingsStore } from '@/store/settingsStore';
import type { EmotionFamilyId } from '@/types/models';

interface Props {
  id: CoachMarkId;
  /** Height of the screen's own chrome above the note (header, title…). */
  topOffset: number;
  /** The screen's layer hue — tints the card border only; text stays ink. */
  family: EmotionFamilyId;
}

export function CoachNote(props: Props) {
  const dismissed = useSettingsStore((s) => s.dismissedTips.includes(props.id));
  // Dismissed is the permanent steady state — mount none of the timer or
  // animation machinery once the note has done its job.
  if (dismissed) return null;
  return <CoachNoteCard {...props} />;
}

function CoachNoteCard({ id, topOffset, family }: Props) {
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

  return (
    <Animated.View
      style={[entryStyle, styles.frame, { top: insets.top + spacing.md + topOffset }]}
      testID={`coach-${id}`}
    >
      <Pressable
        testID={`coach-dismiss-${id}`}
        accessibilityRole="button"
        accessibilityLabel={mark}
        accessibilityHint="Dismisses this note"
        style={[styles.card, { borderColor: mutedPalette[family].border }]}
        onPress={() => dismissTip(id)}
      >
        <Text style={typography.overline}>{COACH_NOTE_OVERLINE}</Text>
        <Text style={typography.body}>{mark}</Text>
        <Text style={typography.caption}>{COACH_NOTE_DISMISS_HINT}</Text>
      </Pressable>
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
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.floating,
  },
});

export default CoachNote;
