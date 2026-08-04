import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlusIcon, TrashIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Input,
  PressableScale,
  Screen,
  ScreenTitle,
  Select,
  type SelectItem,
  useDialog,
  useToast,
} from '@/components/ui';
import type { Equipment, ExerciseCategory } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { addSlot, getDay, getSlot, setSlotAlternatives } from '@/features/training/authoring.repo';
import {
  createCustomExercise,
  deleteCustomExercise,
  exercisesQuery,
} from '@/features/training/exercises.repo';
import { CATEGORY_KEY, EQUIPMENT_KEY } from '@/features/training/labels';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const CATEGORIES = Object.keys(CATEGORY_KEY) as ExerciseCategory[];

const ExercisePicker = () => {
  const { dayId, altFor } = useLocalSearchParams<{ dayId: string; altFor?: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand } = useTheme();

  const day = typeof dayId === 'string' ? getDay(dayId) : null;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | undefined>();
  const { data: exercises } = useLiveQuery(exercisesQuery(user?.id ?? '', category));

  // New-exercise inline form.
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('chest');
  const [newEquipment, setNewEquipment] = useState<Equipment>();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? exercises.filter((e) => e.name.toLowerCase().includes(q)) : exercises;
  }, [exercises, search]);

  if (!user || !day || typeof dayId !== 'string') return <Redirect href="/training" />;

  const pick = (exerciseId: string) => {
    if (typeof altFor === 'string') {
      // Alternative mode: append to the slot's interchangeable list.
      const target = getSlot(altFor);
      const current = target?.alternativeExerciseIds ?? [];
      if (!current.includes(exerciseId)) setSlotAlternatives(altFor, [...current, exerciseId]);
      router.back();
      return;
    }
    addSlot(dayId, day.userProgramId, exerciseId);
    router.back();
  };

  const confirmDeleteExercise = (exerciseId: string) =>
    dialog.show({
      title: t('editor.confirmDelete'),
      actions: [
        { label: t('common.cancel'), style: 'cancel' },
        {
          label: t('editor.delete'),
          style: 'destructive',
          onPress: () => {
            if (!deleteCustomExercise(exerciseId, user.id)) toast.error(t('editor.inUse'));
          },
        },
      ],
    });

  const createAndPick = () => {
    if (newName.trim().length < 2) return toast.error(t('editor.exerciseName'));
    const ex = createCustomExercise(user.id, {
      name: newName.trim(),
      category: newCategory,
      equipment: newEquipment ?? null,
    });
    addSlot(dayId, day.userProgramId, ex.id);
    router.back();
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
      header={<TopBar showBack showAvatar={false} />}
    >
      <ScreenTitle title={t('editor.pickExercise')} />

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
        <>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={t('editor.searchExercises')}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Category filter */}
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setCategory(undefined)}
              className={[
                'rounded-full border px-3 py-1.5',
                category === undefined
                  ? 'border-brand/40 bg-brand/15'
                  : 'border-ink-700 bg-ink-800',
              ].join(' ')}
            >
              <Text
                className={[
                  'text-xs font-sans-medium',
                  category === undefined ? 'text-brand' : 'text-ink-300',
                ].join(' ')}
              >
                {t('common.all')}
              </Text>
            </Pressable>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={[
                  'rounded-full border px-3 py-1.5',
                  category === c ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-xs font-sans-medium',
                    category === c ? 'text-brand' : 'text-ink-300',
                  ].join(' ')}
                >
                  {t(CATEGORY_KEY[c])}
                </Text>
              </Pressable>
            ))}
          </View>

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

          <View className="mt-4 gap-2">
            {filtered.map((e) => (
              <PressableScale key={e.id} onPress={() => pick(e.id)}>
                <Card className="flex-row items-center py-3">
                  <View className="flex-1">
                    <Text className="text-base font-sans-semibold text-ink-50">{e.name}</Text>
                    <Text className="mt-0.5 text-xs text-ink-400">
                      {t(CATEGORY_KEY[e.category])}
                      {e.isCustom ? ` · ${t('editor.custom')}` : ''}
                    </Text>
                  </View>
                  {e.isCustom && e.userId === user.id ? (
                    <Pressable
                      onPress={() => confirmDeleteExercise(e.id)}
                      hitSlop={8}
                      className="mr-3"
                    >
                      <TrashIcon color="#ef4444" size={18} />
                    </Pressable>
                  ) : null}
                  <PlusIcon color={brand} size={20} />
                </Card>
              </PressableScale>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
};

export default ExercisePicker;
