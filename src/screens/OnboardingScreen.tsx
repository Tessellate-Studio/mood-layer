// Onboarding: four paged slides (quilt / fluidity / privacy / guide) with
// solid page dots and a Begin button on the last slide. Every slide's
// vignette speaks the app's one visual grammar — overlapping translucent
// family cloth, colour deepening where layers meet (user, 2026-08-31: the
// mixed line-art/flat idioms read inconsistent). Content shows immediately
// (the old fade/drift animation was removed — user: "jumpy").

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { borderRadius, colors, familyPalette, hitTarget, mutedPalette, spacing, typography } from '@/constants/theme';
import LayeredClusterVignette from '@/components/LayeredClusterVignette';
import PaperTexture from '@/components/PaperTexture';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { ONBOARDING_SLIDES } from '@/content/onboarding';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useSettingsStore } from '@/store/settingsStore';
import type { EmotionFamilyId } from '@/types/models';
import { CLOTH_OPACITY } from '@/utils/quiltLayout';

type Nav = NativeStackNavigationProp<RootStackParamList>;


// --- Vignettes: one per slide, decorative only ---

/** The layered cluster in miniature — the app's real visual grammar, shown
 *  from the very first slide (replaced the dashed patch square 2026-07-17). */
function QuiltVignette() {
  return <LayeredClusterVignette size={88} />;
}

/** A current of feeling: three long cloth bands crossing mid-frame, their
 *  overlaps deepening — feelings moving through rather than held still.
 *  Hoisted like LayeredClusterVignette's PIECES — the slides stay mounted
 *  and re-render on every page swipe. */
const FLUIDITY_BANDS: { y: number; family: EmotionFamilyId; transform: string }[] = [
  { y: 16, family: 'sadness', transform: 'rotate(-6 32 23)' },
  { y: 26, family: 'anticipation', transform: 'rotate(3 32 33)' },
  { y: 36, family: 'fear', transform: 'rotate(-4 32 43)' },
];

function FluidityVignette() {
  return (
    <Svg width={88} height={88} viewBox="0 0 64 64">
      {FLUIDITY_BANDS.map((band) => (
        <Rect
          key={band.family}
          x={4}
          y={band.y}
          width={56}
          height={14}
          rx={7}
          fill={familyPalette[band.family].shades[3]}
          fillOpacity={CLOTH_OPACITY}
          transform={band.transform}
        />
      ))}
    </Svg>
  );
}

/** A padlock built of translucent layers: a fear-cloth body and shackle
 *  band holding a small trust-cloth layer safe inside — the overlap
 *  deepening exactly like the quilt does. */
function PrivacyVignette() {
  return (
    <Svg width={88} height={88} viewBox="0 0 64 64">
      <Path
        d="M22 30 v-8 a10 10 0 0 1 20 0 v8"
        fill="none"
        stroke={familyPalette[SLIDE_FAMILY.privacy].shades[4]}
        strokeWidth={9}
        strokeOpacity={CLOTH_OPACITY}
        strokeLinecap="round"
      />
      <Rect
        x={14}
        y={26}
        width={36}
        height={28}
        rx={10}
        fill={familyPalette[SLIDE_FAMILY.privacy].shades[3]}
        fillOpacity={CLOTH_OPACITY}
      />
      <Rect
        x={20}
        y={32}
        width={24}
        height={16}
        rx={8}
        fill={familyPalette.trust.shades[3]}
        fillOpacity={CLOTH_OPACITY}
      />
    </Svg>
  );
}

/** The field-guide slide: all nine families as a woven spread — each piece
 *  overlapping its neighbours so the seams deepen, a glimpse of the
 *  vocabulary the guide holds in the quilt's own grammar. */
function GuideVignette() {
  const families = Object.values(EMOTION_FAMILIES);
  return (
    <Svg width={88} height={88} viewBox="0 0 64 64">
      {families.map((family, i) => (
        <Rect
          key={family.id}
          x={6 + (i % 3) * 17}
          y={6 + Math.floor(i / 3) * 17}
          width={21}
          height={21}
          rx={7}
          fill={familyPalette[family.id].shades[3]}
          fillOpacity={CLOTH_OPACITY}
        />
      ))}
    </Svg>
  );
}

const VIGNETTES: Record<string, () => React.JSX.Element> = {
  quilt: QuiltVignette,
  fluidity: FluidityVignette,
  privacy: PrivacyVignette,
  guide: GuideVignette,
};

// Muted-layer treatment: each slide's vignette sits on its own whisper-tint
// layer — the first colours a new user meets are the ones the app will keep.
const SLIDE_FAMILY: Record<string, EmotionFamilyId> = {
  quilt: 'sadness',
  fluidity: 'disgust',
  privacy: 'fear',
  guide: 'anticipation',
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  // useWindowDimensions, never module-load Dimensions.get (forge elastic-
  // layout anti-pattern) — slides track rotation/resize.
  const { width } = useWindowDimensions();
  const [page, setPage] = React.useState(0);
  const lastIndex = ONBOARDING_SLIDES.length - 1;

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
          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              {Vignette ? (
                <View
                  testID={`vignette-${slide.id}`}
                  style={[
                    styles.vignette,
                    { borderColor: mutedPalette[SLIDE_FAMILY[slide.id]].border },
                  ]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Vignette />
                </View>
              ) : null}
              <Text style={typography.display}>{slide.title}</Text>
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
            </View>
          );
        })}
      </ScrollView>

      {/* Page dots — decorative; hidden from screen readers. */}
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
    alignSelf: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    backgroundColor: colors.paperRaised,
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
