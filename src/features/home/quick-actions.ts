import type { Href } from 'expo-router';
import type { ComponentType } from 'react';

import { BookIcon, CameraIcon, type IconProps } from '@/components/icons';
import { CALC_META, calcShortTitle } from '@/features/calculators/registry';
import { getDocs } from '@/features/docs';
import type { Locale } from '@/i18n';

/**
 * Quick-access catalogue: every calculator and guide (generated from the same
 * sources Explore renders) plus the extras — the user pins any of them to Home.
 * Ids are stable (`calc-<id>`, `doc-<slug>`) and persisted in MMKV; never
 * reuse or rename one.
 */
type QuickActionKind = 'calc' | 'doc' | 'other';

export type QuickAction = {
  id: string;
  title: string;
  href: Href;
  icon: ComponentType<IconProps>;
  kind: QuickActionKind;
  /** Doc actions only — powers the topic sectioning in the picker. */
  docCategory?: string;
};

/** Ids persisted by older builds → their current equivalent. */
const LEGACY_IDS: Record<string, string> = {
  bmr: 'calc-tdee',
  macros: 'calc-macros',
  onerm: 'calc-onerm',
  bodyfat: 'calc-bodyfat',
  water: 'calc-water',
  ideal: 'calc-idealweight',
  ffmi: 'calc-ffmi',
};

export const getQuickActions = (locale: Locale): QuickAction[] => [
  ...CALC_META.map(({ id, icon }) => ({
    id: `calc-${id}`,
    title: calcShortTitle(id, locale),
    href: { pathname: '/calculators/[id]', params: { id } } as Href,
    icon,
    kind: 'calc' as const,
  })),
  ...getDocs(locale).map((doc) => ({
    id: `doc-${doc.id}`,
    title: doc.title,
    href: { pathname: '/docs/[id]', params: { id: doc.id } } as Href,
    icon: BookIcon,
    kind: 'doc' as const,
    docCategory: doc.category,
  })),
  {
    id: 'progress',
    title: locale === 'es' ? 'Fotos de progreso' : 'Progress photos',
    href: '/progress',
    icon: CameraIcon,
    kind: 'other' as const,
  },
];

export const getQuickAction = (id: string, locale: Locale): QuickAction | undefined => {
  const resolved = LEGACY_IDS[id] ?? id;
  return getQuickActions(locale).find((a) => a.id === resolved);
};
