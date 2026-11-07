import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { t } from '../i18n';
import { usePalette } from '../state/theme';
import { line, space, type } from '../theme';
import { T } from './ui';

type Tab = 'today' | 'calendar' | 'insights' | 'settings';
const PATHS: Record<Tab, '/' | '/calendar' | '/insights' | '/settings'> = { today: '/', calendar: '/calendar', insights: '/insights', settings: '/settings' };

/** Small drawn icons, so the app needs no icon font. */
function Icon({ tab, color }: { tab: Tab; color: string }) {
  if (tab === 'today') {
    return <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: color }}><View style={{ position: 'absolute', top: 4, left: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: color }} /></View>;
  }
  if (tab === 'calendar') {
    return (
      <View style={{ width: 22, height: 21, borderRadius: 5, borderWidth: 2.5, borderColor: color, paddingTop: 4, paddingHorizontal: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
        {[0, 1, 2, 3].map((i) => <View key={i} style={{ width: 5, height: 4, borderRadius: 1, backgroundColor: color }} />)}
      </View>
    );
  }
  if (tab === 'insights') {
    return (
      <View style={{ width: 22, height: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
        {[9, 16, 12, 20].map((h, i) => <View key={i} style={{ width: 3.5, height: h, borderRadius: 2, backgroundColor: color }} />)}
      </View>
    );
  }
  return (
    <View style={{ width: 22, height: 20, justifyContent: 'space-between', paddingVertical: 2 }}>
      {[0, 1, 2].map((i) => <View key={i} style={{ height: 2.5, borderRadius: 2, backgroundColor: color, marginRight: i === 1 ? 6 : 0 }} />)}
    </View>
  );
}

export function TabBar({ current }: { current: Tab }) {
  const p = usePalette();
  const label: Record<Tab, string> = { today: t('Today'), calendar: t('Calendar'), insights: t('Insights'), settings: t('Settings') };
  return (
    <View style={[styles.bar, { borderTopColor: line(p), backgroundColor: p.bg }]} accessibilityRole="tablist">
      {(Object.keys(PATHS) as Tab[]).map((tab) => {
        const on = tab === current;
        const color = on ? p.accent : p.muted;
        return (
          <Pressable key={tab} testID={`tab-${tab}`} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tab}
            onPress={() => !on && router.replace(PATHS[tab])}>
            <Icon tab={tab} color={color} />
            <T style={[type.small, { color, marginTop: 4 }]} maxFontSizeMultiplier={1.3}>{label[tab]}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.s },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
});
