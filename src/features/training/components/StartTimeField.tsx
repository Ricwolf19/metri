import { Pressable, Text, View } from 'react-native';

import { TimerIcon } from '@/components/icons';
import { TimePicker } from '@/components/ui';
import { useT } from '@/i18n';
import { useClockFormat } from '@/lib/useClockFormat';
import { useTheme } from '@/theme/theme-context';

import { formatClockTime, fromHourMinute, toHourMinute } from '../schedule';

/** Sensible first suggestion when a split has no time yet. */
export const DEFAULT_START_MINUTE = 18 * 60;

type Props = {
  /** Minutes after midnight, null when unset. */
  value: number | null;
  open: boolean;
  onToggle: () => void;
  onChange: (startMinute: number) => void;
};

/** Time chip that expands into an inline wheel picker (one open at a time is the caller's job). */
export const StartTimeField = ({ value, open, onToggle, onChange }: Props) => {
  const t = useT();
  const clock = useClockFormat();
  const { brand } = useTheme();
  const set = value != null;

  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className={[
          'mt-3 flex-row items-center justify-center gap-2 rounded-field border py-2.5',
          set ? 'border-brand/40 bg-brand/10' : 'border-ink-700 bg-ink-800',
        ].join(' ')}
      >
        <TimerIcon color={brand} size={16} />
        <Text
          className={['text-sm font-sans-semibold', set ? 'text-brand' : 'text-ink-300'].join(' ')}
        >
          {set ? formatClockTime(value, clock) : t('start.pickTime')}
        </Text>
      </Pressable>
      {open ? (
        <View className="mt-3">
          <TimePicker
            {...toHourMinute(value ?? DEFAULT_START_MINUTE)}
            clock={clock}
            onChange={({ hour, minute }) => onChange(fromHourMinute(hour, minute))}
          />
        </View>
      ) : null}
    </View>
  );
};
