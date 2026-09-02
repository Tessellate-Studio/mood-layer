// A first-visit helper note: one tinted note card per screen (NoteCard is
// the shared face), floated over a dimmed page, shown once per install
// (settingsStore.dismissedTips) and gone for good on a tap anywhere — the
// card or the dim. The dim is the point: on a page of words, a card of words
// on the same cream read as more page (user, 2026-09-02); a scrim says "read
// this first" the same way the sheet's backdrop does — one grammar for
// anything that owns the screen for a moment.
//
// The card mounts at full strength with the screen — no entry beat, no fade
// on the card itself. The old beat-then-fade arrived late and looked patchy
// (an elevation shadow animating its opacity on Android; user, 2026-09-02).
// Only the scrim fades, and a plain flat view fades cleanly. CoachNote owns
// the floating frame (safe-area top, spacing.md gutters); the screen passes
// only `topOffset`, the height of its own chrome. Copy: content/coachMarks.ts.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { noteCardStyle } from '@/components/NoteCard';
import { colors, motion, spacing, typography } from '@/constants/theme';
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
  /** The screen's layer hue — tints the card; text stays ink. */
  family: EmotionFamilyId;
}

export function CoachNote(props: Props) {
  const dismissed = useSettingsStore((s) => s.dismissedTips.includes(props.id));
  // Dismissed is the permanent steady state — mount none of the animation
  // machinery once the note has done its job.
  if (dismissed) return null;
  return <CoachNoteCard {...props} />;
}

function CoachNoteCard({ id, topOffset, family }: Props) {
  const dismissTip = useSettingsStore((s) => s.dismissTip);
  const insets = useSafeAreaInsets();
  const { reduced } = useMotion();
  const scrim = useSharedValue(reduced ? 1 : 0);

  React.useEffect(() => {
    // Hard rule (CLAUDE.md): animations disable cleanly — snap to rest.
    scrim.value = reduced ? 1 : withTiming(1, { duration: motion.gentleMs });
  }, [scrim, reduced]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));
  const dismiss = () => dismissTip(id);
  const mark = COACH_MARKS[id];

  return (
    <View style={StyleSheet.absoluteFill} testID={`coach-${id}`}>
      {/* The dim: a tap anywhere on it dismisses, same as the sheet backdrop. */}
      <Animated.View style={[styles.scrim, scrimStyle]} testID={`coach-dim-${id}`}>
        <Pressable
          testID={`coach-scrim-${id}`}
          accessibilityRole="button"
          accessibilityLabel="Dismiss the note"
          style={styles.fill}
          onPress={dismiss}
        />
      </Animated.View>
      <View style={[styles.frame, { top: insets.top + spacing.md + topOffset }]}>
        <Pressable
          testID={`coach-dismiss-${id}`}
          accessibilityRole="button"
          accessibilityLabel={mark}
          accessibilityHint="Dismisses this note"
          style={noteCardStyle(family)}
          onPress={dismiss}
        >
          <Text style={typography.overline}>{COACH_NOTE_OVERLINE}</Text>
          <Text style={typography.body}>{mark}</Text>
          <Text style={typography.caption}>{COACH_NOTE_DISMISS_HINT}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  frame: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
});

export default CoachNote;
