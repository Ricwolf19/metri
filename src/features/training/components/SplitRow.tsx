import { Pressable, Text, View } from 'react-native';

import { PlaySolidIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Props = {
  name: string;
  /** Schedule label ("Mon · 18:00"), null when the split has no schedule. */
  label: string | null;
  /** `today` = the large brand Play; `other` = the compact chip. */
  emphasis: 'today' | 'other';
  disabled: boolean;
  onPlay: () => void;
};

/** One split of the active program with its Play control. */
export const SplitRow = ({ name, label, emphasis, disabled, onPlay }: Props) => {
  const t = useT();
  const { brand, brandContrast } = useTheme();
  const today = emphasis === 'today';

  return (
    <View
      className={
        today
          ? 'flex-row items-center rounded-field border border-brand/30 bg-brand/10 py-3 pl-4 pr-3'
          : 'flex-row items-center rounded-field border border-ink-600 bg-ink-850 py-2.5 pl-4 pr-2.5'
      }
    >
      <View className="flex-1">
        <Text
          className={
            today
              ? 'text-lg font-sans-bold text-ink-50'
              : 'text-base font-sans-semibold text-ink-50'
          }
        >
          {name}
        </Text>
        {label ? <Text className="mt-0.5 text-xs text-ink-400">{label}</Text> : null}
      </View>
      <Pressable
        onPress={onPlay}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t('training.playSplit', { name })}
        className={[
          'items-center justify-center rounded-full',
          today ? 'h-14 w-14 bg-brand' : 'h-10 w-10 bg-brand/15',
          disabled ? 'opacity-40' : '',
        ].join(' ')}
      >
        <PlaySolidIcon color={today ? brandContrast : brand} size={today ? 24 : 16} />
      </Pressable>
    </View>
  );
};
