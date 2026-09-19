import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, Input, PressableScale } from '@/components/ui';
import type { Exercise, ExerciseCategory } from '@/db/schema';
import { exercisesQuery } from '@/features/training/exercises.repo';
import { CATEGORY_KEY, exerciseDisplayName } from '@/features/training/labels';
import { useI18n, useT } from '@/i18n';

const CATEGORIES = Object.keys(CATEGORY_KEY) as ExerciseCategory[];

type Props = {
  userId: string;
  onPick: (exercise: Exercise) => void;
  /** Rendered between the filters and the list (e.g. the picker's "New exercise" button). */
  above?: React.ReactNode;
  /** Trailing slot per row (e.g. a delete chip for custom exercises). */
  trailing?: (exercise: Exercise) => React.ReactNode;
  /** Icon at the row's right edge. */
  rowIcon?: React.ReactNode;
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

/** Searchable, category-filtered list of catalog + own custom exercises (picker and library). */
export const ExerciseList = ({ userId, onPick, above, trailing, rowIcon }: Props) => {
  const t = useT();
  const { locale } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | undefined>();
  const { data: exercises } = useLiveQuery(exercisesQuery(userId, category));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? exercises.filter((e) => exerciseDisplayName(e, locale).toLowerCase().includes(q))
      : exercises;
  }, [exercises, search, locale]);

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
          active={category === undefined}
          onPress={() => setCategory(undefined)}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t(CATEGORY_KEY[c])}
            active={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>

      {above}

      <View className="mt-4 gap-2">
        {filtered.map((e) => (
          <PressableScale key={e.id} onPress={() => onPick(e)}>
            <Card className="flex-row items-center py-3">
              <View className="flex-1">
                <Text className="text-base font-sans-semibold text-ink-50">
                  {exerciseDisplayName(e, locale)}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-400">
                  {t(CATEGORY_KEY[e.category])}
                  {e.isCustom ? ` · ${t('editor.custom')}` : ''}
                </Text>
              </View>
              {trailing?.(e)}
              {rowIcon}
            </Card>
          </PressableScale>
        ))}
      </View>
    </>
  );
};
