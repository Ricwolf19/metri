import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { ScrollRow } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

/**
 * The rack as ONE row of badges, one per denomination: tap a badge to load a
 * plate on the side; a loaded badge turns brand, shows its count ("20 ×2")
 * and grows −/+ on the pill. Nothing appears below the row and nothing moves
 * away from under the thumb — a second "loaded" strip used to pop in and push
 * every control down the moment the first plate went on.
 */
export const PlateBadgeRow = ({
  options,
  counts,
  unit,
  onAdd,
  onRemove,
}: {
  /** Denominations in the display unit, largest first. */
  options: number[];
  /** Plates loaded on one side, per denomination. */
  counts: ReadonlyMap<number, number>;
  unit: Units;
  onAdd: (plate: number) => void;
  onRemove: (plate: number) => void;
}) => {
  const t = useT();
  const { brand } = useTheme();
  return (
    <ScrollRow>
      {options.map((plate) => {
        const count = counts.get(plate) ?? 0;
        const on = count > 0;
        return (
          <View
            key={plate}
            className={[
              'min-h-10 shrink-0 flex-row items-center rounded-full border py-1 pl-3',
              on ? 'border-brand/40 bg-brand/15 pr-1' : 'border-ink-700 bg-ink-800 pr-3',
            ].join(' ')}
          >
            <Pressable
              onPress={() => onAdd(plate)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t('load.stackAdd', { plate, unit })}
            >
              <Text
                maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                className={[
                  'text-sm font-sans-semibold tabular-nums',
                  on ? 'text-brand' : 'text-ink-300',
                ].join(' ')}
              >
                {plate} {unit}
                {count > 1 ? ` ×${count}` : ''}
              </Text>
            </Pressable>
            {on ? (
              <>
                <Pressable
                  onPress={() => onRemove(plate)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={t('load.stackRemove', { plate, unit })}
                  className="ml-1.5 h-7 w-7 items-center justify-center rounded-full bg-ink-900/60"
                >
                  <MinusIcon color={brand} size={14} />
                </Pressable>
                <Pressable
                  onPress={() => onAdd(plate)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={t('load.stackAdd', { plate, unit })}
                  className="ml-1 h-7 w-7 items-center justify-center rounded-full bg-ink-900/60"
                >
                  <PlusIcon color={brand} size={14} />
                </Pressable>
              </>
            ) : null}
          </View>
        );
      })}
    </ScrollRow>
  );
};
