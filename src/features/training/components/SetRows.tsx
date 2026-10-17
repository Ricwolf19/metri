import { Pressable, Text, View } from 'react-native';

import { CheckIcon, SkipIcon, XIcon } from '@/components/icons';
import type { SetLog } from '@/db/schema';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { MISSED } from '../adherence-colors';
import { deleteSet } from '../session.repo';
import { ConvertibleWeight } from './ConvertibleWeight';

/** A planned set the lifter skipped: it counts as missed; the X restores it. */
export const SkippedRow = ({
  label,
  text,
  onRestore,
}: {
  label: string;
  text: string;
  onRestore: () => void;
}) => {
  const { muted } = useTheme();
  return (
    <View className="flex-row items-center rounded-field border border-red-500/30 bg-red-500/10 px-3 py-2">
      <View className="mr-2.5 h-5 w-5 items-center justify-center rounded-full bg-red-500/30">
        <SkipIcon color={MISSED} size={12} />
      </View>
      <Text className="w-7 text-xs font-sans-semibold text-red-400">{label}</Text>
      <Text className="flex-1 text-xs text-red-400">{text}</Text>
      <Pressable hitSlop={8} onPress={onRestore} accessibilityRole="button">
        <XIcon color={muted} size={15} />
      </Pressable>
    </View>
  );
};

/** A set that has not come up yet: the plan, dimmed, no inputs. Sets are done in order. */
export const PendingRow = ({ label, legend }: { label: string; legend: string | null }) => (
  <View className="flex-row items-center rounded-field bg-ink-850/40 px-3 py-2.5">
    <Text className="w-7 text-xs font-sans-semibold text-ink-600">{label}</Text>
    <Text className="flex-1 text-xs text-ink-500">{legend}</Text>
  </View>
);

/** A set already logged. Tapping the row reopens it in place for a correction; the X deletes it. */
export const LoggedRow = ({
  label,
  logged,
  unit,
  warmup,
  failureLabel,
  editHint,
  onEdit,
}: {
  label: string;
  logged: SetLog;
  unit: Units;
  warmup: boolean;
  failureLabel: string;
  editHint?: string;
  onEdit?: () => void;
}) => {
  const { brandContrast, muted } = useTheme();
  return (
    <Pressable
      onPress={onEdit}
      disabled={!onEdit}
      accessibilityRole={onEdit ? 'button' : undefined}
      accessibilityHint={editHint}
      className="flex-row items-center rounded-field bg-ink-850 px-3 py-2 active:bg-ink-800"
    >
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
    </Pressable>
  );
};
