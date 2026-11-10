import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { t } from '../i18n';
import { unlock } from '../services/lock';
import { useApp } from '../state/AppState';
import { usePalette } from '../state/theme';
import { space, type } from '../theme';
import { PrimaryButton, T } from './ui';

/**
 * With the lock on, Moonday is covered whenever it opens or comes back from the background, until Face ID
 * or the phone's passcode says it is her. The cover also hides her data in the app switcher.
 */
export function LockGate({ children }: { children: ReactNode }) {
  const { settings } = useApp();
  const p = usePalette();
  const [locked, setLocked] = useState(settings.lock);
  const asking = useRef(false);

  const ask = async () => {
    if (asking.current) return;
    asking.current = true;
    try {
      if (await unlock()) setLocked(false);
    } finally {
      asking.current = false;
    }
  };

  useEffect(() => {
    if (!settings.lock) {
      setLocked(false);
      return;
    }
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' || s === 'inactive') setLocked(true);
    });
    return () => sub.remove();
  }, [settings.lock]);

  useEffect(() => {
    if (locked) ask().catch(() => {});
  }, [locked]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {locked && settings.lock && (
        <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: p.bg }]} accessibilityViewIsModal>
          <View style={[styles.moon, { backgroundColor: p.period }]}><View style={[styles.bite, { backgroundColor: p.bg }]} /></View>
          <T style={type.title}>{t('Moonday is locked')}</T>
          <View style={{ alignSelf: 'stretch' }}><PrimaryButton label={t('Unlock')} onPress={() => ask().catch(() => {})} testID="unlock" /></View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: 'center', justifyContent: 'center', gap: space.xl, padding: space.xxl },
  moon: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden' },
  bite: { position: 'absolute', width: 72, height: 72, borderRadius: 36, left: 22, top: -12 },
});
