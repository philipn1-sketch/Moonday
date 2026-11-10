import { Pressable, StyleSheet, View } from 'react-native';

import { usePalette } from '../state/theme';
import { space, TAP, type } from '../theme';
import { T } from './ui';

/** A row with a label, an optional note and an on and off switch drawn to match the app. */
export function Toggle({ label, note, value, onChange, testID }: { label: string; note?: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  const p = usePalette();
  return (
    <Pressable testID={testID} onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T style={type.body}>{label}</T>
        {note ? <T tone="muted" style={type.small}>{note}</T> : null}
      </View>
      <View style={[styles.track, { backgroundColor: value ? p.accent : p.raised }]}>
        <View style={[styles.knob, { backgroundColor: value ? p.onAccent : p.muted, alignSelf: value ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: TAP },
  track: { width: 52, height: 32, borderRadius: 16, padding: 3, justifyContent: 'center' },
  knob: { width: 26, height: 26, borderRadius: 13 },
});
