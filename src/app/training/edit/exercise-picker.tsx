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
  TagPicker,
  type SelectItem,
  type TagSection,
  useToast,
} from '@/components/ui';
import type { Equipment } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { addSlot, getDay, getSlot, setSlotAlternatives } from '@/features/training/authoring.repo';
import { ExerciseList } from '@/features/training/components/ExerciseList';
import { createCustomExercise, deleteCustomExercise } from '@/features/training/exercises.repo';
import { EQUIPMENT_KEY, dayDisplayName } from '@/features/training/labels';
import {
  HEAD_CATEGORY,
  MUSCLE_HEADS,
  muscleHeadKey,
  type MuscleHead,
} from '@/features/training/muscles';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const isHead = (v: string): v is MuscleHead => (MUSCLE_HEADS as readonly string[]).includes(v);

const ExercisePicker = () => {
  const { dayId, altFor } = useLocalSearchParams<{ dayId: string; altFor?: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();
  const { brand } = useTheme();

  const day = typeof dayId === 'string' ? getDay(dayId) : null;

  // New-exercise inline form. Muscles are required; the category derives from them.
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscles, setNewMuscles] = useState<string[]>([]);
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
    const heads = newMuscles.filter(isHead);
    if (!heads.length) return toast.error(t('editor.musclesRequired'));
    const ex = createCustomExercise(user.id, {
      name: newName.trim(),
      category: HEAD_CATEGORY[heads[0]],
      primaryMuscles: heads,
      equipment: newEquipment ?? null,
    });
    if (typeof altFor === 'string') {
      pick(ex.id);
      return;
    }
    openFresh(ex.id);
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
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('editor.pickExercise')}
          subtitle={dayDisplayName(day, t)}
        />
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
          <TagPicker
            label={t('editor.muscles')}
            sections={muscleSections}
            value={newMuscles}
            onChange={setNewMuscles}
            placeholder={t('editor.musclesRequired')}
            doneLabel={t('common.done')}
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
          showDoc
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
