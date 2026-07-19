// The body of an emotion's helper: what the messenger carries, where it lives
// in the body, what it hardens into when resisted, and a couple of soft
// invitations to feel it. All copy comes from content/ (hard rule). Monochrome
// throughout; the only motion is a slow breathing pulse on the invitation card.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { borderRadius, colors, familyPalette, motion, spacing, typography } from '@/constants/theme';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { EMOTION_HELPERS } from '@/content/helpers';
import { useMotion } from '@/hooks/useMotion';
import type { EmotionFamilyId } from '@/types/models';

interface Props {
  family: EmotionFamilyId;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.overline}>{label}</Text>
      {children}
    </View>
  );
}

export function EmotionHelperContent({ family }: Props) {
  const helper = EMOTION_HELPERS[family];
  const label = EMOTION_FAMILIES[family].label;
  // The family's Atlas pastel carries through the card: pale tint on the
  // invitation, muted same-hue thread on dots and stitching (user-requested).
  const palette = familyPalette[family];

  // When reduced, the invitation card sits still at scale 1.
  const { reduced: reduceMotion } = useMotion();

  const breathe = useSharedValue(1);
  React.useEffect(() => {
    if (reduceMotion) {
      breathe.value = 1;
      return;
    }
    // A slow in-and-out swell — an invitation to breathe with it, not a
    // grabby animation. The card dips to breatheScale (<1) and returns, so
    // the laid-out size is its maximum and the border never clips.
    breathe.value = withRepeat(
      withSequence(
        withTiming(motion.breatheScale, { duration: motion.breatheMs / 2 }),
        withTiming(1, { duration: motion.breatheMs / 2 })
      ),
      -1
    );
    // breathe is a stable shared-value ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  return (
    <View style={styles.root}>
      <Text style={typography.title}>{label}</Text>

      <Section label="What it means">
        <Text style={typography.body}>{helper.whatItMeans}</Text>
      </Section>

      <Section label="In the body">
        {helper.bodySignature.map((line) => (
          <View key={line} style={styles.bodyRow}>
            {/* Dot lives in a first-line-height box so it centers on the text's
                first line instead of floating above it (device finding). */}
            <View style={styles.bodyDotBox}>
              <Svg width={8} height={8} viewBox="0 0 8 8">
                <Circle cx={4} cy={4} r={2} fill={palette.thread} />
              </Svg>
            </View>
            <Text style={[typography.body, styles.bodyRowText]}>{line}</Text>
          </View>
        ))}
      </Section>

      <Section label="When resisted, it becomes…">
        <View style={styles.becomesRow} accessibilityLabel={`${label} becomes ${helper.whenResisted.becomes}`}>
          <Text style={typography.heading}>{label}</Text>
          <Text style={styles.arrow}> → </Text>
          <Text style={typography.heading}>{helper.whenResisted.becomes}</Text>
        </View>
        {/* A thin stitched underline ties the two words together. */}
        <Svg width="100%" height={4} accessibilityElementsHidden>
          <Line
            x1="0"
            y1={2}
            x2="100%"
            y2={2}
            stroke={palette.thread}
            strokeWidth={1}
            strokeDasharray={[3, 3]}
          />
        </Svg>
        <Text style={[typography.body, styles.becomesDesc]}>
          {helper.whenResisted.description}
        </Text>
      </Section>

      <Section label="An invitation">
        <Animated.View
          style={[
            styles.invitationCard,
            { backgroundColor: palette.shades[1], borderColor: palette.thread },
            breatheStyle,
          ]}
        >
          {helper.invitationToFeel.map((line) => (
            <Text key={line} style={[typography.body, styles.invitationLine]}>
              {line}
            </Text>
          ))}
        </Animated.View>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
  },
  bodyRow: {
    // Dot + wrappable text: top-align so a wrapped line keeps its dot at the
    // first line (forge elastic-layout anti-pattern).
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bodyDotBox: {
    // Exactly one text line tall → the dot vertically centers on the first
    // line of the (possibly wrapping) text next to it.
    height: typography.body.lineHeight,
    justifyContent: 'center',
  },
  bodyRowText: {
    flex: 1,
    flexWrap: 'wrap',
  },
  becomesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  arrow: {
    ...typography.heading,
    color: colors.inkMuted,
  },
  becomesDesc: {
    marginTop: spacing.xs,
  },
  invitationCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.sm,
  },
  invitationLine: {
    color: colors.ink,
  },
});

export default EmotionHelperContent;
