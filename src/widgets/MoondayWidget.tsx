import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { Glance } from '../core/glance';

export interface WidgetProps {
  glance?: Glance;
  /** Without Moonday Plus the widget shows a short note instead of her cycle. */
  locked?: boolean;
  lockedText?: string;
}

/**
 * The home screen and lock screen widget. It runs inside iOS on its own, so everything comes in through its
 * props: one set for each of the coming days, sent by the app (see services/glance.ts).
 */
const MoondayWidget = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  // the app's palette; declared in here because a widget can't see anything outside this function
  const dark = env.colorScheme !== 'light';
  const c = dark
    ? { bg: '#14132B', ink: '#F1EEFB', muted: '#A9A4C9', period: '#F2738C', fertile: '#5FD3C4', ovulation: '#C9A2FF', calm: '#B9A6FF' }
    : { bg: '#F6F4FB', ink: '#221F3D', muted: '#66618A', period: '#C8365A', fertile: '#13867A', ovulation: '#8240D0', calm: '#6B4FD8' };
  const rounded = (size: number, weight: 'medium' | 'semibold' | 'bold' = 'semibold') => font({ size, weight, design: 'rounded' });
  const family = env.widgetFamily ?? 'systemSmall';
  const lock = [containerBackground(c.bg, 'widget'), widgetURL('moonday://')];
  const g = props.glance;

  if (props.locked || !g) {
    const note = props.locked ? props.lockedText ?? 'Widgets are part of Moonday Plus.' : 'Open Moonday to start.';
    if (family.startsWith('accessory')) return <Text modifiers={[rounded(13), ...lock]}>Moonday</Text>;
    return (
      <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: 2000, maxHeight: 2000, alignment: 'topLeading' }), ...lock]}>
        <Text modifiers={[rounded(17, 'bold'), foregroundStyle(c.ink)]}>Moonday</Text>
        <Text modifiers={[rounded(13, 'medium'), foregroundStyle(c.muted)]}>{note}</Text>
        <Spacer />
      </VStack>
    );
  }

  const tone = c[g.tone];
  if (family === 'accessoryInline') return <Text modifiers={lock}>{g.headline}</Text>;
  if (family === 'accessoryCircular') {
    return (
      <VStack spacing={0} modifiers={lock}>
        <Text modifiers={[rounded(20, 'bold'), minimumScaleFactor(0.6), lineLimit(1)]}>{g.short || '◐'}</Text>
      </VStack>
    );
  }
  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: 2000, alignment: 'leading' }), ...lock]}>
        <Text modifiers={[rounded(15, 'bold'), lineLimit(1), minimumScaleFactor(0.7)]}>{g.headline}</Text>
        {g.phase ? <Text modifiers={[rounded(13, 'medium'), lineLimit(1)]}>{g.phase}</Text> : null}
        {g.detail ? <Text modifiers={[rounded(12, 'medium'), lineLimit(1)]}>{g.detail}</Text> : null}
      </VStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: 2000, maxHeight: 2000, alignment: 'topLeading' }), ...lock]}>
      <HStack>
        <Text modifiers={[rounded(13, 'semibold'), foregroundStyle(c.muted), lineLimit(1)]}>{g.detail || 'Moonday'}</Text>
        <Spacer />
      </HStack>
      <Text modifiers={[rounded(family === 'systemSmall' ? 22 : 26, 'bold'), foregroundStyle(c.ink), minimumScaleFactor(0.6), lineLimit(2)]}>{g.headline}</Text>
      <Spacer />
      {g.phase ? <Text modifiers={[rounded(13, 'bold'), foregroundStyle(tone), lineLimit(1)]}>{g.phase}</Text> : null}
      {g.next ? <Text modifiers={[rounded(12, 'medium'), foregroundStyle(c.muted), lineLimit(1)]}>{g.next}</Text> : null}
    </VStack>
  );
};

export default createWidget<WidgetProps>('MoondayWidget', MoondayWidget, {});
