import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LockGate } from '../components/LockGate';
import { loadFonts } from '../services/fonts';
import { AppStateProvider } from '../state/AppState';
import { useThemeName } from '../state/theme';
import { palettes } from '../theme';

function Themed() {
  const theme = useThemeName();
  const p = palettes[theme];
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(p.bg).catch(() => {});
  }, [p.bg]);
  return (
    <>
      <StatusBar style={theme === 'night' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg }, animation: 'none' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="log/[date]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="plus" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="sharing" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

loadFonts();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <LockGate>
          <Themed />
        </LockGate>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
