// Onboarding: three paged slides (quilt / fluidity / privacy) with stitch-mark
// page dots and a Begin button on the last slide. Each slide carries a small
// monochrome line-art vignette; vignette → title → body fade/drift in with a
// short stagger whenever the page settles (static under reduce-motion).

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { borderRadius, colors, hitTarget, motion, spacing, textures, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import { ONBOARDING_SLIDES } from '@/content/onboarding';
import { useMotion } from '@/hooks/useMotion';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useSettingsStore } from '@/store/settingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Stagger step between a slide's vignette / title / body entrances. */
const STAGGER_MS = 90;

// --- Vignettes: inline monochrome line art, one per slide, decorative only ---

/** A lone dashed patch square with one filled shade2 segment. */
function QuiltVignette() {
  return (
    <Svg width={88} height={88} viewBox="0 0 64 64">
      <Rect
        x={6}
        y={6}
        width={52}
        height={52}
        fill="none"
        stroke={colors.ink}
        strokeWidth={1.5}
        strokeDasharray={[...textures.stitchDash]}
      />
      <Rect x={6} y={6} width={26} height={26} fill={colors.shade2} />
      <Line
        x1={32}
        y1={6}
        x2={32}
        y2={58}
        stroke={colors.ink}
        strokeWidth={1}
        strokeDasharray={[...textures.stitchDashFine]}
      />
      <Line
        x1={6}
        y1={32}
        x2={58}
        y2={32}
        stroke={colors.ink}
        strokeWidth={1}
        strokeDasharray={[...textures.stitchDashFine]}
      />
    </Svg>
  );
}

/** An abstract circle-and-line figure with a gentle sine wave passing through. */
function FluidityVignette() {
  return (
    <Svg width={88} height={88} viewBox="0 0 64 64">
      <Circle cx={32} cy={12} r={6} fill="none" stroke={colors.ink} strokeWidth={1.5} />
      <Line
        x1={32}
        y1={18}
        x2={32}
        y2={50}
        stroke={colors.ink}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M2 34 C 8 26, 14 26, 20 34 S 32 42, 38 34 S 50 26, 62 34"
        fill="none"
        stroke={colors.inkSoft}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** A padlock drawn of stitched dashes. */
function PrivacyVignette() {
  return (
    <Svg width={88} height={88} viewBox="0 0 64 64">
      <Path
        d="M22 28 v-7 a10 10 0 0 1 20 0 v7"
        fill="none"
        stroke={colors.ink}
        strokeWidth={1.5}
        strokeDasharray={[...textures.stitchDash]}
        strokeLinecap="round"
      />
      <Rect
        x={14}
        y={28}
        width={36}
        height={26}
        rx={5}
        fill="none"
        stroke={colors.ink}
        strokeWidth={1.5}
        strokeDasharray={[...textures.stitchDash]}
      />
      <Circle cx={32} cy={41} r={2.5} fill={colors.ink} />
    </Svg>
  );
}

const VIGNETTES: Record<string, () => React.JSX.Element> = {
  quilt: QuiltVignette,
  fluidity: FluidityVignette,
  privacy: PrivacyVignette,
};

/**
 * Fade/drift-in wrapper: re-runs whenever its slide becomes the settled page,
 * with `order` steps of stagger (vignette 0 → title 1 → body 2). Under
 * reduce-motion the content is simply pinned at rest (hard rule: animations
 * disable cleanly).
 */
function FadeDrift({
  active,
  reduceMotion,
  order,
  children,
}: {
  active: boolean;
  reduceMotion: boolean;
  order: number;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    if (!active) return;
    opacity.value = 0;
    translateY.value = 10;
    opacity.value = withDelay(order * STAGGER_MS, withTiming(1, { duration: motion.gentleMs }));
    translateY.value = withDelay(order * STAGGER_MS, withTiming(0, { duration: motion.gentleMs }));
  }, [active, order, reduceMotion, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  // useWindowDimensions, never module-load Dimensions.get (forge elastic-
  // layout anti-pattern) — slides track rotation/resize.
  const { width } = useWindowDimensions();
  const [page, setPage] = React.useState(0);
  const lastIndex = ONBOARDING_SLIDES.length - 1;

  const { reduced: reduceMotion } = useMotion();

  const begin = () => {
    useSettingsStore.getState().completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
      ]}
      testID="screen-onboarding"
    >
      <PaperTexture />
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / width))
        }
      >
        {ONBOARDING_SLIDES.map((slide, index) => {
          const Vignette = VIGNETTES[slide.id];
          const active = index === page;
          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              {Vignette ? (
                <FadeDrift active={active} reduceMotion={reduceMotion} order={0}>
                  {/* Decorative line art — hidden from screen readers. */}
                  <View
                    style={styles.vignette}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <Vignette />
                  </View>
                </FadeDrift>
              ) : null}
              <FadeDrift active={active} reduceMotion={reduceMotion} order={1}>
                <Text style={styles.slideTitle}>{slide.title}</Text>
              </FadeDrift>
              <FadeDrift active={active} reduceMotion={reduceMotion} order={2}>
                <Text style={styles.slideBody}>{slide.body}</Text>
                {index === lastIndex && (
                  <Pressable
                    testID="onboarding-begin"
                    accessibilityRole="button"
                    accessibilityLabel="Begin"
                    style={styles.begin}
                    onPress={begin}
                  >
                    <Text style={styles.beginLabel}>Begin</Text>
                  </Pressable>
                )}
              </FadeDrift>
            </View>
          );
        })}
      </ScrollView>

      {/* Stitch-mark page dots — decorative; hidden from screen readers. */}
      <View
        style={styles.dots}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {ONBOARDING_SLIDES.map((slide, index) => (
          <Svg key={slide.id} width={16} height={6} viewBox="0 0 16 6">
            <Line
              x1={2}
              y1={3}
              x2={14}
              y2={3}
              stroke={index === page ? colors.ink : colors.inkFaint}
              strokeWidth={2}
              strokeDasharray={[...textures.stitchDashFine]}
              strokeLinecap="round"
            />
          </Svg>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  slide: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  vignette: {
    marginBottom: spacing.lg,
  },
  slideTitle: {
    // typography.display sized down a notch so long titles fit small phones.
    ...typography.display,
    fontSize: 30,
    lineHeight: 38,
  },
  slideBody: {
    ...typography.bodyLarge,
    marginTop: spacing.md,
  },
  begin: {
    marginTop: spacing.xl,
    alignSelf: 'flex-start',
    minHeight: hitTarget,
    minWidth: hitTarget,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginLabel: {
    ...typography.label,
    color: colors.paper,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
