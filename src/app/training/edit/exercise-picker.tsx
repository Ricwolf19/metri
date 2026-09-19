import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlusIcon, TrashIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  HoldButton,
  Input,
  Screen,
  Select,
  type SelectItem,
  useToast,
} from '@/components/ui';
import type { Equipment, ExerciseCategory } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { addSlot, getDay, getSlot, setSlotAlternatives } from '@/features/training/authoring.repo';
import { ExerciseList } from '@/features/training/components/ExerciseList';
import { createCustomExercise, deleteCustomExercise } from '@/features/training/exercises.repo';
import { CATEGORY_KEY, EQUIPMENT_KEY } from '@/features/training/labels';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const CATEGORIES = Object.keys(CATEGORY_KEY) as ExerciseCategory[];

const ExercisePicker = () => {
  const { dayId, altFor } = useLocalSearchParams<{ dayId: string; altFor?: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();
  const { brand } = useTheme();

  const day = typeof dayId === 'string' ? getDay(dayId) : null;

  // New-exercise inline form.
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('chest');
  const [newEquipment, setNewEquipment] = useState<Equipment>();

  if (!user || !day || typeof dayId !== 'string') return <Redirect href="/training" />;

  // A new slot goes straight into its editor (replace: back lands on the
  // split, and leaving without saving deletes the fresh slot again).
  const openFresh = (exerciseId: string) => {
    const slot = addSlot(dayId, day.userProgramId, exerciseId);
    router.replace({ pathname: '/training/edit/slot/[id]', params: { id: slot.id, fresh: '1' } });
  };

  const pick = (exerciseId: string) => {
    if (typeof altFor === 'string') {
      // Alternative mode: append to the slot's interchangeable list.
      const target = getSlot(altFor);
      const current = target?.alternativeExerciseIds ?? [];
      if (!current.includes(exerciseId)) setSlotAlternatives(altFor, [...current, exerciseId]);
      router.back();
      return;
    }
    openFresh(exerciseId);
  };

  const removeExercise = (exerciseId: string) => {
    if (!deleteCustomExercise(exerciseId, user.id)) toast.error(t('editor.inUse'));
    else toast.info(t('editor.deletedToast'));
  };

  const createAndPick = () => {
    if (newName.trim().length < 2) return toast.error(t('editor.exerciseName'));
    const ex = createCustomExercise(user.id, {
      name: newName.trim(),
      category: newCategory,
      equipment: newEquipment ?? null,
    });
    if (typeof altFor === 'string') {
      pick(ex.id);
      return;
    }
    openFresh(ex.id);
  };

  const categoryItems: SelectItem<ExerciseCategory>[] = CATEGORIES.map((c) => ({
    value: c,
    label: t(CATEGORY_KEY[c]),
  }));
  const equipmentItems: SelectItem<Equipment>[] = (Object.keys(EQUIPMENT_KEY) as Equipment[]).map(
    (e) => ({ value: e, label: t(EQUIPMENT_KEY[e]) }),
  );

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={
        <TopBar showBack showAvatar={false} title={t('editor.pickExercise')} subtitle={day.name} />
      }
    >
      {creating ? (
        <Card className="gap-4">
          <Input
            label={t('editor.exerciseName')}
            value={newName}
            onChangeText={setNewName}
            autoCapitalize="words"
          />
          <Select
            label={t('editor.category')}
            items={categoryItems}
            value={newCategory}
            onChange={setNewCategory}
          />
          <Select
            label={t('editor.equipment')}
            items={equipmentItems}
            value={newEquipment}
            onChange={setNewEquipment}
            placeholder="—"
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label={t('common.cancel')}
                variant="secondary"
                onPress={() => setCreating(false)}
              />
            </View>
            <View className="flex-1">
              <Button label={t('editor.addExercise')} onPress={createAndPick} />
            </View>
          </View>
        </Card>
      ) : (
        <ExerciseList
          userId={user.id}
          onPick={(e) => pick(e.id)}
          rowIcon={<PlusIcon color={brand} size={20} />}
          above={
            <Pressable
              onPress={() => setCreating(true)}
              accessibilityRole="button"
              className="mt-4 flex-row items-center justify-center rounded-field border border-brand/30 bg-brand/10 py-3"
            >
              <PlusIcon color={brand} size={18} />
              <Text className="ml-1.5 text-sm font-sans-semibold text-brand">
                {t('editor.newExercise')}
              </Text>
            </Pressable>
          }
          trailing={(e) =>
            e.isCustom && e.userId === user.id ? (
              <View className="mr-3">
                <HoldButton
                  icon={<TrashIcon color="#ef4444" size={16} />}
                  accessibilityLabel={t('editor.deleteExercise')}
                  onComplete={() => removeExercise(e.id)}
                />
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
};

export default ExercisePicker;
