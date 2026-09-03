// A folded-by-default emotion-family group: a header row (family name + one
// quiet preview line) that unfolds its word chips on tap. Born from user
// feedback (2026-07-13): nine fully-open families read as a wall of ~50
// chips — exactly wrong for someone already overwhelmed. Folded is the calm
// default; the preview hints at the range without asking to be read. It is
// still reading text, so it sits at body size in the body token's inkSoft
// (anti-pattern #10) — quiet by colour, never by a smaller face, and never a
// sub-AA fade; contrast is a hard rule.
//
// Holding the header row opens the family's own card (What it means, In the
// body, When resisted, An invitation) — the same tap-to-act/hold-to-learn
// idiom every word chip already teaches, extended to the family name itself.
// User, 2026-09-03: on check-in "family card is otherwise not displayed on
// this screen and it genuinely has some useful information."

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SectionHeader from '@/components/SectionHeader';
import { colors, hitTarget, spacing, typography } from '@/constants/theme';
import type { EmotionFamily } from '@/content/emotions';
import { useHelperSheetStore } from '@/store/helperSheetStore';

interface Props {
  family: EmotionFamily;
  expanded: boolean;
  onToggle(): void;
  testID: string;
  /** One muted line shown while folded; defaults to the gradient's first words. */
  preview?: string;
  /** Rendered while folded — e.g. already-chosen chips staying visible. */
  pinned?: React.ReactNode;
  children: React.ReactNode;
  /** Long-press doorway. Defaults to this family's own helper sheet, so
   *  every screen that lists families teaches on hold without wiring. */
  onLongPress?(): void;
}

export function FamilyGroup({
  family,
  expanded,
  onToggle,
  testID,
  preview,
  pinned,
  children,
  onLongPress,
}: Props) {
  const previewText =
    preview ??
    `${family.gradient
      .slice(0, 3)
      .map((w) => w.label.toLowerCase())
      .join(' · ')} …`;
  return (
    <View style={styles.group}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${family.label}. ${expanded ? 'Fold' : 'Unfold'} its words. Hold to learn about ${family.label}.`}
        style={styles.header}
        onPress={onToggle}
        onLongPress={onLongPress ?? (() => useHelperSheetStore.getState().openFamily(family.id))}
      >
        <View style={styles.headerText}>
          {/* Muted-layer treatment: the family's tinted section glyph does
              the naming, teaching the family↔hue pairing the quilt uses. */}
          <SectionHeader family={family.id} label={family.label} />
          {!expanded ? (
            <Text style={typography.body} numberOfLines={1}>
              {previewText}
            </Text>
          ) : null}
        </View>
        <Text style={styles.toggle} accessibilityElementsHidden>
          {expanded ? '–' : '+'}
        </Text>
      </Pressable>
      {expanded ? children : pinned ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  header: {
    minHeight: hitTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  toggle: {
    ...typography.heading,
    color: colors.inkSoft,
  },
});

export default FamilyGroup;
