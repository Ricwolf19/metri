import { SegmentedControl, type Segment } from '@/components/ui';
import { useT } from '@/i18n';
import type { ThemePreference } from '@/lib/storage';

import { useTheme } from './theme-context';

/** System / Light / Dark picker bound to the theme preference. */
export const ThemeSelect = () => {
  const t = useT();
  const { preference, setPreference } = useTheme();

  const segments: Segment<ThemePreference>[] = [
    { value: 'system', label: t('theme.system') },
    { value: 'light', label: t('theme.light') },
    { value: 'dark', label: t('theme.dark') },
  ];

  return <SegmentedControl segments={segments} value={preference} onChange={setPreference} />;
};
