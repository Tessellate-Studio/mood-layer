// "Name it" reminders — a thin wrapper over expo-notifications. Local-only:
// these fire on-device from a schedule; nothing leaves the phone (hard rule).
//
// SDK NOTE: verify the exact expo-notifications SDK 55 surface at device-test
// time. Two shapes matter here and have changed across SDKs:
//   • the handler uses shouldShowBanner/shouldShowList (NOT the old
//     shouldShowAlert), and
//   • DAILY triggers take { type: SchedulableTriggerInputTypes.DAILY, hour,
//     minute }.
// The jest mock in jest.setup.js mirrors this surface.

import * as Notifications from 'expo-notifications';

import type { NameItSettings } from '@/types/models';
import { planDailyTimes } from '@/utils/notificationPlanner';

const CHANNEL_ID = 'name-it';

// Gentle, rotating reminder lines — never clinical or directive (tone rule).
const REMINDER_LINES = [
  "What's here right now?",
  'Can you name it?',
  'A moment to check in',
];

/** Foreground presentation: a quiet banner, no sound, no badge. */
export function configureHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // SDK 55 keys — banner/list, not the legacy shouldShowAlert.
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Android notification channel (no-op on iOS). Idempotent. */
export async function ensureChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Name it reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

/** Ask for permission only if not already granted. Returns the final grant. */
export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Cancel any existing reminders and, if enabled, schedule a fresh set for
 * today's planned times. Returns the scheduled notification ids so the caller
 * can persist them. Cancel-then-schedule keeps the OS from accumulating stale
 * reminders whenever the settings change.
 */
export async function rescheduleNameIt(settings: NameItSettings): Promise<string[]> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.enabled) return [];

  await ensureChannel();

  const times = planDailyTimes(settings.timesPerDay, settings.wakeStart, settings.wakeEnd);
  const ids: string[] = [];
  for (let i = 0; i < times.length; i++) {
    const { hour, minute } = times[i];
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: REMINDER_LINES[i % REMINDER_LINES.length],
        data: { route: 'CheckInFlow', source: 'name-it' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
    ids.push(id);
  }
  return ids;
}
