import { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Input,
  Select,
  TagPicker,
  type SelectItem,
  type TagSection,
  useToast,
} from '@/components/ui';
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
  const toast = useToast();
  const [name, setName] = useState('');
  const [muscles, setMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<Equipment>();

  const submit = () => {
    if (name.trim().length < 2) return toast.error(t('editor.exerciseName'));
    const heads = muscles.filter(isHead);
    if (!heads.length) return toast.error(t('editor.musclesRequired'));
    onCreated(
      createCustomExercise(userId, {
        name: name.trim(),
        category: HEAD_CATEGORY[heads[0]],
        primaryMuscles: heads,
        equipment: equipment ?? null,
      }),
    );
  };

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
      <Input
        label={t('editor.exerciseName')}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TagPicker
        label={t('editor.muscles')}
        sections={muscleSections}
        value={muscles}
        onChange={setMuscles}
        placeholder={t('editor.musclesRequired')}
        doneLabel={t('common.done')}
      />
      <Select
        label={t('editor.equipment')}
        items={equipmentItems}
        value={equipment}
        onChange={setEquipment}
        placeholder="—"
      />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} />
        </View>
        <View className="flex-1">
          <Button label={submitLabel} onPress={submit} />
        </View>
      </View>
    </Card>
  );
};
