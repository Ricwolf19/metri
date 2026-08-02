import type { Href } from 'expo-router';
import type { ComponentType } from 'react';

import {
  ActivityIcon,
  BookIcon,
  CameraIcon,
  DumbbellIcon,
  FlameIcon,
  type IconProps,
} from '@/components/icons';
import type { TranslationKey } from '@/i18n/en';

/**
 * The catalogue of features a user can pin to their Home screen as quick
 * actions. `id` is the stable key persisted in MMKV (see `settings.pinnedActions`)
 * — never reuse or renumber ids. Labels reuse existing i18n keys.
 */
export type QuickAction = {
  id: string;
  titleKey: TranslationKey;
  subKey: TranslationKey;
  href: Href;
  icon: ComponentType<IconProps>;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'training',
    titleKey: 'tools.trainingTitle',
    subKey: 'tools.trainingDesc',
    href: '/training',
    icon: DumbbellIcon,
  },
  {
    id: 'bmr',
    titleKey: 'tools.hbTitle',
    subKey: 'tools.hbDesc',
    href: '/calculators/tdee',
    icon: FlameIcon,
  },
  {
    id: 'macros',
    titleKey: 'tools.macrosTitle',
    subKey: 'tools.macrosDesc',
    href: '/calculators/macros',
    icon: FlameIcon,
  },
  {
    id: 'onerm',
    titleKey: 'tools.onermTitle',
    subKey: 'tools.onermDesc',
    href: '/calculators/onerm',
    icon: ActivityIcon,
  },
  {
    id: 'bodyfat',
    titleKey: 'tools.bodyfatTitle',
    subKey: 'tools.bodyfatDesc',
    href: '/calculators/bodyfat',
    icon: FlameIcon,
  },
  {
    id: 'water',
    titleKey: 'tools.waterTitle',
    subKey: 'tools.waterDesc',
    href: '/calculators/water',
    icon: ActivityIcon,
  },
  {
    id: 'ideal',
    titleKey: 'tools.idealTitle',
    subKey: 'tools.idealDesc',
    href: '/calculators/idealweight',
    icon: FlameIcon,
  },
  {
    id: 'ffmi',
    titleKey: 'tools.ffmiTitle',
    subKey: 'tools.ffmiDesc',
    href: '/calculators/ffmi',
    icon: ActivityIcon,
  },
  {
    id: 'progress',
    titleKey: 'home.progress',
    subKey: 'home.progressSub',
    href: '/progress',
    icon: CameraIcon,
  },
  {
    id: 'docs',
    titleKey: 'docs.title',
    subKey: 'docs.subtitle',
    href: '/explore',
    icon: BookIcon,
  },
];

/** Pinned by default for a fresh install — the original Home shortcuts. */
/** None by default — Home shows an invite card until the user pins their own. */
export const DEFAULT_PINNED_ACTIONS: string[] = [];

export const getQuickAction = (id: string): QuickAction | undefined =>
  QUICK_ACTIONS.find((a) => a.id === id);
