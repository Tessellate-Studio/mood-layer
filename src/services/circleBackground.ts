// Circle background wake (phase 2): a periodic OS task (WorkManager via
// expo-background-task) that 1) sends any DUE automatic summaries and
// 2) pulls the inbox, raising a gentle local notification when a paired
// person's week arrived. Honest automation: Android decides the exact wake
// moments (15-min granularity at best, often coarser under Doze) — the
// foreground catch-up in App.tsx covers the gap whenever the app opens.
//
// Follows the notifications service's EXPO GO GUARD pattern: lazy-require +
// no-op under Expo Go, where background tasks and notifications are absent.

import Constants from 'expo-constants';

import { runCircleAutoSend, syncCircleInbox } from '@/store/circleStore';
import { notifyCircleReceived } from '@/services/notifications';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

export const CIRCLE_TASK = 'circle-auto-delivery';

/** Minimum minutes between wakes — the OS treats this as a floor, not a
 *  schedule. Coarse on purpose: delivery is a daily/weekly rhythm. */
const MIN_INTERVAL_MINUTES = 60;

type TaskManagerModule = typeof import('expo-task-manager');
type BackgroundTaskModule = typeof import('expo-background-task');

function getModules(): { tm: TaskManagerModule; bg: BackgroundTaskModule } | null {
  if (IS_EXPO_GO) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tm = require('expo-task-manager') as TaskManagerModule;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bg = require('expo-background-task') as BackgroundTaskModule;
  return { tm, bg };
}

/** The shared body of a wake — also the foreground catch-up in App.tsx
 *  (there `notify` stays false: the user is already looking). */
export async function runCircleDelivery(notify: boolean): Promise<void> {
  await runCircleAutoSend();
  const arrivedFrom = await syncCircleInbox();
  if (notify && arrivedFrom.length > 0) {
    await notifyCircleReceived(arrivedFrom);
  }
}

// Task DEFINITION happens at MODULE SCOPE, as a side effect of importing
// this file (App.tsx does). This is load-bearing: a WorkManager wake runs
// the JS bundle HEADLESS — no render, no effects — so a definition made
// inside a component effect would not exist precisely when the OS calls the
// task, and every background wake would fail with "task not defined".
(() => {
  const modules = getModules();
  if (!modules) return;
  const { tm, bg } = modules;
  if (tm.isTaskDefined(CIRCLE_TASK)) return;
  tm.defineTask(CIRCLE_TASK, async () => {
    try {
      await runCircleDelivery(true);
      return bg.BackgroundTaskResult.Success;
    } catch {
      return bg.BackgroundTaskResult.Failed;
    }
  });
})();

/**
 * Register the periodic task with the OS. Call from App start (the
 * definition above already happened at import time). Safe to call
 * repeatedly — registration is idempotent.
 */
export async function registerCircleDelivery(): Promise<void> {
  const modules = getModules();
  if (!modules) return;
  try {
    await modules.bg.registerTaskAsync(CIRCLE_TASK, {
      minimumInterval: MIN_INTERVAL_MINUTES,
    });
  } catch {
    // Registration can fail on devices with background restrictions —
    // the foreground catch-up still delivers.
  }
}
