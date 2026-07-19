// Circle tab — share with your people, on your terms. Each person is a local
// preference: what they SEE (colours + words / colours only / a count) and HOW
// OFTEN you mean to share. Nothing leaves the phone on its own — "Share now"
// generates a summary on the spot (gated by their `sees` level) and hands it to
// the OS share sheet. Removing someone forgets them entirely.

import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { borderRadius, colors, hitTarget, mutedPalette, spacing, typography } from '@/constants/theme';
import LogoDivider from '@/components/LogoDivider';
import PaperTexture from '@/components/PaperTexture';
import ThreadCard from '@/components/ThreadCard';
import {
  ACTIVE_FREQUENCY_ORDER,
  FREQUENCY_LABELS,
  nextInCycle,
  SEES_LABELS,
  SEES_ORDER,
  shareSummary,
} from '@/content/circle';
import PairSheet from '@/components/PairSheet';
import { useCheckInStore } from '@/store/checkInStore';
import { syncCircleInbox, useCircleStore, type ReceivedStatus } from '@/store/circleStore';
import { useExperimentStore } from '@/store/experimentStore';
import type { CirclePerson, EmotionFamilyId, WeekStats } from '@/types/models';
import { weekKey } from '@/utils/dates';
import { computeStatsForWeek } from '@/utils/insightEngine';

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

// Muted-layer treatment: people wear the soft sage green (closeness). The
// invite form stays plain raised paper — a form is chrome, not a layer.
const PERSON_FAMILY: EmotionFamilyId = 'disgust';

function PersonCard({ person, stats }: { person: CirclePerson; stats: WeekStats }) {
  const updatePerson = useCircleStore((s) => s.updatePerson);
  const removePerson = useCircleStore((s) => s.removePerson);
  const pairing = useCircleStore((s) => s.pairings[person.id]);
  const setPairing = useCircleStore((s) => s.setPairing);
  const removePairing = useCircleStore((s) => s.removePairing);
  const [pairingOpen, setPairingOpen] = React.useState(false);
  const [sentAt, setSentAt] = React.useState<string | null>(null);
  const preview = shareSummary(person.sees, stats);
  const paused = person.frequency === 'paused';

  // Peer-app delivery: seal the SAME gated summary on this device and drop it
  // on the relay; their app decrypts it into their Circle screen. The one
  // sanctioned exception to local-only (docs/SECURITY.md).
  const sendToApp = async () => {
    if (!pairing) return;
    try {
      const { getKeyPair, seal, sendSealed } = await import('@/services/circleRelay');
      const pair = await getKeyPair();
      await sendSealed(pairing, seal(preview, pairing.peerPub, pair.secretKey));
      setSentAt(new Date().toISOString());
    } catch {
      Alert.alert('Could not send', 'The relay is unreachable right now — try again in a moment.');
    }
  };

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

  // The header toggle IS the pause switch: one tap to rest a person, one tap
  // to resume at their own rhythm (user, 2026-07-18). 'Paused' left the
  // how-often cycle entirely — cycling is for choosing a rhythm, not for
  // stopping one.
  const setActive = (active: boolean) => {
    if (active) {
      updatePerson(person.id, { frequency: person.lastActiveFrequency ?? 'weekly' });
    } else if (!paused) {
      updatePerson(person.id, {
        frequency: 'paused',
        lastActiveFrequency: person.frequency as Exclude<CirclePerson['frequency'], 'paused'>,
      });
    }
  };

  const shareNow = () => {
    // On-demand only: the summary is built here and handed straight to the OS
    // share sheet. Nothing is persisted or sent automatically.
    Share.share({ message: preview }).catch(() => {
      // The share sheet rejects when dismissed — nothing to recover.
    });
  };

  // Swipe-to-remove only — a always-visible Remove button made deleting a
  // person one accidental tap away (user, 2026-07-18).
  const renderActions = () => (
    <View style={styles.actionsRow}>
      <Pressable
        testID={`circle-remove-${person.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${person.name}`}
        style={styles.actionBtn}
        onPress={confirmRemove}
      >
        <Text style={styles.actionText}>Remove</Text>
      </Pressable>
    </View>
  );

  return (
    <ReanimatedSwipeable renderRightActions={renderActions} overshootRight={false}>
      <ThreadCard family={PERSON_FAMILY} testID={`circle-person-${person.id}`} style={styles.cardBody}>
        <View style={styles.personHeader}>
          <View style={[styles.avatar, { borderColor: mutedPalette[PERSON_FAMILY].thread }]}>
            <Text style={styles.avatarText}>{initialOf(person.name)}</Text>
          </View>
          <View style={styles.personName}>
            <Text style={typography.heading}>{person.name}</Text>
            <Text style={styles.relationship}>{person.relationship}</Text>
          </View>
          {sentAt ? <Text style={styles.sentDot} testID={`circle-sent-${person.id}`}>✓</Text> : null}
          {pairing ? (
            <Pressable
              testID={`circle-send-${person.id}`}
              accessibilityRole="button"
              disabled={paused}
              accessibilityLabel={`Send to ${person.name}'s app`}
              style={styles.headerIconBtn}
              onPress={() => void sendToApp()}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M3 11 L21 4 L14.5 21 L11 13.5 Z" stroke={colors.ink} strokeWidth={1.5} strokeLinejoin="round" />
                <Line x1={11} y1={13.5} x2={21} y2={4} stroke={colors.ink} strokeWidth={1.5} />
              </Svg>
            </Pressable>
          ) : null}
          <Pressable
            testID={`circle-share-${person.id}`}
            accessibilityRole="button"
            disabled={paused}
            accessibilityLabel={`Share with ${person.name} as text`}
            style={styles.headerIconBtn}
            onPress={shareNow}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={6} cy={12} r={2.4} stroke={colors.ink} strokeWidth={1.5} />
              <Circle cx={17.5} cy={5.5} r={2.4} stroke={colors.ink} strokeWidth={1.5} />
              <Circle cx={17.5} cy={18.5} r={2.4} stroke={colors.ink} strokeWidth={1.5} />
              <Line x1={8.2} y1={10.9} x2={15.3} y2={6.6} stroke={colors.ink} strokeWidth={1.5} />
              <Line x1={8.2} y1={13.1} x2={15.3} y2={17.4} stroke={colors.ink} strokeWidth={1.5} />
            </Svg>
          </Pressable>
          <Pressable
            testID={pairing ? `circle-unpair-${person.id}` : `circle-pair-${person.id}`}
            accessibilityRole="button"
            disabled={paused}
            accessibilityLabel={
              pairing ? `Unpair ${person.name}'s app` : `Pair ${person.name}'s app`
            }
            style={styles.headerIconBtn}
            onPress={() => {
              if (!pairing) {
                setPairingOpen(true);
                return;
              }
              Alert.alert(
                `Unpair ${person.name}?`,
                'Their app will stop receiving your weeks until you pair again.',
                [
                  { text: 'Keep', style: 'cancel' },
                  {
                    text: 'Unpair',
                    style: 'destructive',
                    onPress: () => {
                      const creds = pairing;
                      removePairing(person.id);
                      void import('@/services/circleRelay').then((m) =>
                        m.unpair(creds).catch(() => {})
                      );
                    },
                  },
                ]
              );
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M4 9 V4 H9" stroke={colors.ink} strokeWidth={1.5} />
              <Path d="M15 4 H20 V9" stroke={colors.ink} strokeWidth={1.5} />
              <Path d="M20 15 V20 H15" stroke={colors.ink} strokeWidth={1.5} />
              <Path d="M9 20 H4 V15" stroke={colors.ink} strokeWidth={1.5} />
              {pairing ? (
                <Circle cx={12} cy={12} r={2.6} fill={colors.ink} />
              ) : (
                <Circle cx={12} cy={12} r={2.6} stroke={colors.ink} strokeWidth={1.5} />
              )}
            </Svg>
          </Pressable>
          <Switch
            testID={`circle-active-${person.id}`}
            accessibilityLabel={`Sharing with ${person.name}: ${paused ? 'paused' : 'on'}`}
            value={!paused}
            onValueChange={setActive}
            trackColor={{ false: colors.inkFaint, true: colors.inkSoft }}
            thumbColor={colors.paperRaised}
          />
        </View>

        <View style={[styles.cardInner, paused && styles.dormant]}>
          <View style={styles.controlRow}>
            <View style={styles.control}>
              <Text style={styles.overline}>Sees</Text>
              <Pressable
                testID={`circle-sees-${person.id}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: paused }}
                disabled={paused}
                accessibilityLabel={`What ${person.name} sees: ${SEES_LABELS[person.sees]}. Tap to change.`}
                style={styles.optionChip}
                onPress={() =>
                  updatePerson(person.id, { sees: nextInCycle(SEES_ORDER, person.sees) })
                }
              >
                <Text style={styles.optionText}>{SEES_LABELS[person.sees]}</Text>
              </Pressable>
            </View>
            <View style={styles.control}>
              <Text style={styles.overline}>How often</Text>
              <Pressable
                testID={`circle-frequency-${person.id}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: paused }}
                disabled={paused}
                accessibilityLabel={
                  paused
                    ? `Sharing with ${person.name} is paused`
                    : `How often you share with ${person.name}: ${FREQUENCY_LABELS[person.frequency]}. Tap to change.`
                }
                style={styles.optionChip}
                onPress={() =>
                  updatePerson(person.id, {
                    frequency: nextInCycle(ACTIVE_FREQUENCY_ORDER, person.frequency),
                  })
                }
              >
                <Text style={styles.optionText}>{FREQUENCY_LABELS[person.frequency]}</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.overline, styles.previewLabel]}>What {person.name} sees</Text>
          <Text style={styles.preview} testID={`circle-preview-${person.id}`}>
            {preview}
          </Text>
        </View>

        <PairSheet
          visible={pairingOpen}
          personName={person.name}
          onPaired={(creds) => {
            setPairing(person.id, creds);
            setPairingOpen(false);
          }}
          onClose={() => setPairingOpen(false)}
        />
      </ThreadCard>
    </ReanimatedSwipeable>
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
    // Plain raised paper — the amber family tint fought the grey disabled
    // button and read as an ugly clash (user, 2026-07-18). A form is chrome,
    // not a layer.
    <View style={styles.inviteCard}>
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
    </View>
  );
}

/** The latest received status per paired person — a quiet strip, like
 *  status rows on social apps, in the person's muted layer. */
function ReceivedStrip({ people, received }: { people: CirclePerson[]; received: ReceivedStatus[] }) {
  const latest = new Map<string, ReceivedStatus>();
  for (const status of received) {
    if (!latest.has(status.personId)) latest.set(status.personId, status);
  }
  if (latest.size === 0) return null;
  return (
    <View style={styles.receivedBlock} testID="circle-received">
      <Text style={styles.overline}>From your circle</Text>
      {[...latest.values()].map((status) => {
        const person = people.find((p) => p.id === status.personId);
        if (!person) return null;
        return (
          <ThreadCard
            key={status.id}
            family={PERSON_FAMILY}
            testID={`received-${status.personId}`}
            style={styles.receivedBody}
          >
            <Text style={typography.heading}>{person.name}</Text>
            <Text style={typography.body}>{status.message}</Text>
            <Text style={styles.receivedWhen}>
              {new Date(status.sentAt).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </ThreadCard>
        );
      })}
    </View>
  );
}

export default function CircleScreen() {
  const insets = useSafeAreaInsets();
  const people = useCircleStore((s) => s.people);
  const received = useCircleStore((s) => s.received);
  const checkIns = useCheckInStore((s) => s.checkIns);
  const judgmentEntries = useExperimentStore((s) => s.judgmentEntries);
  const [inviting, setInviting] = React.useState(false);

  // Pull anything paired people sent since we last looked. Focus-driven in
  // phase 1 (a push poke arrives with scheduled sends, phase 2).
  useFocusEffect(
    React.useCallback(() => {
      void syncCircleInbox();
    }, [])
  );

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

        <ReceivedStrip people={people} received={received} />

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
  dormant: {
    opacity: 0.45,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginLeft: spacing.sm,
  },
  actionBtn: {
    minWidth: hitTarget + 16,
    minHeight: hitTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.paperRaised,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    ...typography.label,
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
    // Always solid: the old dashed-when-paused border stuck around after
    // cycling away on Android (borderStyle doesn't repaint) — pause state now
    // reads from the toggle + the dormant fade, not a border style.
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    ...typography.label,
  },
  preview: {
    ...typography.body,
    color: colors.ink,
  },
  inviteCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.inkFaint,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentDot: {
    ...typography.caption,
  },
  cardInner: {
    gap: spacing.sm,
  },
  previewLabel: {
    marginTop: spacing.xs,
  },
  receivedBlock: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  receivedBody: {
    gap: spacing.xs,
  },
  receivedWhen: {
    ...typography.caption,
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
