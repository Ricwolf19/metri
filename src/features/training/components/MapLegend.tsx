import { Text, View } from 'react-native';

import {
  balanceFill,
  fatigueFill,
  recencyFill,
  untrainedFill,
} from '@/features/training/muscle-colors';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/**
 * Key for the body map's three views. Not decoration: the fills differ in hue
 * AND density, and this is what makes either readable — a colour ramp with no
 * labels is unusable for anyone who can't separate the hues.
 */
export type MapView = 'balance' | 'fatigue' | 'strength';

const Dot = ({ color, label }: { color: string; label: string }) => (
  <View className="mr-3 flex-row items-center gap-1.5">
    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
    <Text className="text-[11px] text-ink-400">{label}</Text>
  </View>
);

export const MapLegend = ({ view }: { view: MapView }) => {
  const t = useT();
  const theme = useTheme();

  const entries =
    view === 'balance'
      ? [
          { color: untrainedFill(theme), label: t('stats.legendUntrained') },
          { color: balanceFill(theme, 'low'), label: t('stats.legendLow') },
          { color: balanceFill(theme, 'optimal'), label: t('stats.legendOptimal') },
          { color: balanceFill(theme, 'high'), label: t('stats.legendHigh') },
        ]
      : view === 'fatigue'
        ? [
            { color: untrainedFill(theme), label: t('stats.legendFresh') },
            { color: fatigueFill(theme, 1), label: t('stats.legendFatigued') },
          ]
        : [
            { color: recencyFill(theme, 0), label: t('stats.legendRecent') },
            { color: recencyFill(theme, 99), label: t('stats.legendDetrained') },
          ];

  return (
    <View className="flex-row flex-wrap">
      {entries.map((e) => (
        <Dot key={e.label} color={e.color} label={e.label} />
      ))}
    </View>
  );
};
