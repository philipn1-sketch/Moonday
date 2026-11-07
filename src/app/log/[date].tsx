import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PillButton, PrimaryButton, Screen, T, TopBar } from '../../components/ui';
import { dateOf, today } from '../../core/days';
import {
  DIGESTION, DISCHARGE, ENERGY, FLOWS, MOODS, OVULATION_TEST, PREGNANCY_TEST, SEX, SLEEP, SYMPTOMS,
} from '../../core/options';
import type { DayLog } from '../../core/types';
import { t } from '../../i18n';
import { useApp } from '../../state/AppState';
import { usePalette } from '../../state/theme';
import { line, radius, space, type, wash } from '../../theme';

type Options = readonly { id: string; label: string }[];

/** Everything about one day, in tap sized chips. Nothing is required; saving keeps only what she picked. */
export default function LogDay() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const day = date ?? today();
  const { dayLog, saveDay, showSnack } = useApp();
  const p = usePalette();
  const [draft, setDraft] = useState<DayLog>(() => dayLog(day));
  const set = (patch: Partial<DayLog>) => setDraft((d) => ({ ...d, ...patch }));

  const one = <K extends keyof DayLog>(key: K) => (id: string) => set({ [key]: draft[key] === id ? undefined : id } as Partial<DayLog>);
  const many = (key: 'symptoms' | 'moods' | 'digestion') => (id: string) => {
    const now = draft[key] ?? [];
    set({ [key]: now.includes(id) ? now.filter((x) => x !== id) : [...now, id] });
  };

  const save = () => {
    const { date: _d, ...rest } = draft;
    saveDay(day, { ...rest, note: draft.note?.trim() || undefined });
    showSnack(t('Saved.'));
    router.back();
  };

  const chips = (opts: Options, isOn: (id: string) => boolean, toggle: (id: string) => void, color: string = p.accent, id = '') => (
    <View style={styles.chips}>
      {opts.map((o) => {
        const on = isOn(o.id);
        return (
          <Pressable key={o.id} testID={`${id}${o.id}`} onPress={() => toggle(o.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
            style={({ pressed }) => [styles.chip, { backgroundColor: on ? color : p.surface, borderColor: on ? color : line(p), opacity: pressed ? 0.8 : 1 }]}>
            <T style={[type.label, { color: on ? p.onAccent : p.ink, fontWeight: on ? '700' : '500' }]}>{t(o.label)}</T>
          </Pressable>
        );
      })}
    </View>
  );
  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <View style={{ gap: space.s }}>
      <T tone="muted" style={[type.small, { textTransform: 'uppercase' }]} accessibilityRole="header">{title}</T>
      {children}
    </View>
  );
  const number = (value: number | undefined, onChange: (n: number | undefined) => void, unit: string, testID: string, placeholder: string) => (
    <View style={[styles.numberBox, { backgroundColor: p.surface }]}>
      <TextInput testID={testID} keyboardType="decimal-pad" value={value === undefined ? '' : String(value)} placeholder={placeholder} placeholderTextColor={p.muted}
        onChangeText={(s) => {
          const n = parseFloat(s.replace(',', '.'));
          onChange(Number.isFinite(n) ? n : undefined);
        }} style={[type.title, { color: p.ink, flex: 1 }]} accessibilityLabel={placeholder} />
      <T tone="muted">{unit}</T>
    </View>
  );

  return (
    <Screen>
      <TopBar left={<PillButton label={t('Cancel')} onPress={() => router.back()} testID="cancel" />}
        title={dateOf(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Section title={t('Period')}>{chips(FLOWS, (id) => draft.flow === id, one('flow'), p.period, 'flow-')}</Section>
          <Section title={t('Symptoms')}>{chips(SYMPTOMS, (id) => !!draft.symptoms?.includes(id), many('symptoms'), p.accent, 'symptom-')}</Section>
          <Section title={t('Mood')}>{chips(MOODS, (id) => !!draft.moods?.includes(id), many('moods'))}</Section>
          <Section title={t('Energy')}>{chips(ENERGY, (id) => draft.energy === id, one('energy'))}</Section>
          <Section title={t('Sleep')}>{chips(SLEEP, (id) => draft.sleep === id, one('sleep'))}</Section>
          <Section title={t('Discharge')}>{chips(DISCHARGE, (id) => draft.discharge === id, one('discharge'), p.fertile)}</Section>
          <Section title={t('Sex')}>{chips(SEX, (id) => draft.sex === id, one('sex'))}</Section>
          <Section title={t('Digestion')}>{chips(DIGESTION, (id) => !!draft.digestion?.includes(id), many('digestion'))}</Section>
          <Section title={t('Ovulation test')}>{chips(OVULATION_TEST, (id) => draft.ovulationTest === id, one('ovulationTest'), p.ovulation)}</Section>
          <Section title={t('Pregnancy test')}>{chips(PREGNANCY_TEST, (id) => draft.pregnancyTest === id, one('pregnancyTest'))}</Section>
          <Section title={t('Pill')}>{chips([{ id: 'yes', label: t('Taken today') }], () => !!draft.pillTaken, () => set({ pillTaken: draft.pillTaken ? undefined : true }))}</Section>
          <Section title={t('Body')}>
            <View style={{ flexDirection: 'row', gap: space.s }}>
              {number(draft.temperature, (n) => set({ temperature: n }), '°C', 'temperature', t('Temperature'))}
              {number(draft.weight === undefined ? undefined : draft.weight / 1000, (n) => set({ weight: n === undefined ? undefined : Math.round(n * 1000) }), 'kg', 'weight', t('Weight'))}
            </View>
            {number(draft.water, (n) => set({ water: n === undefined ? undefined : Math.round(n) }), t('glasses'), 'water', t('Water'))}
          </Section>
          <Section title={t('Note')}>
            <TextInput testID="note" multiline value={draft.note ?? ''} onChangeText={(s) => set({ note: s.slice(0, 500) })}
              placeholder={t('Anything to remember')} placeholderTextColor={p.muted}
              style={[type.body, styles.note, { color: p.ink, backgroundColor: p.surface }]} accessibilityLabel={t('Note')} />
          </Section>
        </ScrollView>
        <View style={{ paddingHorizontal: space.side, paddingTop: space.s, backgroundColor: wash(p.bg, 'F2') }}>
          <PrimaryButton label={t('Save')} onPress={save} testID="save-day" />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.side, paddingBottom: space.xl, gap: space.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  chip: { minHeight: 44, borderRadius: radius.chip, borderWidth: 1.5, paddingHorizontal: space.l, justifyContent: 'center' },
  numberBox: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: radius.row, paddingHorizontal: space.l, gap: space.s },
  note: { minHeight: 96, borderRadius: radius.row, padding: space.l, textAlignVertical: 'top' },
});
