// Perspective practice flow — one Atlas practice walked step by step in a
// modal (user redesign 2026-07-17: the inline scratch pad couldn't hold
// multi-point steps or show a noted point NEXT TO the space that reflects it).
// Steps are typed data (content/practices.ts); this screen renders each kind:
//   write   — one open writing space
//   list    — several points, add/remove
//   reflect — every point from an earlier list, side by side with its own box
//   mark    — two lists in two columns, tap points that earn the mark word
//   pick    — choose one point to keep
// Everything persists live into the experiment store, so closing mid-way
// loses nothing and reopening resumes where you left off.

import React from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import ModalHeader from '@/components/ModalHeader';
import PaperTexture from '@/components/PaperTexture';
import {
  borderRadius,
  colors,
  hitTarget,
  mutedPalette,
  spacing,
  typography,
} from '@/constants/theme';
import { findPractice, PRACTICE_FAMILY, type Practice, type PracticeStep } from '@/content/practices';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore } from '@/store/experimentStore';
import type { EmotionFamilyId } from '@/types/models';
import {
  addEntry,
  emptyWork,
  entriesFor,
  itemKey,
  notedItems,
  removeListItem,
  setEntry,
  toggleMark,
  togglePick,
  type PracticeWork,
} from '@/utils/practiceWork';

type PracticeRoute = RouteProp<RootStackParamList, 'PracticeFlow'>;

export default function PracticeFlowScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<PracticeRoute>();
  const practice = findPractice(route.params?.practiceId ?? '');

  const [stepIndex, setStepIndex] = React.useState(0);

  // Each step is its own page — never inherit the previous step's scroll
  // position (app-wide bug, 2026-07-17).
  const scrollRef = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [stepIndex]);

  if (!practice) {
    // A stale deep link — nothing to practise on; leave quietly.
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-practice">
        <PaperTexture />
        <ModalHeader title="Practice" closeTestID="practice-close" onClose={() => navigation.goBack()} />
        <Text style={typography.body}>This practice has moved on. Head back and pick another.</Text>
      </View>
    );
  }

  const family = PRACTICE_FAMILY[practice.id];
  const step = practice.steps[stepIndex];
  const isLast = stepIndex === practice.steps.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-practice">
      <PaperTexture />
      {/* Edge-to-edge Android never resizes the window for the keyboard, so
          without this the writing boxes hide behind it and the page can't
          scroll (device feedback 2026-07-17). */}
      <KeyboardAvoidingView style={styles.avoider} behavior="padding">
      <ModalHeader
        title={practice.title}
        closeTestID="practice-close"
        onClose={() => navigation.goBack()}
      />

      {/* Progress dashes — one per step, same language as the other flows. */}
      <View style={styles.progress} accessibilityElementsHidden>
        <Svg width="100%" height={6}>
          {practice.steps.map((_, i) => {
            const color = i < stepIndex ? colors.ink : i === stepIndex ? colors.inkSoft : colors.inkFaint;
            const segW = 100 / practice.steps.length;
            return (
              <Line
                key={i}
                x1={`${i * segW + 1}%`}
                y1={3}
                x2={`${(i + 1) * segW - 1}%`}
                y2={3}
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepGap}>
          <Text style={typography.heading} testID="practice-step-title">
            {step.title}
          </Text>
          <Text style={typography.body}>{step.prompt}</Text>
          <StepBody practice={practice} step={step} family={family} />
          {isLast ? <Text style={styles.closing}>{practice.closing}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {stepIndex > 0 ? (
          <Pressable
            testID="practice-back"
            accessibilityRole="button"
            style={styles.backBtn}
            onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            <Text style={styles.backText}>‹ back</Text>
          </Pressable>
        ) : null}
        <Pressable
          testID={isLast ? 'practice-done' : 'practice-next'}
          accessibilityRole="button"
          style={styles.primaryBtn}
          onPress={() => {
            if (isLast) {
              // Archive this sitting and clear the page — next visit starts
              // fresh instead of resurfacing old answers (user, 2026-07-17).
              useExperimentStore.getState().completePractice(practice.id);
              navigation.goBack();
            } else {
              setStepIndex((i) => i + 1);
            }
          }}
        >
          <Text style={styles.primaryText}>{isLast ? 'Set it down' : 'Continue'}</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Everything below renders ONE step's working area from the store. */
function StepBody({
  practice,
  step,
  family,
}: {
  practice: Practice;
  step: PracticeStep;
  family: EmotionFamilyId;
}) {
  const work = useExperimentStore((s) => s.practiceWork[practice.id]) ?? emptyWork();
  const updatePracticeWork = useExperimentStore((s) => s.updatePracticeWork);
  const update = (fn: (w: PracticeWork) => PracticeWork) => updatePracticeWork(practice.id, fn);

  switch (step.kind) {
    case 'write':
      return (
        <TextInput
          testID={`practice-write-${step.id}`}
          style={styles.writeInput}
          multiline
          placeholder={step.placeholder}
          placeholderTextColor={colors.inkMuted}
          value={entriesFor(work, step.id)[0] ?? ''}
          onChangeText={(text) => update((w) => setEntry(w, step.id, 0, text))}
          textAlignVertical="top"
          accessibilityLabel={step.title}
        />
      );

    case 'list':
      return <ListStepBody practice={practice} step={step} work={work} update={update} />;

    case 'reflect': {
      const points = notedItems(work, step.sourceStepId);
      const sourceTitle =
        practice.steps.find((s) => s.id === step.sourceStepId)?.title.toLowerCase() ??
        'the earlier step';
      if (points.length === 0) {
        return (
          <Text style={typography.caption}>
            Nothing noted under “{sourceTitle}” yet — step back to add one, or simply move on.
          </Text>
        );
      }
      return (
        <View style={styles.stepGap}>
          {points.map((point) => (
            // Side by side: the noted point on the left (wearing the
            // practice's muted layer), its reflection space on the right.
            <View key={point.index} style={styles.reflectRow}>
              <View
                style={[
                  styles.pointCard,
                  {
                    backgroundColor: mutedPalette[family].fill,
                    borderLeftColor: mutedPalette[family].thread,
                  },
                ]}
              >
                <Text style={styles.pointText}>{point.text}</Text>
              </View>
              <TextInput
                testID={`practice-reflect-${step.id}-${point.index}`}
                style={[styles.writeInput, styles.reflectInput]}
                multiline
                placeholder={step.placeholder}
                placeholderTextColor={colors.inkMuted}
                value={entriesFor(work, step.id)[point.index] ?? ''}
                onChangeText={(text) => update((w) => setEntry(w, step.id, point.index, text))}
                textAlignVertical="top"
                accessibilityLabel={`${step.title}: ${point.text}`}
              />
            </View>
          ))}
        </View>
      );
    }

    case 'mark': {
      const marked = work.marks[step.id] ?? [];
      return (
        <View style={styles.markColumns}>
          {step.sourceStepIds.map((sourceId, col) => (
            <View key={sourceId} style={styles.markColumn}>
              <Text style={typography.overline}>{step.columnLabels[col]}</Text>
              {notedItems(work, sourceId).map((point) => {
                const key = itemKey(sourceId, point.index);
                const isMarked = marked.includes(key);
                return (
                  <Pressable
                    key={key}
                    testID={`practice-mark-${sourceId}-${point.index}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isMarked }}
                    accessibilityLabel={`${point.text}. ${isMarked ? `Marked ${step.markWord}.` : `Tap to mark ${step.markWord}.`}`}
                    style={[styles.markCard, isMarked && styles.markCardMarked]}
                    onPress={() => update((w) => toggleMark(w, step.id, key))}
                  >
                    <Text style={styles.pointText}>{point.text}</Text>
                    {isMarked ? <Text style={styles.markTag}>· {step.markWord}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      );
    }

    case 'pick': {
      const points = notedItems(work, step.sourceStepId);
      const picked = work.picks[step.id] ?? [];
      if (points.length === 0) {
        return (
          <Text style={typography.caption}>
            Nothing to choose from yet — step back to note an idea first.
          </Text>
        );
      }
      return (
        <View style={styles.stepGap}>
          {points.map((point) => {
            const key = itemKey(step.sourceStepId, point.index);
            const isPicked = picked.includes(key);
            return (
              <Pressable
                key={key}
                testID={`practice-pick-${step.id}-${point.index}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isPicked }}
                accessibilityLabel={point.text}
                style={[styles.pickCard, isPicked && styles.pickCardPicked]}
                onPress={() => update((w) => togglePick(w, step.id, key))}
              >
                <Text style={[styles.pointText, styles.pickText]}>{point.text}</Text>
                {isPicked ? <Text style={styles.pickGlyph}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      );
    }
  }
}

/** A list step's working area — its own component so the "+ another" button
 *  can move focus straight into the row it just added (device feedback:
 *  otherwise the cursor stays on the previous point). */
function ListStepBody({
  practice,
  step,
  work,
  update,
}: {
  practice: Practice;
  step: Extract<PracticeStep, { kind: 'list' }>;
  work: PracticeWork;
  update: (fn: (w: PracticeWork) => PracticeWork) => void;
}) {
  const inputRefs = React.useRef<(TextInput | null)[]>([]);
  // Always at least one open row, so the step never reads as closed.
  const texts = entriesFor(work, step.id);
  const rows = texts.length > 0 ? texts : [''];

  const addRow = () => {
    const nextIndex = rows.length;
    update((w) => addEntry(texts.length > 0 ? w : setEntry(w, step.id, 0, ''), step.id));
    // Focus lands after the new row has rendered.
    setTimeout(() => inputRefs.current[nextIndex]?.focus(), 80);
  };

  return (
    <View style={styles.stepGap}>
      {rows.map((text, i) => (
        <View key={i} style={styles.listRow}>
          <TextInput
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            testID={`practice-item-${step.id}-${i}`}
            style={styles.listInput}
            placeholder={step.placeholder}
            placeholderTextColor={colors.inkMuted}
            value={text}
            onChangeText={(t) => update((w) => setEntry(w, step.id, i, t))}
            accessibilityLabel={`${step.itemNoun} ${i + 1}`}
          />
          {rows.length > 1 ? (
            <Pressable
              testID={`practice-remove-${step.id}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${step.itemNoun} ${i + 1}`}
              style={styles.removeBtn}
              onPress={() => update((w) => removeListItem(practice, w, step.id, i))}
            >
              <Text style={styles.removeGlyph}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      <Pressable
        testID={`practice-add-${step.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Add another ${step.itemNoun}`}
        style={styles.addBtn}
        onPress={addRow}
      >
        <Text style={styles.addText}>+ another {step.itemNoun}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  avoider: {
    flex: 1,
  },
  progress: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  body: {
    paddingBottom: spacing.xl,
  },
  stepGap: {
    gap: spacing.md,
  },
  writeInput: {
    ...typography.body,
    color: colors.ink,
    minHeight: 96,
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listInput: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
    paddingVertical: spacing.sm,
  },
  removeBtn: {
    width: hitTarget,
    height: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeGlyph: {
    ...typography.title,
    color: colors.inkMuted,
  },
  addBtn: {
    minHeight: hitTarget,
    justifyContent: 'center',
  },
  addText: {
    ...typography.label,
    color: colors.inkSoft,
  },
  reflectRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  pointCard: {
    flex: 5,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    padding: spacing.sm + spacing.xs,
    justifyContent: 'center',
  },
  reflectInput: {
    flex: 7,
    minHeight: 96,
  },
  pointText: {
    ...typography.body,
    color: colors.ink,
  },
  markColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  markColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  markCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    padding: spacing.sm + spacing.xs,
    gap: spacing.xs,
  },
  markCardMarked: {
    // Colour-only (inkFaint -> ink): a width change here would resize the
    // content box and jump the text 0.5px on every toggle.
    borderColor: colors.ink,
  },
  markTag: {
    ...typography.caption,
  },
  pickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    minHeight: hitTarget,
  },
  pickCardPicked: {
    borderWidth: 2,
    borderColor: colors.ink,
  },
  pickText: {
    flex: 1,
    flexWrap: 'wrap',
  },
  pickGlyph: {
    ...typography.heading,
  },
  closing: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  backBtn: {
    minHeight: hitTarget,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  backText: {
    ...typography.label,
    color: colors.inkSoft,
  },
  primaryBtn: {
    flex: 1,
    minHeight: hitTarget,
    backgroundColor: colors.ink,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    ...typography.label,
    color: colors.paper,
  },
});
