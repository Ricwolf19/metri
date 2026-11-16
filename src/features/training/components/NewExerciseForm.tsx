import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ControlledInput, ControlledSelect, useSaveForm } from '@/components/form';
import { Button, Card, Switch, TagPicker, type SelectItem, type TagSection } from '@/components/ui';
import type { Equipment, Exercise } from '@/db/schema';
import { createCustomExercise } from '@/features/training/exercises.repo';
import { EQUIPMENT_KEY } from '@/features/training/labels';
import {
  HEAD_CATEGORY,
  MUSCLE_HEADS,
  muscleHeadKey,
  type MuscleHead,
} from '@/features/training/muscles';
import { useT } from '@/i18n';

const isHead = (v: string): v is MuscleHead => (MUSCLE_HEADS as readonly string[]).includes(v);

type ExerciseDraft = {
  name: string;
  muscles: string[];
  equipment: Equipment | undefined;
  unilateral: boolean;
};

/**
 * The essentials of a custom exercise: name, the muscles it trains (required —
 * the body map and the split badges are derived from them), equipment. The
 * category is derived from the first muscle, never asked.
 */
export const NewExerciseForm = ({
  userId,
  onCreated,
  onCancel,
  submitLabel,
}: {
  userId: string;
  onCreated: (exercise: Exercise) => void;
  onCancel: () => void;
  submitLabel: string;
}) => {
  const t = useT();
  // `create`: one exercise per form — a double tap used to store two.
  const form = useSaveForm<ExerciseDraft>({
    kind: 'create',
    defaultValues: { name: '', muscles: [], equipment: undefined, unilateral: false },
    onSave: ({ name, muscles, equipment, unilateral }) => {
      const heads = muscles.filter(isHead);
      if (!heads.length) return false;
      onCreated(
        createCustomExercise(userId, {
          name: name.trim(),
          category: HEAD_CATEGORY[heads[0]],
          primaryMuscles: heads,
          equipment: equipment ?? null,
          unilateral,
        }),
      );
    },
  });

  const muscleSections: TagSection[] = [
    {
      title: t('editor.muscles'),
      items: MUSCLE_HEADS.map((h) => ({ value: h, label: t(muscleHeadKey(h)) })),
    },
  ];
  const equipmentItems: SelectItem<Equipment>[] = (Object.keys(EQUIPMENT_KEY) as Equipment[]).map(
    (e) => ({ value: e, label: t(EQUIPMENT_KEY[e]) }),
  );

  return (
    <Card className="gap-4">
      <ControlledInput
        control={form.control}
        name="name"
        rules={{ validate: (v) => v.trim().length >= 2 }}
        label={t('editor.exerciseName')}
        autoCapitalize="words"
      />
      <Controller
        control={form.control}
        name="muscles"
        rules={{ validate: (v) => v.some(isHead) }}
        render={({ field }) => (
          <TagPicker
            label={t('editor.muscles')}
            sections={muscleSections}
            value={field.value}
            onChange={field.onChange}
            placeholder={t('editor.musclesRequired')}
            doneLabel={t('common.done')}
          />
        )}
      />
      <ControlledSelect
        control={form.control}
        name="equipment"
        label={t('editor.equipment')}
        items={equipmentItems}
        placeholder="—"
      />
      <View className="flex-row items-center gap-4">
        <View className="flex-1">
          <Text className="text-sm font-sans-medium text-ink-100">{t('editor.unilateral')}</Text>
          <Text className="mt-0.5 text-[11px] leading-4 text-ink-500">
            {t('editor.unilateralHint')}
          </Text>
        </View>
        <Controller
          control={form.control}
          name="unilateral"
          render={({ field }) => (
            <Switch
              value={field.value}
              onValueChange={field.onChange}
              accessibilityLabel={t('editor.unilateral')}
            />
          )}
        />
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} />
        </View>
        <View className="flex-1">
          <Button label={submitLabel} disabled={!form.canSave} onPress={() => form.submit()} />
        </View>
      </View>
    </Card>
  );
};
