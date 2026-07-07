// P10 — notifications service: thin wrapper over expo-notifications (mocked in
// jest.setup.js). We assert the scheduling contract: cancel-then-schedule,
// count matches timesPerDay, disabled short-circuits, and enabling ensures the
// Android channel exists.

import * as Notifications from 'expo-notifications';

import {
  configureHandler,
  ensureChannel,
  ensurePermissions,
  rescheduleNameIt,
} from '@/services/notifications';
import type { NameItSettings } from '@/types/models';

const BASE: NameItSettings = {
  enabled: true,
  timesPerDay: 3,
  wakeStart: 9,
  wakeEnd: 21,
  scheduledIds: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('rescheduleNameIt', () => {
  it('cancels first, then schedules timesPerDay notifications and returns their ids', async () => {
    const ids = await rescheduleNameIt({ ...BASE, timesPerDay: 3 });

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    expect(ids).toEqual(['mock-notification-id', 'mock-notification-id', 'mock-notification-id']);

    // cancel happens before any schedule (order matters — never leave stale
    // reminders when the schedule changes).
    const cancelOrder = (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mock
      .invocationCallOrder[0];
    const firstScheduleOrder = (Notifications.scheduleNotificationAsync as jest.Mock).mock
      .invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(firstScheduleOrder);
  });

  it('when disabled: cancels, returns [], schedules nothing', async () => {
    const ids = await rescheduleNameIt({ ...BASE, enabled: false });
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(ids).toEqual([]);
  });

  it('ensures the Android channel exists when enabled', async () => {
    await rescheduleNameIt({ ...BASE, timesPerDay: 1 });
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'name-it',
      expect.objectContaining({ name: expect.any(String) })
    );
  });

  it('tags each notification with the CheckIn route so a tap deep-links', async () => {
    await rescheduleNameIt({ ...BASE, timesPerDay: 1 });
    const arg = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(arg.content.data).toEqual({ route: 'CheckInFlow', source: 'name-it' });
    expect(arg.trigger.hour).toBeGreaterThanOrEqual(0);
    expect(arg.trigger.minute).toBeGreaterThanOrEqual(0);
  });
});

describe('ensurePermissions', () => {
  it('returns true when already granted (no re-request)', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
      granted: true,
    });
    const granted = await ensurePermissions();
    expect(granted).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests when not yet granted and returns the request result', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
      granted: true,
    });
    const granted = await ensurePermissions();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(granted).toBe(true);
  });
});

describe('configureHandler / ensureChannel', () => {
  it('configureHandler installs a handler', () => {
    configureHandler();
    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  });

  it('ensureChannel creates the name-it channel', async () => {
    await ensureChannel();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'name-it',
      expect.any(Object)
    );
  });
});
