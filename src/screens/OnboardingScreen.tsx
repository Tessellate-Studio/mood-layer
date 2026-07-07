// Onboarding: three paged slides (quilt / fluidity / privacy) with stitch-mark
// page dots and a Begin button on the last slide.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { borderRadius, colors, hitTarget, spacing, textures, typography } from '@/constants/theme';
import { ONBOARDING_SLIDES } from '@/content/onboarding';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useSettingsStore } from '@/store/settingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / width))
        }
      >
        {ONBOARDING_SLIDES.map((slide, index) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <Text style={styles.slideTitle}>{slide.title}</Text>
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
        ))}
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
