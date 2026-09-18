import { Pressable, Text, View } from 'react-native';

import { useI18n, useT } from '@/i18n';

import { DAY_ORDER, WEEKDAY_KEY, weekdayLetter } from '../labels';

type Props = {
  /** Selected expo weekdays; one entry for single-select callers. */
  selected: readonly number[];
  onPress: (weekday: number) => void;
  size?: 'sm' | 'md';
};

/** Monday-first row of single-letter weekday chips. Selection semantics belong to the caller. */
export const WeekdayChips = ({ selected, onPress, size = 'md' }: Props) => {
  const t = useT();
  const { locale } = useI18n();
  const box = size === 'md' ? 'h-10 w-10' : 'h-9 w-9';
  const text = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <View className="flex-row justify-between">
      {DAY_ORDER.map((weekday) => {
        const active = selected.includes(weekday);
        return (
          <Pressable
            key={weekday}
            onPress={() => onPress(weekday)}
            accessibilityRole="button"
            accessibilityLabel={t(WEEKDAY_KEY[weekday])}
            accessibilityState={{ selected: active }}
            className={[
              box,
              'items-center justify-center rounded-full border',
              active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            <Text
              className={[text, 'font-sans-semibold', active ? 'text-brand' : 'text-ink-400'].join(
                ' ',
              )}
            >
              {weekdayLetter(locale, weekday)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
