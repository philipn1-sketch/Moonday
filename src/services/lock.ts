import * as LocalAuthentication from 'expo-local-authentication';

import { t } from '../i18n';

/** Whether this phone can lock the app: Face ID, Touch ID or at least a phone passcode. */
export async function canLock(): Promise<boolean> {
  return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
}

/** Asks for Face ID, with the phone's own passcode as the fallback. */
export async function unlock(): Promise<boolean> {
  const r = await LocalAuthentication.authenticateAsync({ promptMessage: t('Unlock Moonday'), disableDeviceFallback: false });
  return r.success;
}
