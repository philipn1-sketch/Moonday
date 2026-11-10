import { Pressable, StyleSheet, View } from 'react-native';

import { t } from '../i18n';
import { usePalette } from '../state/theme';
import { radius, space, TAP, type } from '../theme';
import { T } from './ui';

/** Minus, a value, and plus, each a full tap target. */
export function Stepper({ label, value, display, onChange, min, max, testID }: {
  label: string;
  value: number;
  display: string;
  onChange: (n: number) => void;
  min: number;
  max: number;
  testID?: string;
}) {
  const p = usePalette();
  const button = (dir: -1 | 1) => {
    const off = dir < 0 ? value <= min : value >= max;
    return (
      <Pressable testID={testID ? `${testID}-${dir < 0 ? 'less' : 'more'}` : undefined} disabled={off} accessibilityRole="button"
        accessibilityLabel={t(dir < 0 ? 'Less {what}' : 'More {what}', { what: label.toLowerCase() })}
        onPress={() => onChange(Math.min(max, Math.max(min, value + dir)))}
        style={({ pressed }) => [styles.button, { backgroundColor: p.raised, opacity: off ? 0.35 : pressed ? 0.7 : 1 }]}>
        <T style={type.title}>{dir < 0 ? '−' : '+'}</T>
      </Pressable>
    );
  };
  return (
    <View style={styles.row} accessible={false}>
      {button(-1)}
      <T style={[type.title, styles.value]} accessibilityLabel={`${label}: ${display}`} testID={testID}>{display}</T>
      {button(1)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  button: { width: TAP, height: TAP, borderRadius: radius.row, alignItems: 'center', justifyContent: 'center' },
  value: { flex: 1, textAlign: 'center' },
});
