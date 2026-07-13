// Settings: reminders, feel (haptics / reduce motion), the ideas behind the
// app, and the data rows (export / delete). Local-only hard rule shows up
// twice here — export goes through the OS share sheet (nothing uploaded), and
// delete is a true factory reset of the on-device stores.

import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { borderRadius, colors, hitTarget, spacing, typography } from '@/constants/theme';
import PaperTexture from '@/components/PaperTexture';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { rescheduleNameIt } from '@/services/notifications';
import { useCheckInStore } from '@/store/checkInStore';
import { useCircleStore } from '@/store/circleStore';
import { useExperimentStore } from '@/store/experimentStore';
import { useInsightStore } from '@/store/insightStore';
import { useSettingsStore } from '@/store/settingsStore';
import { seedMonth } from '@/utils/devSeed';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Shown at the foot of the screen; bump alongside app.json on release. */
const APP_VERSION = 'v0.2.0';

const ABOUT_TEXT =
  'The quilt comes from Paul Ekman, who showed we rarely feel one thing at a ' +
  'time — several feelings arrive together, stitched into one moment. The ' +
  "quilt's colours follow the Atlas of Emotions, the map of feeling Ekman " +
  'built with the Dalai Lama (atlasofemotions.org). The practice of feeling ' +
  'instead of resisting comes from Joe Hudson: emotions that are allowed to ' +
  'move through the body pass on their own, and letting them builds ' +
  'resilience. This app is a practice companion, not therapy or diagnosis.';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const nameIt = useExperimentStore((s) => s.nameIt);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const reduceMotionOverride = useSettingsStore((s) => s.reduceMotionOverride);
  const setReduceMotionOverride = useSettingsStore((s) => s.setReduceMotionOverride);
  const [aboutOpen, setAboutOpen] = React.useState(false);

  const exportEverything = async () => {
    try {
      // Everything the four persisted stores hold, pretty-printed so the
      // export is human-readable. Goes through the OS share sheet only —
      // nothing is uploaded (local-only hard rule).
      await Share.share({
        title: 'The Mood Layer export',
        message: JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            checkIns: useCheckInStore.getState().checkIns,
            judgmentEntries: useExperimentStore.getState().judgmentEntries,
            nameIt: useExperimentStore.getState().nameIt,
            insightCards: useInsightStore.getState().cards,
            settings: {
              onboardingCompletedAt: useSettingsStore.getState().onboardingCompletedAt,
              hapticsEnabled: useSettingsStore.getState().hapticsEnabled,
              reduceMotionOverride: useSettingsStore.getState().reduceMotionOverride,
            },
          },
          null,
          2
        ),
      });
    } catch {
      // Share rejects when the sheet is dismissed — nothing to recover.
    }
  };

  const deleteEverything = () => {
    Alert.alert(
      'Delete everything?',
      'Every check-in, reflection, and setting on this phone will be removed. There is no backup to restore from.',
      [
        { text: 'Keep my data', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Cancel scheduled reminders BEFORE clearing the stores: clearAll
            // wipes the persisted scheduledIds, and without this call the OS
            // would keep firing orphaned notifications for an app whose data
            // is gone.
            void rescheduleNameIt({ ...nameIt, enabled: false, scheduledIds: [] });
            useCheckInStore.getState().clearAll();
            useExperimentStore.getState().clearAll();
            useInsightStore.getState().clearAll();
            useCircleStore.getState().clearAll();
            // resetAll() clears onboardingCompletedAt too, so the user
            // re-onboards — intentional: delete-everything is a factory reset.
            useSettingsStore.getState().resetAll();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]} testID="screen-settings">
      <PaperTexture />
      <View style={styles.headerRow}>
        <Pressable
          testID="settings-back"
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
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Reminders</Text>
        <Pressable
          testID="settings-name-it"
          accessibilityRole="button"
          accessibilityLabel={`Name-it reminders, currently ${
            nameIt.enabled ? `${nameIt.timesPerDay} times a day` : 'off'
          }`}
          style={styles.row}
          onPress={() => navigation.navigate('NameItSetup')}
        >
          <Text style={styles.rowLabel}>Name-it reminders</Text>
          <Text style={styles.rowValue}>
            {nameIt.enabled ? `${nameIt.timesPerDay}× a day` : 'Off'}
          </Text>
        </Pressable>

        <Text style={styles.sectionHeader}>Feel</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Haptics</Text>
          <Switch
            testID="settings-haptics"
            accessibilityLabel="Haptics"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: colors.inkFaint, true: colors.inkSoft }}
            thumbColor={colors.paperRaised}
          />
        </View>
        <View style={styles.rowGroup}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Reduce motion</Text>
            <Switch
              testID="settings-reduce-motion"
              accessibilityLabel="Reduce motion"
              value={reduceMotionOverride ?? false}
              onValueChange={(value) => setReduceMotionOverride(value)}
              trackColor={{ false: colors.inkFaint, true: colors.inkSoft }}
              thumbColor={colors.paperRaised}
            />
          </View>
          <Text style={styles.rowCaption}>
            Follows your system setting unless you turn this on.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>About the ideas</Text>
        <Pressable
          testID="settings-about"
          accessibilityRole="button"
          accessibilityLabel="About the ideas behind this app"
          accessibilityState={{ expanded: aboutOpen }}
          style={styles.row}
          onPress={() => setAboutOpen((open) => !open)}
        >
          <Text style={styles.rowLabel}>Where this comes from</Text>
          <Text style={styles.rowValue}>{aboutOpen ? 'Hide' : 'Read'}</Text>
        </Pressable>
        {aboutOpen ? <Text style={styles.aboutBody}>{ABOUT_TEXT}</Text> : null}

        <Text style={styles.sectionHeader}>Your data</Text>
        <View style={styles.rowGroup}>
          <Pressable
            testID="settings-export"
            accessibilityRole="button"
            accessibilityLabel="Export everything"
            style={styles.row}
            onPress={exportEverything}
          >
            <Text style={styles.rowLabel}>Export everything</Text>
          </Pressable>
          <Text style={styles.rowCaption}>Your data lives only on this phone.</Text>
        </View>
        <Pressable
          testID="settings-delete"
          accessibilityRole="button"
          accessibilityLabel="Delete everything"
          style={[styles.row, styles.deleteRow]}
          onPress={deleteEverything}
        >
          <Text style={styles.rowLabel}>Delete everything</Text>
        </Pressable>

        {__DEV__ ? (
          // Dev builds only — never rendered in production. Paints a
          // deterministic month of history for design review.
          <Pressable
            testID="settings-dev-seed"
            accessibilityRole="button"
            accessibilityLabel="Seed a month of sample data"
            style={[styles.row, styles.deleteRow]}
            onPress={() => {
              const n = seedMonth();
              Alert.alert('Seeded', `${n} check-ins painted across the last month.`);
            }}
          >
            <Text style={styles.rowLabel}>Seed a month (dev)</Text>
          </Pressable>
        ) : null}

        <Text style={styles.version}>{APP_VERSION}</Text>
      </ScrollView>
    </View>
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
  },
  iconButton: {
    minWidth: hitTarget,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    flex: 1,
    flexWrap: 'wrap',
  },
  content: {
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    ...typography.overline,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: {
    minHeight: hitTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.inkFaint,
  },
  rowGroup: {
    gap: spacing.xs,
  },
  rowLabel: {
    ...typography.label,
    flexShrink: 1,
  },
  rowValue: {
    ...typography.caption,
  },
  rowCaption: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  aboutBody: {
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  deleteRow: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  version: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
