// P10 — notifications service: thin wrapper over expo-notifications (mocked in
// jest.setup.js). We assert the scheduling contract: cancel-then-schedule,
// count matches timesPerDay, disabled short-circuits, and enabling ensures the
// Android channel exists.

import * as Notifications from 'expo-notifications';

import {
  configureHandler,
  ensureChannel,
  ensurePermissions,
  rescheduleCircle,
  rescheduleNameIt,
} from '@/services/notifications';
import type { CirclePerson, NameItSettings } from '@/types/models';

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

describe('rescheduleCircle', () => {
  const person = (over: Partial<CirclePerson> = {}): CirclePerson => ({
    id: 'p1',
    name: 'Sam',
    relationship: 'Partner',
    sees: 'colours',
    frequency: 'evening',
    ...over,
  });

  it('schedules one reminder per non-paused person and returns a personId → ids map', async () => {
    const map = await rescheduleCircle(
      [
        person({ id: 'p1', frequency: 'evening' }),
        person({ id: 'p2', frequency: 'weekly' }),
        person({ id: 'p3', frequency: 'paused' }),
      ],
      {}
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(map).toEqual({ p1: ['mock-notification-id'], p2: ['mock-notification-id'] });
  });

  it('cancels prior ids PER ID — never cancelAll (that would wipe name-it)', async () => {
    await rescheduleCircle([person({ id: 'p1' })], { p1: ['old-1'], p2: ['old-2'] });
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-1');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-2');
    expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  it('a now-paused person: cancels their stale id and schedules nothing', async () => {
    const map = await rescheduleCircle([person({ id: 'p1', frequency: 'paused' })], {
      p1: ['old-1'],
    });
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-1');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(map).toEqual({});
  });

  it('tags each reminder with the Circle route + personId so a tap deep-links', async () => {
    await rescheduleCircle([person({ id: 'p1', frequency: 'evening' })], {});
    const arg = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(arg.content.data).toEqual({ route: 'Circle', source: 'circle', personId: 'p1' });
  });

  it('uses a weekly trigger (Sunday) for weekly and a daily trigger for evening', async () => {
    await rescheduleCircle([person({ id: 'p1', frequency: 'weekly' })], {});
    const weekly = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(weekly.trigger.type).toBe('weekly');
    expect(weekly.trigger.weekday).toBe(1);

    jest.clearAllMocks();
    await rescheduleCircle([person({ id: 'p2', frequency: 'evening' })], {});
    const daily = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(daily.trigger.type).toBe('daily');
    expect(daily.trigger.weekday).toBeUndefined();
  });

  it('ensures the circle channel exists when scheduling', async () => {
    await rescheduleCircle([person({ id: 'p1', frequency: 'evening' })], {});
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'circle',
      expect.objectContaining({ name: expect.any(String) })
    );
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
