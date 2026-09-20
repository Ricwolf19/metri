import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, Input, PressableScale } from '@/components/ui';
import type { Exercise } from '@/db/schema';
import { ExerciseDocButton } from '@/features/training/components/ExerciseDocButton';
import { ExerciseThumb } from '@/features/training/components/ExerciseFrames';
import { exercisesQuery } from '@/features/training/exercises.repo';
import { exerciseDisplayName } from '@/features/training/labels';
import {
  MUSCLE_HEADS,
  exerciseHeads,
  muscleHeadKey,
  type MuscleHead,
} from '@/features/training/muscles';
import { useI18n, useT } from '@/i18n';

type Props = {
  userId: string;
  onPick: (exercise: Exercise) => void;
  /** Rendered between the filters and the list (e.g. the picker's "New exercise" button). */
  above?: React.ReactNode;
  /** Trailing slot per row (e.g. a delete chip for custom exercises). */
  trailing?: (exercise: Exercise) => React.ReactNode;
  /** Icon at the row's right edge. */
  rowIcon?: React.ReactNode;
  /** Shows the standard book affordance per row (technique guide / history). */
  showDoc?: boolean;
};

const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    className={[
      'rounded-full border px-3 py-1.5',
      active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
    ].join(' ')}
  >
    <Text
      className={['text-xs font-sans-medium', active ? 'text-brand' : 'text-ink-300'].join(' ')}
    >
      {label}
    </Text>
  </Pressable>
);

/**
 * Searchable list of catalog + own custom exercises (picker and library),
 * filtered by the muscle it trains — the same vocabulary the body map and the
 * split badges use, so "quads" means the same thing everywhere.
 */
export const ExerciseList = ({ userId, onPick, above, trailing, rowIcon, showDoc }: Props) => {
  const t = useT();
  const { locale } = useI18n();
  const [search, setSearch] = useState('');
  const [head, setHead] = useState<MuscleHead | undefined>();
  const { data: exercises } = useLiveQuery(exercisesQuery(userId), [userId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (!head || exerciseHeads(e).includes(head)) &&
        (!q || exerciseDisplayName(e, locale).toLowerCase().includes(q)),
    );
  }, [exercises, search, head, locale]);

  return (
    <>
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder={t('editor.searchExercises')}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Chip
          label={t('common.all')}
          active={head === undefined}
          onPress={() => setHead(undefined)}
        />
        {MUSCLE_HEADS.map((h) => (
          <Chip
            key={h}
            label={t(muscleHeadKey(h))}
            active={head === h}
            onPress={() => setHead(h)}
          />
        ))}
      </View>

      {above}

      <View className="mt-4 gap-2">
        {filtered.map((e) => (
          <PressableScale key={e.id} onPress={() => onPick(e)}>
            <Card className="flex-row items-center py-3">
              <ExerciseThumb exercise={e} />
              <View className="ml-3 flex-1">
                <Text className="text-base font-sans-semibold text-ink-50">
                  {exerciseDisplayName(e, locale)}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-400" numberOfLines={1}>
                  {exerciseHeads(e)
                    .slice(0, 3)
                    .map((h) => t(muscleHeadKey(h)))
                    .join(' · ')}
                  {e.isCustom ? ` · ${t('editor.custom')}` : ''}
                </Text>
              </View>
              {showDoc ? <ExerciseDocButton exerciseId={e.id} /> : null}
              {trailing?.(e)}
              {rowIcon}
            </Card>
          </PressableScale>
        ))}
      </View>
    </>
  );
};
