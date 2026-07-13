// Circle tab — share with your people, on your terms. Each person is a local
// preference: what they SEE (colours + words / colours only / a count) and HOW
// OFTEN you mean to share. Nothing leaves the phone on its own — "Share now"
// generates a summary on the spot (gated by their `sees` level) and hands it to
// the OS share sheet. Removing someone forgets them entirely.

import React from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, colors, hitTarget, mutedPalette, spacing, typography } from '@/constants/theme';
import LogoDivider from '@/components/LogoDivider';
import PaperTexture from '@/components/PaperTexture';
import ThreadCard from '@/components/ThreadCard';
import {
  FREQUENCY_LABELS,
  FREQUENCY_ORDER,
  nextInCycle,
  SEES_LABELS,
  SEES_ORDER,
  shareSummary,
} from '@/content/circle';
import { useCheckInStore } from '@/store/checkInStore';
import { useCircleStore } from '@/store/circleStore';
import { useExperimentStore } from '@/store/experimentStore';
import type { CirclePerson, EmotionFamilyId, WeekStats } from '@/types/models';
import { weekKey } from '@/utils/dates';
import { computeStatsForWeek } from '@/utils/insightEngine';

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

// Muted-layer treatment: people wear the soft sage green (closeness), the
// invite form the warm amber (an opening door).
const PERSON_FAMILY: EmotionFamilyId = 'disgust';
const INVITE_FAMILY: EmotionFamilyId = 'enjoyment';

function PersonCard({ person, stats }: { person: CirclePerson; stats: WeekStats }) {
  const updatePerson = useCircleStore((s) => s.updatePerson);
  const removePerson = useCircleStore((s) => s.removePerson);
  const preview = shareSummary(person.sees, stats);

  const confirmRemove = () => {
    Alert.alert(
      `Remove ${person.name}?`,
      'Removing someone deletes everything they were ever sent.',
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removePerson(person.id) },
      ]
    );
  };

  const shareNow = () => {
    // On-demand only: the summary is built here and handed straight to the OS
    // share sheet. Nothing is persisted or sent automatically.
    Share.share({ message: preview }).catch(() => {
      // The share sheet rejects when dismissed — nothing to recover.
    });
  };

  return (
    <ThreadCard family={PERSON_FAMILY} testID={`circle-person-${person.id}`} style={styles.cardBody}>
      <View style={styles.personHeader}>
        <View style={[styles.avatar, { borderColor: mutedPalette[PERSON_FAMILY].thread }]}>
          <Text style={styles.avatarText}>{initialOf(person.name)}</Text>
        </View>
        <View style={styles.personName}>
          <Text style={typography.heading}>{person.name}</Text>
          <Text style={styles.relationship}>{person.relationship}</Text>
        </View>
        <Pressable
          testID={`circle-remove-${person.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${person.name}`}
          style={styles.remove}
          onPress={confirmRemove}
        >
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>

      <View style={styles.controlRow}>
        <View style={styles.control}>
          <Text style={styles.overline}>Sees</Text>
          <Pressable
            testID={`circle-sees-${person.id}`}
            accessibilityRole="button"
            accessibilityLabel={`What ${person.name} sees: ${SEES_LABELS[person.sees]}. Tap to change.`}
            style={styles.optionChip}
            onPress={() => updatePerson(person.id, { sees: nextInCycle(SEES_ORDER, person.sees) })}
          >
            <Text style={styles.optionText}>{SEES_LABELS[person.sees]}</Text>
          </Pressable>
        </View>
        <View style={styles.control}>
          <Text style={styles.overline}>How often</Text>
          <Pressable
            testID={`circle-frequency-${person.id}`}
            accessibilityRole="button"
            accessibilityLabel={`How often you share with ${person.name}: ${FREQUENCY_LABELS[person.frequency]}. Tap to change.`}
            style={[styles.optionChip, person.frequency === 'paused' && styles.optionChipPaused]}
            onPress={() =>
              updatePerson(person.id, {
                frequency: nextInCycle(FREQUENCY_ORDER, person.frequency),
              })
            }
          >
            <Text style={styles.optionText}>{FREQUENCY_LABELS[person.frequency]}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.overline}>What {person.name} sees</Text>
      <Text style={styles.preview} testID={`circle-preview-${person.id}`}>
        {preview}
      </Text>

      <Pressable
        testID={`circle-share-${person.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Share this week with ${person.name}`}
        style={styles.shareBtn}
        onPress={shareNow}
      >
        <Text style={styles.shareText}>Share this week</Text>
      </Pressable>
    </ThreadCard>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const addPerson = useCircleStore((s) => s.addPerson);
  const [name, setName] = React.useState('');
  const [relationship, setRelationship] = React.useState('');

  const submit = () => {
    if (name.trim().length === 0) return;
    // New people start Paused — sharing is off until you turn it on.
    addPerson({
      name: name.trim(),
      relationship: relationship.trim() || 'Someone you trust',
      sees: 'colours',
      frequency: 'paused',
    });
    onDone();
  };

  return (
    <ThreadCard family={INVITE_FAMILY} style={styles.cardBody}>
      <Text style={typography.heading}>Invite someone</Text>
      <TextInput
        testID="circle-add-name"
        style={styles.input}
        placeholder="Their name"
        placeholderTextColor={colors.inkMuted}
        value={name}
        onChangeText={setName}
        accessibilityLabel="Their name"
      />
      <TextInput
        testID="circle-add-relationship"
        style={styles.input}
        placeholder="Who they are to you (optional)"
        placeholderTextColor={colors.inkMuted}
        value={relationship}
        onChangeText={setRelationship}
        accessibilityLabel="Who they are to you"
      />
      <View style={styles.formActions}>
        <Pressable
          testID="circle-add-cancel"
          accessibilityRole="button"
          style={styles.formCancel}
          onPress={onDone}
        >
          <Text style={styles.formCancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          testID="circle-add-submit"
          accessibilityRole="button"
          accessibilityState={{ disabled: name.trim().length === 0 }}
          disabled={name.trim().length === 0}
          style={[styles.primaryBtn, name.trim().length === 0 && styles.primaryDisabled]}
          onPress={submit}
        >
          <Text style={styles.primaryText}>Add to circle</Text>
        </Pressable>
      </View>
    </ThreadCard>
  );
}

export default function CircleScreen() {
  const insets = useSafeAreaInsets();
  const people = useCircleStore((s) => s.people);
  const checkIns = useCheckInStore((s) => s.checkIns);
  const judgmentEntries = useExperimentStore((s) => s.judgmentEntries);
  const [inviting, setInviting] = React.useState(false);

  const pendingSharePersonId = useCircleStore((s) => s.pendingSharePersonId);
  const clearPendingShare = useCircleStore((s) => s.clearPendingShare);

  // This week's summary, generated fresh — never stored.
  const stats = React.useMemo(
    () => computeStatsForWeek(checkIns, judgmentEntries, weekKey(new Date().toISOString())),
    [checkIns, judgmentEntries]
  );

  // A tapped Circle reminder lands here with a pending-share intent: open the
  // OS share sheet pre-loaded with that person's gated summary (the same gated
  // text "Share this week" produces). The user still taps share — we only
  // automated the nudge, not the send (hard rule: local-only).
  React.useEffect(() => {
    if (!pendingSharePersonId) return;
    const person = people.find((p) => p.id === pendingSharePersonId);
    clearPendingShare();
    if (!person) return;
    Share.share({ message: shareSummary(person.sees, stats) }).catch(() => {
      // The share sheet rejects when dismissed — nothing to recover.
    });
  }, [pendingSharePersonId, people, stats, clearPendingShare]);

  return (
    <View style={styles.container}>
      <PaperTexture />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        testID="screen-circle"
      >
        <Text style={typography.title}>Your circle</Text>
        <Text style={styles.intro}>
          Nothing leaves your phone until you choose it. Sharing is off until you turn it on, per
          person.
        </Text>

        {people.map((person) => (
          <PersonCard key={person.id} person={person} stats={stats} />
        ))}

        {inviting ? (
          <InviteForm onDone={() => setInviting(false)} />
        ) : (
          <Pressable
            testID="circle-invite"
            accessibilityRole="button"
            accessibilityLabel="Invite someone to your circle"
            style={styles.invite}
            onPress={() => setInviting(true)}
          >
            <Text style={styles.inviteText}>+ Invite someone</Text>
          </Pressable>
        )}

        <LogoDivider tip="Change or stop sharing any time. Removing someone deletes everything they were ever sent." />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  intro: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  cardBody: {
    gap: spacing.sm,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // Border colour comes from the person layer's thread at the use site.
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.heading,
  },
  personName: {
    flex: 1,
  },
  relationship: {
    ...typography.caption,
  },
  remove: {
    minHeight: hitTarget,
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  removeText: {
    ...typography.label,
    color: colors.inkSoft,
  },
  controlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  control: {
    gap: spacing.xs,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 130,
  },
  overline: {
    ...typography.overline,
  },
  optionChip: {
    minHeight: hitTarget,
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
  },
  optionChipPaused: {
    borderColor: colors.inkFaint,
    borderStyle: 'dashed',
  },
  optionText: {
    ...typography.label,
  },
  preview: {
    ...typography.body,
    color: colors.ink,
  },
  shareBtn: {
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ink,
    // Raised paper so the button reads as a page laid on the tinted card.
    backgroundColor: colors.paperRaised,
    marginTop: spacing.xs,
  },
  shareText: {
    ...typography.label,
    color: colors.ink,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
    paddingVertical: spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  formCancel: {
    minHeight: hitTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  formCancelText: {
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
  primaryDisabled: {
    backgroundColor: colors.inkFaint,
  },
  primaryText: {
    ...typography.label,
    color: colors.paper,
  },
  invite: {
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkFaint,
    padding: spacing.md,
  },
  inviteText: {
    ...typography.label,
    color: colors.inkSoft,
  },
});
