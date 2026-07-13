// Field guide: the app's emotional-education home, reached from Experiments.
// Two sections — "What's underneath?" (an everyday stuck state → the resisted
// feeling it tends to carry, content/underneath.ts) and "Find the word" (the
// full mild→intense vocabulary per family, content/vocabulary.ts) — so
// someone can name what they feel more precisely than the check-in's short
// gradients allow. Learn links open the global family helper sheet.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import EmotionChip from '@/components/EmotionChip';
import PaperTexture from '@/components/PaperTexture';
import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { UNDERNEATH_MAP } from '@/content/underneath';
import { allWordsForFamily, findVocabularyWord, INTENSITY_PHRASES } from '@/content/vocabulary';
import { useHelperSheetStore } from '@/store/helperSheetStore';
import type { EmotionFamilyId } from '@/types/models';

export default function FieldGuideScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // One state panel and one word detail open at a time — the guide reads like
  // a reference page, not a form; nothing here is stored.
  const [openState, setOpenState] = React.useState<string | null>(null);
  const [openWordId, setOpenWordId] = React.useState<string | null>(null);

  const openWord = openWordId ? findVocabularyWord(openWordId) : undefined;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-field-guide">
      <PaperTexture />
      <View style={styles.headerRow}>
        <Pressable
          testID="field-guide-back"
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Line x1={13} y1={3} x2={6} y2={10} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={6} y1={10} x2={13} y2={17} stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text style={typography.title}>Field guide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={typography.body}>
          A little map of feelings — for finding the right word, and for noticing what an old
          mood might be carrying.
        </Text>

        {/* ——— What's underneath? ——— */}
        <View style={styles.section}>
          <Text style={styles.overline}>What&apos;s underneath?</Text>
          <Text style={typography.body}>
            When a state will not shift, it is often carrying a feeling that has not been felt
            yet. Tap one that sounds like today.
          </Text>
          <View style={styles.chipWrap}>
            {UNDERNEATH_MAP.map((state) => (
              <EmotionChip
                key={state.id}
                id={`state-${state.id}`}
                label={state.label}
                dashed
                selected={openState === state.id}
                onPress={() => setOpenState((cur) => (cur === state.id ? null : state.id))}
              />
            ))}
          </View>

          {UNDERNEATH_MAP.filter((s) => s.id === openState).map((state) => (
            <View key={state.id} style={styles.panel} testID={`underneath-panel-${state.id}`}>
              <Text style={typography.body}>{state.description}</Text>
              {state.underneath.map((familyId) => (
                <UnderneathFamilyRow key={familyId} familyId={familyId} />
              ))}
              <Text style={styles.invitation}>{state.invitation}</Text>
            </View>
          ))}
        </View>

        {/* ——— Find the word ——— */}
        <View style={styles.section}>
          <Text style={styles.overline}>Find the word</Text>
          <Text style={typography.body}>
            More words than the check-in offers, mild to intense — sometimes the right one is
            all a feeling needs.
          </Text>
          {Object.values(EMOTION_FAMILIES).map((family) => (
            <View key={family.id} style={styles.familyGroup} testID={`word-family-${family.id}`}>
              <Text style={styles.overline}>{family.label}</Text>
              <Text style={styles.essence}>{family.essence}</Text>
              <View style={styles.chipWrap}>
                {allWordsForFamily(family.id).map((word) => (
                  <EmotionChip
                    key={word.id}
                    id={`word-${word.id}`}
                    label={word.label}
                    selected={openWordId === word.id}
                    onPress={() => setOpenWordId((cur) => (cur === word.id ? null : word.id))}
                  />
                ))}
              </View>
              {openWord && openWord.family.id === family.id ? (
                <View style={styles.panel} testID={`word-detail-${family.id}`}>
                  <Text style={typography.body}>
                    {openWord.word.label} — {openWord.family.label.toLowerCase()},{' '}
                    {INTENSITY_PHRASES[openWord.word.intensityHint]}.
                  </Text>
                  <LearnLink familyId={family.id} testID={`word-learn-${family.id}`} />
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Words adapted from a feelings-vocabulary wheel, arranged into the quilt&apos;s
          families. None of them is a test — the closest word is close enough.
        </Text>
      </ScrollView>
    </View>
  );
}

/** One underlying family inside a state panel: name, essence, learn link. */
function UnderneathFamilyRow({ familyId }: { familyId: EmotionFamilyId }) {
  const family = EMOTION_FAMILIES[familyId];
  return (
    <View style={styles.familyRow}>
      <View style={styles.familyRowText}>
        <Text style={typography.heading}>{family.label}</Text>
        <Text style={styles.essence}>{family.essence}</Text>
      </View>
      <LearnLink familyId={familyId} testID={`guide-learn-${familyId}`} />
    </View>
  );
}

function LearnLink({ familyId, testID }: { familyId: EmotionFamilyId; testID: string }) {
  const label = EMOTION_FAMILIES[familyId].label;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Learn about ${label}`}
      hitSlop={8}
      onPress={() => useHelperSheetStore.getState().open(familyId)}
    >
      <Text style={styles.learnLink}>learn →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconButton: {
    width: hitTarget,
    height: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  panel: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.md,
  },
  familyRow: {
    // Text block + link: top-aligned so a wrapping essence keeps the link at
    // its first line (forge elastic-layout rule).
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  familyRowText: {
    flex: 1,
    gap: spacing.xs,
  },
  essence: {
    ...typography.caption,
  },
  invitation: {
    ...typography.body,
    color: colors.ink,
  },
  learnLink: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  familyGroup: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
