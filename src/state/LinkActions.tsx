import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';

import * as native from '../../modules/moonday-native';
import { t } from '../i18n';
import { useApp } from './AppState';

/** Acts on moonday://action?do=period from Siri, and on Log period tapped on the Watch. */
export function LinkActions() {
  const { saveDay, todayKey, dayLog, showSnack, viewOnly } = useApp();
  const ref = useRef({ saveDay, todayKey, dayLog, showSnack, viewOnly });
  ref.current = { saveDay, todayKey, dayLog, showSnack, viewOnly };

  useEffect(() => {
    const logPeriod = () => {
      const r = ref.current;
      if (r.viewOnly || r.dayLog(r.todayKey).flow) return;
      r.saveDay(r.todayKey, { flow: 'medium' });
      r.showSnack(t('Logged today as a period day.'));
    };
    const act = (url: string | null | undefined) => {
      if (url && /action\?(?:.*&)?do=period\b/.test(url)) logPeriod();
    };
    Linking.getInitialURL().then(act).catch(() => {});
    const sub = Linking.addEventListener('url', (e) => act(e.url));
    native.takePendingActions().forEach((a) => a.action === 'period' && logPeriod());
    const watch = native.onWatchAction((a) => a.action === 'period' && logPeriod());
    return () => {
      sub.remove();
      watch.remove();
    };
  }, []);
  return null;
}
