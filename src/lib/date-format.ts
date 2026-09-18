/** Display-only date formatting by the user's preset (AGENTS.md#conventions, Dates). Storage keys stay 'YYYY-MM-DD'. */
export type DateFormat = 'system' | 'dmy' | 'mdy' | 'ymd' | 'dmmmy' | 'full';

export const DATE_FORMATS: readonly DateFormat[] = ['system', 'dmy', 'mdy', 'ymd', 'dmmmy', 'full'];

type LocaleTag = 'en' | 'es';

const TAG: Record<LocaleTag, string> = { en: 'en-US', es: 'es-MX' };

const pad2 = (n: number) => String(n).padStart(2, '0');

export const formatDate = (date: Date, format: DateFormat, locale: LocaleTag): string => {
  const d = pad2(date.getDate());
  const m = pad2(date.getMonth() + 1);
  const y = date.getFullYear();
  switch (format) {
    case 'dmy':
      return `${d}/${m}/${y}`;
    case 'mdy':
      return `${m}/${d}/${y}`;
    case 'ymd':
      return `${y}-${m}-${d}`;
    case 'dmmmy':
      return date.toLocaleDateString(TAG[locale], {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    case 'full':
      return date.toLocaleDateString(TAG[locale], {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    case 'system':
      return date.toLocaleDateString(TAG[locale]);
  }
};

/** Same, for a 'YYYY-MM-DD' storage key (device-local). */
export const formatDateKey = (key: string, format: DateFormat, locale: LocaleTag): string => {
  const [y, m, d] = key.split('-').map(Number);
  return formatDate(new Date(y, m - 1, d), format, locale);
};

/** Short day + month for compact charts and labels (respects the preset's day/month order). */
export const formatDayMonth = (date: Date, format: DateFormat, locale: LocaleTag): string => {
  if (format === 'mdy') return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
  if (format === 'dmy' || format === 'ymd')
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
  return date.toLocaleDateString(TAG[locale], { day: 'numeric', month: 'short' });
};
