import { Pressable, Text, View } from 'react-native';

import type { ActivityLevel } from '@/db/schema';
import { useT } from '@/i18n';

import { ACTIVITY_LEVELS, ACTIVITY_MULTIPLIERS } from '../calc';

type Props = {
  value: ActivityLevel;
  onChange: (value: ActivityLevel) => void;
};

/** Radio-style list of activity levels with their TDEE multiplier + hint. */
export const ActivityPicker = ({ value, onChange }: Props) => {
  const t = useT();
  return (
    <View className="gap-2">
      {ACTIVITY_LEVELS.map((key) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            className={[
              'flex-row items-center rounded-xl border px-4 py-3',
              active ? 'border-lime-400 bg-lime-400/10' : 'border-ink-600 bg-ink-800',
            ].join(' ')}
          >
            <View
              className={[
                'mr-3 h-5 w-5 items-center justify-center rounded-full border-2',
                active ? 'border-lime-400' : 'border-ink-500',
              ].join(' ')}
            >
              {active ? <View className="h-2.5 w-2.5 rounded-full bg-lime-400" /> : null}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink-50">
                {t(`activity.${key}`)}{' '}
                <Text className="font-normal text-ink-400">×{ACTIVITY_MULTIPLIERS[key]}</Text>
              </Text>
              <Text className="text-xs text-ink-400">{t(`activityHint.${key}`)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
