import * as Notifications from 'expo-notifications';

import { APP_NAME } from '../config';
import { LOG, PILL, PILL_DISCREET, type Planned } from '../core/reminders';
import type { Reminders } from '../core/types';
import { t } from '../i18n';

export type Permission = 'granted' | 'denied' | 'undetermined';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function permission(): Promise<Permission> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

export async function askPermission(): Promise<Permission> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

/** Replaces every Moonday reminder with the ones planned now, plus the daily pill and log reminders. */
export async function syncReminders(plan: Planned[], r: Reminders): Promise<void> {
  if ((await permission()) !== 'granted') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const content = (body: string) => ({ title: APP_NAME, body: t(body), sound: 'default' as const });
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: content(p.body),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(p.at) },
    });
  }
  const daily = async (id: string, minutes: number, body: string) =>
    Notifications.scheduleNotificationAsync({
      identifier: id,
      content: content(body),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: Math.floor(minutes / 60), minute: minutes % 60 },
    });
  if (r.pill !== null) await daily('pill', r.pill, r.discreet ? PILL_DISCREET : PILL);
  if (r.log !== null) await daily('log', r.log, LOG);
}
