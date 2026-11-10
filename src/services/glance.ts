import { Platform } from 'react-native';

import * as native from '../../modules/moonday-native';
import { dateOf } from '../core/days';
import type { Glance } from '../core/glance';
import { t } from '../i18n';
import MoondayWidget from '../widgets/MoondayWidget';

let last = '';

/**
 * Sends the coming days to the widget (each takes over at its midnight), and today's summary to the Watch
 * and Siri. Only when something changed.
 */
export function shareGlance(days: Glance[], plus: boolean, hidden = false): void {
  const key = JSON.stringify([days, plus, hidden]);
  if (key === last || Platform.OS !== 'ios' || days.length === 0) return;
  last = key;
  try {
    native.setGlance(JSON.stringify({ ...days[0], plus }));
    const entries = days.map((g, i) => ({
      date: i === 0 ? new Date() : dateOf(g.day),
      // with the Moonday lock on, the widget keeps her cycle off the home and lock screen
      props: !plus ? { locked: true, lockedText: t('Widgets are part of Moonday Plus.') }
        : hidden ? { locked: true, lockedText: t('Open Moonday to see your cycle.') } : { glance: g },
    }));
    // dateOf gives noon; each day's entry should start at its midnight
    for (const e of entries.slice(1)) e.date.setHours(0, 0, 0, 0);
    MoondayWidget.updateTimeline(entries);
  } catch {
    // no widget support on this phone: the app works the same without it
  }
}
