// "Name it" reminders — a thin wrapper over expo-notifications. Local-only:
// these fire on-device from a schedule; nothing leaves the phone (hard rule).
//
// EXPO GO GUARD (device-verified 2026-07-07): merely IMPORTING
// expo-notifications inside Expo Go on Android crashes the runtime red-screen
// ("Android Push notifications ... removed from Expo Go with SDK 53" — thrown
// from the module's own init via addPushTokenListener). So the module is
// lazy-required and skipped entirely under Expo Go; every function degrades to
// a quiet no-op there. Real builds (dev/production) load it normally.
//
// SDK NOTE: two shapes changed across SDKs and are used here:
//   • the handler uses shouldShowBanner/shouldShowList (NOT the old
//     shouldShowAlert), and
//   • DAILY triggers take { type: SchedulableTriggerInputTypes.DAILY, hour,
//     minute }.
// The jest mock in jest.setup.js mirrors this surface.

import Constants from 'expo-constants';

import type { NameItSettings } from '@/types/models';
import { planDailyTimes } from '@/utils/notificationPlanner';

type NotificationsModule = typeof import('expo-notifications');

/** appOwnership === 'expo' only inside Expo Go, never in a real build. */
const IS_EXPO_GO = Constants.appOwnership === 'expo';

let cachedModule: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (cachedModule === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = IS_EXPO_GO ? null : (require('expo-notifications') as NotificationsModule);
  }
  return cachedModule;
}

const CHANNEL_ID = 'name-it';

// Gentle, rotating reminder lines — never clinical or directive (tone rule).
const REMINDER_LINES = [
  "What's here right now?",
  'Can you name it?',
  'A moment to check in',
];

/** Foreground presentation: a quiet banner, no sound, no badge. */
export function configureHandler(): void {
  const Notifications = getNotifications();
  if (!Notifications) return;
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

/** Android notification channel (no-op on iOS and Expo Go). Idempotent. */
export async function ensureChannel(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Name it reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

/** Ask for permission only if not already granted. Returns the final grant.
 *  Expo Go: resolves true so the setup screen stays usable (its Expo Go
 *  caption explains reminders won't fire there). */
export async function ensurePermissions(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return true;
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
  const Notifications = getNotifications();
  if (!Notifications) return [];
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

/**
 * Route notification taps (warm + cold start) to the given handler. Returns an
 * unsubscribe. Expo Go: inert no-op (no listener exists to fire anyway).
 * App.tsx uses this instead of importing expo-notifications directly, so the
 * Expo Go import guard stays the single choke point.
 */
export function subscribeToNotificationTaps(
  onData: (data: unknown) => void
): () => void {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};

  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    onData(r.notification.request.content.data);
  });

  // Cold start: app launched by tapping a reminder.
  void Notifications.getLastNotificationResponseAsync().then((r) => {
    if (r) onData(r.notification.request.content.data);
  });

  return () => sub.remove();
}
