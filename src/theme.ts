import { Platform } from 'react-native';

import type { Phase } from './core/cycle';
import type { ThemeName } from './core/types';

/**
 * Moonlit indigo at night, soft dawn in the day. Each part of the cycle keeps one colour everywhere:
 * rose for her period, teal for the fertile window, violet for ovulation.
 */
export const palettes = {
  night: {
    bg: '#14132B',
    surface: '#222042',
    raised: '#2E2B55',
    ink: '#F1EEFB',
    muted: '#A9A4C9',
    accent: '#B9A6FF',
    period: '#F2738C',
    fertile: '#5FD3C4',
    ovulation: '#C9A2FF',
    onAccent: '#14132B',
  },
  day: {
    bg: '#F6F4FB',
    surface: '#FFFFFF',
    raised: '#ECE8F7',
    ink: '#221F3D',
    muted: '#66618A',
    accent: '#6B4FD8',
    period: '#C8365A',
    fertile: '#13867A',
    ovulation: '#8240D0',
    onAccent: '#FFFFFF',
  },
} as const;

export type Palette = (typeof palettes)[ThemeName];

export const phaseColor = (p: Palette, phase: Phase | null): string => {
  switch (phase) {
    case 'period':
      return p.period;
    case 'fertile':
      return p.fertile;
    case 'ovulation':
      return p.ovulation;
    case 'late':
      return p.period;
    default:
      return p.accent;
  }
};

export const line = (p: Palette) => `${p.muted}40`;
export const wash = (hex: string, alpha = '26') => `${hex}${alpha}`;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, side: 20 } as const;
export const radius = { chip: 14, row: 18, card: 26, big: 36 } as const;
export const TAP = 52;

const rounded = Platform.select({ ios: 'ui-rounded', web: 'ui-rounded, Nunito, system-ui, sans-serif', default: undefined });

export const type = {
  hero: { fontFamily: rounded, fontSize: 46, fontWeight: '800', letterSpacing: -1 },
  title: { fontFamily: rounded, fontSize: 21, fontWeight: '700' },
  body: { fontFamily: rounded, fontSize: 17, fontWeight: '600' },
  label: { fontFamily: rounded, fontSize: 15, fontWeight: '500' },
  small: { fontFamily: rounded, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
} as const;
