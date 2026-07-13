// A folded-by-default emotion-family group: a header row (family name + one
// quiet preview line) that unfolds its word chips on tap. Born from user
// feedback (2026-07-13): nine fully-open families read as a wall of ~50
// chips — exactly wrong for someone already overwhelmed. Folded is the calm
// default; the preview hints at the range without asking to be read. The
// preview stays inkMuted (7:1), never a sub-AA fade — contrast is a hard rule.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, hitTarget, spacing, typography } from '@/constants/theme';
import type { EmotionFamily } from '@/content/emotions';

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
}

export function FamilyGroup({ family, expanded, onToggle, testID, preview, pinned, children }: Props) {
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
        accessibilityLabel={`${family.label}. ${expanded ? 'Fold' : 'Unfold'} its words.`}
        style={styles.header}
        onPress={onToggle}
      >
        <View style={styles.headerText}>
          <Text style={typography.overline}>{family.label}</Text>
          {!expanded ? (
            <Text style={styles.preview} numberOfLines={1}>
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
  preview: {
    ...typography.caption,
  },
  toggle: {
    ...typography.heading,
    color: colors.inkSoft,
  },
});

export default FamilyGroup;
