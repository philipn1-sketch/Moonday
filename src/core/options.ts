import { tk } from '../i18n';
import type { Phase } from './cycle';
import type { DayLog, Flow } from './types';

/** What she can pick on the log screen. Ids are stored; labels are translated where they are shown. */
export const FLOWS: { id: Flow; label: string }[] = [
  { id: 'spotting', label: tk('Spotting') },
  { id: 'light', label: tk('Light') },
  { id: 'medium', label: tk('Medium') },
  { id: 'heavy', label: tk('Heavy') },
];

export const SYMPTOMS = [
  { id: 'cramps', label: tk('Cramps') },
  { id: 'headache', label: tk('Headache') },
  { id: 'bloating', label: tk('Bloating') },
  { id: 'tender', label: tk('Tender breasts') },
  { id: 'backache', label: tk('Backache') },
  { id: 'acne', label: tk('Acne') },
  { id: 'fatigue', label: tk('Tired') },
  { id: 'nausea', label: tk('Nausea') },
  { id: 'cravings', label: tk('Cravings') },
  { id: 'insomnia', label: tk('Trouble sleeping') },
  { id: 'dizzy', label: tk('Dizzy') },
  { id: 'pelvic', label: tk('Pelvic pain') },
];

export const MOODS = [
  { id: 'calm', label: tk('Calm') },
  { id: 'happy', label: tk('Happy') },
  { id: 'energetic', label: tk('Energetic') },
  { id: 'sensitive', label: tk('Sensitive') },
  { id: 'irritable', label: tk('Irritable') },
  { id: 'anxious', label: tk('Anxious') },
  { id: 'low', label: tk('Low') },
  { id: 'swings', label: tk('Mood swings') },
];

export const DIGESTION = [
  { id: 'constipation', label: tk('Constipation') },
  { id: 'diarrhoea', label: tk('Diarrhoea') },
  { id: 'gas', label: tk('Gas') },
  { id: 'appetite', label: tk('Big appetite') },
];

export const ENERGY = [
  { id: 'low', label: tk('Low') },
  { id: 'ok', label: tk('Okay') },
  { id: 'high', label: tk('High') },
] as const satisfies { id: NonNullable<DayLog['energy']>; label: string }[];

export const SLEEP = [
  { id: 'poor', label: tk('Poor') },
  { id: 'ok', label: tk('Okay') },
  { id: 'good', label: tk('Good') },
] as const satisfies { id: NonNullable<DayLog['sleep']>; label: string }[];

export const DISCHARGE = [
  { id: 'none', label: tk('None') },
  { id: 'sticky', label: tk('Sticky') },
  { id: 'creamy', label: tk('Creamy') },
  { id: 'watery', label: tk('Watery') },
  { id: 'eggWhite', label: tk('Egg white') },
  { id: 'unusual', label: tk('Unusual') },
] as const satisfies { id: NonNullable<DayLog['discharge']>; label: string }[];

export const SEX = [
  { id: 'none', label: tk('No sex') },
  { id: 'protected', label: tk('Protected') },
  { id: 'unprotected', label: tk('Unprotected') },
] as const satisfies { id: NonNullable<DayLog['sex']>; label: string }[];

export const OVULATION_TEST = [
  { id: 'negative', label: tk('Negative') },
  { id: 'positive', label: tk('Positive') },
] as const satisfies { id: NonNullable<DayLog['ovulationTest']>; label: string }[];

export const PREGNANCY_TEST = [
  { id: 'negative', label: tk('Negative') },
  { id: 'faint', label: tk('Faint line') },
  { id: 'positive', label: tk('Positive') },
] as const satisfies { id: NonNullable<DayLog['pregnancyTest']>; label: string }[];

/** One plain line per phase. Our own words, general and gentle, never medical advice. */
export const PHASE_NAME: Record<Phase, string> = {
  period: tk('Period'),
  follicular: tk('Follicular phase'),
  fertile: tk('Fertile window'),
  ovulation: tk('Ovulation day'),
  luteal: tk('Luteal phase'),
  late: tk('Period is late'),
};

export const PHASE_TIP: Record<Phase, string> = {
  period: tk('Rest counts. Warmth, water and gentle movement can ease cramps.'),
  follicular: tk('Energy often rises after a period. A good time for things that need focus.'),
  fertile: tk('The days pregnancy is most likely. Not a reliable form of contraception.'),
  ovulation: tk('Your most fertile day, give or take. Some people feel a twinge low on one side.'),
  luteal: tk('Later in this phase, bloating, cravings or a lower mood can show up. Be kind to yourself.'),
  late: tk('Stress, travel and illness can all shift a cycle. A test can help if pregnancy is possible.'),
};
