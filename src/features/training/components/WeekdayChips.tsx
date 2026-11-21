import { Pressable, Text, View } from 'react-native';

import { useI18n, useT } from '@/i18n';

import { DAY_ORDER, WEEKDAY_KEY, weekdayLetter } from '../labels';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';

type Props = {
  /** Selected expo weekdays; one entry for single-select callers. */
  selected: readonly number[];
  onPress: (weekday: number) => void;
  size?: 'sm' | 'md';
};

/**
 * Monday-first row of single-letter weekday chips. Selection semantics belong to the caller.
 * Each chip is a circle of at most 40 dp (`md`) that shrinks evenly when seven of them and
 * their gaps outgrow the row: seven fixed 40 dp chips fill a card on a 360 dp phone edge to
 * edge and overflow it at a larger display size.
 */
export const WeekdayChips = ({ selected, onPress, size = 'md' }: Props) => {
  const t = useT();
  const { locale } = useI18n();
  const box = size === 'md' ? 'max-w-10' : 'max-w-9';
  const text = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <View className="flex-row justify-between gap-1">
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
              'aspect-square flex-1 items-center justify-center rounded-full border',
              active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            <Text
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
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
