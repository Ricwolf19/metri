import { Pressable, Text, View } from 'react-native';

import { CheckIcon, XIcon } from '@/components/icons';
import type { SetLog } from '@/db/schema';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { deleteSet } from '../session.repo';
import { ConvertibleWeight } from './ConvertibleWeight';

/** A set that has not come up yet: the plan, dimmed, no inputs. Sets are done in order. */
export const PendingRow = ({ label, legend }: { label: string; legend: string | null }) => (
  <View className="flex-row items-center rounded-field bg-ink-850/40 px-3 py-2.5">
    <Text className="w-7 text-xs font-sans-semibold text-ink-600">{label}</Text>
    <Text className="flex-1 text-xs text-ink-500">{legend}</Text>
  </View>
);

export const LoggedRow = ({
  label,
  logged,
  unit,
  warmup,
  failureLabel,
}: {
  label: string;
  logged: SetLog;
  unit: Units;
  warmup: boolean;
  failureLabel: string;
}) => {
  const { brandContrast, muted } = useTheme();
  return (
    <View className="flex-row items-center rounded-field bg-ink-850 px-3 py-2">
      <View
        className={[
          'mr-2.5 h-5 w-5 items-center justify-center rounded-full',
          warmup ? 'bg-ink-600' : 'bg-brand',
        ].join(' ')}
      >
        <CheckIcon color={brandContrast} size={13} />
      </View>
      <Text className="w-7 text-xs font-sans-semibold text-ink-400">{label}</Text>
      <View className="flex-1 flex-row items-center">
        {/* Two dumbbells read as "2 × 30 kg × 10": the count goes first so it
            cannot be mistaken for the reps. */}
        {logged.load?.kind === 'dumbbell' && logged.load.hands === 2 ? (
          <Text className="text-sm font-sans-medium text-ink-400">2 × </Text>
        ) : null}
        <ConvertibleWeight kg={logged.weightKg} unit={unit} />
        <Text className="text-sm font-sans-medium text-ink-100">
          {' '}
          × {logged.reps}
          {logged.rir != null ? ` · RIR ${logged.rir}` : ''}
          {logged.isFailure ? ` · ${failureLabel}` : ''}
        </Text>
      </View>
      <Pressable hitSlop={8} onPress={() => deleteSet(logged.id)} accessibilityRole="button">
        <XIcon color={muted} size={15} />
      </Pressable>
    </View>
  );
};
