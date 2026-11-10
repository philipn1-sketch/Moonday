// The web preview has no notifications.
import type { Planned } from '../core/reminders';
import type { Reminders } from '../core/types';

export type Permission = 'granted' | 'denied' | 'undetermined';
export const permission = async (): Promise<Permission> => 'undetermined';
export const askPermission = async (): Promise<Permission> => 'denied';
export const syncReminders = async (_plan: Planned[], _r: Reminders): Promise<void> => {};
