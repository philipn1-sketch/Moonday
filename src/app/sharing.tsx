import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';

import { PlusCard } from '../components/PlusGate';
import { Card, Choice, PillButton, PrimaryButton, QuietButton, Screen, SecondaryButton, T, TopBar } from '../components/ui';
import { span } from '../core/format';
import { isCode, showCode } from '../core/sync';
import { t } from '../i18n';
import { vaultAvailable } from '../services/vault';
import { useApp } from '../state/AppState';
import { usePalette } from '../state/theme';
import { radius, space, TAP, type, wash } from '../theme';

/** Partner sharing and the encrypted backup, both made from one family code. */
export default function Sharing() {
  const { settings, sync, startSharing, joinFamily, stopSharing, deleteBackup, plus } = useApp();
  const p = usePalette();
  const [code, setCode] = useState('');
  const [role, setRole] = useState<'partner' | 'owner'>('partner');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const share = (c: string) =>
    Share.share({ message: t('Join me on Moonday. Open Moonday, then Settings, then Partner and backup, and type this code: {code}', { code: showCode(c) }) }).catch(() => {});

  const body = () => {
    if (!vaultAvailable) return <T tone="muted" style={type.label}>{t('Backup and sharing are not set up in this build yet.')}</T>;
    if (!plus && !settings.sync) return <PlusCard feature="sharing" />;

    if (settings.sync) {
      const s = settings.sync;
      const status = sync.state === 'offline' ? t("Can't reach the backup right now. Everything is safe on this phone.")
        : sync.state === 'syncing' ? t('Syncing.')
          : sync.lastOk ? t('Up to date. Last synced {time} ago.', { time: span(Date.now() - sync.lastOk) }) : t('Up to date.');
      return (
        <View style={{ gap: space.l }}>
          <Card style={{ gap: space.s }}>
            <T tone="muted" style={type.label}>{s.role === 'partner' ? t('You are viewing as a partner') : t('Your family code')}</T>
            <T style={[type.title, styles.code]} selectable testID="family-code" accessibilityLabel={t('Family code {code}', { code: [...s.code].join(' ') })}>{showCode(s.code)}</T>
            <T tone="muted" style={type.small} accessibilityLiveRegion="polite">{status}</T>
            {s.role === 'owner' && (
              <>
                <T tone="muted" style={type.label}>{t('Send this to your partner, and keep it somewhere safe. On a new phone, it brings everything back.')}</T>
                <SecondaryButton strong label={t('Send the code')} onPress={() => share(s.code)} testID="send-code" />
              </>
            )}
          </Card>
          <QuietButton label={t('Stop sharing on this phone')} onPress={stopSharing} testID="stop-sharing" style={{ alignSelf: 'flex-start' }} />
          {s.role === 'owner' && (
            <View style={{ gap: space.s }}>
              {!confirmDelete ? (
                <QuietButton label={t('Delete the online backup')} tone="period" onPress={() => setConfirmDelete(true)} testID="delete-backup" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <Card style={{ gap: space.s, borderWidth: 1.5, borderColor: wash(p.period, '80') }}>
                  <T style={type.label}>{t('This deletes the encrypted backup for good, for every phone using this code. Everything on this phone stays.')}</T>
                  <SecondaryButton strong label={t('Delete it')} testID="delete-backup-confirm" onPress={async () => {
                    setBusy(true);
                    try {
                      await deleteBackup();
                    } catch {
                      setMessage(t("Couldn't reach the backup. Check the connection and try again."));
                    } finally {
                      setBusy(false);
                      setConfirmDelete(false);
                    }
                  }} />
                  <QuietButton label={t('Keep it')} onPress={() => setConfirmDelete(false)} />
                </Card>
              )}
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={{ gap: space.l }}>
        <Card style={{ gap: space.m }}>
          <T style={type.title}>{t('Share with your partner')}</T>
          <T tone="muted" style={type.label}>{t('Your partner sees your phase, your next period and your fertile window on their phone. They can not change anything.')}</T>
          <T tone="muted" style={type.label}>{t('It also keeps an encrypted backup, so a new phone gets everything back. Only someone with your code can read it, not even us.')}</T>
          <PrimaryButton label={busy ? t('Starting') : t('Start sharing')} testID="start-sharing" onPress={async () => {
            if (busy) return;
            setBusy(true);
            setMessage(null);
            try {
              share(await startSharing());
            } catch {
              setMessage(t("Couldn't reach the backup. Check the connection and try again."));
            } finally {
              setBusy(false);
            }
          }} />
        </Card>
        <Card style={{ gap: space.m }}>
          <T style={type.title}>{t('Join with a code')}</T>
          <TextInput testID="join-code" value={code} onChangeText={(s) => setCode(s.toUpperCase().slice(0, 16))} placeholder="ABCD EFGH JKMN"
            placeholderTextColor={p.muted} autoCapitalize="characters" autoCorrect={false}
            style={[type.title, styles.input, { color: p.ink, backgroundColor: p.raised }]} accessibilityLabel={t('Family code')} />
          <Choice<'partner' | 'owner'> label={t('This phone is')} value={role} onChange={setRole}
            options={[{ value: 'partner', label: t("My partner's") }, { value: 'owner', label: t('My new phone') }]} />
          <SecondaryButton strong label={t('Join')} testID="join" onPress={async () => {
            if (!isCode(code)) return setMessage(t("That doesn't look right. Codes are 12 letters and numbers."));
            setBusy(true);
            const r = await joinFamily(code, role);
            setBusy(false);
            if (r === 'joined') router.replace('/');
            else setMessage(r === 'notFound' ? t('No backup found for that code. Check it on the other phone.') : t("Couldn't reach the backup. Check the connection and try again."));
          }} />
        </Card>
      </View>
    );
  };

  return (
    <Screen>
      <TopBar left={<PillButton label={t('Back')} onPress={() => router.back()} testID="back" />} title={t('Partner and backup')} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {body()}
        {message && <T style={type.label} accessibilityLiveRegion="polite">{message}</T>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.side, paddingBottom: space.xl, gap: space.l },
  code: { fontSize: 28, letterSpacing: 2, fontVariant: ['tabular-nums'] },
  input: { minHeight: TAP + 4, borderRadius: radius.row, paddingHorizontal: space.l, letterSpacing: 2 },
});
