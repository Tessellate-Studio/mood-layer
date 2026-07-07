// "Name it" reminder setup: a gentle-reminders toggle (permission-gated), a
// frequency stepper (1–5/day), a waking-window pair of steppers, and a preview
// of today's planned times. Any change while enabled cancels + reschedules the
// on-device notifications and persists the new ids. Local-only throughout.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ModalHeader from '@/components/ModalHeader';
import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import { rescheduleNameIt, ensurePermissions } from '@/services/notifications';
import { useExperimentStore } from '@/store/experimentStore';
import type { NameItSettings } from '@/types/models';
import {
  MAX_TIMES_PER_DAY,
  MIN_TIMES_PER_DAY,
  planDailyTimes,
} from '@/utils/notificationPlanner';

const MIN_FREQ = MIN_TIMES_PER_DAY;
const MAX_FREQ = MAX_TIMES_PER_DAY;
// Waking-window guardrails: start stays morning-ish, end stays evening-ish,
// and start must remain strictly before end.
const WAKE_START_MIN = 6;
const WAKE_START_MAX = 12;
const WAKE_END_MIN = 18;
const WAKE_END_MAX = 23;

function fmt(hour: number, minute: number): string {
  return `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`;
}

// Expo Go on Android can't fire local scheduled notifications (SDK 53+
// removed support). Without this caption the toggle looks functional and
// silently does nothing — the exact user-can't-see failure the closing-retro
// exists to catch. appOwnership === 'expo' only in Expo Go, never in a dev or
// production build.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export default function NameItSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const nameIt = useExperimentStore((s) => s.nameIt);
  const setNameIt = useExperimentStore((s) => s.setNameIt);

  const [permissionDenied, setPermissionDenied] = React.useState(false);

  // Apply a settings change AND, while enabled, reschedule the reminders and
  // persist the fresh ids. Kept in one place so every control routes through it.
  const applyAndReschedule = React.useCallback(
    async (partial: Partial<NameItSettings>) => {
      setNameIt(partial);
      const next = useExperimentStore.getState().nameIt;
      if (next.enabled) {
        const scheduledIds = await rescheduleNameIt(next);
        setNameIt({ scheduledIds });
      }
    },
    [setNameIt]
  );

  const onToggle = async (value: boolean) => {
    if (value) {
      const granted = await ensurePermissions();
      if (!granted) {
        setPermissionDenied(true);
        return; // stay off
      }
      setPermissionDenied(false);
      await applyAndReschedule({ enabled: true });
    } else {
      setNameIt({ enabled: false });
      await rescheduleNameIt({ ...nameIt, enabled: false });
      setNameIt({ scheduledIds: [] });
    }
  };

  const changeFreq = (delta: number) => {
    const next = Math.min(MAX_FREQ, Math.max(MIN_FREQ, nameIt.timesPerDay + delta));
    if (next !== nameIt.timesPerDay) void applyAndReschedule({ timesPerDay: next });
  };

  const changeWakeStart = (delta: number) => {
    let next = Math.min(WAKE_START_MAX, Math.max(WAKE_START_MIN, nameIt.wakeStart + delta));
    if (next >= nameIt.wakeEnd) next = nameIt.wakeEnd - 1; // keep start < end
    if (next !== nameIt.wakeStart) void applyAndReschedule({ wakeStart: next });
  };

  const changeWakeEnd = (delta: number) => {
    let next = Math.min(WAKE_END_MAX, Math.max(WAKE_END_MIN, nameIt.wakeEnd + delta));
    if (next <= nameIt.wakeStart) next = nameIt.wakeStart + 1; // keep end > start
    if (next !== nameIt.wakeEnd) void applyAndReschedule({ wakeEnd: next });
  };

  const preview = planDailyTimes(nameIt.timesPerDay, nameIt.wakeStart, nameIt.wakeEnd);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-name-it">
      <PaperTexture />
      <ModalHeader title="Name it" closeTestID="name-it-close" onClose={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={typography.body}>
          A few soft nudges through the day to pause and name what&apos;s here.
        </Text>

        {/* Enable */}
        <View style={styles.rowBetween}>
          <Text style={typography.label}>Gentle reminders</Text>
          <Switch
            testID="name-it-enabled"
            accessibilityLabel="Gentle reminders"
            accessibilityRole="switch"
            accessibilityState={{ checked: nameIt.enabled }}
            value={nameIt.enabled}
            onValueChange={onToggle}
            trackColor={{ true: colors.ink, false: colors.inkFaint }}
            thumbColor={colors.paperRaised}
          />
        </View>
        {permissionDenied ? (
          <Text style={styles.denied}>Reminders need notification permission</Text>
        ) : null}
        {IS_EXPO_GO ? (
          <Text style={styles.denied} testID="expo-go-note">
            Previewing in Expo Go — reminders will not fire here. They work in
            the installed app.
          </Text>
        ) : null}

        {/* Frequency */}
        <Stepper
          label="Times a day"
          value={`${nameIt.timesPerDay}`}
          decTestID="freq-dec"
          incTestID="freq-inc"
          onDec={() => changeFreq(-1)}
          onInc={() => changeFreq(1)}
          a11yLabel={`Times a day, ${nameIt.timesPerDay}`}
        />

        {/* Waking window */}
        <Stepper
          label="Waking starts"
          value={fmt(nameIt.wakeStart, 0)}
          decTestID="wake-start-dec"
          incTestID="wake-start-inc"
          onDec={() => changeWakeStart(-1)}
          onInc={() => changeWakeStart(1)}
          a11yLabel={`Waking starts, ${nameIt.wakeStart} o'clock`}
        />
        <Stepper
          label="Waking ends"
          value={fmt(nameIt.wakeEnd, 0)}
          decTestID="wake-end-dec"
          incTestID="wake-end-inc"
          onDec={() => changeWakeEnd(-1)}
          onInc={() => changeWakeEnd(1)}
          a11yLabel={`Waking ends, ${nameIt.wakeEnd} o'clock`}
        />

        {/* Preview */}
        <View style={styles.previewBlock}>
          <Text style={styles.overline}>Today&apos;s times</Text>
          <Text style={styles.preview}>{preview.map((t) => fmt(t.hour, t.minute)).join('   ')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

interface StepperProps {
  label: string;
  value: string;
  decTestID: string;
  incTestID: string;
  onDec(): void;
  onInc(): void;
  a11yLabel: string;
}

function Stepper({ label, value, decTestID, incTestID, onDec, onInc, a11yLabel }: StepperProps) {
  return (
    <View style={styles.rowBetween} accessibilityLabel={a11yLabel}>
      <Text style={typography.label}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          testID={decTestID}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          style={styles.stepBtn}
          onPress={onDec}
        >
          <Text style={styles.stepGlyph}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable
          testID={incTestID}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          style={styles.stepBtn}
          onPress={onInc}
        >
          <Text style={styles.stepGlyph}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  body: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  denied: {
    ...typography.caption,
    marginTop: -spacing.sm,
  },
  overline: {
    ...typography.overline,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: hitTarget,
    height: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  stepGlyph: {
    ...typography.title,
  },
  stepValue: {
    ...typography.label,
    minWidth: 52,
    textAlign: 'center',
  },
  previewBlock: {
    gap: spacing.xs,
  },
  preview: {
    ...typography.caption,
  },
});
