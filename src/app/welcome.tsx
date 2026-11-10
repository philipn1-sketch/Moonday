import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { MonthPicker } from '../components/MonthPicker';
import { Stepper } from '../components/Stepper';
import { Choice, PillButton, PrimaryButton, Screen, T, TopBar } from '../components/ui';
import { addDays, diff } from '../core/days';
import type { DayKey, Goal } from '../core/types';
import { t, tn } from '../i18n';
import { useApp } from '../state/AppState';
import { usePalette } from '../state/theme';
import { line, radius, space, TAP, type } from '../theme';

type Step = 1 | 2 | 3 | 4;

/** First launch: a few questions so predictions can start on day one. Every answer can change later in Settings. */
export default function Welcome() {
  const { settings, updateSettings, saveDay, todayKey } = useApp();
  const p = usePalette();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(settings.name);
  const [goal, setGoal] = useState<Goal>(settings.goal);
  const [start, setStart] = useState<DayKey | null>(null);
  const [cycle, setCycle] = useState(settings.usualCycle);
  const [period, setPeriod] = useState(settings.usualPeriod);
  const pregnant = goal === 'pregnant';
  const last: Step = pregnant ? 3 : 4;

  const finish = () => {
    updateSettings({
      name: name.trim(), goal, usualCycle: cycle, usualPeriod: period, onboarded: true,
      ...(pregnant && start ? { pregnancyStart: start } : {}),
    });
    // her last period, as far as it has gone, so predictions start straight away
    if (start && !pregnant) {
      for (let i = 0; i < period && diff(addDays(start, i), todayKey) >= 0; i++) saveDay(addDays(start, i), { flow: i < 2 ? 'medium' : 'light' });
    }
    router.replace('/');
  };
  const next = () => (step < last ? setStep((step + 1) as Step) : finish());

  const title = {
    1: t('Welcome to Moonday. What should we call you?'),
    2: t('What are you tracking for?'),
    3: pregnant ? t('When did your last period start before the pregnancy?') : t('When did your last period start?'),
    4: t('How long are your cycles and periods, usually?'),
  }[step];

  return (
    <Screen>
      <TopBar
        left={step > 1 ? <PillButton label={t('Back')} onPress={() => setStep((step - 1) as Step)} testID="welcome-back" /> : undefined}
        title={t('Step {n} of {total}', { n: step, total: last })}
        right={<PillButton label={t('Skip')} onPress={finish} testID="welcome-skip" a11yLabel={t('Skip the questions')} />}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <T style={styles.title} accessibilityRole="header">{title}</T>

          {step === 1 && (
            <TextInput testID="welcome-name" value={name} onChangeText={(s) => setName(s.slice(0, 30))} placeholder={t('Your name (optional)')}
              placeholderTextColor={p.muted} autoCapitalize="words" autoCorrect={false} returnKeyType="next" onSubmitEditing={next}
              accessibilityLabel={t('Your name')} style={[type.title, styles.field, { color: p.ink, backgroundColor: p.surface }]} />
          )}

          {step === 2 && (
            <View style={{ gap: space.m }}>
              <Choice<Goal> label={t('Goal')} value={goal} onChange={setGoal}
                options={[{ value: 'track', label: t('My cycle') }, { value: 'conceive', label: t('Conceiving') }, { value: 'pregnant', label: t('Pregnant') }]} />
              <T tone="muted" style={type.label}>
                {goal === 'track' ? t('Know when your period is coming and how you feel through your cycle.')
                  : goal === 'conceive' ? t('See your fertile window and best days to try, with ovulation tests and temperature.')
                    : t('Follow your pregnancy week by week, with your due date.')}
              </T>
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: space.m }}>
              <MonthPicker value={start} onChange={setStart} max={todayKey} />
              <T tone="muted" style={type.label}>{t("Not sure? Pick your best guess, or skip. Moonday learns from the periods you log.")}</T>
            </View>
          )}

          {step === 4 && (
            <View style={[styles.box, { borderColor: line(p) }]}>
              <T tone="muted" style={type.label}>{t('Cycle length, from the first day of one period to the next')}</T>
              <Stepper label={t('Cycle length')} value={cycle} display={tn('{n} day', '{n} days', cycle)} onChange={setCycle} min={18} max={50} testID="cycle" />
              <T tone="muted" style={[type.label, { marginTop: space.m }]}>{t('Period length')}</T>
              <Stepper label={t('Period length')} value={period} display={tn('{n} day', '{n} days', period)} onChange={setPeriod} min={1} max={12} testID="period" />
              <T tone="muted" style={[type.small, { marginTop: space.s }]}>{t('Most cycles are 21 to 35 days. If you are not sure, keep 28 and 5.')}</T>
            </View>
          )}
        </ScrollView>
        <View style={styles.bottom}>
          <PrimaryButton label={step === last ? t('Start') : t('Next')} onPress={next} testID={step === last ? 'welcome-finish' : 'welcome-next'} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.side, paddingTop: space.l, paddingBottom: space.xl, gap: space.xl },
  title: { fontFamily: type.title.fontFamily, fontSize: 30, fontWeight: '800', lineHeight: 36 },
  field: { minHeight: TAP + 4, borderRadius: radius.row, paddingHorizontal: space.side },
  box: { borderWidth: 1.5, borderRadius: radius.card, padding: space.l, gap: space.s },
  bottom: { paddingHorizontal: space.side, paddingTop: space.s },
});
