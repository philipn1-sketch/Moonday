import { ScrollView, StyleSheet, View } from 'react-native';

import { TabBar } from '../components/TabBar';
import { Card, Choice, Screen, T } from '../components/ui';
import type { Goal, ThemeChoice } from '../core/types';
import { t } from '../i18n';
import { useApp } from '../state/AppState';
import { space, type } from '../theme';

/** Settings for the design review; reminders, privacy, sharing and Plus come in the next round. */
export default function Settings() {
  const { settings, updateSettings } = useApp();
  return (
    <Screen>
      <View style={styles.head}><T style={[type.title, { fontSize: 28 }]} accessibilityRole="header">{t('Settings')}</T></View>
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={{ gap: space.m }}>
          <T tone="muted" style={type.label}>{t('What are you tracking for?')}</T>
          <Choice<Goal> label={t('Goal')} value={settings.goal} onChange={(goal) => updateSettings({ goal })}
            options={[{ value: 'track', label: t('My cycle') }, { value: 'conceive', label: t('Conceiving') }, { value: 'pregnant', label: t('Pregnant') }]} />
        </Card>
        <Card style={{ gap: space.m }}>
          <T tone="muted" style={type.label}>{t('Look')}</T>
          <Choice<ThemeChoice> label={t('Look')} value={settings.theme} onChange={(theme) => updateSettings({ theme })}
            options={[{ value: 'night', label: t('Night') }, { value: 'day', label: t('Day') }, { value: 'system', label: t('Auto') }]} />
        </Card>
      </ScrollView>
      <TabBar current="settings" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.side, paddingTop: space.m, paddingBottom: space.s },
  body: { paddingHorizontal: space.side, paddingBottom: space.xl, gap: space.l },
});
