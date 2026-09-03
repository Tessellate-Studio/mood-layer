// Word-level helper: what a SPECIFIC feeling actually is, and what people
// tend to do with it — situational, Atlas-of-Emotions style (atlasofemotions.
// org doesn't grade one emotion by strength; every state gets its own
// definition, plus constructive/ambiguous/destructive actions — a real third
// bucket, not a euphemism: plenty of reactions genuinely could go either way).
// Deliberately minimal — no family essay (What it means, In the body, When
// resisted, An invitation) here; user, 2026-09-03: "Only show the
// definition, the whole family card is unnecessary." The family stays
// reachable through its own dedicated entry points (Field Guide's nine
// families, a masking doorway's "learn about X") — this is the OTHER path,
// for holding a specific word.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { borderRadius, familyPalette, mutedPalette, spacing, typography } from '@/constants/theme';
import { findVocabularyWord } from '@/content/vocabulary';
import { findWordDefinition, WORD_ACTION_LABELS } from '@/content/wordDefinitions';
import type { EmotionFamilyId, Intensity } from '@/types/models';

interface Props {
  wordId: string;
}

/** One side of the read-only intensity dots — spacing.sm, the same token the
 *  check-in's own interactive IntensityDial reaches for at this scale. */
const DOT = spacing.sm;

/** Four small squares — a read-only twin of the check-in's own interactive
 *  IntensityDial, showing where this word sits on its family's 1–4 scale.
 *  Both filled and unfilled dots stroke with the family's own `.thread` —
 *  one palette for the whole dial (CLAUDE.md: familyPalette is "solely for
 *  quilt patch fills/swatches/dials"), not mixed with mutedPalette. */
function IntensityDots({ family, intensity }: { family: EmotionFamilyId; intensity: Intensity }) {
  const palette = familyPalette[family];
  return (
    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
      {([1, 2, 3, 4] as const).map((level) => {
        const filled = level <= intensity;
        return (
          <Svg key={level} width={DOT} height={DOT}>
            <Rect
              width={DOT}
              height={DOT}
              rx={borderRadius.sm / 2}
              fill={filled ? palette.shades[level] : 'transparent'}
              stroke={palette.thread}
              strokeWidth={1.5}
              strokeOpacity={filled ? 1 : 0.5}
            />
          </Svg>
        );
      })}
    </View>
  );
}

function ActionRow({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.actionRow}>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionText}>{text}</Text>
    </View>
  );
}

export function WordDefinitionContent({ wordId }: Props) {
  const hit = findVocabularyWord(wordId);
  const entry = findWordDefinition(wordId);
  // Guarded by wordDefinitions.test.ts's completeness check — every word in
  // the app resolves both lookups. Renders nothing rather than crash if a
  // future word ever slips through un-authored.
  if (!hit || !entry) return null;
  const { word, family } = hit;
  // The family tag: a small filled pill + coloured label — a card fill and a
  // same-hue accent, the two mutedPalette categories this is (CLAUDE.md).
  const muted = mutedPalette[family.id];

  return (
    <View style={styles.root}>
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: muted.fill }]}>
          <Text style={[styles.tagText, { color: muted.accent }]}>{family.label}</Text>
        </View>
        <IntensityDots family={family.id} intensity={word.intensityHint} />
      </View>

      <Text style={styles.definition}>{entry.definition}</Text>

      <View style={styles.actions}>
        <ActionRow label={WORD_ACTION_LABELS.constructive} text={entry.actions.constructive} />
        <ActionRow label={WORD_ACTION_LABELS.ambiguous} text={entry.actions.ambiguous} />
        <ActionRow label={WORD_ACTION_LABELS.destructive} text={entry.actions.destructive} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tag: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    ...typography.overline,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  definition: {
    ...typography.body,
  },
  actions: {
    gap: spacing.md,
  },
  actionRow: {
    gap: spacing.xs,
  },
  actionLabel: {
    ...typography.overline,
  },
  actionText: {
    ...typography.body,
  },
});

export default WordDefinitionContent;
