// Reflections catalog — every saved sitting (judgment sittings + perspective
// practice sittings), laid out the way the home screen lays out weeks so the
// shape feels familiar (user, 2026-07-17): week blocks newest-first, a
// weekday letterpress column on the left, one tinted card per reflection.
// Tap a card to unfold it; swipe for edit (judgment sittings) or remove.

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import ThreadCard from '@/components/ThreadCard';
import { findPractice, JUDGMENT_FAMILY, PRACTICE_FAMILY } from '@/content/practices';
import { findVocabularyWord } from '@/content/vocabulary';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useExperimentStore, type PracticeSession } from '@/store/experimentStore';
import type { EmotionFamilyId, JudgmentEntry } from '@/types/models';
import { weekKey, weekRangeLabel } from '@/utils/dates';
import { sessionConclusion, sessionLines } from '@/utils/practiceWork';
import { groupSittings } from '@/utils/sittings';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** One catalog row — a judgment sitting (its grouped entries) or a practice
 *  sitting, unified for sorting and grouping. */
type Reflection =
  | { kind: 'judgment'; id: string; createdAt: string; entries: JudgmentEntry[] }
  | { kind: 'practice'; id: string; createdAt: string; session: PracticeSession };

export default function ReflectionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const judgmentEntries = useExperimentStore((s) => s.judgmentEntries);
  const practiceSessions = useExperimentStore((s) => s.practiceSessions);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  // Merge both kinds, newest first, then shelve into ISO weeks — the same
  // rhythm as the home quilt, so the eye already knows how to read it.
  const weeks = React.useMemo(() => {
    const all: Reflection[] = [
      ...groupSittings(judgmentEntries).map((sitting) => ({
        kind: 'judgment' as const,
        id: sitting.id,
        createdAt: sitting.entries[0].createdAt,
        entries: sitting.entries,
      })),
      ...practiceSessions.map((session) => ({
        kind: 'practice' as const,
        id: session.id,
        createdAt: session.createdAt,
        session,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const order: string[] = [];
    const byWeek = new Map<string, Reflection[]>();
    for (const r of all) {
      const wk = weekKey(r.createdAt);
      if (!byWeek.has(wk)) {
        byWeek.set(wk, []);
        order.push(wk);
      }
      byWeek.get(wk)!.push(r);
    }
    return order.map((wk) => ({ weekKey: wk, items: byWeek.get(wk)! }));
  }, [judgmentEntries, practiceSessions]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-reflections">
      <PaperTexture />
      <View style={styles.headerRow}>
        <Pressable
          testID="reflections-back"
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
        <Text style={typography.title}>Reflections</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {weeks.length === 0 ? (
          <Text style={styles.empty}>
            Nothing set down yet — reflections from the practices will gather
            here, week by week.
          </Text>
        ) : (
          weeks.map((week) => (
            <View key={week.weekKey} style={styles.weekBlock} testID={`reflections-week-${week.weekKey}`}>
              <Text style={typography.overline}>{weekRangeLabel(week.weekKey)}</Text>
              {week.items.map((r) => (
                <View key={r.id} style={styles.dayRow}>
                  <Text style={styles.dayLabel}>
                    {WEEKDAYS_SHORT[new Date(r.createdAt).getDay()]}
                  </Text>
                  <View style={styles.cardHolder}>
                    {r.kind === 'judgment' ? (
                      <JudgmentSittingCard
                        sittingId={r.id}
                        entries={r.entries}
                        expanded={expanded === r.id}
                        onToggle={() => setExpanded((cur) => (cur === r.id ? null : r.id))}
                        onEdit={() => navigation.navigate('JudgmentFlow', { editId: r.id })}
                      />
                    ) : (
                      <PracticeSittingCard
                        session={r.session}
                        expanded={expanded === r.id}
                        onToggle={() => setExpanded((cur) => (cur === r.id ? null : r.id))}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/** Swipe actions shared by both card kinds. */
function RowActions({
  onEdit,
  onRemove,
  removeTestID,
  editTestID,
}: {
  onEdit?: () => void;
  onRemove(): void;
  removeTestID: string;
  editTestID?: string;
}) {
  return (
    <View style={styles.actionsRow}>
      {onEdit ? (
        <Pressable
          testID={editTestID}
          accessibilityRole="button"
          accessibilityLabel="Edit"
          style={styles.actionBtn}
          onPress={onEdit}
        >
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
      ) : null}
      <Pressable
        testID={removeTestID}
        accessibilityRole="button"
        accessibilityLabel="Remove"
        style={[styles.actionBtn, styles.actionDelete]}
        onPress={onRemove}
      >
        <Text style={styles.actionText}>Remove</Text>
      </Pressable>
    </View>
  );
}

function JudgmentSittingCard({
  sittingId,
  entries,
  expanded,
  onToggle,
  onEdit,
}: {
  sittingId: string;
  entries: JudgmentEntry[];
  expanded: boolean;
  onToggle(): void;
  onEdit(): void;
}) {
  const removeJudgmentSitting = useExperimentStore((s) => s.removeJudgmentSitting);
  const first = entries[0];
  const more = entries.length - 1;
  const freeWriting = entries.find((e) => e.freeWriting)?.freeWriting;

  const confirmRemove = () => {
    Alert.alert('Remove this reflection?', 'It will be gone from this phone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeJudgmentSitting(sittingId) },
    ]);
  };

  return (
    <ReanimatedSwipeable
      renderRightActions={() => (
        <RowActions
          onEdit={onEdit}
          editTestID={`reflection-edit-${sittingId}`}
          onRemove={confirmRemove}
          removeTestID={`reflection-delete-${sittingId}`}
        />
      )}
      overshootRight={false}
    >
      <ThreadCard
        family={JUDGMENT_FAMILY}
        testID={`reflection-judgment-${sittingId}`}
        accessibilityLabel={`Avoided emotions: ${first.target}, for ${first.judgment}${
          more > 0 ? ` and ${more} more` : ''
        }. Swipe for edit and remove.`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.entryBody}
      >
        {/* Every reflection reads the same way: the PRACTICE's name, then one
            line of what it arrived at. The subtitle yields to the full detail
            on expand — showing both repeated the first judgment (user,
            2026-07-18). */}
        <Text style={styles.entryTitle}>Explore avoided emotions</Text>
        {!expanded ? (
          <Text style={styles.entrySub} numberOfLines={1}>
            {first.target} — {first.judgment}
            {more > 0 ? `  ·  +${more} more` : ''}
          </Text>
        ) : null}
        {expanded ? (
          <View style={styles.entryDetail}>
            {entries.map((entry) => {
              const feelings = entry.uncoveredFeelings
                .map((f) => findVocabularyWord(f.emotionId)?.word.label ?? f.emotionId)
                .join(', ');
              return (
                <View key={entry.id}>
                  <Text style={typography.body}>
                    {entry.target} — {entry.judgment}
                  </Text>
                  {feelings ? (
                    <Text style={typography.caption}>Underneath: {feelings}</Text>
                  ) : null}
                </View>
              );
            })}
            {freeWriting ? <Text style={typography.body}>{freeWriting}</Text> : null}
          </View>
        ) : null}
      </ThreadCard>
    </ReanimatedSwipeable>
  );
}

function PracticeSittingCard({
  session,
  expanded,
  onToggle,
}: {
  session: PracticeSession;
  expanded: boolean;
  onToggle(): void;
}) {
  const removePracticeSession = useExperimentStore((s) => s.removePracticeSession);
  const practice = findPractice(session.practiceId);
  if (!practice) return null;
  const lines = sessionLines(practice, session.work);
  const conclusion = sessionConclusion(practice, session.work);

  const confirmRemove = () => {
    Alert.alert('Remove this sitting?', 'It will be gone from this phone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePracticeSession(session.id) },
    ]);
  };

  return (
    <ReanimatedSwipeable
      renderRightActions={() => (
        <RowActions onRemove={confirmRemove} removeTestID={`reflection-delete-${session.id}`} />
      )}
      overshootRight={false}
    >
      <ThreadCard
        family={PRACTICE_FAMILY[practice.id]}
        testID={`reflection-practice-${session.id}`}
        accessibilityLabel={`${practice.title}. Swipe to remove.`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.entryBody}
      >
        <Text style={styles.entryTitle}>{practice.title}</Text>
        {!expanded && conclusion ? (
          <Text style={styles.entrySub} numberOfLines={1}>
            {conclusion}
          </Text>
        ) : null}
        {expanded ? (
          <View style={styles.entryDetail}>
            {lines.map((line) => (
              <View key={line.title}>
                <Text style={typography.caption}>{line.title}</Text>
                <Text style={typography.body}>{line.body}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ThreadCard>
    </ReanimatedSwipeable>
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
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  weekBlock: {
    gap: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dayLabel: {
    ...typography.caption,
    width: 34,
    paddingTop: spacing.md,
  },
  cardHolder: {
    flex: 1,
  },
  entryBody: {
    gap: spacing.sm,
  },
  entryTitle: {
    ...typography.heading,
  },
  entrySub: {
    ...typography.body,
  },
  entryDetail: {
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginLeft: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    minWidth: hitTarget + 16,
    minHeight: hitTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.paperRaised,
    paddingHorizontal: spacing.sm,
  },
  actionDelete: {
    borderColor: colors.ink,
  },
  actionText: {
    ...typography.label,
  },
});
