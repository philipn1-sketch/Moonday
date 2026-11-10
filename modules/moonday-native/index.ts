import { Platform } from 'react-native';
import { requireOptionalNativeModule, type EventSubscription } from 'expo';

export interface WatchAction {
  /** "period": she tapped Log period on the Watch. */
  action: string;
  at: number;
}

export interface HealthFlow {
  date: string;
  flow: 'light' | 'medium' | 'heavy';
  /** The app that wrote it, so Moonday never re-imports its own days. */
  source: string;
}

interface NativeModule {
  setGlance(json: string): void;
  takePendingActions(): WatchAction[];
  addListener(event: 'onWatchAction', listener: (a: WatchAction) => void): EventSubscription;
  healthAvailable(): boolean;
  requestHealth(): Promise<boolean>;
  saveFlow(day: string, flow: string | null, firstDay: boolean): Promise<boolean>;
  readFlows(since: string): Promise<HealthFlow[]>;
}

// missing in the web preview and in tests
const native = Platform.OS === 'ios' ? requireOptionalNativeModule<NativeModule>('MoondayNative') : null;

export const setGlance = (json: string): void => native?.setGlance(json);
export const takePendingActions = (): WatchAction[] => native?.takePendingActions() ?? [];
export const onWatchAction = (listener: (a: WatchAction) => void): { remove: () => void } =>
  native ? native.addListener('onWatchAction', listener) : { remove: () => {} };
export const healthAvailable = (): boolean => native?.healthAvailable() ?? false;
export const requestHealth = async (): Promise<boolean> => (native ? native.requestHealth() : false);
export const saveFlow = async (day: string, flow: string | null, firstDay: boolean): Promise<boolean> =>
  (native ? native.saveFlow(day, flow, firstDay) : false);
export const readFlows = async (since: string): Promise<HealthFlow[]> => (native ? native.readFlows(since) : []);
