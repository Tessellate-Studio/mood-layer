// The frame every page screen wears, so they read as one app (user,
// 2026-09-03: "Settings, field guide and Home page spacing and design from
// the header to footer look perfect. You need to extend this rule to others,
// in both empty and filled states"). Extracted from exactly those three, not
// invented:
//
//   1. Paper ground with the grain, side gutters of spacing.md.
//   2. The safe-area top plus spacing.md — on the OUTER frame, so the title
//      never slides under the status bar (Circle and Experiments had it on
//      their scroller's content instead, which is why their titles scrolled
//      away while the approved three kept theirs).
//   3. The title row is FIXED, outside the scroller — it is the page's
//      anchor, the thing the first-visit note measures itself against
//      (anti-pattern #9), and the frame owns the gap beneath it, which each
//      screen used to set for itself in four different ways.
//   4. The scroller's content ends on `screenContent` — one bottom token,
//      identical in the empty and filled states.
//
// The frame owns the note, so a screen cannot mount one with an unmeasured
// anchor: pass `note` and the offset comes from this component's own
// measurement. Screens keep their own scroller (FlatList/ScrollView/plain
// View) and pass `screenContent` as its contentContainerStyle bottom.
//
// Flow screens (check-in, judgment, practice, breathing, name-it, onboarding)
// are deliberately NOT framed this way: they are footer-driven wizards whose
// body is a single step, not a page with a title and a scroll.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CoachNote from '@/components/CoachNote';
import PaperTexture from '@/components/PaperTexture';
import { colors, spacing } from '@/constants/theme';
import type { CoachMarkId } from '@/content/coachMarks';
import { useMeasuredHeight } from '@/hooks/useMeasuredHeight';
import type { EmotionFamilyId } from '@/types/models';

interface Props {
  /** `screen-<name>`, the handle device tests and smoke tests reach for. */
  testID: string;
  /** The page's title row: fixed above the body, measured for the note. */
  header: React.ReactNode;
  /** First-visit helper note, anchored under the measured header. */
  note?: { id: CoachMarkId; family: EmotionFamilyId };
  /** The scrolling body — its own FlatList/ScrollView/View. */
  children: React.ReactNode;
}

export function ScreenFrame({ testID, header, note, children }: Props) {
  const insets = useSafeAreaInsets();
  const [headerHeight, onHeaderLayout] = useMeasuredHeight();

  return (
    <View style={[styles.frame, { paddingTop: insets.top + spacing.md }]} testID={testID}>
      <PaperTexture />
      <View
        testID={`${testID}-header`}
        style={styles.header}
        // Measured only when something anchors to it: an unread measurement
        // is a re-render on mount for nothing.
        onLayout={note ? onHeaderLayout : undefined}
      >
        {header}
      </View>
      {children}
      {note ? <CoachNote id={note.id} topOffset={headerHeight} family={note.family} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  content: {
    paddingBottom: spacing.xl,
  },
});

/**
 * Every framed screen's scroller ends here — the same breathing room under
 * the last card whether the page is full or empty.
 */
export const screenContent = styles.content;

export default ScreenFrame;
